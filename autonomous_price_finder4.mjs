/**
 * autonomous_price_finder4.mjs
 * 用 BGhut search.php?keywords= 逐一搜尋每款待查遊戲，精確比對後取定價
 */
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw';
const SHEET_GID = 540615026;
const SEARCH_CACHE = path.join(__dirname, 'bghut_search_cache2.json');
const PROGRESS_FILE = path.join(__dirname, 'price_finder_progress4.json');
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
  return (s || '').toLowerCase()
    .replace(/[：:・\s\-－—《》【】（）()「」『』、，。！？!?．.·～~_]/g, '')
    .replace(/桌遊|boardgame/gi, '')
    .replace(/中文版|繁中版|繁體|大盒版|標準版|豪華版|新版|第\d版|\d+版|\d+年版/g, '');
}

function isChinese(s) { return /[一-鿿㐀-䶿]/.test(s); }

function parseNamesFromUrl(url) {
  const m = url.match(/goods-\d+-(.+)\.html$/i);
  if (!m) return { zhName: '', enName: '' };
  const raw = decodeURIComponent(m[1].replace(/\+/g, ' ')).trim();
  const enMatch = raw.match(/\(([^)]+)\)\s*$/);
  const enName = enMatch?.[1]?.trim() || '';
  const zhName = enName ? raw.replace(/\s*\([^)]+\)\s*$/, '').trim() : raw;
  return { zhName, enName };
}

async function fetchHtml(url) {
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; }
}

async function searchBghut(keyword) {
  const url = `${BGHUT_BASE}/search.php?keywords=${encodeURIComponent(keyword)}`;
  const html = await fetchHtml(url);
  if (!html) return [];
  const seen = new Set();
  const results = [];
  for (const m of html.matchAll(/href="(goods-\d+[^"#?]+\.html)"/g)) {
    const href = `${BGHUT_BASE}/${m[1]}`;
    if (!seen.has(href)) { seen.add(href); results.push(href); }
  }
  return results;
}

// 判斷搜尋結果是否為同一款遊戲（允許 BGhut 名稱稍有不同）
function isGoodMatch(sheetName, sheetEn, urlZh, urlEn) {
  const ns = norm(sheetName);
  const ne = norm(sheetEn);
  const nz = norm(urlZh);
  const nu = norm(urlEn);

  // 精確比對
  if (ns === nz || ne === nu) return 'exact';
  // Sheet 名稱完全包含在 URL 名稱中（或反之），且長度差不大
  if (ns.length >= 3 && nz.includes(ns) && nz.length <= ns.length * 2) return 'contains';
  if (nz.length >= 3 && ns.includes(nz) && ns.length <= nz.length * 2) return 'contains';
  // 英文名比對
  if (ne.length >= 4 && nu.includes(ne)) return 'en_contains';
  if (nu.length >= 4 && ne.includes(nu)) return 'en_contains';
  return null;
}

function saveProgress(p) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
    done: [...p.done], written: p.written, updatedAt: new Date().toISOString(),
  }, null, 2));
}

async function main() {
  console.log('=== Round 4：BGhut 搜尋 API ===\n');

  // 載入搜尋快取
  let searchCache = {};
  if (fs.existsSync(SEARCH_CACHE)) {
    searchCache = JSON.parse(fs.readFileSync(SEARCH_CACHE, 'utf8'));
    console.log(`搜尋快取：${Object.keys(searchCache).length} 筆\n`);
  }

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
    console.log(`繼續進度：${progress.done.size} 筆已完成\n`);
  }

  const updates = [];
  let searched = 0, found = 0, noMatch = 0, noPrice = 0;

  for (const { rowNum, name, enName } of noPriceList) {
    if (progress.done.has(rowNum)) continue;

    // 搜尋關鍵字：優先用英文名，其次中文名（英文在 BGhut 通常更精確）
    const searchKeywords = [];
    if (enName && enName.length >= 3) searchKeywords.push(enName.split(':')[0].trim()); // 只取主標題
    // 中文名去掉括號後綴當關鍵字
    const cnKey = name.replace(/[（(【〔].+$/, '').replace(/[：:].+$/, '').trim();
    if (cnKey.length >= 2 && isChinese(cnKey)) searchKeywords.push(cnKey);

    let bestUrl = null;
    let bestMatchType = null;

    for (const keyword of searchKeywords) {
      if (!keyword) continue;

      // 先查快取
      let urls = searchCache[keyword];
      if (!urls) {
        urls = await searchBghut(keyword);
        searchCache[keyword] = urls;
        // 每 50 次存快取
        if (searched % 50 === 0) {
          fs.writeFileSync(SEARCH_CACHE, JSON.stringify(searchCache, null, 2));
        }
        await sleep(350);
      }

      // 從搜尋結果中找最佳比對（只取中文版）
      for (const url of urls.slice(0, 10)) {
        const { zhName: uz, enName: ue } = parseNamesFromUrl(url);
        if (!isChinese(uz)) continue; // 只考慮中文版

        const matchType = isGoodMatch(name, enName, uz, ue);
        if (matchType === 'exact') { bestUrl = url; bestMatchType = 'exact'; break; }
        if (matchType && !bestUrl) { bestUrl = url; bestMatchType = matchType; }
      }

      if (bestMatchType === 'exact') break;
    }

    progress.done.add(rowNum);
    searched++;

    if (!bestUrl) {
      noMatch++;
      if (searched % 20 === 0) {
        process.stdout.write(`\r  搜尋 ${searched}/${noPriceList.length}，找到 ${found}，無配對 ${noMatch}`);
      }
      continue;
    }

    // 抓定價
    const html = await fetchHtml(bestUrl);
    if (!html) { continue; }

    const price = extractPrice(html);
    if (!price || price === '9999' || parseInt(price) > 9000) {
      noPrice++;
      continue;
    }

    found++;
    const { zhName: uz } = parseNamesFromUrl(bestUrl);
    updates.push({ range: `${sheetName}!N${rowNum}`, values: [[parseInt(price)]] });
    console.log(`  ✓ [${rowNum}] ${name}${uz !== name ? ` (BGhut:${uz})` : ''} [${bestMatchType}] → ${price}元`);

    if (updates.length >= 20) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: { valueInputOption: 'USER_ENTERED', data: updates.splice(0, 20) },
      });
      progress.written += 20;
      console.log(`  [寫入 20 筆]`);
      saveProgress(progress);
    }

    await sleep(300);
  }

  // 存最後快取
  fs.writeFileSync(SEARCH_CACHE, JSON.stringify(searchCache, null, 2));

  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { valueInputOption: 'USER_ENTERED', data: updates },
    });
    progress.written += updates.length;
    console.log(`  [寫入 ${updates.length} 筆]`);
  }
  saveProgress(progress);

  console.log(`\n=== Round 4 完成 ===`);
  console.log(`搜尋 ${searched} 款，找到定價 ${found} 款，無配對 ${noMatch} 款，無法取得價格 ${noPrice} 款`);
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
