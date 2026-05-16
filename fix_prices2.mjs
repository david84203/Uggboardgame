/**
 * 只保留 Lu 確認的 36 款，其餘這次新增的全部清空
 * KEEP 清單：名稱 → 正確定價
 */
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw';
const SHEET_GID = 540615026;

// Lu 確認正確的遊戲（含他修改過的定價）
const KEEP = new Map([
  ['卡卡頌：亞馬遜', 1250],
  ['卡卡頌：公主與火龍擴充', 690],
  ['卡卡頌：帳篷之下', 690],
  ['卡卡頌：2014大盒版', 2480],
  ['一夜終極狼人', 800],
  ['胡鬧咖啡廳：甜點時間', 830],
  ['七大奇蹟 對決：帕特農', 850],
  ['開心滑水梯樂園', 850],
  ['七大奇蹟：領袖', 900],
  ['七大奇蹟：通天塔', 1250],
  ['七大奇蹟：艦隊', 1250],
  ['截碼戰：光碟播放器擴充', 490],
  ['推倒堤基', 880],
  ['國家公園：自然之旅', 1650],
  ['二人三築', 1190],
  ['字母瘋火輪', 890],
  ['矮人礦坑2', 390],
  ['富饒之城新版', 1300],
  ['火線急救室', 890],
  ['舞動魔咒', 890],
  ['雲遊', 890],
  ['狼人殺-魔幻科技', 450],
  ['歡樂彈跳球', 899],
  ['神秘大地－粉絲創作種族擴充', 890],
  ['原木形色棋：旅行版', 630],
  ['叢林探險', 950],
  ['英雄國度', 960],
  ['猜拆畫畫', 960],
  ['小小城鎮', 990],
  ['沃塔棋', 990],
  ['農家樂：更多大與小建築', 990],
  ['農家樂：更多更多大與小建築', 990],
  ['農家樂：農夫與寵畜', 990],
  ['迷你文明', 990],
  ['翻滾路易', 990],
  ['兩室一彈', 990],
]);

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'service-account.json'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });
const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
const tab = meta.data.sheets.find(s => s.properties.sheetId === SHEET_GID);
const sn = tab.properties.title;

// 讀取 Sheet
const res = await sheets.spreadsheets.values.get({
  spreadsheetId: SHEET_ID,
  range: `${sn}!A:N`,
  valueRenderOption: 'UNFORMATTED_VALUE',
});
const rows = res.data.values || [];
const headerIdx = rows.findIndex(r => r && r[0] === '中文名稱');

// 這次新增的遊戲（在舊 no_price_list 裡）
const oldNoPrice = new Set(
  JSON.parse(fs.readFileSync(path.join(__dirname, 'no_price_list.json'), 'utf8')).map(g => g.row)
);

const updates = [];
let cleared = 0, updated = 0, kept = 0;

for (let i = headerIdx + 1; i < rows.length; i++) {
  const row = rows[i] || [];
  const rowNum = i + 1;
  const name = String(row[0] || '').trim();
  const currentPrice = Number(row[13] || 0);

  // 只處理這次新增的（在舊清單裡且現在有定價）
  if (!oldNoPrice.has(rowNum) || !currentPrice) continue;

  if (KEEP.has(name)) {
    const correctPrice = KEEP.get(name);
    if (correctPrice !== currentPrice) {
      updates.push({ range: `${sn}!N${rowNum}`, values: [[correctPrice]] });
      console.log(`  更新: N${rowNum} ${name}: ${currentPrice} → ${correctPrice}`);
      updated++;
    } else {
      kept++;
    }
  } else {
    updates.push({ range: `${sn}!N${rowNum}`, values: [['']] });
    console.log(`  清空: N${rowNum} ${name} (${currentPrice})`);
    cleared++;
  }
}

console.log(`\n保留 ${kept} 筆、更新 ${updated} 筆、清空 ${cleared} 筆`);
console.log(`送出 ${updates.length} 個更新...`);

// 分批寫入
for (let i = 0; i < updates.length; i += 200) {
  const batch = updates.slice(i, i + 200);
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { valueInputOption: 'USER_ENTERED', data: batch },
  });
}
console.log('✓ 完成');
