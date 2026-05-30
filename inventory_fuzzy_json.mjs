// inventory_fuzzy.mjs
// 對庫存系統找不到 Sheet 對應的遊戲做模糊比對，列出候選項供確認

import { google } from 'googleapis';
import fs from 'fs';

const SERVICE_ACCOUNT_PATH = 'C:/Users/bboylu/Dropbox/service-account-ugg.json';
const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw';
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

async function getInventoryGames(accessToken) {
  const url = `${FIRESTORE_BASE}/inventory?pageSize=300`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await res.json();
  return (data.documents || []).map(doc => ({
    id: doc.name.split('/').pop(),
    name: doc.fields?.name?.stringValue || '',
    imageUrl: doc.fields?.imageUrl?.stringValue || '',
  }));
}

// 計算兩字串共同字元比例（中文友善）
function similarity(a, b) {
  const setA = new Set([...a]);
  const setB = new Set([...b]);
  let common = 0;
  for (const ch of setA) {
    if (setB.has(ch)) common++;
  }
  return common / Math.max(setA.size, setB.size);
}

// 去除括號內容、標點後比對核心詞
function normalize(str) {
  return str
    .replace(/[（(【\[「『].*?[）)\]】」』]/g, '')  // 去括號
    .replace(/[：:・·\-\s]/g, '')                    // 去標點空格
    .replace(/版$|套$|組$/, '')                       // 去後綴
    .trim()
    .toLowerCase();
}

async function main() {
  const accessToken = await getAccessToken();

  const allRows = await readSheet();
  const headerIndex = allRows.findIndex(row => row[0]?.includes('中文名稱'));
  const dataRows = allRows.slice(headerIndex + 1);

  // 建立 Sheet map（完整名稱 → 資料）
  const sheetMap = {};
  dataRows.forEach((row, idx) => {
    const name = (row[0] || '').trim();
    if (!name) return;
    const players = (row[4] || '').trim();
    const price = parseInt(row[13]) || 0;
    const rental = parseInt(row[14]) || 0;
    sheetMap[name] = { players, price, rental, sheetRowNumber: headerIndex + idx + 2 };
  });

  const inventoryGames = await getInventoryGames(accessToken);
  const sheetNames = Object.keys(sheetMap);

  // 找出 Sheet 找不到的庫存遊戲
  const unmatched = inventoryGames.filter(g => !sheetMap[g.name]);

  console.log(`\n共 ${unmatched.length} 筆庫存遊戲在 Sheet 找不到精確對應，以下是模糊比對結果：\n`);
  console.log('格式：庫存名稱 → 最佳 Sheet 候選（相似度）\n');

  const results = [];

  for (const game of unmatched) {
    const normGame = normalize(game.name);

    // 計算和所有 Sheet 遊戲的相似度
    const candidates = sheetNames.map(sName => ({
      sName,
      score: Math.max(
        similarity(normGame, normalize(sName)),
        similarity(game.name, sName),          // 也試原始字串
      )
    })).sort((a, b) => b.score - a.score).slice(0, 3);

    const best = candidates[0];
    results.push({ inventory: game.name, best: best.sName, score: best.score, top3: candidates });
  }

  // 依相似度高→低排序，相似度高的先列
  results.sort((a, b) => b.score - a.score);

  let high = 0, mid = 0, low = 0;
  for (const r of results) {
    const pct = Math.round(r.score * 100);
    let tag = '';
    if (r.score >= 0.7) { tag = '🟢'; high++; }
    else if (r.score >= 0.45) { tag = '🟡'; mid++; }
    else { tag = '🔴'; low++; }

    const data = sheetMap[r.best];
    console.log(`${tag} ${r.inventory}`);
    console.log(`   → ${r.best}（${pct}%）  售價${data.price} 租金${data.rental}`);
    if (r.top3[1]) {
      const d2 = sheetMap[r.top3[1].sName];
      console.log(`   備選 ${r.top3[1].sName}（${Math.round(r.top3[1].score * 100)}%）  售價${d2.price}`);
    }
    console.log('');
  }

  fs.writeFileSync('fuzzy_results.json', JSON.stringify({ high, mid, low, results }, null, 2));
}

main().catch(console.error);
