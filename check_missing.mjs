import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw';
const SHEET_GID = 540615026;

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'service-account.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
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

  const headerIdx = rows.findIndex(r => r.some(c => c && c.trim() === '中文名稱'));
  const headers = rows[headerIdx].map(h => (h || '').trim());

  const col = (name) => headers.indexOf(name);
  const C = {
    name:   col('中文名稱'),
    price:  col('定價'),
    image:  col('圖片'),
    bgg:    col('BGG連結'),
    desc:   col('遊戲簡介'),
  };

  let total = 0, noPrice = 0, noImage = 0, bggNoDesc = 0;
  const noPriceList = [], noImageList = [], bggNoDescList = [];

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const name = (row[C.name] || '').trim();
    if (!name) continue;
    total++;

    if (!(row[C.price] || '').trim()) { noPrice++; noPriceList.push(name); }
    if ((row[C.image] || '').trim().toLowerCase() !== 'v') { noImage++; noImageList.push(name); }
    const hasBgg = !!(row[C.bgg] || '').trim();
    const hasDesc = !!(row[C.desc] || '').trim();
    if (hasBgg && !hasDesc) { bggNoDesc++; bggNoDescList.push(name); }
  }

  console.log(`總遊戲數：${total} 款\n`);
  console.log(`沒有定價：${noPrice} 款`);
  console.log(`沒有圖片：${noImage} 款`);
  console.log(`有BGG連結但無遊戲簡介：${bggNoDesc} 款`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
