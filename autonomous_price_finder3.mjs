/**
 * autonomous_price_finder3.mjs
 * 用更寬鬆的名稱比對（子字串/關鍵字）從現有 URL 快取中撈更多定價
 */
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw';
const SHEET_GID = 540615026;
const URL_CACHE_FILE = path.join(__dirname, 'bghut_all_urls_cache.json');
const PROGRESS_FILE = path.join(__dirname, 'price_finder_progress3.json');
const BGHUT_BASE = 'https://bghut.com';

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

function norm(s) {
  return s.toLowerCase()
    .replace(/[：:・\s\-－—《》【】（）()「」『』、，。！？!?．.·～~_]/g, '')
    .replace(/桌遊|board\s*game/gi, '')
    .replace(/中文版|繁中版|繁中|繁體|大盒版|標準版|豪華版|新版|經典版/g, '');
}

function isChinese(s) { return /[一-鿿㐀-䶿]/.test(s); }

function parseNamesFromUrl(url) {
  const m = url.match(/goods-\d+-(.+)\.html$/);
  if (!m) return { zhName: '', enName: '', full: '' };
  const raw = decodeURIComponent(m[1].replace(/\+/g, ' ')).trim();
  const enMatch = raw.match(/\(([^)]+)\)\s*$/);
  const enName = enMatch?.[1]?.trim() || '';
  const zhName = enName ? raw.replace(/\s*\([^)]+\)\s*$/, '').trim() : raw;
  return { zhName, enName, full: raw };
}

async function fetchHtml(url) {
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; }
}

function saveProgress(p) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
    done: [...p.done], written: p.written, updatedAt: new Date().toISOString(),
  }, null, 2));
}

async function writeToSheet(sheets, updates, sheetName) {
  if (!updates.length) return;
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { valueInputOption: 'USER_ENTERED', data: updates },
  });
  console.log(`  [寫入 ${updates.length} 筆]`);
}

async function main() {
  console.log('=== Round 3：寬鬆名稱比對 ===\n');

  // 讀取 URL 快取
  const cached = JSON.parse(fs.readFileSync(URL_CACHE_FILE, 'utf8'));
  const allUrls = cached.urls || [];
  console.log(`URL 快取：${allUrls.length} 個`);

  // 篩選中文版
  const cnUrls = allUrls.filter(u => isChinese(parseNamesFromUrl(u).zhName));
  console.log(`中文版：${cnUrls.length} 個\n`);

  // 讀取 Sheet
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

  const noPriceList = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const name = String(row[0] || '').trim();
    const enName = String(row[2] || '').trim();
    const price = String(row[13] || '').trim();
    if (name && !price) noPriceList.push({ rowNum: i + 1, name, enName });
  }
  console.log(`待查定價：${noPriceList.length} 款\n`);

  // 讀進度
  let progress = { done: new Set(), written: 0 };
  if (fs.existsSync(PROGRESS_FILE)) {
    const p = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    progress.done = new Set(p.done || []);
    progress.written = p.written || 0;
    console.log(`繼續進度：已完成 ${progress.done.size} 筆\n`);
  }

  // 預先為每個 URL 建立正規化名稱索引
  const urlIndex = cnUrls.map(url => {
    const { zhName, enName, full } = parseNamesFromUrl(url);
    return { url, normZh: norm(zhName), normEn: norm(enName), normFull: norm(full), zhName, enName };
  });

  // 比對：精確 + 子字串
  const matches = [];
  for (const { rowNum, name, enName } of noPriceList) {
    if (progress.done.has(rowNum)) continue;

    const normName = norm(name);
    const normEn = norm(enName);
    // 取中文名稱前 4-6 字當關鍵字（去掉括號和後綴）
    const keyPart = name.replace(/[（(【〔].+$/, '').replace(/[：:].+$/, '').trim();
    const normKey = norm(keyPart);

    let best = null;
    for (const entry of urlIndex) {
      // 1. 精確比對
      if (entry.normZh === normName || entry.normEn === normEn ||
          (normEn.length > 3 && entry.normEn === normEn)) {
        best = entry; break;
      }
      // 2. 子字串比對（URL 名稱包含 Sheet 名稱，或反之）
      if (normKey.length >= 3) {
        if (entry.normZh.includes(normKey) || normKey.includes(entry.normZh)) {
          if (!best) best = entry;
        }
      }
      // 3. 英文名部分比對
      if (normEn.length >= 4 && entry.normEn.length >= 4) {
        if (entry.normEn.includes(normEn) || normEn.includes(entry.normEn)) {
          if (!best) best = entry;
        }
      }
    }

    if (best) matches.push({ rowNum, name, url: best.url, bghutName: best.zhName });
  }

  console.log(`比對命中：${matches.length} 款\n`);

  // 抓價格
  const updates = [];
  let fetched = 0, found = 0, noPrice = 0;

  for (const { rowNum, name, url, bghutName } of matches) {
    if (progress.done.has(rowNum)) continue;

    const html = await fetchHtml(url);
    progress.done.add(rowNum);
    fetched++;

    if (!html) { await sleep(300); continue; }

    const price = extractPrice(html);
    if (!price || price === '9999' || parseInt(price) > 9000) {
      noPrice++;
      if (fetched % 30 === 0) process.stdout.write(`\r  進度 ${fetched}/${matches.length}，命中 ${found}，無價格 ${noPrice}`);
      await sleep(280);
      continue;
    }

    found++;
    updates.push({ range: `${sheetName}!N${rowNum}`, values: [[parseInt(price)]] });
    console.log(`  ✓ [${rowNum}] ${name}${bghutName !== name ? ` (BGhut: ${bghutName})` : ''} → ${price}元`);

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

  console.log(`\n\n=== Round 3 完成 ===`);
  console.log(`抓取 ${fetched} 筆，找到定價 ${found} 筆，無法取得 ${noPrice} 筆`);
  console.log(`本輪新增寫入：${progress.written} 筆`);

  // 最終統計
  const fr = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID, range: `${sheetName}!A:N`, valueRenderOption: 'UNFORMATTED_VALUE',
  });
  const frows = fr.data.values || [];
  const fhi = frows.findIndex(r => r && r[0] === '中文名稱');
  let still = 0;
  for (let i = fhi + 1; i < frows.length; i++) {
    const r = frows[i] || [];
    if (r[0] && !String(r[13] || '').trim()) still++;
  }
  console.log(`仍缺定價：${still} 款`);
}

main().catch(e => { console.error('\n錯誤：', e.message); process.exit(1); });
