import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw';
const SHEET_GID = 540615026;

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'service-account.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });
const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
const tab = meta.data.sheets.find(s => s.properties.sheetId === SHEET_GID);
const sn = tab.properties.title;

const updates = [
  // 刪除（清空）
  { row: 1010, val: '', note: '現代藝術：台灣版 (30→刪)' },
  { row: 448,  val: '', note: '工讀生別裝了！ (50→刪)' },
  { row: 742,  val: '', note: '撰寫文明史 (50→刪)' },
  { row: 1206, val: '', note: '狼來了 (90→刪)' },
  { row: 341,  val: '', note: '四季物語 (100→刪)' },
  { row: 1191, val: '', note: '星杯傳說 (150→刪)' },
  { row: 875,  val: '', note: '地下鐵 (180→刪)' },
  { row: 1222, val: '', note: '阿瓦隆馬來西亞版 (180→刪)' },
  { row: 1225, val: '', note: '阿瓦隆Ｑ版 (180→刪)' },
  { row: 344,  val: '', note: '特魯瓦 (950→刪)' },
  { row: 152,  val: '', note: '殖民火星：極樂世界地圖擴充 (1000→刪)' },
  { row: 153,  val: '', note: '殖民火星：下一站金星擴充 (1000→刪)' },
  { row: 157,  val: '', note: '殖民火星：動盪擴充 (1000→刪)' },
  // 改值
  { row: 581,  val: 960,  note: '英雄國度 (6000→960)' },
  { row: 1221, val: 290,  note: '諜戰特工 (950→290)' },
  { row: 663,  val: 1980, note: '夢工廠 (2400→1980)' },
  { row: 1529, val: 0,    note: '蜜語工坊：秋味擴充 (3380→0)' },
];

console.log('執行修正：');
updates.forEach(u => console.log(`  N${u.row} ${u.note}`));

await sheets.spreadsheets.values.batchUpdate({
  spreadsheetId: SHEET_ID,
  requestBody: {
    valueInputOption: 'USER_ENTERED',
    data: updates.map(u => ({ range: `${sn}!N${u.row}`, values: [[u.val]] })),
  },
});
console.log('\n✓ 全部修正完成');
