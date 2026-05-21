// inventory_apply_matches.mjs
// 根據人工確認的比對結果執行更新：
//   Group A: 庫存名稱 → Sheet名稱（改庫存名 + 填資料）
//   Group B: Sheet名稱 → 庫存名稱（改Sheet A欄 + 填資料）

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const SERVICE_ACCOUNT_PATH = 'C:/Users/bboylu/Dropbox/service-account-ugg.json';
const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw';
const IMAGES_DIR = 'D:/uggboardgame/public/images';
const VERCEL_BASE = 'https://uggboardgame.vercel.app/images';
const PROJECT_ID = 'ugg-store-system';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Group A: [庫存目前名稱, Sheet名稱]  → 庫存改名 + 填資料
const GROUP_A = [
  ['推理事件簿：騎士信條1400', '推理事件簿-騎士信條1400'],
  ['狼人殺魔幻科技（小盒）',   '狼人殺-魔幻科技'],
  ['瞎掰王看圖掰',             '瞎掰王：看圖掰'],
  ['DOTS',                     'Dots'],
  ['傻傻玩（土狗）',           '傻傻玩'],
  ['傻傻玩（黑熊）',           '傻傻玩'],
  ['字字轉機臉紅心跳',         '字字轉機─臉紅心跳'],
  ['矮人礦坑雙人對決',         '矮人礦坑：雙人決鬥版'],
  ['真心話不冒險',             '真心話不冒險2'],
  ['大搜查：星際大戰',         '大搜查！星際大戰'],
  ['第九張交響曲',             '第九號交響曲'],
  ['迷音在說話',               '迷因在說話'],
  ['新翻滾路易',               '翻滾路易'],
  ['砰：骰子版',               '砰！骰子版'],
  ['妙語說書人：奧德賽',       '說書人：奧德賽'],
  ['彩計瘋爆',                 '彩球瘋爆'],
  ['童話實說',                 '實話實說2'],
  ['聰明孩家',                 '聰明玩家'],
  ['大頭娃娃2',                '大頭娃娃'],
  ['推倒提基',                 '推倒堤基'],
  ['海底探險',                 '深海探險'],
  ['神秘島語',                 '神秘導語'],
  ['泛亞天鵝數字牌（旅行版）', '天鵝數字牌：旅行版'],
  ['原木形色棋',               '原木形色棋：旅行版'],
];

// Group B: [庫存名稱（保持不變）, Sheet目前名稱（要改為庫存名稱）]
const GROUP_B = [
  ['UNO毫不留情no mercy',   'UNO毫不留情'],
  ['政變風雲',               '政變'],
  ['Scout馬戲團經理人',      '馬戲經理人'],
];

// ── Auth ──────────────────────────────────────────────────────────────────────
const auth = new google.auth.GoogleAuth({
  keyFile: SERVICE_ACCOUNT_PATH,
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/datastore',
  ],
});

async function getAccessToken() {
  const client = await auth.getClient();
  return (await client.getAccessToken()).token;
}

// ── Google Sheet ──────────────────────────────────────────────────────────────
async function readSheet() {
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'A1:O3000',
  });
  return res.data.values || [];
}

async function updateSheetCell(rowIndex1Based, newName) {
  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `A${rowIndex1Based}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[newName]] },
  });
}

function extractBggId(bggLink) {
  if (!bggLink) return null;
  const m = bggLink.match(/boardgamegeek\.com\/boardgame\/(\d+)/);
  return m ? m[1] : null;
}

function findImageFile(bggId, sheetRowNumber, englishName) {
  const candidates = [];
  if (bggId) candidates.push(`${bggId}.jpg`, `${bggId}.webp`, `${bggId}.png`);
  if (englishName) {
    const safe = englishName.replace(/[\/\\:*?"<>|]/g, '').trim();
    candidates.push(`${safe}.jpg`, `${safe}.webp`, `${safe}.png`);
  }
  candidates.push(`row-${sheetRowNumber}.jpg`, `row-${sheetRowNumber}.webp`, `row-${sheetRowNumber}.png`);
  for (const name of candidates) {
    if (fs.existsSync(path.join(IMAGES_DIR, name))) return name;
  }
  return null;
}

// ── Firestore ─────────────────────────────────────────────────────────────────
async function getInventoryGames(accessToken) {
  const url = `${FIRESTORE_BASE}/inventory?pageSize=300`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await res.json();
  return (data.documents || []).map(doc => ({
    id: doc.name.split('/').pop(),
    name: doc.fields?.name?.stringValue || '',
  }));
}

async function updateFirestoreDoc(docId, fields, accessToken) {
  const fieldPaths = Object.keys(fields).map(k => `updateMask.fieldPaths=${k}`).join('&');
  const url = `${FIRESTORE_BASE}/inventory/${docId}?${fieldPaths}`;
  const body = {};
  for (const [k, v] of Object.entries(fields)) {
    body[k] = typeof v === 'number' ? { integerValue: v } : { stringValue: String(v) };
  }
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: body }),
  });
  if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 200)}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('取得 token...');
  const accessToken = await getAccessToken();

  console.log('讀取 Sheet...');
  const allRows = await readSheet();
  const headerIndex = allRows.findIndex(r => r[0]?.includes('中文名稱'));
  const dataRows = allRows.slice(headerIndex + 1);

  // 建 Sheet 索引：名稱 → 資料
  const sheetMap = {};
  dataRows.forEach((row, idx) => {
    const name = (row[0] || '').trim();
    if (!name) return;
    sheetMap[name] = {
      englishName:    (row[2]  || '').trim(),
      players:        (row[4]  || '').trim(),
      bggLink:        (row[10] || '').trim(),
      price:          parseInt(row[13]) || 0,
      rental:         parseInt(row[14]) || 0,
      sheetRowNumber: headerIndex + idx + 2,
    };
  });

  console.log('讀取 Firestore...');
  const inventoryGames = await getInventoryGames(accessToken);
  const idByName = {};
  for (const g of inventoryGames) idByName[g.name] = g.id;

  // ── Group A：改庫存名稱 + 填資料 ─────────────────────────────────────────
  console.log(`\n── Group A：${GROUP_A.length} 筆（庫存改名 + 填資料）──`);
  for (const [invName, sheetName] of GROUP_A) {
    const docId = idByName[invName];
    if (!docId) { console.log(`  ⚠️  找不到庫存文件：${invName}`); continue; }

    const sd = sheetMap[sheetName];
    if (!sd) { console.log(`  ⚠️  Sheet 找不到：${sheetName}`); continue; }

    const bggId = extractBggId(sd.bggLink);
    const imgFile = findImageFile(bggId, sd.sheetRowNumber, sd.englishName);
    const cost = Math.round(sd.price * 0.65);

    const fields = { name: sheetName };
    if (sd.players) fields.players = sd.players;
    if (sd.price > 0) fields.price = sd.price;
    if (sd.rental > 0) fields.rental = sd.rental;
    if (cost > 0) fields.cost = cost;
    if (imgFile) fields.imageUrl = `${VERCEL_BASE}/${encodeURIComponent(imgFile)}`;

    try {
      await updateFirestoreDoc(docId, fields, accessToken);
      const imgLabel = imgFile ? `✓ ${imgFile}` : '✗ 無圖';
      console.log(`  ✅ ${invName} → ${sheetName} | 售${sd.price} 成${cost} 租${sd.rental} | ${imgLabel}`);
    } catch (e) {
      console.error(`  ❌ ${invName}: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 50));
  }

  // ── Group B：改 Sheet A欄 + 填 Firestore 資料 ────────────────────────────
  console.log(`\n── Group B：${GROUP_B.length} 筆（Sheet 改名 + 填資料）──`);
  for (const [invName, currentSheetName] of GROUP_B) {
    const docId = idByName[invName];
    if (!docId) { console.log(`  ⚠️  找不到庫存文件：${invName}`); continue; }

    const sd = sheetMap[currentSheetName];
    if (!sd) { console.log(`  ⚠️  Sheet 找不到：${currentSheetName}`); continue; }

    // 更新 Sheet A 欄
    try {
      await updateSheetCell(sd.sheetRowNumber, invName);
      console.log(`  📝 Sheet 第 ${sd.sheetRowNumber} 行：${currentSheetName} → ${invName}`);
    } catch (e) {
      console.error(`  ❌ 更新 Sheet 失敗 ${currentSheetName}: ${e.message}`);
      continue;
    }

    const bggId = extractBggId(sd.bggLink);
    const imgFile = findImageFile(bggId, sd.sheetRowNumber, sd.englishName);
    const cost = Math.round(sd.price * 0.65);

    const fields = {};
    if (sd.players) fields.players = sd.players;
    if (sd.price > 0) fields.price = sd.price;
    if (sd.rental > 0) fields.rental = sd.rental;
    if (cost > 0) fields.cost = cost;
    if (imgFile) fields.imageUrl = `${VERCEL_BASE}/${encodeURIComponent(imgFile)}`;

    if (Object.keys(fields).length > 0) {
      try {
        await updateFirestoreDoc(docId, fields, accessToken);
        const imgLabel = imgFile ? `✓ ${imgFile}` : '✗ 無圖';
        console.log(`  ✅ Firestore 填資料：${invName} | 售${sd.price} 成${cost} 租${sd.rental} | ${imgLabel}`);
      } catch (e) {
        console.error(`  ❌ Firestore 更新失敗 ${invName}: ${e.message}`);
      }
    } else {
      console.log(`  ⚠️  ${invName}：Sheet 沒有售價或玩家人數，略過 Firestore 填寫`);
    }
    await new Promise(r => setTimeout(r, 50));
  }

  console.log('\n========== 完成 ==========');
}

main().catch(console.error);
