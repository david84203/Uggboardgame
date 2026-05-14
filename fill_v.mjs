/**
 * fill_v.mjs
 * 掃描 public/images/ 資料夾，找出有圖片的 row
 * 在 Google Sheet U 欄補上 "v"（跳過已有值的格子）
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

async function main() {
  // 掃描圖片檔
  const files = fs.readdirSync(IMAGES_DIR);
  const rowNums = new Set();

  for (const f of files) {
    const name = path.parse(f).name; // 去掉副檔名
    // 格式1: "row-123" → 123
    let m = name.match(/^row-(\d+)$/);
    if (m) { rowNums.add(parseInt(m[1])); continue; }
    // 格式2: "123" → 123
    m = name.match(/^(\d+)$/);
    if (m) { rowNums.add(parseInt(m[1])); }
  }

  console.log(`圖片資料夾：${files.length} 個檔案`);
  console.log(`對應 ${rowNums.size} 個 row\n`);

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
    range: `${sheetName}!A:U`,
  });
  const rows = res.data.values || [];

  // 收集需要更新的 row
  const updates = [];
  let filled = 0, skipped = 0;

  for (const rowNum of rowNums) {
    if (rowNum < 1 || rowNum > rows.length) continue;

    const currentU = (rows[rowNum - 1][20] || '').trim();
    if (currentU === 'v' || currentU === 'V') {
      skipped++;
      continue;
    }

    updates.push({
      range: `${sheetName}!U${rowNum}`,
      values: [['v']],
    });
    filled++;
  }

  // 批次寫入
  if (updates.length > 0) {
    console.log(`補填 ${updates.length} 個 v...`);
    for (let i = 0; i < updates.length; i += 100) {
      const batch = updates.slice(i, i + 100);
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: { data: batch, valueInputOption: 'USER_ENTERED' },
      });
      console.log(`  批次 ${Math.floor(i / 100) + 1}：寫入 ${batch.length} 個`);
      await sleep(200);
    }
  }

  console.log(`\n完成！補填 ${filled} 個 v，跳過 ${skipped} 個（已有值）`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
