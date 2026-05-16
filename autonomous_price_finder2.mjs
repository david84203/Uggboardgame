/**
 * autonomous_price_finder2.mjs
 * 補爬 BGhut DESC 方向（page 24-300），覆蓋中段 goods ID 約 7700-12135
 * 合併到 bghut_all_urls_cache.json，再比對 no_price_list 寫入 Sheet
 */
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw';
const SHEET_GID = 540615026;
const BGHUT_BASE = 'https://bghut.com';
const URL_CACHE_FILE = path.join(__dirname, 'bghut_all_urls_cache.json');
const PROGRESS_FILE = path.join(__dirname, 'price_finder_progress.json');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html',
  'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function extractPrice(html) {
  return html.match(/"price"\s*:\s*"(\d+)"/)?.[1]
    || html.match(/<meta[^>]+property=["']price:amount["'][^>]+content=["'](\d+)["']/i)?.[1]
    || null;
}

function normalize(s) {
  return s.toLowerCase()
    .replace(/[：:・\s\-－—《》【】（）()「」『』、，。！？!?．.·]/g, '')
    .replace(/桌遊/g, '');
}

async function fetchHtml(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(12000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      if (i === retries) return null;
      await sleep(1000 * (i + 1));
    }
  }
}

function parseNamesFromUrl(url) {
  const m = url.match(/goods-\d+-(.+)\.html$/);
  if (!m) return { zhName: '', enName: '' };
  const raw = decodeURIComponent(m[1].replace(/\+/g, ' ')).trim();
  const enMatch = raw.match(/\(([^)]+)\)\s*$/);
  const enName = enMatch?.[1]?.trim() || '';
  const zhName = enName ? raw.replace(/\s*\([^)]+\)\s*$/, '').trim() : raw;
  return { zhName, enName };
}

function isChinese(s) { return /[一-鿿㐀-䶿]/.test(s); }

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
    done: [...progress.done],
    written: progress.written,
    updatedAt: new Date().toISOString(),
  }, null, 2));
}

async function writeToSheet(sheets, updates, sheetName) {
  if (!updates.length) return;
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { valueInputOption: 'USER_ENTERED', data: updates },
  });
  process.stdout.write(` [寫入 ${updates.length} 筆]\n`);
}

async function main() {
  console.log('=== 烏嘎嘎 自動定價補填 Round 2 ===\n');

  // 讀取現有 URL 快取
  let existingUrls = new Set();
  if (fs.existsSync(URL_CACHE_FILE)) {
    const cached = JSON.parse(fs.readFileSync(URL_CACHE_FILE, 'utf8'));
    (cached.urls || []).forEach(u => existingUrls.add(u));
    console.log(`載入既有 URL 快取：${existingUrls.size} 個`);
  }

  // 補爬 DESC 方向（page 24-300）
  console.log('補爬 BGhut DESC 方向（page 24-300）...');
  let newFound = 0;
  let consecutiveEmpty = 0;

  for (let p = 24; p <= 300; p++) {
    const pageUrl = `${BGHUT_BASE}/category-1-b0-min0-max0-attr0-${p}-goods_id-DESC.html`;
    const html = await fetchHtml(pageUrl);
    if (!html) { consecutiveEmpty++; if (consecutiveEmpty >= 5) break; continue; }
    consecutiveEmpty = 0;

    const links = [...html.matchAll(/href="(goods-\d+[^"#?]+\.html)"/g)]
      .map(m => `${BGHUT_BASE}/${m[1]}`);
    const prevSize = existingUrls.size;
    links.forEach(u => existingUrls.add(u));
    const added = existingUrls.size - prevSize;
    newFound += added;

    if (p % 20 === 0) {
      process.stdout.write(`\r  第 ${p} 頁，新增 ${newFound} 個，總計 ${existingUrls.size} 個`);
    }

    if (added === 0 && p > 30) {
      consecutiveEmpty++;
      if (consecutiveEmpty >= 5) {
        console.log(`\n  連續 5 頁無新 URL，停止`);
        break;
      }
    }

    await sleep(280);
  }

  console.log(`\n補爬完成，新增 ${newFound} 個，總計 ${existingUrls.size} 個 URL`);

  // 存回快取
  const allUrls = [...existingUrls];
  fs.writeFileSync(URL_CACHE_FILE, JSON.stringify({ urls: allUrls, updatedAt: new Date().toISOString() }, null, 2));

  // 讀取 Sheet 取得待查清單
  console.log('\n重新讀取 Sheet...');
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'service-account.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const tab = meta.data.sheets.find(s => s.properties.sheetId === SHEET_GID);
  const sheetName = tab.properties.title;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:N`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  const rows = res.data.values || [];
  const headerIdx = rows.findIndex(r => r && r[0] === '中文名稱');

  const noPriceMap = new Map();
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const name = String(row[0] || '').trim();
    const enName = String(row[2] || '').trim();
    const price = String(row[13] || '').trim();
    if (name && !price) noPriceMap.set(i + 1, { name, enName });
  }
  console.log(`待查定價：${noPriceMap.size} 款`);

  // 建立名稱索引（多層正規化）
  const normMap = new Map();
  for (const [rowNum, { name, enName }] of noPriceMap) {
    normMap.set(normalize(name), rowNum);
    if (enName) normMap.set(normalize(enName), rowNum);
    // 去掉括號版本
    const baseName = name.replace(/[（(【〔].+[)）】〕]$/, '').trim();
    if (baseName !== name) normMap.set(normalize(baseName), rowNum);
    // 去掉「擴充」「大盒版」等後綴
    const shortName = name.replace(/[：:].+$/, '').trim();
    if (shortName !== name && shortName.length >= 2) normMap.set(normalize(shortName), rowNum);
  }

  // 篩選中文版 URL 並比對
  const chineseUrls = allUrls.filter(url => isChinese(parseNamesFromUrl(url).zhName));
  console.log(`中文版頁面：${chineseUrls.length} 個`);

  const matches = [];
  for (const url of chineseUrls) {
    const { zhName, enName } = parseNamesFromUrl(url);
    const rowNum = normMap.get(normalize(zhName)) || normMap.get(normalize(enName));
    if (rowNum) {
      matches.push({ rowNum, name: noPriceMap.get(rowNum)?.name, url });
    }
  }
  console.log(`名稱比對命中：${matches.length} 款\n`);

  // 讀進度
  let progress = { done: new Set(), written: 0 };
  if (fs.existsSync(PROGRESS_FILE)) {
    const p = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    progress.done = new Set(p.done || []);
    progress.written = p.written || 0;
    console.log(`繼續上次進度：已完成 ${progress.done.size} 筆，已寫入 ${progress.written} 筆\n`);
  }

  // 抓定價
  const updates = [];
  let fetched = 0, noPrice = 0;

  for (const { rowNum, name, url } of matches) {
    if (progress.done.has(rowNum)) continue;

    const html = await fetchHtml(url);
    progress.done.add(rowNum);

    if (!html) { fetched++; await sleep(300); continue; }

    const price = extractPrice(html);
    fetched++;

    if (!price || price === '9999' || parseInt(price) > 9000) {
      noPrice++;
      continue;
    }

    updates.push({ range: `${sheetName}!N${rowNum}`, values: [[parseInt(price)]] });
    console.log(`  ✓ [${rowNum}] ${name} → ${price}元`);

    if (updates.length >= 20) {
      await writeToSheet(sheets, updates.splice(0, 20), sheetName);
      progress.written += 20;
      saveProgress(progress);
    }

    await sleep(320);
  }

  if (updates.length > 0) {
    await writeToSheet(sheets, updates, sheetName);
    progress.written += updates.length;
    saveProgress(progress);
  }

  console.log(`\n=== 完成！===`);
  console.log(`抓取 ${fetched} 筆，寫入 ${progress.written} 筆，無價格 ${noPrice} 筆`);

  // 最終統計
  const finalRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:N`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  const finalRows = finalRes.data.values || [];
  const fhIdx = finalRows.findIndex(r => r && r[0] === '中文名稱');
  let still = 0;
  for (let i = fhIdx + 1; i < finalRows.length; i++) {
    const r = finalRows[i] || [];
    if (r[0] && !String(r[13] || '').trim()) still++;
  }
  console.log(`仍缺定價：${still} 款`);
}

main().catch(e => { console.error('\n錯誤：', e.message); process.exit(1); });
