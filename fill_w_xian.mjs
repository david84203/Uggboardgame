import { google } from 'googleapis';
import path from 'path';

const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw';
const SHEET_NAME = '工作表1';

async function main() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(import.meta.dirname, 'service-account.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  // 讀取 V 和 W 欄
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!V2:W`,
  });

  const rows = res.data.values || [];
  const updates = [];

  for (let i = 0; i < rows.length; i++) {
    const v = (rows[i][0] || '').trim();
    const w = (rows[i][1] || '').trim();
    if (v && !w) {
      const sheetRow = i + 2; // 1-based, starting from row 2
      updates.push({
        range: `${SHEET_NAME}!W${sheetRow}`,
        values: [['XIAN在玩桌遊']],
      });
    }
  }

  console.log(`找到 ${updates.length} 筆需要填入出處`);

  if (updates.length === 0) {
    console.log('沒有需要更新的資料');
    return;
  }

  // 預覽前 10 筆
  console.log('前 10 筆範圍:', updates.slice(0, 10).map(u => u.range).join(', '));

  // 批次寫入
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      data: updates,
      valueInputOption: 'USER_ENTERED',
    },
  });

  console.log(`✅ 完成！已將 ${updates.length} 筆空白出處填入「XIAN在玩桌遊」`);
}

main().catch(e => console.error('❌ 錯誤:', e.message));
