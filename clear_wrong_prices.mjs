// 清除 Round 5 PChome 誤配的 13 筆錯誤定價
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw';
const SHEET_GID = 540615026;

// Round 5 的誤配（全部是錯的：書籍/鞋子/化妝品/PS4）
const WRONG_ROWS = [29, 37, 45, 50, 75, 76, 78, 81, 88, 91, 102, 110, 138];

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'service-account.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });
const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
const tab = meta.data.sheets.find(s => s.properties.sheetId === SHEET_GID);
const sheetName = tab.properties.title;

// 先確認這些格子的現值
const ranges = WRONG_ROWS.map(r => `${sheetName}!N${r}`);
const check = await sheets.spreadsheets.values.batchGet({
  spreadsheetId: SHEET_ID, ranges, valueRenderOption: 'UNFORMATTED_VALUE',
});
console.log('清除前的值：');
WRONG_ROWS.forEach((r, i) => {
  const val = check.data.valueRanges[i]?.values?.[0]?.[0];
  console.log(`  N${r}: ${val}`);
});

// 清空
const clearData = WRONG_ROWS.map(r => ({ range: `${sheetName}!N${r}`, values: [['']] }));
await sheets.spreadsheets.values.batchUpdate({
  spreadsheetId: SHEET_ID,
  requestBody: { valueInputOption: 'USER_ENTERED', data: clearData },
});
console.log(`\n已清除 ${WRONG_ROWS.length} 筆錯誤定價`);
