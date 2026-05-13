/**
 * swan_update.mjs
 * 從 swanpanasia.com 抓取資料並更新 Google Sheet
 *
 * 用法：
 *   node swan_update.mjs crawl    ← 只爬網站，存成 swan_cache.json
 *   node swan_update.mjs update   ← 只更新 Sheet（需先跑 crawl）
 *   node swan_update.mjs all      ← 兩步驟一起跑
 */

import puppeteer from 'puppeteer';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// === CONFIG ===
const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw';
const SHEET_GID = 540615026;
const IMAGES_DIR = path.join(__dirname, 'public', 'images');
const TOKEN_PATH = path.join(__dirname, 'sheets_token.json');
const CACHE_PATH = path.join(__dirname, 'swan_cache.json');
const SWAN_BASE = 'https://www.swanpanasia.com';
const TOTAL_PAGES = 23;


// 欄位索引（0-based）
const C = {
  名稱: 0,   // A
  英文: 2,   // C
  BGG: 10,   // K
  定價: 13,  // N
  圖片: 20,  // U
  教學: 21,  // V
  出處: 22,  // W
  簡介: 24,  // Y
};

// === AUTH (Service Account) ===
async function getAuth() {
  const keyPath = path.join(__dirname, 'service-account.json');
  if (!fs.existsSync(keyPath)) {
    console.error('找不到 service-account.json');
    process.exit(1);
  }
  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth;
}

// === CRAWL ===
async function crawl() {
  // 載入既有快取
  let cached = {};
  if (fs.existsSync(CACHE_PATH)) {
    try {
      const raw = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
      cached = raw.products || {};
      const count = Object.keys(cached).filter(k => !cached[k].error).length;
      console.log(`載入既有快取：${count} 筆`);
    } catch {}
  }

  console.log('啟動 Puppeteer...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  page.setDefaultTimeout(20000);

  // 第一步：收集所有產品 URL
  console.log('\n掃描目錄...');
  const urlMap = new Map(); // href → text
  for (let p = 1; p <= TOTAL_PAGES; p++) {
    const url = p === 1
      ? `${SWAN_BASE}/catalog/all-product`
      : `${SWAN_BASE}/catalog/all-product?8ea8cbe2_page=${p}`;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const links = await page.$$eval('a[href^="/products/"]', els =>
        els.map(a => ({ href: a.href, text: a.innerText.trim() }))
      );
      for (const l of links) {
        if (l.href && !urlMap.has(l.href)) urlMap.set(l.href, l.text);
      }
    } catch (e) {
      console.warn(`  頁面 ${p} 失敗: ${e.message}`);
    }
    process.stdout.write(`\r  頁面 ${p}/${TOTAL_PAGES}，累計 ${urlMap.size} 筆`);
    await sleep(400);
  }
  console.log(`\n目錄共 ${urlMap.size} 筆`);

  // 第二步：逐一抓產品頁
  const urls = [...urlMap.entries()];
  let done = 0;
  let skipped = 0;

  for (const [href, text] of urls) {
    // 跳過已有資料且無錯誤的快取
    if (cached[href] && !cached[href].error) {
      skipped++;
      done++;
      process.stdout.write(`\r  ${done}/${urls.length} (跳過 ${skipped}) ${text.slice(0, 30)}`);
      continue;
    }

    try {
      await page.goto(href, { waitUntil: 'networkidle2', timeout: 20000 });
      const data = await page.evaluate(() => {
        // 中文名稱（h1 的下一個兄弟或特定 class）
        const h1 = document.querySelector('h1');
        const zhName = h1?.nextElementSibling?.innerText?.trim() || '';
        const enName = h1?.innerText?.trim() || '';

        // 遊戲簡介：找有意義的段落，排除規格列
        const desc = [...document.querySelectorAll('p')]
          .map(p => p.innerText?.trim() || '')
          .filter(t =>
            t.length > 20 &&
            !/\d+歲/.test(t) &&
            !/\d+-\d+人/.test(t) &&
            !/NT\$/.test(t) &&
            !/mm/.test(t) &&
            !/©/.test(t) &&
            !/All Rights Reserved/.test(t) &&
            !/客服/.test(t)
          )
          .join('\n');

        // YouTube 影片（從 iframe src 取）
        const iframeSrc = document.querySelector('iframe[src*="youtube"]')?.src || '';
        const ytId = iframeSrc.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/)?.[1] || '';
        const ytUrl = ytId ? `https://www.youtube.com/watch?v=${ytId}` : '';

        // 定價
        const priceMatch = document.body.innerText.match(/NT\$\s*(\d{3,5})/);
        const price = priceMatch?.[1] || '';

        return { zhName, enName, desc, ytUrl, price };
      });

      cached[href] = { url: href, listText: text, ...data };
    } catch (e) {
      cached[href] = { url: href, listText: text, error: e.message };
    }

    done++;
    process.stdout.write(`\r  ${done}/${urls.length} ${text.slice(0, 35)}`);

    // 每 20 筆存一次快取
    if (done % 20 === 0) {
      fs.writeFileSync(CACHE_PATH, JSON.stringify({ products: cached, updatedAt: new Date() }, null, 2));
    }

    await sleep(800);
  }

  await browser.close();
  fs.writeFileSync(CACHE_PATH, JSON.stringify({ products: cached, updatedAt: new Date() }, null, 2));
  const ok = Object.values(cached).filter(p => !p.error).length;
  console.log(`\n完成！成功 ${ok}，失敗 ${Object.keys(cached).length - ok}，存入 swan_cache.json`);
  return cached;
}

// === READ SHEET ===
async function readSheet(auth) {
  const sheets = google.sheets({ version: 'v4', auth });

  // 找到正確的 tab
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const tab = meta.data.sheets.find(s => s.properties.sheetId === SHEET_GID)
    || meta.data.sheets[0];
  const sheetName = tab.properties.title;
  console.log(`讀取 Sheet tab：${sheetName}`);

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:Y`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });

  return { rows: res.data.values || [], sheetName };
}

// === UPDATE ===
async function updateSheet(auth, products, sheetData) {
  const { rows, sheetName } = sheetData;

  // 找到標題列
  const headerIdx = rows.findIndex(r => r && r[0] === '中文名稱');
  if (headerIdx === -1) throw new Error('找不到標題列「中文名稱」');
  console.log(`標題列在第 ${headerIdx + 1} 行`);

  // 建立新天鵝堡索引（中文名稱 → 資料）
  const byZh = {};
  const byEn = {};
  for (const p of Object.values(products)) {
    if (!p || p.error) continue;
    if (p.zhName) byZh[p.zhName.trim()] = p;
    if (p.enName) byEn[p.enName.trim().toUpperCase()] = p;
    // 也用目錄上顯示的文字配對（通常是「英文名 中文名」）
    if (p.listText) {
      const parts = p.listText.split('\n');
      for (const part of parts) {
        const t = part.trim();
        if (t) byZh[t] = byZh[t] || p;
      }
    }
  }

  // 圖片檔清單
  const imageFiles = fs.readdirSync(IMAGES_DIR);
  const imageIds = new Set(imageFiles.map(f => path.parse(f).name));

  const updates = [];
  let matched = 0;
  let imgFixed = 0;

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const zhName = String(row[C.名稱] || '').trim();
    if (!zhName) continue;

    const rowNum = i + 1; // 1-based sheet 行號

    // --- 圖片 v 檢查（整個 sheet 都做）---
    const bggUrl = String(row[C.BGG] || '');
    const bggId = bggUrl.match(/\/boardgame(?:expansion)?\/(\d+)/)?.[1];
    const hasImg = (bggId && imageIds.has(bggId)) || imageIds.has(`row-${rowNum}`);
    const imgVal = String(row[C.圖片] || '').trim();
    if (hasImg && !imgVal) {
      updates.push({ row: rowNum, col: C.圖片 + 1, value: 'v' });
      imgFixed++;
    }

    // --- 配對新天鵝堡 ---
    const enName = String(row[C.英文] || '').trim().toUpperCase();
    const swan = byZh[zhName] || byEn[enName];
    if (!swan) continue;
    matched++;

    // 遊戲簡介 (Y)
    const descVal = String(row[C.簡介] || '').trim();
    if (!descVal && swan.desc) {
      updates.push({ row: rowNum, col: C.簡介 + 1, value: swan.desc });
    }

    // 教學 (V) + 出處 (W) — 只要其中一個是空的就不動，兩個都空才填
    const videoVal = String(row[C.教學] || '').trim();
    const sourceVal = String(row[C.出處] || '').trim();
    if (!videoVal && !sourceVal && swan.ytUrl) {
      updates.push({ row: rowNum, col: C.教學 + 1, value: swan.ytUrl });
      updates.push({ row: rowNum, col: C.出處 + 1, value: '新天鵝堡桌遊' });
    }

    // 定價 (N)
    const priceVal = String(row[C.定價] || '').trim();
    if (!priceVal && swan.price) {
      updates.push({ row: rowNum, col: C.定價 + 1, value: swan.price });
    }
  }

  console.log(`配對 ${matched} 筆新天鵝堡遊戲，補圖片v ${imgFixed} 筆，共 ${updates.length} 個更新`);

  if (updates.length === 0) {
    console.log('沒有需要更新的欄位，完成！');
    return;
  }

  // 轉為 batchUpdate 格式
  const sheets = google.sheets({ version: 'v4', auth });
  const batchData = updates.map(u => ({
    range: `${sheetName}!${colLetter(u.col)}${u.row}`,
    values: [[u.value]],
  }));

  // 每次最多 500 格
  const CHUNK = 500;
  for (let i = 0; i < batchData.length; i += CHUNK) {
    const chunk = batchData.slice(i, i + CHUNK);
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { valueInputOption: 'USER_ENTERED', data: chunk },
    });
    console.log(`  已更新 ${Math.min(i + CHUNK, batchData.length)} / ${batchData.length} 格`);
  }
  console.log('Sheet 更新完成！✓');
}

// === HELPERS ===
function colLetter(n) {
  let r = '';
  while (n > 0) { n--; r = String.fromCharCode(65 + n % 26) + r; n = Math.floor(n / 26); }
  return r;
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// === MAIN ===
const phase = process.argv[2] || 'all';

const auth = await getAuth();

if (phase === 'crawl' || phase === 'all') {
  await crawl();
}

if (phase === 'update' || phase === 'all') {
  if (!fs.existsSync(CACHE_PATH)) {
    console.error('找不到 swan_cache.json，請先執行 crawl');
    process.exit(1);
  }
  const cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
  const sheetData = await readSheet(auth);
  await updateSheet(auth, cache.products, sheetData);
}
