/**
 * 將這一輪找到的定價寫入 Google Sheet N 欄
 * 用遊戲名稱比對 no_price_list.json 取得正確列號
 */
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw';
const SHEET_GID = 540615026;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 這一輪找到的價格（名稱 → 定價）
// 以 BGhut 直接抓取為主，並標記來源
const FOUND_PRICES = [
  { name: '骰寫特魯瓦',               price: 950,  source: 'BGhut' },
  { name: '玻璃之路',                  price: 2180, source: 'BGhut' },
  { name: '黑天使號',                  price: 2990, source: 'BGhut（簡中版）' },
  { name: '骰子城',                    price: 1320, source: 'BGhut' },
  { name: '城區',                      price: 1750, source: 'BGhut' },
  { name: '蓋亞計畫',                  price: 3200, source: 'BGhut' },
  { name: '強國爭壩',                  price: 2990, source: 'BGhut' },
  { name: '強國爭壩：利格沃特計劃擴充', price: 1490, source: 'BGhut' },
  { name: 'XCOM: The Board Game',     price: 2400, source: 'BGhut' },
  { name: '九局下半',                  price: 750,  source: 'BGhut' },
  { name: '花舍物語',                  price: 1490, source: 'BGhut' },
  { name: '倫敦商會',                  price: 2280, source: 'BGhut' },
  { name: '埃馬拉之冠',               price: 2250, source: 'BGhut' },
  { name: '貓與花毯',                  price: 1550, source: 'books.com.tw (GoKids中文版)' },
];

// 讀取 no_price_list 建立名稱 → 列號對應
const noPriceList = JSON.parse(fs.readFileSync(path.join(__dirname, 'no_price_list.json'), 'utf8'));
const nameToRow = {};
for (const item of noPriceList) {
  nameToRow[item.name.trim()] = item.row;
}

// 比對
const updates = [];
const notMatched = [];
for (const p of FOUND_PRICES) {
  const row = nameToRow[p.name];
  if (!row) {
    notMatched.push(p.name);
    continue;
  }
  updates.push({ range: `工作表1!N${row}`, values: [[p.price]], name: p.name, source: p.source });
}

console.log(`比對結果：${updates.length} 款命中，${notMatched.length} 款未命中`);
if (notMatched.length) console.log('未命中：', notMatched);

console.log('\n即將寫入：');
updates.forEach(u => console.log(`  N${u.range.split('N')[1]} ${u.name} → ${u.values[0][0]}元 (${u.source})`));

// 寫入 Sheet
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'service-account.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

// 先確認這些格子目前是空的
const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
const tab = meta.data.sheets.find(s => s.properties.sheetId === SHEET_GID);
const sheetName = tab.properties.title;

const ranges = updates.map(u => u.range.replace('工作表1', sheetName));
const checkRes = await sheets.spreadsheets.values.batchGet({
  spreadsheetId: SHEET_ID,
  ranges,
  valueRenderOption: 'UNFORMATTED_VALUE',
});

let skipped = 0;
const finalUpdates = [];
for (let i = 0; i < updates.length; i++) {
  const existing = checkRes.data.valueRanges[i]?.values?.[0]?.[0];
  if (existing && existing !== '') {
    console.log(`  跳過（已有值）：${updates[i].name} = ${existing}`);
    skipped++;
  } else {
    finalUpdates.push({ range: ranges[i], values: updates[i].values });
  }
}

console.log(`\n實際寫入 ${finalUpdates.length} 筆（跳過 ${skipped} 筆已有值）`);

if (finalUpdates.length > 0) {
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { valueInputOption: 'USER_ENTERED', data: finalUpdates },
  });
  console.log('✓ 寫入完成！');
}
