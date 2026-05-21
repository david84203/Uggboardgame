// inventory_fill.mjs
// 從 Google Sheet 讀取遊戲資料，填入庫存系統 Firestore
// 填入：players, price, rental, cost (price*0.65), imageUrl (Vercel URL)

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const SERVICE_ACCOUNT_PATH = 'C:/Users/bboylu/Dropbox/service-account-ugg.json';
const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw';
const IMAGES_DIR = 'D:/uggboardgame/public/images';
const VERCEL_BASE = 'https://uggboardgame.vercel.app/images';
const PROJECT_ID = 'ugg-store-system';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const auth = new google.auth.GoogleAuth({
  keyFile: SERVICE_ACCOUNT_PATH,
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/datastore',
  ],
});

async function getAccessToken() {
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

async function readSheet() {
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'A1:O3000',
  });
  return res.data.values || [];
}

function extractBggId(bggLink) {
  if (!bggLink) return null;
  const match = bggLink.match(/boardgamegeek\.com\/boardgame\/(\d+)/);
  return match ? match[1] : null;
}

function findImageFile(bggId, sheetRowNumber, englishName) {
  const candidates = [];
  if (bggId) {
    candidates.push(`${bggId}.jpg`, `${bggId}.webp`, `${bggId}.png`);
  }
  if (englishName) {
    // 清理英文名稱作為檔名
    const safe = englishName.replace(/[\/\\:*?"<>|]/g, '').trim();
    candidates.push(`${safe}.jpg`, `${safe}.webp`, `${safe}.png`);
  }
  candidates.push(`row-${sheetRowNumber}.jpg`, `row-${sheetRowNumber}.webp`, `row-${sheetRowNumber}.png`);

  for (const name of candidates) {
    const fullPath = path.join(IMAGES_DIR, name);
    if (fs.existsSync(fullPath)) {
      return name;
    }
  }
  return null;
}

async function getInventoryGames(accessToken) {
  const url = `${FIRESTORE_BASE}/inventory?pageSize=300`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  return (data.documents || []).map(doc => ({
    id: doc.name.split('/').pop(),
    name: doc.fields?.name?.stringValue || '',
    imageUrl: doc.fields?.imageUrl?.stringValue || '',
    price: parseInt(doc.fields?.price?.integerValue || doc.fields?.price?.doubleValue || 0),
  }));
}

async function updateFirestoreDoc(docId, fields, accessToken) {
  const fieldPaths = Object.keys(fields).map(k => `updateMask.fieldPaths=${k}`).join('&');
  const url = `${FIRESTORE_BASE}/inventory/${docId}?${fieldPaths}`;

  const firestoreFields = {};
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === 'number') {
      firestoreFields[key] = { integerValue: value };
    } else {
      firestoreFields[key] = { stringValue: String(value) };
    }
  }

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields: firestoreFields }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Update failed (${res.status}): ${err.slice(0, 200)}`);
  }
}

async function main() {
  console.log('取得 access token...');
  const accessToken = await getAccessToken();

  console.log('讀取 Google Sheet...');
  const allRows = await readSheet();

  // 找到標題行（含「中文名稱」的那行）
  const headerIndex = allRows.findIndex(row => row[0]?.includes('中文名稱'));
  if (headerIndex < 0) throw new Error('找不到標題行');
  console.log(`標題行在第 ${headerIndex + 1} 行`);

  const dataRows = allRows.slice(headerIndex + 1);

  // 建立 Sheet map：名稱 → 資料
  const sheetMap = {};
  dataRows.forEach((row, idx) => {
    const name = (row[0] || '').trim();
    if (!name) return;
    const englishName = (row[2] || '').trim();   // C
    const players = (row[4] || '').trim();         // E
    const bggLink = (row[10] || '').trim();        // K
    const price = parseInt(row[13]) || 0;          // N
    const rental = parseInt(row[14]) || 0;         // O
    const bggId = extractBggId(bggLink);
    const sheetRowNumber = headerIndex + idx + 2;  // 1-based sheet row

    sheetMap[name] = { players, price, rental, bggId, englishName, sheetRowNumber };
  });
  console.log(`Sheet 共 ${Object.keys(sheetMap).length} 筆遊戲`);

  console.log('讀取 Firestore 庫存...');
  const inventoryGames = await getInventoryGames(accessToken);
  const noImageGames = inventoryGames.filter(g => !g.imageUrl);
  console.log(`庫存共 ${inventoryGames.length} 筆，其中 ${noImageGames.length} 筆無圖片\n`);

  let updated = 0, notFound = 0, noImg = 0;
  const notFoundList = [];
  const noImgList = [];

  for (const game of noImageGames) {
    const sheetData = sheetMap[game.name];
    if (!sheetData) {
      notFoundList.push(game.name);
      notFound++;
      continue;
    }

    const imageFile = findImageFile(sheetData.bggId, sheetData.sheetRowNumber, sheetData.englishName);
    const imageUrl = imageFile ? `${VERCEL_BASE}/${encodeURIComponent(imageFile)}` : '';

    if (!imageFile) {
      noImgList.push(`${game.name} (bggId=${sheetData.bggId})`);
      noImg++;
    }

    const cost = Math.round(sheetData.price * 0.65);

    const fields = {};
    if (sheetData.players) fields.players = sheetData.players;
    if (sheetData.price > 0) fields.price = sheetData.price;
    if (sheetData.rental > 0) fields.rental = sheetData.rental;
    if (cost > 0) fields.cost = cost;
    if (imageUrl) fields.imageUrl = imageUrl;

    if (Object.keys(fields).length === 0) {
      console.log(`  SKIP (無資料): ${game.name}`);
      continue;
    }

    try {
      await updateFirestoreDoc(game.id, fields, accessToken);
      const imgLabel = imageFile ? `✓ ${imageFile}` : '✗ 無圖';
      console.log(`  ✅ ${game.name} | 售價${sheetData.price} 成本${cost} 租金${sheetData.rental} | ${imgLabel}`);
      updated++;
    } catch (err) {
      console.error(`  ❌ ${game.name}: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 50));
  }

  console.log('\n========== 完成 ==========');
  console.log(`✅ 更新成功：${updated} 筆`);
  console.log(`❓ Sheet 找不到：${notFound} 筆`);
  if (notFoundList.length) {
    notFoundList.forEach(n => console.log(`   - ${n}`));
  }
  console.log(`🖼️  無圖片：${noImg} 筆`);
  if (noImgList.length) {
    noImgList.forEach(n => console.log(`   - ${n}`));
  }
}

main().catch(console.error);
