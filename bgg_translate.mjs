/**
 * bgg_translate.mjs
 * 讀取 bgg_cache.json + Sheet → 輸出待翻譯 JSON → 寫入翻譯結果到 Sheet
 *
 * 用法：
 *   node bgg_translate.mjs export          ← 匯出待翻譯清單到 translate_work.json
 *   node bgg_translate.mjs write            ← 將翻譯結果寫入 Sheet
 */
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw';
const SHEET_GID = 540615026;
const CACHE_PATH = path.join(__dirname, 'bgg_cache.json');
const WORK_PATH = path.join(__dirname, 'translate_work.json');
const MODE = process.argv[2];

async function getAuth() {
  const keyPath = path.join(__dirname, 'service-account.json');
  return new google.auth.GoogleAuth({ keyFile: keyPath, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
}

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

async function exportWork() {
  const auth = await getAuth();
  const { rows } = await readSheet(auth);
  const cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));

  const headerIdx = rows.findIndex(r => r && r[0] === '中文名稱');
  const work = [];

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const zhName = String(row[0] || '').trim();
    const enName = String(row[2] || '').trim();
    const bggLink = String(row[10] || '').trim();
    const descVal = String(row[24] || '').trim();
    if (!zhName || descVal) continue;

    const bggId = bggLink.match(/\/boardgame(?:expansion)?\/(\d+)/)?.[1];
    if (!bggId) continue;

    const cached = cache[bggId];
    if (cached === undefined || cached === '' || cached === null) continue;

    let enDesc = '';
    if (typeof cached === 'object' && cached.desc) enDesc = cached.desc;
    else if (typeof cached === 'string') enDesc = cached;
    if (enDesc.length < 60) continue;

    work.push({
      rowNum: i + 1,
      bggId,
      zhName,
      enName,
      enDesc,
      zhDesc: '',
    });
  }

  fs.writeFileSync(WORK_PATH, JSON.stringify(work, null, 2));
  console.log(`匯出 ${work.length} 筆待翻譯到 translate_work.json`);
}

async function writeTranslations() {
  if (!fs.existsSync(WORK_PATH)) { console.error('找不到 translate_work.json'); process.exit(1); }
  const work = JSON.parse(fs.readFileSync(WORK_PATH, 'utf8'));
  const done = work.filter(w => w.zhDesc && w.zhDesc.length >= 10);

  if (done.length === 0) {
    console.log('沒有已翻譯的項目，請先將中文填入 zhDesc 欄位再執行 write');
    return;
  }

  const auth = await getAuth();
  const { sheetName } = await readSheet(auth);
  const sheets = google.sheets({ version: 'v4', auth });

  const batchData = done.map(w => ({
    range: `${sheetName}!Y${w.rowNum}`,
    values: [[w.zhDesc]],
  }));

  const CHUNK = 200;
  for (let i = 0; i < batchData.length; i += CHUNK) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { valueInputOption: 'USER_ENTERED', data: batchData.slice(i, i + CHUNK) },
    });
    console.log(`  已寫入 ${Math.min(i + CHUNK, batchData.length)} / ${batchData.length} 格`);
  }
  console.log(`完成！寫入 ${done.length} 格`);
}

async function main() {
  if (MODE === 'export') await exportWork();
  else if (MODE === 'write') await writeTranslations();
  else console.log('請指定模式：export 或 write');
}

main().catch(console.error);
