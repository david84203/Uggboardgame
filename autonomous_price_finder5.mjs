/**
 * autonomous_price_finder5.mjs
 * 使用 PChome 搜尋 API 為剩餘 517 款遊戲找定價
 * PChome 的 price 欄位 = 近似定價（官方商品通常等於 MSRP）
 * 注意：只接受名稱比對精確的結果，避免誤配
 */
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw';
const SHEET_GID = 540615026;
const SEARCH_CACHE = path.join(__dirname, 'pchome_search_cache.json');
const PROGRESS_FILE = path.join(__dirname, 'price_finder_progress5.json');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'zh-TW,zh;q=0.9',
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function norm(s) {
  return (s || '').toLowerCase()
    .replace(/[【】（）()：:\s\-－—.·～]/g, '')
    .replace(/桌遊|boardgame|繁體中文版?|中文版?|新版|大盒版?|豪華版?|第\d版|\d+版|\d+年版/gi, '')
    .replace(/【[^】]*】/g, ''); // 去掉【品牌】前綴
}

// 判斷 PChome 商品名稱是否和 Sheet 遊戲名稱相符
function matchScore(sheetName, sheetEn, pcName) {
  const ns = norm(sheetName);
  const ne = norm(sheetEn);
  const np = norm(pcName);

  // 精確比對
  if (ns === np || (ne.length > 3 && ne === np)) return 3;
  // 包含比對（Sheet 名稱出現在 PChome 名稱中，或反之）
  if (ns.length >= 3 && np.includes(ns)) return 2;
  if (np.length >= 3 && ns.includes(np) && np.length >= ns.length * 0.7) return 2;
  // 英文名包含比對
  if (ne.length >= 4 && np.includes(ne)) return 2;
  // 鬆散：共用開頭（前4字）
  if (ns.length >= 4 && np.startsWith(ns.substring(0, 4))) return 1;
  return 0;
}

async function searchPchome(keyword) {
  const url = `https://ecshweb.pchome.com.tw/search/v3.3/all/results?q=${encodeURIComponent(keyword)}&page=1&sort=rnk/dc`;
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = await res.json();
    return data.prods || [];
  } catch { return []; }
}

function saveProgress(p) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
    done: [...p.done], written: p.written, updatedAt: new Date().toISOString(),
  }, null, 2));
}

async function main() {
  console.log('=== Round 5：PChome 搜尋 ===\n');

  // 載入搜尋快取
  let searchCache = {};
  if (fs.existsSync(SEARCH_CACHE)) {
    searchCache = JSON.parse(fs.readFileSync(SEARCH_CACHE, 'utf8'));
    console.log(`PChome 搜尋快取：${Object.keys(searchCache).length} 筆`);
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
  let searched = 0, found = 0, noMatch = 0;

  for (const { rowNum, name, enName } of noPriceList) {
    if (progress.done.has(rowNum)) continue;

    // 建立搜尋關鍵字列表
    const keywords = new Set();
    // 英文名去掉副標題（冒號後）
    if (enName) keywords.add(enName.split(':')[0].split('–')[0].trim());
    // 中文名去掉括號和副標題
    const cnBase = name.replace(/[（(【〔].+$/, '').replace(/[：:].+$/, '').trim();
    if (cnBase.length >= 2) keywords.add(cnBase + ' 桌遊');
    if (cnBase.length >= 2) keywords.add(cnBase);

    let bestMatch = null;
    let bestScore = 0;

    for (const kw of keywords) {
      if (!kw) continue;

      let prods = searchCache[kw];
      if (!prods) {
        prods = await searchPchome(kw);
        searchCache[kw] = prods;
        if (searched % 30 === 0) fs.writeFileSync(SEARCH_CACHE, JSON.stringify(searchCache, null, 2));
        await sleep(250);
      }

      for (const prod of prods.slice(0, 5)) {
        const score = matchScore(name, enName, prod.name);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = prod;
        }
        if (score === 3) break; // 精確比對，不再找
      }

      if (bestScore === 3) break;
    }

    progress.done.add(rowNum);
    searched++;

    if (!bestMatch || bestScore < 2) {
      noMatch++;
      if (searched % 25 === 0) {
        process.stdout.write(`\r  搜尋 ${searched}/${noPriceList.length}，找到 ${found}，無配對 ${noMatch}`);
      }
      continue;
    }

    // 取定價（用 price，避免超高價）
    const price = bestMatch.originPrice || bestMatch.price;
    if (!price || price <= 0 || price > 15000) { noMatch++; continue; }

    found++;
    updates.push({ range: `${sheetName}!N${rowNum}`, values: [[price]] });
    const pcNorm = bestMatch.name.replace(/【[^】]*】/g, '').trim();
    console.log(`  ✓ [${rowNum}] ${name} → ${price} (PChome: ${pcNorm.substring(0, 30)})`);

    if (updates.length >= 20) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: { valueInputOption: 'USER_ENTERED', data: updates.splice(0, 20) },
      });
      progress.written += 20;
      console.log(`  [寫入 20 筆]`);
      saveProgress(progress);
    }

    await sleep(200);
  }

  // 存快取和剩餘
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

  console.log(`\n=== Round 5 完成 ===`);
  console.log(`搜尋 ${searched} 款，找到定價 ${found} 款，無配對 ${noMatch} 款`);
  console.log(`本輪新增寫入：${progress.written} 筆`);

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
