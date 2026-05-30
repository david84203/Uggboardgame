import fetch from 'node-fetch';
import { google } from 'googleapis';
import { writeFileSync, existsSync } from 'fs';
import { extname } from 'path';

const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw';
const IMAGES_DIR = 'D:/Claude Project/Uggboardgame/public/images';

const COL_NAME    = 0;   // A：中文名稱
const COL_EN      = 2;   // C：英文名稱
const COL_BGG     = 10;  // K：BGG連結
const COL_IMAGE   = 20;  // U：圖片

// ── 工具函數 ──────────────────────────────────────────────────────────────────

function extractBggId(url) {
  if (!url) return null;
  const m = url.match(/boardgamegeek\.com\/boardgame(?:expansion)?\/(\d+)/);
  return m ? m[1] : null;
}

function safeEnglishName(en) {
  if (!en || en.trim() === '' || en.trim().toUpperCase() === 'N/A') return null;
  return en.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '-').trim();
}

// 決定圖片檔名（不含副檔名）
function resolveFilename(row, sheetRow) {
  const bggUrl = row[COL_BGG] || '';
  const bggId = extractBggId(bggUrl);
  if (bggId) return bggId;

  const en = safeEnglishName(row[COL_EN] || '');
  if (en) return en;

  return `row-${sheetRow}`;
}

// ── 讀取 Sheet ────────────────────────────────────────────────────────────────

const auth = new google.auth.GoogleAuth({
  keyFile: 'D:/Claude Project/Uggboardgame/service-account.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

console.log('讀取 Sheet...');
const res = await sheets.spreadsheets.values.get({
  spreadsheetId: SHEET_ID,
  range: '工作表1!A:U',
});
const rows = res.data.values || [];

// 找出 U 欄目前是 Shopline URL 的列
const targets = [];
for (let i = 8; i < rows.length; i++) {   // i=8 → sheet row 9（資料第一行）
  const row = rows[i];
  const imgVal = (row[COL_IMAGE] || '').trim();
  if (!imgVal.startsWith('https://img.shoplineapp.com')) continue;

  const sheetRow = i + 1;  // 1-based
  const filename = resolveFilename(row, sheetRow);
  targets.push({
    sheetRow,
    name: row[COL_NAME] || '',
    imgUrl: imgVal,
    filename,
  });
}

console.log(`找到 ${targets.length} 筆需要下載圖片`);

// ── 下載圖片 ──────────────────────────────────────────────────────────────────

const downloaded = [];
const failed = [];

for (const t of targets) {
  // 偵測副檔名（Shopline 通常是 .png，但 URL path 可能有 .png）
  const urlPath = new URL(t.imgUrl).pathname;
  const ext = extname(urlPath) || '.png';
  const savePath = `${IMAGES_DIR}/${t.filename}${ext}`;

  // 若已存在就跳過
  if (existsSync(savePath)) {
    console.log(`  [SKIP] ${t.name} → ${t.filename}${ext} 已存在`);
    downloaded.push({ ...t, savePath, ext });
    continue;
  }

  try {
    const imgRes = await fetch(t.imgUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status}`);
    const buffer = await imgRes.buffer();
    writeFileSync(savePath, buffer);
    console.log(`  [OK] ${t.name} → ${t.filename}${ext} (${(buffer.length/1024).toFixed(0)}KB)`);
    downloaded.push({ ...t, savePath, ext });
  } catch (e) {
    console.log(`  [FAIL] ${t.name} → ${e.message}`);
    failed.push(t);
  }

  // 小延遲避免被擋
  await new Promise(r => setTimeout(r, 50));
}

console.log(`\n下載完成：${downloaded.length} 成功，${failed.length} 失敗`);

// ── 把成功的 U 欄改為 v ───────────────────────────────────────────────────────

if (downloaded.length > 0) {
  const batchData = downloaded.map(t => ({
    range: `工作表1!U${t.sheetRow}`,
    values: [['v']],
  }));

  for (let i = 0; i < batchData.length; i += 200) {
    const chunk = batchData.slice(i, i + 200);
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { data: chunk, valueInputOption: 'USER_ENTERED' },
    });
    console.log(`Sheet 更新：${Math.min(i + 200, batchData.length)} / ${batchData.length}`);
  }
  console.log('✅ U 欄已全部改為 v');
}

if (failed.length > 0) {
  console.log('\n失敗清單：');
  failed.forEach(t => console.log(`  Row ${t.sheetRow}: ${t.name}`));
}
