/**
 * bghut_search.mjs
 * 從 Google Sheet 找出 Y 欄（遊戲簡介）空白的遊戲
 * → 用英文名在 bghut.com 搜尋 → 精確比對 → 寫回 Y 欄
 *
 * 用法：
 *   node bghut_search.mjs          ← 執行（支援中斷續跑）
 *   node bghut_search.mjs --dry    ← 試跑，只印出結果不寫入 Sheet
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw';
const SHEET_GID = 540615026;
const CACHE_PATH = path.join(__dirname, 'bghut_search_cache.json');
const BGHUT_BASE = 'https://bghut.com';
const DRY = process.argv.includes('--dry');

// 欄位索引（0-based）
const C = { 名稱: 0, 英文: 2, 簡介: 24 };

// === AUTH ===
async function getAuth() {
  const keyPath = path.join(__dirname, 'service-account.json');
  if (!fs.existsSync(keyPath)) { console.error('找不到 service-account.json'); process.exit(1); }
  return new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

// === FETCH ===
async function fetchHtml(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
        },
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(1200 * (i + 1));
    }
  }
}

// 從 HTML 取 og:description，切掉前綴「遊戲名_類別_卡牌屋，」
function extractDesc(html) {
  const match =
    html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i) ||
    html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:description"/i);
  if (!match) return '';
  let desc = match[1]
    .replace(/&quot;/g, '"').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").trim();
  const commaIdx = desc.indexOf(',');
  if (commaIdx > 0 && commaIdx < 120) desc = desc.slice(commaIdx + 1).trim();
  return desc;
}

// 從 URL 解析中英文名
function parseNameFromUrl(url) {
  const m = url.match(/goods-\d+-(.+)\.html$/);
  if (!m) return { zhName: '', enName: '' };
  const raw = decodeURIComponent(m[1].replace(/\+/g, ' ')).trim();
  const enMatch = raw.match(/\(([^)]+)\)\s*$/);
  const enName = enMatch?.[1]?.trim() || '';
  const zhName = enName ? raw.replace(/\s*\([^)]+\)\s*$/, '').trim() : raw;
  return { zhName, enName };
}

// 標準化比對用：去掉括號、空格、特殊符號，轉小寫
function normalize(s) {
  return (s || '').toLowerCase().replace(/[\s()（）：:!！?？\-–—,，.。]/g, '').trim();
}

// 在 bghut 搜尋，回傳所有商品連結（去重）
async function searchBghut(keyword) {
  const url = `${BGHUT_BASE}/search.php?keywords=${encodeURIComponent(keyword)}`;
  const html = await fetchHtml(url);
  const seen = new Set();
  const results = [];
  const re = /href="(goods-\d+[^"#?]+\.html)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = `${BGHUT_BASE}/${m[1]}`;
    if (!seen.has(href)) { seen.add(href); results.push(href); }
  }
  return results;
}

// 取得 URL 裡的所有名稱片段（含括號內外，不管中英順序）
function allNamesFromUrl(url) {
  const m = url.match(/goods-\d+-(.+)\.html$/);
  if (!m) return [];
  const raw = decodeURIComponent(m[1].replace(/\+/g, ' ')).trim();
  const enMatch = raw.match(/\(([^)]+)\)\s*$/);
  const parts = [raw.replace(/\s*\([^)]+\)\s*$/, '').trim()];
  if (enMatch) parts.push(enMatch[1].trim());
  return parts.filter(Boolean);
}

// 從搜尋結果找最精確的配對
// 英文或中文任一側完全一致即算配對（處理「英文(中文)」和「中文(英文)」兩種格式）
function findBestMatch(links, zhName, enName) {
  const normZh = normalize(zhName);
  const normEn = normalize(enName);

  for (const link of links) {
    const parts = allNamesFromUrl(link).map(normalize);
    if (normEn && parts.includes(normEn)) return link;
  }
  for (const link of links) {
    const parts = allNamesFromUrl(link).map(normalize);
    if (normZh && parts.includes(normZh)) return link;
  }
  return null;
}

// === READ SHEET ===
async function readSheet(auth) {
  const sheets = google.sheets({ version: 'v4', auth });
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const tab = meta.data.sheets.find(s => s.properties.sheetId === SHEET_GID) || meta.data.sheets[0];
  const sheetName = tab.properties.title;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:Y`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  return { rows: res.data.values || [], sheetName };
}

// === WRITE SHEET ===
async function writeUpdates(auth, sheetName, updates) {
  if (updates.length === 0) return;
  const sheets = google.sheets({ version: 'v4', auth });
  const batchData = updates.map(u => ({
    range: `${sheetName}!${colLetter(u.col)}${u.row}`,
    values: [[u.value]],
  }));
  const CHUNK = 200;
  for (let i = 0; i < batchData.length; i += CHUNK) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { valueInputOption: 'USER_ENTERED', data: batchData.slice(i, i + CHUNK) },
    });
    console.log(`  已寫入 ${Math.min(i + CHUNK, batchData.length)} / ${batchData.length} 格`);
  }
}

// === MAIN ===
async function main() {
  console.log(DRY ? '【試跑模式，不寫入 Sheet】' : '');

  // 載入快取（記錄已搜尋過的遊戲，避免重複查詢）
  let cache = {};
  if (fs.existsSync(CACHE_PATH)) {
    try { cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')); } catch {}
  }
  console.log(`搜尋快取：${Object.keys(cache).length} 筆`);

  const auth = await getAuth();
  const { rows, sheetName } = await readSheet(auth);

  const headerIdx = rows.findIndex(r => r && r[0] === '中文名稱');
  if (headerIdx === -1) throw new Error('找不到標題列');
  console.log(`標題列在第 ${headerIdx + 1} 行，共 ${rows.length - headerIdx - 1} 筆遊戲`);

  // 收集 Y 欄空白的遊戲
  const targets = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const zhName = String(row[C.名稱] || '').trim();
    const enName = String(row[C.英文] || '').trim();
    const descVal = String(row[C.簡介] || '').trim();
    if (zhName && !descVal) targets.push({ rowIdx: i, rowNum: i + 1, zhName, enName });
  }
  console.log(`Y 欄空白需補：${targets.length} 筆\n`);

  const updates = [];
  let found = 0, notFound = 0, skipped = 0, shortDesc = 0;

  for (let idx = 0; idx < targets.length; idx++) {
    const { rowIdx, rowNum, zhName, enName } = targets[idx];
    const cacheKey = enName || zhName;

    // 已有快取結果 → 直接用
    if (cache[cacheKey] !== undefined) {
      skipped++;
      if (cache[cacheKey]) {
        updates.push({ row: rowNum, col: C.簡介 + 1, value: cache[cacheKey] });
        found++;
      }
      process.stdout.write(`\r  ${idx + 1}/${targets.length} ✓快取 ${found}找到 ${notFound}未找到 ${skipped}快取`);
      continue;
    }

    // 搜尋策略：英文名優先搜尋，沒配對到再用中文名搜尋
    let desc = '';

    try {
      let bestLink = null;
      if (enName) {
        const links = await searchBghut(enName);
        bestLink = findBestMatch(links, zhName, enName);
      }
      // 英文搜尋沒配對到，改用中文名再試
      if (!bestLink && zhName) {
        await sleep(300);
        const links2 = await searchBghut(zhName);
        bestLink = findBestMatch(links2, zhName, enName);
      }

      if (bestLink) {
        const html = await fetchHtml(bestLink);
        desc = extractDesc(html);
        if (desc.length < 60) {
          desc = '';
          shortDesc++;
        }
      }
    } catch (e) {
      // 網路錯誤 → 不快取，下次重試
      process.stdout.write(`\r  ${idx + 1} 錯誤: ${e.message.slice(0,40)}`);
      await sleep(2000);
      continue;
    }

    // 存快取（找到→存描述；找不到→存空字串標記「已查過」）
    cache[cacheKey] = desc || '';
    if (idx % 20 === 0) fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));

    if (desc) {
      found++;
      updates.push({ row: rowNum, col: C.簡介 + 1, value: desc });
    } else {
      notFound++;
    }

    process.stdout.write(`\r  ${idx + 1}/${targets.length} ✓${found}找到 ✗${notFound}未找到 ~${shortDesc}短描述 ⬡${skipped}快取`);
    await sleep(600);
  }

  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  console.log(`\n\n搜尋完成！找到 ${found} 筆簡介，${notFound} 筆bghut沒有，${shortDesc} 筆描述太短跳過`);

  if (DRY) {
    console.log('\n【試跑】以下為會寫入的內容（前5筆）：');
    updates.slice(0, 5).forEach(u => console.log(`  Row ${u.row}: ${u.value.slice(0, 80)}...`));
    return;
  }

  console.log(`\n寫入 Sheet 共 ${updates.length} 格...`);
  await writeUpdates(auth, sheetName, updates);
  console.log('完成！✓');
}

// === HELPERS ===
function colLetter(n) {
  let r = '';
  while (n > 0) { n--; r = String.fromCharCode(65 + n % 26) + r; n = Math.floor(n / 26); }
  return r;
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

main().catch(console.error);
