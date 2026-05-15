/**
 * bgg_fill.mjs
 * 用 Puppeteer 抓取 BGG 遊戲描述，寫入 Google Sheet Y 欄
 *
 * 用法：
 *   node bgg_fill.mjs            ← 完整執行（支援中斷續跑）
 *   node bgg_fill.mjs --dry      ← 試跑，只印結果不寫入 Sheet
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

// 欄位索引（0-based）
const C = { 名稱: 0, 英文: 2, BGG連結: 10, 簡介: 24 };

// === AUTH ===
async function getAuth() {
  const keyPath = path.join(__dirname, 'service-account.json');
  if (!fs.existsSync(keyPath)) { console.error('找不到 service-account.json'); process.exit(1); }
  return new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
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

// === 從 BGG 頁面文字擷取描述 ===
function extractDesc(bodyText, zhName, enName) {
  // 策略：
  // 1. 找 "Description" 標記
  // 2. 找到 Classification meta 區塊結尾（"+ N more" 後的空行）
  // 3. 取之後的段落直到遇到 "•••"、"+ More"、全大寫區塊標頭
  const descIdx = bodyText.indexOf('Description');
  if (descIdx === -1) return '';

  const section = bodyText.slice(descIdx);

  // 找 Classification 結尾：最後一個 "+ N more" 或 "+ N more\n" 之後
  const metaEndMatch = section.match(/\+\s*\d+\s+more\s*\n/);
  let startIdx = 0;
  if (metaEndMatch) {
    startIdx = metaEndMatch.index + metaEndMatch[0].length;
  } else {
    // 沒找到 "+ N more"，試著直接找第一個夠長的段落
    startIdx = 0;
  }

  const contentAfterMeta = section.slice(startIdx);

  // 取段落直到遇到停止符號
  const stopPatterns = [
    '•••',           // BGG 中日文分隔符
    'OFFICIAL LINKS',
    'COMMUNITY STATS',
    'ADDITIONAL SUGGESTIONS',
    'BGG Item ID',
    'Shopping',
    'We may earn',
    'No necessary in-game',
    'Show Community Stats',
  ];

  const lines = contentAfterMeta.split('\n');
  const proseLines = [];
  let foundStart = false;

  for (const line of lines) {
    const t = line.trim();

    // 跳過空行（但允許空行在描述中間出現）
    if (!t) {
      if (foundStart) proseLines.push(''); // 保留段落間空行
      continue;
    }

    // 碰到停止符號就結束
    const isStop = stopPatterns.some(p => t.toUpperCase().startsWith(p.toUpperCase()));
    if (isStop) break;

    // 碰到 + More / - Less 就結束
    if (/^[\+\-] More$/i.test(t) || /^[\+\-] Less$/i.test(t)) break;

    // 還沒找到描述起點：第一段夠長的文字就是描述開頭
    if (!foundStart) {
      // 跳過短的 meta 行
      if (/^(Strategy|Thematic|War|Abstract|Family|Children|Party|Customizable|Wargame|Thematic|N\/A)$/i.test(t)) continue;
      if (/^(Deck|Memory|Push|Solo|Once|Variable|Dice|Hand|Open|Secret|Team|Cooperative|Area|Action|Card|Set|Tile|Worker|Roll|Player|Grid|Pattern|Network|Pick|Rock|Paper|Scissors|Trick|Betting|Bingo|Chit|Crayon|Line|Simulation|Storytelling|Acting|Miniatures|Modular|Campaign|Legacy|Turn|Time|Point|Income|Loans|Auction|Bidding|Commodity|Stock|Ownership|Trading|Negotiation|Alliances|Voting|Traitor|Hidden|Roles|Deduction|Bluffing|Pattern|Race|Puzzle|Real|Wargame)$/i.test(t)) continue;
      if (/^\d+ Players$/.test(t)) continue;
      if (/^\d+-\d+ Min$/.test(t)) continue;
      if (/^Age:/.test(t)) continue;
      if (/^Weight:/.test(t)) continue;
      if (/^\[/.test(t)) continue;
      if (/^View poll/.test(t)) continue;
      if (/^Edit$/i.test(t)) continue;
      if (/^Digital Implementations/i.test(t)) continue;
      if (/^Components:/i.test(t)) continue;
      if (/^Reimplemented By/i.test(t)) continue;
      if (/^(Alternate Names|Designer|Artist|Publisher)/i.test(t)) continue;
      if (/^(Game Information|Game Credits)$/i.test(t)) continue;
      if (/^(See Full Credits|My rating|Buy|Sleeve|Add To Collection|Log Play|Subscribe|Settings|Share|Fan)/i.test(t)) continue;
      if (/^\d+$/.test(t)) continue; // 純數字（粉絲數等）
      if (/^(Number of Players|Play Time|Suggested Age|Complexity)$/i.test(t)) continue;
      if (/^\d+ Ratings/.test(t)) continue;
      if (/^\d+ Comments/.test(t)) continue;
      if (/^Community:/.test(t)) continue;
      if (/^GeekBuddy Analysis/.test(t)) continue;
      if (/^(Playing Time|Complexity Rating|'Complexity' Rating|Results)$/i.test(t)) continue;
      if (/^Learn more about/i.test(t)) continue;
      if (t.length < 30) continue;

      // 找到了！
      foundStart = true;
      proseLines.push(t);
    } else {
      proseLines.push(t);
    }
  }

  // 移除結尾的空行
  while (proseLines.length > 0 && proseLines[proseLines.length - 1] === '') {
    proseLines.pop();
  }

  let desc = proseLines.join('\n').trim();

  if (desc.length < 60) return '';

  desc = desc.replace(/\n{4,}/g, '\n\n').trim();
  return desc;
}

// === 用 Puppeteer 抓 BGG 頁面 ===
async function scrapeBGG(browser, bggUrl, zhName, enName) {
  const page = await browser.newPage();
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9,zh-TW;q=0.8' });

    await page.goto(bggUrl, { waitUntil: 'networkidle2', timeout: 25000 });
    await new Promise(r => setTimeout(r, 2000)); // 等 JS 渲染

    const bodyText = await page.evaluate(() => document.body.innerText);
    const desc = extractDesc(bodyText, zhName, enName);
    return desc;
  } catch (e) {
    throw e;
  } finally {
    await page.close();
  }
}

// === MAIN ===
async function main() {
  if (DRY) console.log('【試跑模式，不寫入 Sheet】\n');

  // 載入快取
  let cache = {};
  if (fs.existsSync(CACHE_PATH)) {
    try { cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')); } catch {}
  }
  console.log(`快取：${Object.keys(cache).length} 筆\n`);

  const auth = await getAuth();
  const { rows, sheetName } = await readSheet(auth);

  const headerIdx = rows.findIndex(r => r && r[0] === '中文名稱');
  if (headerIdx === -1) throw new Error('找不到標題列');
  console.log(`標題列在第 ${headerIdx + 1} 行，共 ${rows.length - headerIdx - 1} 筆遊戲`);

  // 收集 Y 欄空白 + 有 BGG 連結的遊戲
  const targets = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const zhName = String(row[C.名稱] || '').trim();
    const enName = String(row[C.英文] || '').trim();
    const bggLink = String(row[C.BGG連結] || '').trim();
    const descVal = String(row[C.簡介] || '').trim();
    if (!zhName || descVal) continue;
    if (!bggLink || !bggLink.includes('boardgamegeek.com')) continue;

    // 從 BGG 連結抽出 game ID 當快取 key
    const bggId = bggLink.match(/\/boardgame(?:expansion)?\/(\d+)/)?.[1];
    if (!bggId) continue;

    targets.push({ rowIdx: i, rowNum: i + 1, zhName, enName, bggLink, bggId });
  }

  console.log(`Y 欄空白且有 BGG 連結：${targets.length} 筆\n`);

  if (targets.length === 0) {
    console.log('沒有需要處理的遊戲，完成！');
    return;
  }

  // 啟動瀏覽器
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const updates = [];
  let found = 0, notFound = 0, cached = 0;
  const startTime = Date.now();

  try {
    for (let idx = 0; idx < targets.length; idx++) {
      const { rowNum, zhName, enName, bggLink, bggId } = targets[idx];
      const cacheKey = bggId;

      // 快取中有 → 直接用
      if (cache[cacheKey] !== undefined) {
        cached++;
        if (cache[cacheKey] && cache[cacheKey].length >= 60) {
          updates.push({ row: rowNum, col: C.簡介 + 1, value: cache[cacheKey] });
          found++;
        } else if (cache[cacheKey]) {
          notFound++; // 太短，算未找到
        } else {
          notFound++;
        }
        process.stdout.write(`\r  ${idx + 1}/${targets.length} ✓${found}找到 ✗${notFound}未找到 ⬡${cached}快取`);
        continue;
      }

      // 爬取 BGG
      let desc = '';
      try {
        desc = await scrapeBGG(browser, bggLink, zhName, enName);
      } catch (e) {
        // 錯誤不快取，下次重試
        process.stdout.write(`\r  ${idx + 1}/${targets.length} 錯誤: ${e.message.slice(0, 40)}`);
        await new Promise(r => setTimeout(r, 3000));
        continue;
      }

      // 存快取
      cache[cacheKey] = desc;
      if (idx % 10 === 0) {
        fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
      }

      if (desc && desc.length >= 60) {
        found++;
        updates.push({ row: rowNum, col: C.簡介 + 1, value: desc });
      } else {
        notFound++;
      }

      // 進度與預計完成時間
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = (idx + 1) / elapsed;
      const remaining = (targets.length - idx - 1) / rate;
      process.stdout.write(`\r  ${idx + 1}/${targets.length} ✓${found}找到 ✗${notFound}未找到 ⬡${cached}快取 | ${Math.round(rate * 60)}/min 剩餘約${Math.round(remaining / 60)}分`);

      // 請求間隔 3-5 秒（對 BGG 友善）
      await new Promise(r => setTimeout(r, 3000 + Math.random() * 2000));
    }
  } finally {
    await browser.close();
  }

  // 最終存快取
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  console.log(`\n\n完成！找到 ${found} 筆描述，${notFound} 筆沒有，${cached} 筆來自快取`);

  if (DRY) {
    console.log('\n【試跑】以下為會寫入的內容（前5筆）：');
    updates.slice(0, 5).forEach(u => console.log(`  Row ${u.row}: ${u.value.slice(0, 100)}...`));
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

main().catch(console.error);
