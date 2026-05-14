/**
 * youtube_fill_v.mjs
 * 從 youtube_videos.json 讀取影片，篩選標題含「教學」的影片，
 * 比對 Google Sheet A 欄遊戲名稱，填入 V 欄 YouTube 網址（跳過已有值的格子）
 */
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw';
const SHEET_GID = 540615026;
const VIDEOS_FILE = path.join(__dirname, 'youtube_videos.json');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 從影片標題提取遊戲名稱
function extractGameNames(title) {
  const names = [];

  // 1. 提取【...】中的英文名稱
  for (const m of title.matchAll(/【(.+?)】/g)) {
    names.push(m[1].trim());
  }
  // 2. 提取『...』中的名稱
  for (const m of title.matchAll(/『(.+?)』/g)) {
    names.push(m[1].trim());
  }

  // 3. 提取中文名稱：去掉「烏嘎嘎桌遊」前綴和分隔符後，在【或教學之前的部分
  let cnPart = title
    .replace(/^烏嘎嘎桌遊\s*[－\-—]\s*/, '')
    .replace(/^BGA\s*/, '');
  // 取【或教學之前的片段當中文名
  const cnMatch = cnPart.match(/^(.+?)(?:【|教學|\(|（)/);
  if (cnMatch) {
    const cn = cnMatch[1].trim();
    if (cn && cn.length >= 2 && cn !== '烏嘎嘎桌遊') {
      names.push(cn);
    }
  } else if (!cnPart.includes('【') && cnPart.trim().length >= 2) {
    // 沒有【也沒有教學，整個後半段就是名稱
    names.push(cnPart.trim());
  }

  return names;
}

// 標準化字串
function normalize(s) {
  return s.toLowerCase()
    .replace(/[【】『』「」\-－:：()（）\/／\s.!,!]+/g, '')
    .replace(/桌遊/g, '');
}

// 手動對應表：當自動比對失敗時使用（影片標題關鍵詞 → Sheet 列號 1-based）
const MANUAL_MAP = [
  // [影片標題必須包含的關鍵詞, Sheet row number]
  ['重塑火星－阿瑞斯探險隊', 136],  // 殖民火星：阿瑞斯探險隊－純卡牌版
  ['Terraforming Mars: Ares Expedition', 136],
  ['埃瑪拉皇冠', null],  // Sheet 無此遊戲
  ['克里多尼亞氏族', null],  // Sheet 無此遊戲
  ['DOHDLES', null],  // Sheet 無此遊戲
];

// 比對影片標題與 Sheet 遊戲名稱
function matchGame(videoTitle, sheetNames) {
  // 0. 先檢查手動對應表
  for (const [keyword, rowNum] of MANUAL_MAP) {
    if (videoTitle.includes(keyword)) {
      if (rowNum === null) return { idx: null, skipped: 'not_in_sheet' };
      return { idx: rowNum - 1, source: 'manual' };
    }
  }

  const extracted = extractGameNames(videoTitle);
  if (extracted.length === 0) return null;

  // 1. 精確比對（標準化後）
  for (const name of extracted) {
    const normName = normalize(name);
    if (normName.length < 2) continue;

    for (let i = 0; i < sheetNames.length; i++) {
      const sheetNorm = normalize(sheetNames[i]);
      if (sheetNorm === normName) return { idx: i, source: 'exact' };
    }
  }

  // 2. 包含比對：影片名包含 Sheet 名
  for (const name of extracted) {
    const normName = normalize(name);
    if (normName.length < 2) continue;
    for (let i = 0; i < sheetNames.length; i++) {
      const sheetNorm = normalize(sheetNames[i]);
      if (sheetNorm.length >= 4 && normName.includes(sheetNorm)) return { idx: i, source: 'contains_sheet' };
    }
  }

  // 3. 包含比對：Sheet 名包含影片名
  for (const name of extracted) {
    const normName = normalize(name);
    if (normName.length < 3) continue;
    for (let i = 0; i < sheetNames.length; i++) {
      const sheetNorm = normalize(sheetNames[i]);
      if (sheetNorm.length >= 2 && sheetNorm.includes(normName)) return { idx: i, source: 'contains_video' };
    }
  }

  // 4. 部分詞彙比對（取影片中文名的前幾個字去 Sheet 找）
  for (const name of extracted) {
    if (/^[a-zA-Z\s:]+$/.test(name)) continue;
    for (let i = 0; i < sheetNames.length; i++) {
      const sheetName = sheetNames[i];
      if (name.length >= 3 && sheetName.includes(name.substring(0, 4))) return { idx: i, source: 'partial' };
    }
  }

  return null;
}

async function main() {
  const videos = JSON.parse(fs.readFileSync(VIDEOS_FILE, 'utf8'));

  // 篩選標題含「教學」的影片（排除介紹、復盤等）
  const teachingVideos = videos.filter(v => v.title.includes('教學'));

  console.log(`全部影片：${videos.length} 部`);
  console.log(`含「教學」：${teachingVideos.length} 部\n`);

  // Google Sheets 驗證
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'service-account.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const tab = meta.data.sheets.find(s => s.properties.sheetId === SHEET_GID) || meta.data.sheets[0];
  const sheetName = tab.properties.title;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:V`,
  });
  const rows = res.data.values || [];
  const sheetNames = rows.map(r => (r[0] || '').trim());

  console.log(`Sheet 共 ${sheetNames.length} 列\n`);

  // 比對所有影片，建立 row → urls 對應
  const rowVideos = {}; // { rowNum: [url1, url2, ...] }
  const matched = [];
  const unmatched = [];
  let skipped = 0;

  for (const video of teachingVideos) {
    const result = matchGame(video.title, sheetNames);
    if (!result || result.skipped === 'not_in_sheet') {
      unmatched.push(video);
      continue;
    }

    const idx = result.idx;
    const rowNum = idx + 1;
    const url = `https://www.youtube.com/watch?v=${video.videoId}`;
    const currentV = (rows[idx][21] || '').trim();

    if (!rowVideos[rowNum]) {
      rowVideos[rowNum] = { existing: currentV, urls: [], sheetName: sheetNames[idx] };
    }

    if (currentV && !rowVideos[rowNum].urls.includes(url)) {
      // 檢查現有值是否已含此 URL
      if (!currentV.includes(url)) {
        rowVideos[rowNum].urls.push(url);
      }
    } else if (!currentV) {
      if (!rowVideos[rowNum].urls.includes(url)) {
        rowVideos[rowNum].urls.push(url);
      }
    }

    matched.push({ ...video, rowNum, sheetName: sheetNames[idx], existing: currentV || null });
  }

  // 建立 updates：合併現有值 + 新 URL
  const updates = [];
  for (const [rowNum, data] of Object.entries(rowVideos)) {
    if (data.urls.length === 0) continue;
    const allUrls = data.existing
      ? [data.existing, ...data.urls]
      : data.urls;
    const combined = [...new Set(allUrls)].join('\n');
    updates.push({
      range: `${sheetName}!V${rowNum}`,
      values: [[combined]],
    });
  }

  // 顯示配對結果
  console.log('=== 配對結果 ===');
  for (const m of matched) {
    const hasNew = rowVideos[m.rowNum]?.urls.includes(`https://www.youtube.com/watch?v=${m.videoId}`);
    const status = hasNew ? '→ 寫入' : '（已有值）';
    console.log(`  [${m.rowNum}] ${m.sheetName} ← ${m.title} ${status}`);
  }

  if (unmatched.length > 0) {
    console.log('\n=== 未配對 ===');
    for (const u of unmatched) {
      const names = extractGameNames(u.title);
      console.log(`  ${u.title}`);
      console.log(`    提取名稱：${names.join(', ')}`);
    }
  }

  // 批次寫入
  if (updates.length > 0) {
    console.log(`\n寫入 ${updates.length} 筆...`);
    for (let i = 0; i < updates.length; i += 50) {
      const batch = updates.slice(i, i + 50);
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: { data: batch, valueInputOption: 'USER_ENTERED' },
      });
      console.log(`  批次 ${Math.floor(i / 50) + 1}：寫入 ${batch.length} 筆`);
      await sleep(200);
    }
  }

  console.log(`\n完成！寫入 ${updates.length} 筆，跳過 ${skipped} 筆（已有值），未配對 ${unmatched.length} 筆`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
