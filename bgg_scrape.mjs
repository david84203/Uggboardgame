/**
 * bgg_scrape.mjs
 * 用 Puppeteer 抓取 BGG 遊戲英文描述，存到 bgg_cache.json
 * 只抓不寫入 Sheet，翻譯另外處理
 *
 * 用法：
 *   node bgg_scrape.mjs            ← 完整執行（支援中斷續跑）
 *   node bgg_scrape.mjs --dry      ← 試跑5筆，看擷取品質
 */

import { google } from 'googleapis';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw';
const SHEET_GID = 540615026;
const CACHE_PATH = path.join(__dirname, 'bgg_cache.json');
const DRY = process.argv.includes('--dry');

const C = { 名稱: 0, 英文: 2, BGG連結: 10, 簡介: 24 };

// === AUTH ===
async function getAuth() {
  const keyPath = path.join(__dirname, 'service-account.json');
  return new google.auth.GoogleAuth({ keyFile: keyPath, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
}

// === READ SHEET ===
async function readSheet(auth) {
  const sheets = google.sheets({ version: 'v4', auth });
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const tab = meta.data.sheets.find(s => s.properties.sheetId === SHEET_GID) || meta.data.sheets[0];
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${tab.properties.title}!A:Y`,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });
  return { rows: res.data.values || [], sheetName: tab.properties.title };
}

// === 從 BGG 頁面文字擷取英文描述 ===
function extractDesc(bodyText) {
  const descIdx = bodyText.indexOf('Description');
  if (descIdx === -1) return '';

  const section = bodyText.slice(descIdx);
  const metaEndMatch = section.match(/\+\s*\d+\s+more\s*\n/);
  let startIdx = metaEndMatch ? metaEndMatch.index + metaEndMatch[0].length : 0;
  const contentAfterMeta = section.slice(startIdx);

  const stopPatterns = [
    '•••', 'OFFICIAL LINKS', 'COMMUNITY STATS', 'ADDITIONAL SUGGESTIONS',
    'BGG Item ID', 'Shopping', 'We may earn', 'No necessary in-game', 'Show Community Stats',
  ];

  const lines = contentAfterMeta.split('\n');
  const proseLines = [];
  let foundStart = false;

  for (const line of lines) {
    const t = line.trim();
    if (!t) { if (foundStart) proseLines.push(''); continue; }

    const isStop = stopPatterns.some(p => t.toUpperCase().startsWith(p.toUpperCase()));
    if (isStop) break;
    if (/^[\+\-] More$/i.test(t) || /^[\+\-] Less$/i.test(t)) break;

    if (!foundStart) {
      if (/^(Strategy|Thematic|War|Abstract|Family|Children|Party|Customizable|Wargame|N\/A)$/i.test(t)) continue;
      if (/^(Deck|Memory|Push|Solo|Once|Variable|Dice|Hand|Open|Secret|Team|Cooperative|Area|Action|Card|Set|Tile|Worker|Roll|Player|Grid|Pattern|Network|Pick|Rock|Paper|Scissors|Trick|Betting|Bingo|Chit|Crayon|Line|Simulation|Storytelling|Acting|Miniatures|Modular|Campaign|Legacy|Turn|Time|Point|Income|Loans|Auction|Bidding|Commodity|Stock|Ownership|Trading|Negotiation|Alliances|Voting|Traitor|Hidden|Roles|Deduction|Bluffing|Race|Puzzle|Real|Wargame)$/i.test(t)) continue;
      if (/^\d+ Players$/.test(t) || /^\d+-\d+ Min$/.test(t) || /^Age:/.test(t) || /^Weight:/.test(t)) continue;
      if (/^\[/.test(t) || /^View poll/.test(t) || /^Edit$/i.test(t)) continue;
      if (/^Digital Implementations/i.test(t) || /^Components?:/i.test(t) || /^Reimplemented By/i.test(t)) continue;
      if (/^(Alternate Names|Designer|Artist|Publisher)/i.test(t)) continue;
      if (/^(Game Information|Game Credits)$/i.test(t)) continue;
      if (/^(Number of Players|Play Time|Suggested Age|Complexity)$/i.test(t)) continue;
      if (/^\d+ Ratings/.test(t) || /^\d+ Comments/.test(t) || /^Community:/.test(t) || /^GeekBuddy Analysis/.test(t)) continue;
      if (/^(Playing Time|Complexity Rating|'Complexity' Rating|Results)$/i.test(t)) continue;
      if (/^Learn more about/i.test(t) || /^See Full Credits/i.test(t)) continue;
      if (/^(My rating|Buy|Sleeve|Add To Collection|Log Play|Subscribe|Settings|Share|Fan)/i.test(t)) continue;
      if (/^\d+$/.test(t)) continue;
      if (/^Admin:/i.test(t) || /^Game description from/i.test(t)) continue;
      if (t.length < 30) continue;
      foundStart = true;
      proseLines.push(t);
    } else {
      proseLines.push(t);
    }
  }

  while (proseLines.length > 0 && proseLines[proseLines.length - 1] === '') proseLines.pop();
  let desc = proseLines.join('\n').trim();
  if (desc.length < 60) return '';
  return desc.replace(/\n{4,}/g, '\n\n').trim();
}

// === Puppeteer 抓取 ===
async function scrapeBGG(browser, bggUrl) {
  const page = await browser.newPage();
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    await page.goto(bggUrl, { waitUntil: 'networkidle2', timeout: 25000 });
    await new Promise(r => setTimeout(r, 2000));
    const bodyText = await page.evaluate(() => document.body.innerText);
    return extractDesc(bodyText);
  } finally {
    await page.close();
  }
}

// === MAIN ===
async function main() {
  if (DRY) console.log('【試跑模式，只抓5筆】\n');

  let cache = {};
  if (fs.existsSync(CACHE_PATH)) {
    try { cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')); } catch {}
  }
  console.log(`快取：${Object.keys(cache).length} 筆\n`);

  const auth = await getAuth();
  const { rows, sheetName } = await readSheet(auth);

  const headerIdx = rows.findIndex(r => r && r[0] === '中文名稱');
  if (headerIdx === -1) throw new Error('找不到標題列');
  console.log(`Sheet「${sheetName}」共 ${rows.length - headerIdx - 1} 筆遊戲`);

  // 收集目標：Y 欄空白 + 有 BGG 連結
  const targets = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const zhName = String(row[C.名稱] || '').trim();
    const descVal = String(row[C.簡介] || '').trim();
    const bggLink = String(row[C.BGG連結] || '').trim();
    if (!zhName || descVal) continue;
    if (!bggLink || !bggLink.includes('boardgamegeek.com')) continue;
    const bggId = bggLink.match(/\/boardgame(?:expansion)?\/(\d+)/)?.[1];
    if (!bggId) continue;
    targets.push({ zhName, bggLink, bggId });
  }

  console.log(`Y 欄空白且有 BGG 連結：${targets.length} 筆\n`);
  if (targets.length === 0) { console.log('沒有需要處理的遊戲！'); return; }

  if (DRY) {
    // 試跑：只抓 5 筆看品質
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    for (let i = 0; i < Math.min(5, targets.length); i++) {
      const { zhName, bggLink, bggId } = targets[i];
      try {
        const desc = await scrapeBGG(browser, bggLink);
        console.log(`${desc.length >= 60 ? '✓' : '✗'} ${zhName} (${bggId}): ${desc.slice(0, 150)}...`);
        console.log('');
      } catch (e) {
        console.log(`✗ ${zhName} 錯誤: ${e.message.slice(0, 60)}`);
        console.log('');
      }
      await new Promise(r => setTimeout(r, 3000));
    }
    await browser.close();
    return;
  }

  // 正式執行
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const startTime = Date.now();
  let scraped = 0, found = 0, cached = 0;

  try {
    for (let idx = 0; idx < targets.length; idx++) {
      const { zhName, bggLink, bggId } = targets[idx];

      if (cache[bggId] !== undefined) {
        cached++;
        if (cache[bggId] && cache[bggId].length >= 60) found++;
        process.stdout.write(`\r  ${idx + 1}/${targets.length} ✓${found}找到 ⬡${cached}快取`);
        continue;
      }

      let desc = '';
      try {
        desc = await scrapeBGG(browser, bggLink);
      } catch (e) {
        process.stdout.write(`\r  ${idx + 1}/${targets.length} 錯誤:${e.message.slice(0, 30)}`);
        await new Promise(r => setTimeout(r, 3000));
        continue;
      }

      cache[bggId] = { zhName, desc };
      scraped++;

      if (desc && desc.length >= 60) found++;

      // 每 10 筆存快取
      if (scraped % 10 === 0) {
        fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
      }

      const elapsed = (Date.now() - startTime) / 1000;
      const rate = (idx + 1) / elapsed;
      const remaining = (targets.length - idx - 1) / rate;
      process.stdout.write(`\r  ${idx + 1}/${targets.length} ✓${found}找到 ⬡${cached}快取 | ${Math.round(rate * 60)}/min 剩餘約${Math.round(remaining / 60)}分`);

      await new Promise(r => setTimeout(r, 3000 + Math.random() * 2000));
    }
  } finally {
    await browser.close();
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  }

  const totalFound = Object.values(cache).filter(v => typeof v === 'object' ? v.desc?.length >= 60 : v?.length >= 60).length;
  console.log(`\n\n完成！快取共 ${Object.keys(cache).length} 筆，${totalFound} 筆有英文描述`);
}

main().catch(console.error);
