/**
 * check_fill_image_v.mjs
 * 掃描 public/images/ 資料夾，比對 Google Sheet BGG連結 欄位提取的 BGG ID，
 * 確認圖片欄（圖片）都有 v，若無則補上。
 *
 * 比對邏輯：
 *   - 圖片命名為 {bggId}.jpg/png/webp → 與 BGG連結 欄位的 BGG ID 比對
 *   - 圖片命名為 row-{n}.jpg → 與 Sheet 的實際列號 n 比對
 */
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw';
const SHEET_GID = 540615026;
const IMAGES_DIR = path.join(__dirname, 'public', 'images');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function extractBggId(url) {
  if (!url) return null;
  const m = url.match(/\/boardgame(?:expansion)?\/(\d+)/);
  return m ? m[1] : null;
}

async function main() {
  // 掃描圖片檔，建立兩個 Set
  const files = fs.readdirSync(IMAGES_DIR);
  const bggIdImages = new Set();   // BGG ID 命名 (如 "10323")
  const rowImages = new Set();     // row 命名 (如 "row-123" → 儲存 123)

  for (const f of files) {
    const name = path.parse(f).name;
    const mRow = name.match(/^row-(\d+)$/);
    if (mRow) { rowImages.add(parseInt(mRow[1])); continue; }
    const mId = name.match(/^(\d+)$/);
    if (mId) { bggIdImages.add(mId[1]); }
  }

  console.log(`圖片資料夾：${files.length} 個檔案`);
  console.log(`  BGG ID 命名：${bggIdImages.size} 個`);
  console.log(`  row-N 命名：${rowImages.size} 個\n`);

  // 讀取 Sheet
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'service-account.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const tab = meta.data.sheets.find(s => s.properties.sheetId === SHEET_GID) || meta.data.sheets[0];
  const sheetName = tab.properties.title;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:Z`,
  });
  const rows = res.data.values || [];

  // 找 header 列（含「中文名稱」的那列）
  const headerRowIdx = rows.findIndex(r => r.some(cell => cell && cell.trim() === '中文名稱'));
  if (headerRowIdx === -1) {
    console.error('找不到標題列（含「中文名稱」）');
    process.exit(1);
  }

  const headers = rows[headerRowIdx].map(h => (h || '').trim());
  const colBgg = headers.indexOf('BGG連結');
  const colImg = headers.indexOf('圖片');

  if (colBgg === -1) { console.error('找不到 BGG連結 欄位'); process.exit(1); }
  if (colImg === -1) { console.error('找不到 圖片 欄位'); process.exit(1); }

  // 欄位轉成 A1 字母
  const colLetter = (idx) => {
    let s = '';
    idx++;
    while (idx > 0) {
      s = String.fromCharCode(64 + (idx % 26 || 26)) + s;
      idx = Math.floor((idx - 1) / 26);
    }
    return s;
  };

  console.log(`Sheet：${sheetName}`);
  console.log(`  Header 在第 ${headerRowIdx + 1} 列`);
  console.log(`  BGG連結 欄：${colLetter(colBgg)} (index ${colBgg})`);
  console.log(`  圖片 欄：${colLetter(colImg)} (index ${colImg})\n`);

  // 收集需要更新的儲存格
  const updates = [];
  let hasV = 0, needFill = 0, noImage = 0;

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const gameName = (row[0] || '').trim();
    if (!gameName) continue; // 跳過空列

    const bggUrl = (row[colBgg] || '').trim();
    const bggId = extractBggId(bggUrl);
    const sheetRowNum = i + 1; // 1-based
    const currentImg = (row[colImg] || '').trim();

    // 判斷是否有圖
    const hasBggImage = bggId && bggIdImages.has(bggId);
    const hasRowImage = rowImages.has(sheetRowNum);
    const hasImage = hasBggImage || hasRowImage;

    if (!hasImage) {
      noImage++;
      continue;
    }

    if (currentImg.toLowerCase() === 'v') {
      hasV++;
      continue;
    }

    // 有圖但沒有 v → 需要補
    updates.push({
      range: `${sheetName}!${colLetter(colImg)}${sheetRowNum}`,
      values: [['v']],
      debug: { row: sheetRowNum, name: gameName, bggId: bggId || `row-${sheetRowNum}` },
    });
    needFill++;
    console.log(`  [需補] 第 ${sheetRowNum} 列：${gameName} (${bggId ? `BGG:${bggId}` : `row-${sheetRowNum}`})`);
  }

  console.log(`\n統計：`);
  console.log(`  已有 v：${hasV} 筆`);
  console.log(`  需補 v：${needFill} 筆`);
  console.log(`  無圖片：${noImage} 筆（跳過）`);

  if (updates.length === 0) {
    console.log('\n全部都已有 v，無需更新！');
    return;
  }

  // 批次寫入
  console.log(`\n開始補填 ${updates.length} 個 v...`);
  const batchData = updates.map(u => ({ range: u.range, values: u.values }));
  for (let i = 0; i < batchData.length; i += 100) {
    const batch = batchData.slice(i, i + 100);
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { data: batch, valueInputOption: 'USER_ENTERED' },
    });
    console.log(`  批次 ${Math.floor(i / 100) + 1}：寫入 ${batch.length} 個`);
    await sleep(200);
  }

  console.log(`\n完成！補填 ${needFill} 個 v`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
