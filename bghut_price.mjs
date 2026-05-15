/**
 * bghut_price.mjs
 * 從 bghut_cache.json 的中文版頁面抓定價，寫入 Google Sheet N 欄（定價）
 *
 * 判斷中文版：URL 中括號前的主名稱含中文字（中文名(英文名) 格式）
 * 價格來源：<meta property="price:amount" content="XXX"> 或 JSON-LD "price"
 *
 * 用法：
 *   node bghut_price.mjs crawl    ← 爬定價，存成 bghut_price_cache.json
 *   node bghut_price.mjs update   ← 比對 Sheet，寫入 N 欄
 *   node bghut_price.mjs all      ← 兩步驟一起跑
 */
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw';
const SHEET_GID = 540615026;
const SOURCE_CACHE = path.join(__dirname, 'bghut_cache.json');
const PRICE_CACHE = path.join(__dirname, 'bghut_price_cache.json');

const C = {
  名稱: 0,  // A 中文名稱
  英文: 2,  // C 英文名稱
  定價: 13, // N 定價
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function isChinese(str) {
  return /[一-鿿㐀-䶿]/.test(str);
}

function extractPrice(html) {
  // 優先抓 meta price:amount（定價，非折扣）
  const metaMatch =
    html.match(/<meta[^>]+property=["']price:amount["'][^>]+content=["'](\d+)["']/i) ||
    html.match(/<meta[^>]+content=["'](\d+)["'][^>]+property=["']price:amount["']/i);
  if (metaMatch) return metaMatch[1];

  // 備用：JSON-LD "price"
  const ldMatch = html.match(/"price"\s*:\s*"(\d+)"/);
  if (ldMatch) return ldMatch[1];

  return '';
}

async function fetchHtml(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
        },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(1000 * (i + 1));
    }
  }
}

// === CRAWL ===
async function crawl() {
  const source = JSON.parse(fs.readFileSync(SOURCE_CACHE, 'utf8'));

  // 只取中文版（主名稱含中文）
  const zhItems = Object.values(source).filter(p => !p.error && isChinese(p.zhName));
  console.log(`中文版頁面：${zhItems.length} 筆（共 ${Object.keys(source).length} 筆）`);

  // 載入既有快取
  let cached = {};
  if (fs.existsSync(PRICE_CACHE)) {
    cached = JSON.parse(fs.readFileSync(PRICE_CACHE, 'utf8'));
    const done = Object.values(cached).filter(p => !p.error).length;
    console.log(`已有快取：${done} 筆\n`);
  }

  let finished = 0, skipped = 0, errors = 0;

  for (const item of zhItems) {
    const key = item.url;

    if (cached[key] && !cached[key].error) {
      skipped++;
      finished++;
      process.stdout.write(`\r  ${finished}/${zhItems.length} (跳過${skipped}) ${item.zhName.slice(0, 20)}`);
      continue;
    }

    try {
      const html = await fetchHtml(item.url);
      const price = extractPrice(html);
      cached[key] = {
        url: item.url,
        zhName: item.zhName,
        enName: item.enName,
        price,
      };
    } catch (e) {
      cached[key] = { url: item.url, zhName: item.zhName, enName: item.enName, error: e.message };
      errors++;
    }

    finished++;
    process.stdout.write(`\r  ${finished}/${zhItems.length} (錯誤${errors}) ${item.zhName.slice(0, 20)}`);

    if (finished % 30 === 0) {
      fs.writeFileSync(PRICE_CACHE, JSON.stringify(cached, null, 2));
    }

    await sleep(500);
  }

  fs.writeFileSync(PRICE_CACHE, JSON.stringify(cached, null, 2));
  const withPrice = Object.values(cached).filter(p => !p.error && p.price).length;
  console.log(`\n完成！有定價 ${withPrice}，錯誤 ${errors}，存入 bghut_price_cache.json`);
}

// === UPDATE SHEET ===
async function update() {
  if (!fs.existsSync(PRICE_CACHE)) {
    console.error('找不到 bghut_price_cache.json，請先執行 crawl');
    process.exit(1);
  }

  const cached = JSON.parse(fs.readFileSync(PRICE_CACHE, 'utf8'));
  const items = Object.values(cached).filter(p => !p.error && p.price);
  console.log(`快取中有定價的中文版：${items.length} 筆`);

  // 建立索引：中文名 → price，英文名 → price（英文名為備用）
  const byZh = {};
  const byEn = {};
  for (const p of items) {
    if (p.zhName) byZh[p.zhName.trim()] = p;
    if (p.enName) byEn[p.enName.trim().toUpperCase()] = p;
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'service-account.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const tab = meta.data.sheets.find(s => s.properties.sheetId === SHEET_GID) || meta.data.sheets[0];
  const sheetName = tab.properties.title;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:N`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  const rows = res.data.values || [];

  const headerIdx = rows.findIndex(r => r && r[0] === '中文名稱');
  if (headerIdx === -1) { console.error('找不到標題列'); process.exit(1); }

  const updates = [];
  let matched = 0, skipped = 0;

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const zhName = String(row[C.名稱] || '').trim();
    if (!zhName) continue;

    // 已有定價 → 跳過
    if ((row[C.定價] || '') !== '') { skipped++; continue; }

    const enName = String(row[C.英文] || '').trim().toUpperCase();
    const found = byZh[zhName] || byEn[enName];
    if (!found) continue;

    matched++;
    updates.push({
      range: `${sheetName}!N${i + 1}`,
      values: [[found.price]],
    });
  }

  console.log(`配對 ${matched} 筆，跳過（已有定價）${skipped} 筆`);

  if (updates.length === 0) {
    console.log('沒有需要更新的欄位');
    return;
  }

  for (let i = 0; i < updates.length; i += 200) {
    const batch = updates.slice(i, i + 200);
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { valueInputOption: 'USER_ENTERED', data: batch },
    });
    console.log(`  批次 ${Math.floor(i / 200) + 1}：寫入 ${batch.length} 筆`);
    await sleep(200);
  }
  console.log('完成！');
}

function colLetter(n) {
  let r = '';
  while (n > 0) { n--; r = String.fromCharCode(65 + n % 26) + r; n = Math.floor(n / 26); }
  return r;
}

const phase = process.argv[2] || 'all';
if (phase === 'crawl' || phase === 'all') await crawl();
if (phase === 'update' || phase === 'all') await update();
