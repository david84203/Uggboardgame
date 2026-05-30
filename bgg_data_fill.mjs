/**
 * bgg_data_fill.mjs
 * 掃描 Google Sheet，對有 BGG 連結但缺少 C/E/G/H/I/J 欄位的遊戲，
 * 用 Puppeteer 抓 BGG 頁面補入資料。
 *
 * 欄位對應（0-based index）：
 *   C (2)  英文名稱
 *   E (4)  遊戲人數（2 或 2-4）
 *   G (6)  BGG玩家評分（7.5，無資料填 N/A）
 *   H (7)  BGG建議最佳人數（3 或 3-4，無資料填 N/A）
 *   I (8)  BGG遊戲時間(分鐘)（45 或 30-60）
 *   J (9)  BGG遊戲難度（2.29，無資料填 N/A）
 *   K (10) BGG連結（讀取用）
 *
 * 用法：
 *   node bgg_data_fill.mjs           ← 完整執行
 *   node bgg_data_fill.mjs --dry     ← 試跑，只印不寫入
 */

import { google } from 'googleapis';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw';
const CACHE_PATH = path.join(__dirname, 'bgg_data_cache.json');
const DRY = process.argv.includes('--dry');

// 目標欄位 (0-based)
const COLS = { englishName: 2, players: 4, rating: 6, bestPlayers: 7, playTime: 8, weight: 9, bggLink: 10 };
const COL_NAMES = { 2: 'C(英文名稱)', 4: 'E(遊戲人數)', 6: 'G(評分)', 7: 'H(最佳人數)', 8: 'I(時間)', 9: 'J(難度)' };

// ── BGG 頁面資料擷取 ─────────────────────────────────────
function parseBggPage(bodyText, titleTag) {
  const lines = bodyText.split('\n').map(l => l.trim()).filter(Boolean);

  // 英文名稱：從頁面 title 取（格式：Name | Board Game | BoardGameGeek）
  const englishName = titleTag.split(' | ')[0] || '';

  // 評分：前 25 行中第一個獨立的小數（如 7.5）
  const ratingLine = lines.slice(0, 25).find(l => /^\d+\.\d+$/.test(l));
  const rating = ratingLine ? parseFloat(ratingLine).toFixed(1) : 'N/A';

  // 遊戲人數
  const playersM = bodyText.match(/(\d+)\s*[–\-]\s*(\d+)\s*Players|(\d+)\s*Players/);
  let players = '';
  if (playersM) {
    if (playersM[1] && playersM[2]) {
      players = playersM[1] === playersM[2] ? playersM[1] : `${playersM[1]}-${playersM[2]}`;
    } else if (playersM[3]) {
      players = playersM[3];
    }
  }

  // 遊戲時間（第一個出現的 Min）
  const timeM = bodyText.match(/(\d+)\s*[–\-]\s*(\d+)\s*Min|(\d+)\s*Min/);
  let playTime = '';
  if (timeM) {
    if (timeM[1] && timeM[2]) {
      playTime = timeM[1] === timeM[2] ? timeM[1] : `${timeM[1]}-${timeM[2]}`;
    } else if (timeM[3]) {
      playTime = timeM[3];
    }
  }

  // 建議最佳人數：取 "Best: X" 或 "Best: X-Y"
  const bestM = bodyText.match(/Best:\s*(\d+\s*[–\-]\s*\d+|\d+)/);
  const bestPlayers = bestM
    ? bestM[1].replace(/\s*[–]\s*/g, '-').replace(/\s*[-]\s*/g, '-')
    : 'N/A';

  // 難度
  const weightM = bodyText.match(/Weight:\s*(\d+\.\d+)\s*\/\s*5/);
  const weight = weightM ? parseFloat(weightM[1]).toFixed(2) : 'N/A';

  return { englishName, rating, players, playTime, bestPlayers, weight };
}

// ── Puppeteer 抓取 ────────────────────────────────────────
async function scrapeBggGame(browser, bggUrl) {
  const page = await browser.newPage();
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    await page.goto(bggUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    const bodyText = await page.evaluate(() => document.body.innerText);
    const titleTag = await page.title();
    return parseBggPage(bodyText, titleTag);
  } finally {
    await page.close();
  }
}

// ── Google Sheet ──────────────────────────────────────────
async function readSheet(auth) {
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: '工作表1!A:K',
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  return res.data.values || [];
}

async function writeUpdates(auth, updates) {
  if (!updates.length) return;
  const sheets = google.sheets({ version: 'v4', auth });
  const batchData = updates.map(u => ({
    range: `工作表1!${colLetter(u.col + 1)}${u.row}`,
    values: [[u.value]],
  }));
  for (let i = 0; i < batchData.length; i += 200) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { valueInputOption: 'USER_ENTERED', data: batchData.slice(i, i + 200) },
    });
    console.log(`  已寫入 ${Math.min(i + 200, batchData.length)} / ${batchData.length} 格`);
  }
}

function colLetter(n) {
  let r = '';
  while (n > 0) { n--; r = String.fromCharCode(65 + n % 26) + r; n = Math.floor(n / 26); }
  return r;
}

// ── Main ──────────────────────────────────────────────────
async function main() {
  if (DRY) console.log('【試跑模式，不寫入 Sheet】\n');

  let cache = {};
  if (fs.existsSync(CACHE_PATH)) {
    try { cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')); } catch {}
  }
  console.log(`快取：${Object.keys(cache).length} 筆`);

  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'service-account.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const rows = await readSheet(auth);
  const headerIdx = rows.findIndex(r => r && r[0] === '中文名稱');

  // 收集目標（有 BGG 連結且缺欄位）
  const targets = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const zhName = String(row[0] || '').trim();
    if (!zhName) continue;
    const bggLink = String(row[COLS.bggLink] || '').trim();
    if (!bggLink.includes('boardgamegeek.com')) continue;
    const bggId = bggLink.match(/\/boardgame(?:expansion)?\/(\d+)/)?.[1];
    if (!bggId) continue;
    const missingCols = [2, 4, 6, 7, 8, 9].filter(c => !String(row[c] || '').trim());
    if (!missingCols.length) continue;
    targets.push({ rowNum: i + 1, zhName, bggLink, bggId, missingCols });
  }

  console.log(`需要補資料：${targets.length} 筆\n`);
  if (!targets.length) { console.log('全部欄位已填，無需處理。'); return; }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const updates = [];
  const colKeyMap = { 2: 'englishName', 4: 'players', 6: 'rating', 7: 'bestPlayers', 8: 'playTime', 9: 'weight' };

  try {
    for (let idx = 0; idx < targets.length; idx++) {
      const { rowNum, zhName, bggLink, bggId, missingCols } = targets[idx];
      process.stdout.write(`[${idx + 1}/${targets.length}] ${zhName} ... `);

      let data = cache[bggId];
      if (!data) {
        try {
          data = await scrapeBggGame(browser, bggLink);
          cache[bggId] = data;
          fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
        } catch (e) {
          console.log(`❌ ${e.message}`);
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }
      } else {
        process.stdout.write('[快取] ');
      }

      const filled = [];
      for (const col of missingCols) {
        const val = data[colKeyMap[col]];
        if (!val || val === 'N/A' && col !== 6 && col !== 7 && col !== 9) continue;
        updates.push({ row: rowNum, col, value: val });
        filled.push(`${COL_NAMES[col]}=${val}`);
      }
      console.log(filled.length ? `✓ ${filled.join(', ')}` : '（無可填資料）');

      if (idx < targets.length - 1 && !cache[bggId]) {
        await new Promise(r => setTimeout(r, 3000 + Math.random() * 2000));
      }
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  console.log(`\n共 ${updates.length} 格需寫入`);

  if (DRY) {
    console.log('\n【試跑詳情】');
    updates.forEach(u => console.log(`  Row${u.row} ${colLetter(u.col + 1)}欄 = ${u.value}`));
    console.log('\n試跑完成，未寫入。');
    return;
  }

  await writeUpdates(auth, updates);
  console.log('✅ 全部完成！');
}

main().catch(console.error);
