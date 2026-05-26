/**
 * morefun_update.mjs
 * 從玩坊 morefun-games.com 抓定價與圖片，同步到：
 * 1. Google Sheet（N欄定價、U欄圖片v標記 + 下載圖片）
 * 2. ugg-inventory Firestore（price、rental、imageUrl）
 *
 * 用法：
 *   node morefun_update.mjs crawl     → 只爬網站，存 morefun_raw.json
 *   node morefun_update.mjs sheet     → 只更新 Google Sheet
 *   node morefun_update.mjs inventory → 只更新 Firestore 庫存
 *   node morefun_update.mjs all       → 全跑（預設）
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { writeFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { google } from 'googleapis'
import admin from 'firebase-admin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw'
const SHEET_TAB = '工作表1'
const IMAGES_DIR = path.join(__dirname, 'public', 'images')
const CACHE_FILE = path.join(__dirname, 'morefun_raw.json')
const LOG_FILE = path.join(__dirname, 'morefun_match_log.json')
const SA_PATH = path.join(__dirname, 'service-account.json')
const FIREBASE_PROJECT = 'ugg-store-system'
const STORAGE_BUCKET = 'ugg-store-system.firebasestorage.app'

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ─── 名稱清理 ───────────────────────────────────────────────────────────────

function cleanName(raw) {
  return raw
    .replace(/^【[^】]*】\s*/, '')   // 移除 【C2】 等前綴
    .trim()
}

// 用來做模糊比對：額外移除括號變體
function normalizeName(name) {
  return name
    .replace(/[（(][^）)]*[）)]/g, '') // 移除 (簡中) (繁中) 等括號
    .replace(/\s+/g, '')
    .trim()
}

// ─── 步驟一：爬玩坊全站 ──────────────────────────────────────────────────────

async function crawlMorefun() {
  if (existsSync(CACHE_FILE)) {
    console.log('📦 已有快取 morefun_raw.json，跳過爬取')
    return JSON.parse(readFileSync(CACHE_FILE, 'utf8'))
  }

  console.log('🔍 開始爬取玩坊...')
  const allProducts = []

  for (let page = 1; page <= 60; page++) {
    const url = page === 1
      ? 'https://www.morefun-games.com/shop'
      : `https://www.morefun-games.com/shop/page/${page}`

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    })
    const html = await res.text()
    const products = parsePageProducts(html)

    if (products.length === 0) {
      console.log(`第 ${page} 頁無資料，停止`)
      break
    }

    allProducts.push(...products)
    process.stdout.write(`\r第 ${page} 頁：${products.length} 筆，累計 ${allProducts.length} 筆`)

    if (!html.includes(`/shop/page/${page + 1}`)) {
      console.log(`\n第 ${page} 頁是最後一頁`)
      break
    }

    await sleep(400)
  }

  writeFileSync(CACHE_FILE, JSON.stringify(allProducts, null, 2), 'utf8')
  console.log(`\n✅ 爬取完成，共 ${allProducts.length} 筆，已存入 morefun_raw.json`)
  return allProducts
}

function parsePageProducts(html) {
  const products = []
  // td.oe_product 包含每個商品
  const tdRegex = /<td[^>]*class="[^"]*oe_product[^"]*"[^>]*>([\s\S]*?)<\/td>/gi
  let tdMatch

  while ((tdMatch = tdRegex.exec(html)) !== null) {
    const cell = tdMatch[1]

    // 商品名稱（h6 > a 文字）
    const nameMatch = cell.match(/<h6[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/)
    if (!nameMatch) continue

    // 定價
    const priceMatch = cell.match(/class="oe_currency_value"[^>]*>([0-9,]+)<\/span>/)

    // 圖片 product ID（從 img src 抓）
    const idMatch = cell.match(/\/product\.template\/(\d+)\//)

    const rawName = nameMatch[1].trim()
    const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : null
    const productId = idMatch ? idMatch[1] : null
    const imgUrl = productId
      ? `https://www.morefun-games.com/web/image/product.template/${productId}/image_512`
      : null

    products.push({
      rawName,
      cleanName: cleanName(rawName),
      price,
      imgUrl,
      productId,
    })
  }

  return products
}

// ─── 步驟二：更新 Google Sheet ────────────────────────────────────────────────

async function updateSheet(products) {
  console.log('\n📊 讀取 Google Sheet...')
  const auth = new google.auth.GoogleAuth({
    keyFile: SA_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  const sheets = google.sheets({ version: 'v4', auth })

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_TAB}!A:U`,
  })
  const rows = res.data.values || []
  // rows[7] = 第8行(header)，rows[8] = 第9行(第一筆資料)
  const dataRows = rows.slice(8)

  // 建立名稱查找表
  const productMap = buildProductMap(products)

  const priceUpdates = []   // { sheetRow, price }
  const imageUpdates = []   // { sheetRow, name, imgUrl }
  const matchLog = []

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    const name = row[0]?.trim()
    if (!name) continue

    const sheetRow = i + 9  // 實際行號
    const hasPrice = !!(row[13])
    const hasImg = row[20] === 'v'

    const match = findProduct(name, productMap)
    if (!match) continue

    matchLog.push({ sheetRow, name, matched: match.cleanName, price: match.price })

    if (!hasPrice && match.price) {
      priceUpdates.push({ sheetRow, price: match.price })
    }
    if (!hasImg && match.imgUrl) {
      imageUpdates.push({ sheetRow, name, imgUrl: match.imgUrl })
    }
  }

  console.log(`✅ 配對成功：${matchLog.length} 筆`)
  console.log(`📝 需補定價：${priceUpdates.length} 筆`)
  console.log(`🖼  需補圖片：${imageUpdates.length} 筆`)

  // 寫入定價
  if (priceUpdates.length > 0) {
    console.log('\n💰 寫入定價...')
    const priceData = priceUpdates.map(u => ({
      range: `${SHEET_TAB}!N${u.sheetRow}`,
      values: [[u.price]],
    }))
    // 分批 batchUpdate（每批 500 筆）
    for (let i = 0; i < priceData.length; i += 500) {
      const batch = priceData.slice(i, i + 500)
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: { valueInputOption: 'RAW', data: batch },
      })
      console.log(`  定價寫入 ${Math.min(i + 500, priceData.length)}/${priceData.length}`)
      if (i + 500 < priceData.length) await sleep(300)
    }
    console.log(`✅ 定價寫入完成`)
  }

  // 下載圖片並寫入 U 欄
  if (imageUpdates.length > 0) {
    console.log(`\n🖼  下載圖片並更新 Sheet（共 ${imageUpdates.length} 張）...`)
    const imgV = []

    for (let i = 0; i < imageUpdates.length; i++) {
      const { sheetRow, name, imgUrl } = imageUpdates[i]
      const destPath = path.join(IMAGES_DIR, `row-${sheetRow}.jpg`)

      // 若已有檔案跳過下載
      if (!existsSync(destPath)) {
        const ok = await downloadImage(imgUrl, destPath)
        if (!ok) {
          process.stdout.write(`\r  [${i + 1}/${imageUpdates.length}] ❌ ${name}`)
          continue
        }
      }

      imgV.push({ range: `${SHEET_TAB}!U${sheetRow}`, values: [['v']] })
      process.stdout.write(`\r  [${i + 1}/${imageUpdates.length}] ✓ ${name}`)
      await sleep(200)
    }

    if (imgV.length > 0) {
      for (let i = 0; i < imgV.length; i += 500) {
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: SHEET_ID,
          requestBody: { valueInputOption: 'RAW', data: imgV.slice(i, i + 500) },
        })
        if (i + 500 < imgV.length) await sleep(300)
      }
    }
    console.log(`\n✅ 圖片完成：${imgV.length} 張`)
  }

  // 儲存配對 log
  writeFileSync(LOG_FILE, JSON.stringify(matchLog, null, 2), 'utf8')
  console.log(`📋 配對紀錄已存 morefun_match_log.json`)

  return matchLog
}

// ─── 步驟三：更新 ugg-inventory Firestore ────────────────────────────────────

async function updateInventory(products) {
  console.log('\n🗄  讀取 Firestore inventory...')

  // 初始化 Firebase Admin（只初始化一次）
  if (!admin.apps.length) {
    const sa = JSON.parse(readFileSync(SA_PATH, 'utf8'))
    admin.initializeApp({
      credential: admin.credential.cert(sa),
      storageBucket: STORAGE_BUCKET,
    })
  }

  const db = admin.firestore()
  const storage = admin.storage().bucket()

  const snap = await db.collection('inventory').where('deleted', '!=', true).get()
  // 也取沒有 deleted 欄位的文件
  const snap2 = await db.collection('inventory').get()
  const docs = snap2.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(d => !d.deleted)

  console.log(`  Firestore 共 ${docs.length} 筆`)

  const productMap = buildProductMap(products)
  let updatedPrice = 0
  let updatedImage = 0

  for (const doc of docs) {
    const name = doc.name?.trim()
    if (!name) continue

    const match = findProduct(name, productMap)
    if (!match) continue

    const updates = {}

    // 補定價
    if (!doc.price && match.price) {
      updates.price = match.price
      updates.rental = Math.ceil(match.price / 500) * 50
      // cost 用 65% 折扣（可調整）
      updates.cost = Math.round(match.price * 0.65)
    }

    // 補圖片
    if (!doc.imageUrl && match.imgUrl) {
      process.stdout.write(`\r  上傳圖片：${name}`)
      const imageUrl = await uploadInventoryImage(storage, doc.id, match.imgUrl, name)
      if (imageUrl) {
        updates.imageUrl = imageUrl
        updatedImage++
      }
      await sleep(300)
    }

    if (Object.keys(updates).length > 0) {
      await db.collection('inventory').doc(doc.id).update(updates)
      if (updates.price) updatedPrice++
    }
  }

  console.log(`\n✅ Firestore 定價更新：${updatedPrice} 筆`)
  console.log(`✅ Firestore 圖片更新：${updatedImage} 筆`)
}

async function uploadInventoryImage(bucket, docId, imgUrl, name) {
  try {
    // 下載圖片
    const res = await fetch(imgUrl, {
      headers: {
        'Referer': 'https://www.morefun-games.com/',
        'User-Agent': 'Mozilla/5.0',
      }
    })
    if (!res.ok) return null

    const buffer = Buffer.from(await res.arrayBuffer())
    const compressed = await sharp(buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer()

    const destPath = `inventory/${docId}/cover.jpg`
    const file = bucket.file(destPath)
    await file.save(compressed, {
      contentType: 'image/jpeg',
      metadata: { cacheControl: 'public,max-age=3600' },
    })
    await file.makePublic()

    const [metadata] = await file.getMetadata()
    return `https://storage.googleapis.com/${bucket.name}/${destPath}`
  } catch (e) {
    console.error(`\n  ❌ 上傳失敗 ${name}:`, e.message)
    return null
  }
}

// ─── 輔助：圖片下載 ──────────────────────────────────────────────────────────

async function downloadImage(url, destPath) {
  try {
    const res = await fetch(url, {
      headers: {
        'Referer': 'https://www.morefun-games.com/',
        'User-Agent': 'Mozilla/5.0',
      }
    })
    if (!res.ok) return false

    const buffer = Buffer.from(await res.arrayBuffer())
    const compressed = await sharp(buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer()

    await writeFile(destPath, compressed)
    return true
  } catch {
    return false
  }
}

// ─── 輔助：名稱配對 ──────────────────────────────────────────────────────────

// 深度正規化：移除語言標記、標點統一、數字轉換
function deepNormalize(name) {
  return name
    .replace(/[（(][^）)]*[）)]/g, '')           // 移除括號內容
    .replace(/(簡中|繁中|簡体|繁體|英文版|中文版|中文|繁體中文|簡體中文)/g, '')
    .replace(/[-—]?(大盒版|小盒版|家庭版|迷你版|豪華版|精裝版|標準版|新版)$/, '') // 連字號版本後綴
    .replace(/擴充$/, '').replace(/基礎版$/, '')
    .replace(/計畫/g, '計劃')                     // 正體/簡體異字
    .replace(/10/g, '十')                         // 阿拉伯數字 → 中文
    .replace(/[1-9]/g, d => '一二三四五六七八九'[+d - 1])
    .replace(/[：:—－\-·・]/g, '')               // 移除所有分隔符號
    .replace(/\s+/g, '').trim()
}

// bigram 相似度（0~1），用來最後一道把關
function bigramSim(a, b) {
  const getBigrams = s => {
    const bg = new Set()
    for (let i = 0; i < s.length - 1; i++) bg.add(s.slice(i, i + 2))
    return bg
  }
  const ba = getBigrams(a)
  const bb = getBigrams(b)
  if (ba.size === 0 || bb.size === 0) return 0
  let inter = 0
  for (const g of ba) if (bb.has(g)) inter++
  return (2 * inter) / (ba.size + bb.size)
}

function buildProductMap(products) {
  const map = new Map()        // cleanName → product
  const normMap = new Map()    // normalizeName → product
  const deepMap = new Map()    // deepNormalize → product
  const allProducts = []

  for (const p of products) {
    if (!map.has(p.cleanName)) map.set(p.cleanName, p)

    const norm = normalizeName(p.cleanName)
    if (norm && !normMap.has(norm)) normMap.set(norm, p)

    const deep = deepNormalize(p.cleanName)
    if (deep && !deepMap.has(deep)) deepMap.set(deep, p)

    allProducts.push(p)
  }

  return { map, normMap, deepMap, allProducts }
}

function findProduct(sheetName, { map, normMap, deepMap, allProducts }) {
  // 1. 精確比對
  if (map.has(sheetName)) return map.get(sheetName)

  // 2. 去【XX】前綴後比對
  const clean = cleanName(sheetName)
  if (map.has(clean)) return map.get(clean)

  // 3. 去括號模糊比對
  const norm = normalizeName(clean)
  if (norm && normMap.has(norm)) return normMap.get(norm)

  // 4. 深度正規化比對（語言標記+標點+異字）
  const deep = deepNormalize(clean)
  if (deep && deepMap.has(deep)) return deepMap.get(deep)

  // 5. bigram 相似度 ≥ 0.75（最後才用，避免誤配）
  //    只看前4字相同的候選，節省時間
  const prefix4 = deep.slice(0, 4)
  if (prefix4.length >= 2) {
    let best = null, bestScore = 0
    for (const p of allProducts) {
      const pDeep = deepNormalize(p.cleanName)
      if (!pDeep.startsWith(prefix4.slice(0, 2))) continue  // 快速篩
      const score = bigramSim(deep, pDeep)
      if (score > bestScore && score >= 0.75) { best = p; bestScore = score }
    }
    if (best) return best
  }

  return null
}

// ─── 主程式 ──────────────────────────────────────────────────────────────────

const mode = process.argv[2] || 'all'

if (mode === 'crawl' || mode === 'all') {
  const products = await crawlMorefun()
  if (mode === 'all' || mode === 'sheet') {
    await updateSheet(products)
  }
  if (mode === 'all' || mode === 'inventory') {
    await updateInventory(products)
  }
} else if (mode === 'sheet') {
  const products = JSON.parse(readFileSync(CACHE_FILE, 'utf8'))
  await updateSheet(products)
} else if (mode === 'inventory') {
  const products = JSON.parse(readFileSync(CACHE_FILE, 'utf8'))
  await updateInventory(products)
} else {
  console.log('用法: node morefun_update.mjs [crawl|sheet|inventory|all]')
}

console.log('\n🎉 完成！')
process.exit(0)
