// 列出這次 session 新增的定價（822 → 517，共 ~305 筆）
// 用 no_price_list 的舊清單比對：有在舊清單裡、現在又有定價的 = 這次新增
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw';
const SHEET_GID = 540615026;

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'service-account.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });
const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
const tab = meta.data.sheets.find(s => s.properties.sheetId === SHEET_GID);

const res = await sheets.spreadsheets.values.get({
  spreadsheetId: SHEET_ID,
  range: `${tab.properties.title}!A:N`,
  valueRenderOption: 'UNFORMATTED_VALUE',
});
const rows = res.data.values || [];
const headerIdx = rows.findIndex(r => r && r[0] === '中文名稱');

// 載入舊的 no_price_list（session 開始時的狀態）
const oldNoPrice = new Set(
  JSON.parse(fs.readFileSync(path.join(__dirname, 'no_price_list.json'), 'utf8')).map(g => g.row)
);

const newPrices = [];
for (let i = headerIdx + 1; i < rows.length; i++) {
  const row = rows[i] || [];
  const rowNum = i + 1;
  const name = String(row[0] || '').trim();
  const price = Number(row[13] || 0);
  if (!name || !price) continue;
  if (!oldNoPrice.has(rowNum)) continue; // 不在舊清單 = 不是這次新增
  newPrices.push({ rowNum, name, price });
}

newPrices.sort((a, b) => a.price - b.price);
console.log(`這次新增定價：${newPrices.length} 款\n`);

// 分組列出
const suspicious = newPrices.filter(g => g.price < 200 || g.price > 8000);
const normal = newPrices.filter(g => g.price >= 200 && g.price <= 8000);

if (suspicious.length > 0) {
  console.log('⚠️  可能異常（< 200 或 > 8000 元）：');
  suspicious.forEach(g => console.log(`  N${g.rowNum} ${g.name}：${g.price} 元`));
  console.log();
}

console.log('✅ 正常範圍（200–8000 元），依價格排列：');
for (let i = 0; i < normal.length; i += 4) {
  const chunk = normal.slice(i, i+4).map(g => `[${g.price}] ${g.name}`).join('  |  ');
  console.log('  ' + chunk);
}
