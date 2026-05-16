/**
 * 寫入第二輪找到的定價（前50款中的命中項）
 */
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw';
const SHEET_GID = 540615026;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 這輪找到的價格（直接用 Sheet 列號，避免名稱比對問題）
const FOUND = [
  { row: 77,  name: '極東之旅',                        price: 1800 },
  { row: 79,  name: '拉格蘭莊園',                      price: 1800 },
  { row: 90,  name: '溫達克',                          price: 2150 },
  { row: 92,  name: '夢境之地',                        price: 1500 },
  { row: 133, name: '特奧蒂瓦坎：眾神之城',             price: 1790 },
  { row: 134, name: '文藝復興大師',                    price: 1390 },
  { row: 136, name: '殖民火星：阿瑞斯探險隊－純卡牌版', price: 1800 },
  { row: 150, name: '漫威英雄套牌構築遊戲',             price: 2500 },
  { row: 151, name: '殖民火星：序幕擴充',               price: 1000 },
];

console.log('即將寫入：');
FOUND.forEach(f => console.log(`  N${f.row} ${f.name} → ${f.price}元`));

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'service-account.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
const tab = meta.data.sheets.find(s => s.properties.sheetId === SHEET_GID);
const sheetName = tab.properties.title;

// 確認這些格子是空的
const ranges = FOUND.map(f => `${sheetName}!N${f.row}`);
const check = await sheets.spreadsheets.values.batchGet({
  spreadsheetId: SHEET_ID,
  ranges,
  valueRenderOption: 'UNFORMATTED_VALUE',
});

const updates = [];
let skipped = 0;
for (let i = 0; i < FOUND.length; i++) {
  const existing = check.data.valueRanges[i]?.values?.[0]?.[0];
  if (existing && existing !== '') {
    console.log(`  跳過（已有值）：${FOUND[i].name} = ${existing}`);
    skipped++;
  } else {
    updates.push({ range: ranges[i], values: [[FOUND[i].price]] });
  }
}

console.log(`\n實際寫入 ${updates.length} 筆（跳過 ${skipped} 筆）`);

if (updates.length > 0) {
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { valueInputOption: 'USER_ENTERED', data: updates },
  });
  console.log('✓ 寫入完成！');
}
