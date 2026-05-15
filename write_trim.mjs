/**
 * write_trim.mjs
 * 從 apply_trim.mjs 讀取 693 筆精簡描述，寫入 Google Sheet Y 欄
 *
 * 用法：node write_trim.mjs
 */
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw';
const SHEET_GID = 540615026;
const TRIM_WORK_PATH = path.join(__dirname, 'trim_work.json');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  // 1. Read source data
  const trimWork = JSON.parse(fs.readFileSync(TRIM_WORK_PATH, 'utf8'));
  const { default: trim } = await import('./apply_trim.mjs');

  console.log(`trim_work.json: ${trimWork.length} entries`);
  console.log(`apply_trim.mjs: ${Object.keys(trim).length} trimmed entries`);

  // 2. Match bggId → rowNum
  const updates = [];
  let matched = 0, missing = 0, noBggId = 0;

  for (const entry of trimWork) {
    if (!entry.bggId) {
      noBggId++;
      console.log(`  [no bggId] row ${entry.rowNum}: ${entry.zhName}`);
      continue;
    }
    const desc = trim[entry.bggId];
    if (!desc) {
      missing++;
      continue;
    }
    updates.push({
      rowNum: entry.rowNum,
      desc,
      bggId: entry.bggId,
      name: entry.zhName,
    });
    matched++;
  }

  console.log(`Matched: ${matched}, Missing in trim: ${missing}, No bggId: ${noBggId}`);

  if (updates.length === 0) {
    console.log('No updates to write.');
    return;
  }

  // 3. Auth & get sheet name
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'service-account.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const tab = meta.data.sheets.find(s => s.properties.sheetId === SHEET_GID) || meta.data.sheets[0];
  const sheetName = tab.properties.title;
  console.log(`Sheet: ${sheetName}`);

  // 4. Batch write to column Y
  const batchData = updates.map(u => ({
    range: `${sheetName}!Y${u.rowNum}`,
    values: [[u.desc]],
  }));

  const CHUNK = 150;
  for (let i = 0; i < batchData.length; i += CHUNK) {
    const chunk = batchData.slice(i, i + CHUNK);
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: chunk,
      },
    });
    console.log(`  已寫入 ${Math.min(i + CHUNK, batchData.length)} / ${batchData.length}`);
    if (i + CHUNK < batchData.length) await sleep(300);
  }

  console.log(`\n完成！成功寫入 ${batchData.length} 格到 Y 欄`);
}

main().catch(e => { console.error(e); process.exit(1); });
