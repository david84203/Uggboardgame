/**
 * bghut_update.mjs
 * 從 bghut.com（卡牌屋）抓取遊戲簡介，更新 Google Sheet Y 欄
 *
 * 用法：
 *   node bghut_update.mjs crawl    ← 爬網站目錄，存成 bghut_cache.json
 *   node bghut_update.mjs update   ← 比對 Sheet，寫入 Y 欄（需先跑 crawl）
 *   node bghut_update.mjs all      ← 兩步驟一起跑
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw';
const SHEET_GID = 540615026;
const CACHE_PATH = path.join(__dirname, 'bghut_cache.json');
const BGHUT_BASE = 'https://bghut.com';

// 欄位索引（0-based）
const C = {
  名稱: 0,  // A 中文名稱
  英文: 2,  // C 英文名稱
  簡介: 24, // Y 遊戲簡介
};

// === AUTH (Service Account) ===
async function getAuth() {
  const keyPath = path.join(__dirname, 'service-account.json');
  if (!fs.existsSync(keyPath)) {
    console.error('找不到 service-account.json');
    process.exit(1);
  }
  return new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

// === FETCH HELPERS ===
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

// 從 HTML 中提取 og:description，並切掉前綴
function extractDesc(html) {
  const match =
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
  if (!match) return '';
  let desc = match[1]
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .trim();
  // 切掉 "遊戲名_類別_桌遊_卡牌屋桌上遊戲," 這段前綴
  const commaIdx = desc.indexOf(',');
  if (commaIdx > 0 && commaIdx < 120) {
    desc = desc.slice(commaIdx + 1).trim();
  }
  return desc;
}

// 從目錄頁 HTML 提取所有商品連結
function extractGoodsLinks(html) {
  const results = [];
  const seen = new Set();
  const re = /href="(goods-\d+[^"#?]+\.html)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = `${BGHUT_BASE}/${m[1]}`;
    if (!seen.has(href)) {
      seen.add(href);
      results.push(href);
    }
  }
  return results;
}

// 從 URL 解析中英文名稱
function parseNameFromUrl(url) {
  const m = url.match(/goods-\d+-(.+)\.html$/);
  if (!m) return { zhName: '', enName: '' };
  const raw = decodeURIComponent(m[1].replace(/\+/g, ' ')).trim();
  // 格式通常是「中文名 (英文名)」
  const enMatch = raw.match(/\(([^)]+)\)\s*$/);
  const enName = enMatch?.[1]?.trim() || '';
  const zhName = enName ? raw.replace(/\s*\([^)]+\)\s*$/, '').trim() : raw;
  return { zhName, enName };
}

// === CRAWL ===
async function crawl() {
  let cached = {};
  if (fs.existsSync(CACHE_PATH)) {
    try {
      cached = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
      const withDesc = Object.values(cached).filter(p => !p.error && p.desc).length;
      console.log(`載入既有快取：${Object.keys(cached).length} 筆（${withDesc} 筆有簡介）`);
    } catch {}
  }

  // Step 1：掃描所有目錄頁，收集商品 URL（與快取獨立，避免提早停止）
  console.log('\n掃描目錄頁...');
  const discoveredUrls = new Set(); // 僅用於偵測「頁面是否有新連結」
  let page = 1;
  let emptyCount = 0;

  while (emptyCount < 2) {
    const url =
      page === 1
        ? `${BGHUT_BASE}/category-1-b0-%E6%A1%8C%E9%81%8A.html`
        : `${BGHUT_BASE}/category-1-b0-min0-max0-attr0-${page}-goods_id-DESC.html`;
    try {
      const html = await fetchHtml(url);
      const links = extractGoodsLinks(html);
      const prevSize = discoveredUrls.size;
      for (const link of links) discoveredUrls.add(link);
      const newLinks = discoveredUrls.size - prevSize;
      if (newLinks === 0) {
        emptyCount++;
      } else {
        emptyCount = 0;
      }
      process.stdout.write(`\r  頁面 ${page}，累計 ${discoveredUrls.size} 筆商品`);
    } catch (e) {
      console.warn(`\n  頁面 ${page} 失敗: ${e.message}`);
      emptyCount++;
    }
    page++;
    await sleep(400);
  }

  // 合併快取既有 URL
  const allUrls = new Set([...discoveredUrls, ...Object.keys(cached)]);
  console.log(`\n目錄共 ${discoveredUrls.size} 筆（加上快取共 ${allUrls.size} 筆）`);

  // Step 2：逐一抓取每個商品頁的簡介
  const urlList = [...allUrls];
  let done = 0;
  let skipped = 0;

  for (const url of urlList) {
    // 已有資料且沒錯誤 → 跳過
    if (cached[url] && !cached[url].error && cached[url].desc !== undefined) {
      skipped++;
      done++;
      continue;
    }

    const { zhName, enName } = parseNameFromUrl(url);
    try {
      const html = await fetchHtml(url);
      const desc = extractDesc(html);
      cached[url] = { url, zhName, enName, desc };
    } catch (e) {
      cached[url] = { url, zhName, enName, error: e.message };
    }

    done++;
    process.stdout.write(`\r  ${done}/${urlList.length} (跳過${skipped}) ${zhName.slice(0, 25)}`);

    if (done % 30 === 0) {
      fs.writeFileSync(CACHE_PATH, JSON.stringify(cached, null, 2));
    }

    await sleep(500);
  }

  fs.writeFileSync(CACHE_PATH, JSON.stringify(cached, null, 2));
  const ok = Object.values(cached).filter(p => !p.error && p.desc).length;
  const fail = Object.values(cached).filter(p => p.error).length;
  console.log(`\n完成！有簡介 ${ok}，失敗 ${fail}，存入 bghut_cache.json`);
}

// === READ SHEET ===
async function readSheet(auth) {
  const sheets = google.sheets({ version: 'v4', auth });
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const tab =
    meta.data.sheets.find(s => s.properties.sheetId === SHEET_GID) ||
    meta.data.sheets[0];
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

  const headerIdx = rows.findIndex(r => r && r[0] === '中文名稱');
  if (headerIdx === -1) throw new Error('找不到標題列「中文名稱」');
  console.log(`標題列在第 ${headerIdx + 1} 行`);

  // 建立 bghut 索引（中文名稱 → 資料，英文名稱 → 資料）
  const byZh = {};
  const byEn = {};
  for (const p of Object.values(products)) {
    if (!p || p.error || !p.desc) continue;
    if (p.zhName) byZh[p.zhName.trim()] = p;
    if (p.enName) byEn[p.enName.trim().toUpperCase()] = p;
  }

  const updates = [];
  let matched = 0;
  let skipped = 0;

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const zhName = String(row[C.名稱] || '').trim();
    if (!zhName) continue;

    // Y 欄已有內容 → 不覆蓋
    const descVal = String(row[C.簡介] || '').trim();
    if (descVal) { skipped++; continue; }

    const enName = String(row[C.英文] || '').trim().toUpperCase();
    const bghut = byZh[zhName] || byEn[enName];
    // 描述少於 60 字表示只是廣告語，不寫入
    if (!bghut?.desc || bghut.desc.length < 60) continue;

    matched++;
    const rowNum = i + 1;
    updates.push({ row: rowNum, col: C.簡介 + 1, value: bghut.desc });
  }

  console.log(`已有簡介跳過 ${skipped} 筆，配對 bghut ${matched} 筆，共 ${updates.length} 個更新`);

  if (updates.length === 0) {
    console.log('沒有需要更新的欄位，完成！');
    return;
  }

  const sheets = google.sheets({ version: 'v4', auth });
  const batchData = updates.map(u => ({
    range: `${sheetName}!${colLetter(u.col)}${u.row}`,
    values: [[u.value]],
  }));

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
    console.error('找不到 bghut_cache.json，請先執行 crawl');
    process.exit(1);
  }
  const cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
  const sheetData = await readSheet(auth);
  await updateSheet(auth, cache, sheetData);
}
