/**
 * autonomous_price_finder.mjs
 * 自動爬取 BGhut 全站商品，比對 no_price_list.json，寫入 Google Sheet 定價
 *
 * 策略：
 *   1. 嘗試從 BGhut sitemap.xml 取得所有商品 URL（最快）
 *   2. 備用：逐頁爬取 BGhut 目錄（sorted by goods_id ASC，從舊到新）
 *   3. 抓每個命中頁面的 JSON-LD 定價
 *   4. 比對 no_price_list.json → 寫入 Sheet N 欄
 *
 * 執行：node autonomous_price_finder.mjs
 * 中斷後重跑會自動跳過已有定價的遊戲
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
    .replace(/[：:・\s\-－—《》【】（）()「」『』、，。！？!?]/g, '')
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

// === 步驟1：從 sitemap 取得所有商品 URL ===
async function tryGetUrlsFromSitemap() {
  console.log('嘗試從 sitemap.xml 取得所有商品 URL...');
  const urls = new Set();

  // 試幾個可能的 sitemap 路徑
  const sitemapUrls = [
    `${BGHUT_BASE}/sitemap.xml`,
    `${BGHUT_BASE}/sitemap_index.xml`,
    `${BGHUT_BASE}/sitemap-goods.xml`,
  ];

  for (const sUrl of sitemapUrls) {
    const html = await fetchHtml(sUrl);
    if (!html) continue;
    const matches = [...html.matchAll(/<loc>(https?:\/\/[^<]+goods-\d+[^<]*\.html)<\/loc>/g)];
    if (matches.length > 0) {
      console.log(`  ${sUrl}: 找到 ${matches.length} 筆商品 URL`);
      matches.forEach(m => urls.add(m[1]));
    } else {
      // 可能是 sitemap index，找子 sitemap
      const subMatches = [...html.matchAll(/<loc>(https?:\/\/[^<]+\.xml)<\/loc>/g)];
      for (const sm of subMatches.slice(0, 10)) {
        const subHtml = await fetchHtml(sm[1]);
        if (!subHtml) continue;
        const goodsMatches = [...subHtml.matchAll(/<loc>(https?:\/\/[^<]+goods-\d+[^<]*\.html)<\/loc>/g)];
        goodsMatches.forEach(m => urls.add(m[1]));
        if (goodsMatches.length > 0) {
          console.log(`  sub-sitemap ${sm[1]}: 找到 ${goodsMatches.length} 筆`);
        }
      }
    }
  }

  return [...urls];
}

// === 步驟2：逐頁爬目錄（備用） ===
async function crawlCategoryPages(startPage = 1, maxPages = 400) {
  console.log(`逐頁爬取目錄（第 ${startPage} 頁起）...`);
  const urls = new Set();

  // 嘗試 ASC 排序（從舊到新）
  for (let p = startPage; p <= maxPages; p++) {
    const pageUrl = p === 1
      ? `${BGHUT_BASE}/category-1-b0-%E6%A1%8C%E9%81%8A.html`
      : `${BGHUT_BASE}/category-1-b0-min0-max0-attr0-${p}-goods_id-ASC.html`;

    const html = await fetchHtml(pageUrl);
    if (!html) { console.log(`  頁面 ${p} 失敗，跳過`); continue; }

    const links = [...html.matchAll(/href="(goods-\d+[^"#?]+\.html)"/g)].map(m => `${BGHUT_BASE}/${m[1]}`);
    const prevSize = urls.size;
    links.forEach(u => urls.add(u));
    const newCount = urls.size - prevSize;

    if (p % 20 === 0 || newCount === 0) {
      process.stdout.write(`\r  第 ${p} 頁，累計 ${urls.size} 個 URL`);
    }

    if (newCount === 0 && p > 5) {
      console.log(`\n  第 ${p} 頁無新 URL，停止`);
      break;
    }

    await sleep(300);
  }

  return [...urls];
}

// === 從 URL 解析名稱 ===
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

// === 主程式 ===
async function main() {
  console.log('=== 烏嘎嘎 自動定價補填 ===\n');

  // 讀取待查清單（從 Sheet 重新拉）
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'service-account.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const tab = meta.data.sheets.find(s => s.properties.sheetId === SHEET_GID);
  const sheetName = tab.properties.title;

  console.log('讀取 Sheet...');
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:N`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  const rows = res.data.values || [];
  const headerIdx = rows.findIndex(r => r && r[0] === '中文名稱');

  // 建立待查的 row → name 對應
  const noPriceMap = new Map(); // row → { name, enName }
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const name = String(row[0] || '').trim();
    const enName = String(row[2] || '').trim();
    const price = String(row[13] || '').trim();
    if (name && !price) noPriceMap.set(i + 1, { name, enName });
  }
  console.log(`待查定價：${noPriceMap.size} 款\n`);

  // 建立名稱索引（正規化）
  const normMap = new Map(); // normName → rowNum
  for (const [rowNum, { name, enName }] of noPriceMap) {
    normMap.set(normalize(name), rowNum);
    if (enName) normMap.set(normalize(enName), rowNum);
    // 也加入去掉括號後的版本
    const baseName = name.replace(/[（(].+[)）]$/, '').trim();
    if (baseName !== name) normMap.set(normalize(baseName), rowNum);
  }

  // === 取得 BGhut 所有商品 URL ===
  let allUrls = [];

  if (fs.existsSync(URL_CACHE_FILE)) {
    const cached = JSON.parse(fs.readFileSync(URL_CACHE_FILE, 'utf8'));
    allUrls = cached.urls || [];
    console.log(`載入 URL 快取：${allUrls.length} 個\n`);
  } else {
    // 先試 sitemap
    allUrls = await tryGetUrlsFromSitemap();
    console.log(`sitemap 取得：${allUrls.length} 個`);

    // sitemap 不夠的話，補充爬目錄
    if (allUrls.length < 1000) {
      console.log('sitemap 不足，改爬目錄...');
      // 爬 ASC（舊到新）和 DESC（新到舊）
      const descUrls = await crawlCategoryPages(24, 400); // 從 page 24 往後（舊的）
      descUrls.forEach(u => { if (!allUrls.includes(u)) allUrls.push(u); });
    }

    fs.writeFileSync(URL_CACHE_FILE, JSON.stringify({ urls: allUrls, updatedAt: new Date() }, null, 2));
    console.log(`URL 快取存檔：${allUrls.length} 個\n`);
  }

  // === 篩選只抓中文版（zhName 含中文）===
  const chineseUrls = allUrls.filter(url => {
    const { zhName } = parseNamesFromUrl(url);
    return isChinese(zhName);
  });
  console.log(`中文版頁面：${chineseUrls.length} 個\n`);

  // === 比對名稱，找出命中的 URL ===
  const matches = []; // { rowNum, name, url }

  for (const url of chineseUrls) {
    const { zhName, enName } = parseNamesFromUrl(url);
    const normZh = normalize(zhName);
    const normEn = normalize(enName);

    const rowNum = normMap.get(normZh) || normMap.get(normEn);
    if (rowNum) {
      const { name } = noPriceMap.get(rowNum);
      matches.push({ rowNum, name, url, zhName, enName });
    }
  }

  console.log(`名稱比對命中：${matches.length} 款\n`);

  // === 讀取進度（避免重複抓）===
  let progress = { done: new Set(), written: 0 };
  if (fs.existsSync(PROGRESS_FILE)) {
    const p = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    progress.done = new Set(p.done || []);
    progress.written = p.written || 0;
    console.log(`繼續上次進度：已完成 ${progress.done.size} 筆，已寫入 ${progress.written} 筆\n`);
  }

  // === 抓取定價並寫入 ===
  const updates = [];
  let fetched = 0;
  let noPrice = 0;

  for (const { rowNum, name, url } of matches) {
    if (progress.done.has(rowNum)) continue;

    const html = await fetchHtml(url);
    if (!html) { progress.done.add(rowNum); continue; }

    const price = extractPrice(html);
    progress.done.add(rowNum);

    if (!price || price === '9999') {
      noPrice++;
      if (fetched % 20 === 0) {
        process.stdout.write(`\r  已抓 ${fetched} 筆，命中 ${updates.length} 筆，無價格 ${noPrice} 筆`);
      }
      fetched++;
      await sleep(300);
      continue;
    }

    updates.push({ range: `${sheetName}!N${rowNum}`, values: [[parseInt(price)]] });
    fetched++;
    console.log(`  ✓ [${rowNum}] ${name} → ${price}元`);

    // 每 20 筆寫一次，避免資料遺失
    if (updates.length >= 20) {
      await writeToSheet(sheets, updates.splice(0, 20));
      progress.written += 20;
      saveProgress(progress);
    }

    await sleep(350);
  }

  // 寫入剩餘
  if (updates.length > 0) {
    await writeToSheet(sheets, updates);
    progress.written += updates.length;
    saveProgress(progress);
  }

  console.log(`\n\n=== 完成！===`);
  console.log(`共抓取 ${fetched} 筆，找到定價 ${progress.written} 筆，無法取得 ${noPrice} 筆`);

  // 最終統計
  const finalRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:N`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  const finalRows = finalRes.data.values || [];
  const finalHeaderIdx = finalRows.findIndex(r => r && r[0] === '中文名稱');
  let stillMissing = 0;
  for (let i = finalHeaderIdx + 1; i < finalRows.length; i++) {
    const r = finalRows[i] || [];
    if (r[0] && !String(r[13] || '').trim()) stillMissing++;
  }
  console.log(`仍缺定價：${stillMissing} 款`);
}

async function writeToSheet(sheets, updates) {
  if (updates.length === 0) return;
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { valueInputOption: 'USER_ENTERED', data: updates },
  });
  process.stdout.write(` [寫入 ${updates.length} 筆]`);
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
    done: [...progress.done],
    written: progress.written,
    updatedAt: new Date(),
  }, null, 2));
}

main().catch(e => {
  console.error('\n錯誤：', e.message);
  process.exit(1);
});
