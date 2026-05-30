import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { google } from 'googleapis';
import { writeFileSync } from 'fs';

const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw';
const TOTAL_PAGES = 41;
const CONCURRENCY = 5;
const DELAY_MS = 300;

// ── 1. 抓取 joyhouse 所有商品 ───────────────────────────────────────────────

async function fetchPage(page) {
  const url = `https://www.joyhouse2015.com/products?limit=72&page=${page}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const html = await res.text();
      const $ = cheerio.load(html);
      const products = [];

      $('a').each((i, el) => {
        const href = $(el).attr('href') || '';
        if (!href.includes('/products/')) return;
        const text = $(el).text().replace(/\s+/g, ' ').trim();
        const priceMatch = text.match(/NT\$[\d,]+/);
        if (!priceMatch) return;

        // 移除「售完」前綴
        const nameRaw = text.replace(/^售完\s*/, '').replace(/NT\$.*$/, '').trim();
        const price = priceMatch[0].replace('NT$', '').replace(/,/g, '');

        // 只取單一價格（跳過 NT$X~NT$Y 的範圍）
        if (text.match(/NT\$[\d,]+\s*~\s*NT\$[\d,]+/)) return;

        // 圖片
        const img = $(el).find('img').first().attr('src') ||
                    $(el).find('img').first().attr('data-src') || '';

        if (nameRaw) products.push({ name: nameRaw, price, img });
      });

      return products;
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

async function fetchAllProducts() {
  const all = [];
  for (let i = 0; i < TOTAL_PAGES; i += CONCURRENCY) {
    const batch = Array.from({ length: Math.min(CONCURRENCY, TOTAL_PAGES - i) }, (_, j) => i + j + 1);
    process.stdout.write(`抓取第 ${batch[0]}-${batch[batch.length-1]} 頁...`);
    const results = await Promise.all(batch.map(p => fetchPage(p)));
    results.forEach(r => all.push(...r));
    console.log(` 累計 ${all.length} 款`);
    if (i + CONCURRENCY < TOTAL_PAGES) await new Promise(r => setTimeout(r, DELAY_MS));
  }
  // 去重（同名只保留第一個）
  const seen = new Set();
  return all.filter(p => {
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  });
}

// ── 2. 讀取 Google Sheet ──────────────────────────────────────────────────────

async function readSheet() {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'D:/Claude Project/Uggboardgame/service-account.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: '工作表1!A:U',
  });
  return { rows: res.data.values || [], sheets, auth };
}

// ── 3. 名稱正規化（用於比對）────────────────────────────────────────────────

function normalize(s) {
  return s
    .replace(/[：:]/g, '')     // 冒號
    .replace(/[（(][^）)]*[）)]/g, '')  // 括號內容
    .replace(/\s+/g, '')       // 空白
    .replace(/[！!？?]/g, '')  // 標點
    .replace(/新版|豪華版|典藏版|大盒版/g, '')  // 版本字
    .toLowerCase()
    .trim();
}

// ── 4. 主流程 ─────────────────────────────────────────────────────────────────

console.log('=== Step 1: 抓取 joyhouse 商品 ===');
const products = await fetchAllProducts();
console.log(`\n共抓到 ${products.length} 款（去重後）`);

// 儲存備份
writeFileSync('joyhouse_products.json', JSON.stringify(products, null, 2));
console.log('已儲存 joyhouse_products.json');

console.log('\n=== Step 2: 讀取 Google Sheet ===');
const { rows, sheets } = await readSheet();
console.log(`Sheet 共 ${rows.length} 列（含標題）`);

// Header 在第 8 列（index 7），資料從 index 8 開始（sheet row 9）
const HEADER_IDX = 7;
const DATA_START = 8;
const COL_NAME = 0;   // A：中文名稱
const COL_PRICE = 13; // N：定價
const COL_IMAGE = 20; // U：圖片

// 建立 joyhouse 名稱查找表
const joyMap = new Map();
for (const p of products) {
  const key = normalize(p.name);
  if (!joyMap.has(key)) joyMap.set(key, p);
}

console.log('\n=== Step 3: 比對名稱，尋找需要更新的遊戲 ===');

const toUpdate = []; // { sheetRow (1-based), priceCell, imageCell, name, price, img }

for (let i = DATA_START; i < rows.length; i++) {
  const row = rows[i];
  const sheetName = (row[COL_NAME] || '').trim();
  if (!sheetName) continue;

  const currentPrice = (row[COL_PRICE] || '').trim();
  const currentImage = (row[COL_IMAGE] || '').trim();

  // 兩個都已有值就跳過
  if (currentPrice && currentImage) continue;

  const key = normalize(sheetName);
  const match = joyMap.get(key);
  if (!match) continue;

  const sheetRow = i + 1; // 1-based
  const entry = { sheetRow, name: sheetName, joyhouseName: match.name };

  if (!currentPrice) entry.price = match.price;
  if (!currentImage) entry.img = match.img;

  toUpdate.push(entry);
  console.log(`  Row ${sheetRow}: ${sheetName} → 定價:${entry.price || '已有'} 圖:${entry.img ? '待填' : '已有'}`);
}

console.log(`\n共需更新 ${toUpdate.length} 筆`);

if (toUpdate.length === 0) {
  console.log('沒有需要更新的資料，結束。');
  process.exit(0);
}

// ── 5. 批次寫入 Sheet ─────────────────────────────────────────────────────────

const colLetter = n => String.fromCharCode(65 + n); // 0→A, 13→N, 20→U

const batchData = [];
for (const entry of toUpdate) {
  if (entry.price) {
    batchData.push({
      range: `工作表1!${colLetter(COL_PRICE)}${entry.sheetRow}`,
      values: [[entry.price]],
    });
  }
  if (entry.img) {
    batchData.push({
      range: `工作表1!${colLetter(COL_IMAGE)}${entry.sheetRow}`,
      values: [[entry.img]],
    });
  }
}

console.log(`\n=== Step 4: 寫入 Sheet（共 ${batchData.length} 個儲存格）===`);

const auth2 = new google.auth.GoogleAuth({
  keyFile: 'D:/Claude Project/Uggboardgame/service-account.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets2 = google.sheets({ version: 'v4', auth: auth2 });

// 分批寫入（每批 200 個）
for (let i = 0; i < batchData.length; i += 200) {
  const chunk = batchData.slice(i, i + 200);
  await sheets2.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { data: chunk, valueInputOption: 'USER_ENTERED' },
  });
  console.log(`  已寫入 ${Math.min(i + 200, batchData.length)} / ${batchData.length}`);
}

console.log('\n✅ 完成！');
console.log('詳細比對結果：');
toUpdate.forEach(e => {
  const updates = [];
  if (e.price) updates.push(`定價: NT$${e.price}`);
  if (e.img) updates.push(`圖片: ${e.img.substring(0, 40)}...`);
  console.log(`  Row ${e.sheetRow}: ${e.name} → ${updates.join(', ')}`);
});
