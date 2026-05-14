/**
 * broadway_update.mjs
 * 從栢龍玩具 broadwaytw.shoplineapp.com 抓取產品名稱、定價、圖片
 * 比對 Google Sheet 並更新 N 欄（定價）和 U 欄（圖片）
 *
 * 用法：
 *   node broadway_update.mjs crawl    ← 爬所有產品頁，存成 broadway_cache.json
 *   node broadway_update.mjs update   ← 比對 Sheet，更新 N/U 欄（需先跑 crawl）
 *   node broadway_update.mjs all      ← 兩步驟一起跑
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// === CONFIG ===
const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw';
const SHEET_GID = 540615026;
const CACHE_PATH = path.join(__dirname, 'broadway_cache.json');
const BROADWAY_BASE = 'https://broadwaytw.shoplineapp.com';

// 欄位索引（0-based）
const C = {
  名稱: 0,  // A 中文名稱
  定價: 13, // N 定價
  圖片: 20, // U 圖片
};

// 栢龍產品 URL 列表（來自 firecrawl map）
const PRODUCT_URLS = [
  '/products/escape-room',
  '/products/全力衝廁',
  '/products/imperial-settlers-empires-of-the-north',
  '/products/10-days-in-the-usa',
  '/products/cookie-box',
  '/products/othello-no-lose-piece',
  '/products/othello-classic',
  '/products/marble-circuit',
  '/products/conspiracy-abyss-universe',
  '/products/aquatica',
  '/products/sherlock-q-q1-last-call',
  '/products/sherlock-q---q2-death-on-the-4th-of-july',
  '/products/sherlock-q---q3-the-tomb-of-the-archaeologist-1-1',
  '/products/sherlock-q---q4-donslegacy-1-1-1',
  '/products/sherlock-q-q5-hostages-1-1-1',
  '/products/sherlock-q-q6-propagation',
  '/products/escape-room-expansion-01',
  '/products/taco-hat-cake-gift-pizza',
  '/products/top-banana',
  '/products/othello-daikaiten-mini',
  '/products/coconuts',
  '/products/ghost-adventure',
  '/products/ghost-castle',
  '/products/heaven-here-i-come',
  '/products/imperial-settlers-empires-of-the-north-japanese-islands',
  '/products/imperial-settlers-empires-of-the-north-roman',
  '/products/dim-sum-jam-jp',
  '/products/savannah-park',
  '/products/escape-room-expansion-02',
  '/products/good-cop-bad-cop',
  '/products/good-cop-bad-cop-expansion',
  '/products/escape-room-2-player-expansion',
  '/products/escape-game-baker-street',
  '/products/escape-game-diabolical-elevator',
  '/products/escape-game-space',
  '/products/welcome-to',
  '/products/happy-city',
  '/products/dive',
  '/products/fugitive',
  '/products/get-on-board',
  '/products/eleven',
  '/products/imperial-settlers-empires-of-the-north-roman-1',
  '/products/imperial-settlers-empires-of-the-north-egyptian-kings',
  '/products/escape-room-expansion-03',
  '/products/elastic-band',
  '/products/sequence',
  '/products/katamino',
  '/products/quarto',
  '/products/quoridor',
  '/products/qawale',
  '/products/sabika',
  '/products/next-station-london',
  '/products/roller-coaster-rush',
  '/products/3d-othello',
  '/products/steam-up',
  '/products/escape-room-family',
  '/products/escape-room-decoder',
  '/products/katamino－family',
  '/products/thrill-bomb',
  '/products/jooky-jooky',
  '/products/destinies',
  '/products/mobile-markets-a-smartphone-inc-game',
  '/products/cross-math',
  '/products/featherlight',
  '/products/triominos',
  '/products/bonsai',
  '/products/infiltraitors',
  '/products/urubamba-valley',
  '/products/coinx－family',
  '/products/the-princes-of-florence',
  '/products/triqueta',
  '/products/escape-from-the-aquarium',
  '/products/destinies-exp',
  '/products/星域奇航：危機01020304',
  '/products/星域奇航：佈局',
  '/products/empires-end',
  '/products/gartenbau',
  '/products/in-the-footstep-of-darwin',
  '/products/monopoly-dragon-ball-z',
  '/products/monopoly-sailor-moon',
  '/products/monopoly-one-piece',
  '/products/stone-soup',
  '/products/hoot-owl-hoot',
  '/products/smart10',
  '/products/puzzlegend-robinson',
  '/products/puzzlegend-sherlock',
  '/products/puzzlegend-merlin',
  '/products/escape-game-titanic',
  '/products/escape-game-knight-templar',
  '/products/jerkyii-hyde-vs-scotland-yard',
  '/products/next-station-tokyo',
  '/products/bamboo',
  '/products/ramba-zamba',
  '/products/endless-winter',
  '/products/endless-winter-expansion',
  '/products/welcome-to-your-perfect-home-collectors-edition',
  '/products/katamino-tower',
  '/products/escape-room-expansion-04',
  '/products/velonimo',
  '/products/amristar',
  '/products/bonsai-vigorous-growth-and-specialists',
  '/products/diabolik-heist-and-investigations',
  '/products/diabolik-la-lama-della-vendetta',
  '/products/謀殺之謎：嫌犯遊戲',
  '/products/line-it',
  '/products/gigamic-giant',
  '/products/leaf',
  '/products/fugitive-ii',
  '/products/moon-river',
  '/products/art-society',
  '/products/this-bed-is-mine',
  '/products/lifeboats',
  '/products/code-x',
  '/products/aurum',
  '/products/maudit-mot-dit',
  '/products/dune-imperium-immortality-expansion-rise-of-ix-expansion',
  '/products/jerkyii-vs-hyde',
  '/products/dont-get-got',
  '/products/quoridor-pacman',
  '/products/bomb-buster',
  '/products/marrakech',
  '/products/joking-hazard',
  '/products/my-city',
  '/products/trickdraw',
  '/products/mezen',
  '/products/i-win-phonics-card-game',
  '/products/what-if',
  '/products/icecool-wizard',
  '/products/pass-the-bomb-junior-30-anniversary',
  '/products/adaptoid-24',
  '/products/halloween',
  '/products/defenders-of-the-wild',
  '/products/sherlock-q10-fabian-essays',
  '/products/jenga-js7',
  '/products/surfosaurus-max',
  '/products/ratjack',
  '/products/blind-business',
  '/products/animal-of-baker-street',
  '/products/iki-akebono',
  '/products/too-much-info',
  '/products/finding-atlantis',
  '/products/next-station-paris',
  '/products/gangsi',
  '/products/my-puzzle-adventure-dragon',
  '/products/prey-another-day',
  '/products/katamino-pocket',
  '/products/quoridor-mini',
  '/products/quarto-mini',
  '/products/clank-catacomb',
  '/products/circles',
  '/products/potion-explosion',
  '/products/ingenious',
  '/products/codex-2-addition-intermediate',
  '/products/codex-3-addition-and-subtraction',
  '/products/chicken-vs-hotdog',
  '/products/escape-room-family2',
  '/products/quest',
  '/products/trial-by-trolley',
  '/products/fate-flip',
  '/products/similo-harry-potter',
  '/products/dont-skip-leg-day',
  '/products/gimbap',
  '/products/flatiron',
  '/products/wild-tiled-west',
  '/products/papayoo',
  '/products/intent-to-kill',
  '/products/similo-animal',
  '/products/similo-myths',
  '/products/wolf-street',
  '/products/wondrous-museum',
  '/products/gwent-the-legendary-card-game',
  '/products/dune-imperium-uprising、bloodlines',
  '/products/acquire-60thanniversary',
  '/products/mega-jackpot',
  '/products/shadow-blocks',
  '/products/曠野',
  '/products/invincible',
  '/products/fantasy-realms-deluxe',
  '/products/the-gang',
  '/products/texas-hold-it',
  '/products/compile',
  '/products/sequence-cat',
  '/products/dumb-questions-to-ask-your-friends',
  '/products/rumblebots',
  '/products/medical-mysteries',
  '/products/medium',
  '/products/men-nefer',
  '/products/qawale-min',
  '/products/pylos-mini',
  '/products/quxio-mini',
  '/products/mastermind',
  '/products/are-you-a-real-fan-ghibli-quiz-box',
  '/products/bunny-100',
  '/products/teddys-day',
  '/products/croa-25th-anniversary-edition',
  '/products/magicaboo',
  '/products/cash-a-catch',
  '/products/tick-tack-bumm',
  '/products/uno',
  '/products/uno-party',
  '/products/lets-hit-each-other-with-fake-swords',
  '/products/hanging-gardens',
  '/products/coinx%EF%BC%8Dfamily',
  '/products/gyges',
  '/products/%E6%9B%A0%E9%87%8E',
  '/products/katamino%EF%BC%8Dfamily',
];

// === UTILS ===
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// === AUTH ===
async function getAuth() {
  const keyPath = path.join(__dirname, 'service-account.json');
  if (!fs.existsSync(keyPath)) {
    console.error('找不到 service-account.json');
    process.exit(1);
  }
  return new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

// === CRAWL ===
async function crawl() {
  // 載入既有快取
  let cached = {};
  if (fs.existsSync(CACHE_PATH)) {
    try {
      cached = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
      const count = Object.keys(cached).filter(k => !cached[k].error).length;
      console.log(`載入既有快取：${count} 筆`);
    } catch {}
  }

  console.log(`\n開始爬取 ${PRODUCT_URLS.length} 個產品頁面...\n`);

  let done = 0;
  let skipped = 0;
  let errors = 0;

  for (const urlPath of PRODUCT_URLS) {
    const fullUrl = BROADWAY_BASE + urlPath;
    const key = urlPath.replace('/products/', '');

    // 跳過已完成且沒錯誤的
    if (cached[key] && !cached[key].error) {
      skipped++;
      done++;
      process.stdout.write(`\r  進度 ${done}/${PRODUCT_URLS.length}（跳過 ${skipped}，錯誤 ${errors}）`);
      continue;
    }

    try {
      const res = await fetch(fullUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html',
          'Accept-Language': 'zh-TW,zh;q=0.9',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const html = await res.text();

      // 提取 LD+JSON 產品資料
      const ldMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/i);
      if (!ldMatch) {
        throw new Error('找不到 LD+JSON');
      }

      const data = JSON.parse(ldMatch[1]);

      cached[key] = {
        name: data.name || '',
        price: data.offers?.price || 0,
        image: Array.isArray(data.image) ? data.image[0] : (data.image || ''),
        url: fullUrl,
        crawledAt: new Date().toISOString(),
      };

      done++;
      await sleep(300); // 禮貌延遲
    } catch (e) {
      cached[key] = { error: e.message, url: fullUrl };
      errors++;
      done++;
    }

    process.stdout.write(`\r  進度 ${done}/${PRODUCT_URLS.length}（跳過 ${skipped}，錯誤 ${errors}）`);
  }

  // 儲存快取
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cached, null, 2), 'utf8');
  const success = Object.keys(cached).filter(k => !cached[k].error).length;
  console.log(`\n\n爬取完成！成功 ${success}，錯誤 ${errors}`);
  console.log(`快取已存到 ${CACHE_PATH}`);
}

// === UPDATE SHEET ===
async function update() {
  if (!fs.existsSync(CACHE_PATH)) {
    console.error('找不到 broadway_cache.json，請先執行 crawl');
    process.exit(1);
  }

  const cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
  const products = Object.entries(cache).filter(([, v]) => !v.error && v.name);

  console.log(`快取中有 ${products.length} 筆有效產品\n`);

  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  // 先取得 sheet 名稱
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const tab = meta.data.sheets.find(s => s.properties.sheetId === SHEET_GID) || meta.data.sheets[0];
  const sheetName = tab.properties.title;
  console.log(`工作表名稱：${sheetName}\n`);

  // 讀取 Sheet 全部資料
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:Y`,
  });

  const rows = res.data.values || [];
  console.log(`Sheet 共 ${rows.length} 列（含標題）\n`);

  // 收集所有更新，再一次送出
  const allUpdates = [];
  let matched = 0;
  let priceFilled = 0;
  let imageFilled = 0;
  let skippedPrice = 0;
  let skippedImage = 0;
  const unmatched = [];

  for (const [, product] of products) {
    const pName = (product.name || '').trim();
    if (!pName) continue;

    // 精確匹配優先，失敗則嘗試模糊匹配
    let sheetRow = rows.findIndex(r => {
      const name = (r[C.名稱] || '').trim();
      return name === pName;
    });

    // 模糊匹配：名稱包含關係
    if (sheetRow === -1) {
      sheetRow = rows.findIndex(r => {
        const name = (r[C.名稱] || '').trim();
        return name && pName && (name.includes(pName) || pName.includes(name));
      });
    }

    if (sheetRow === -1) {
      unmatched.push(pName);
      continue;
    }

    matched++;
    const rowIndex = sheetRow + 1; // Sheets API 是 1-based
    const currentRow = rows[sheetRow];

    // N 欄：定價（只填空格）
    if (!currentRow[C.定價] || currentRow[C.定價].trim() === '') {
      allUpdates.push({
        range: `${sheetName}!N${rowIndex}`,
        values: [[product.price]],
      });
      priceFilled++;
    } else {
      skippedPrice++;
    }

    // U 欄：圖片（只填空格，標記 v）
    if (!currentRow[C.圖片] || currentRow[C.圖片].trim() === '') {
      allUpdates.push({
        range: `${sheetName}!U${rowIndex}`,
        values: [['v']],
      });
      imageFilled++;
    } else {
      skippedImage++;
    }
  }

  // 一次送出所有更新
  if (allUpdates.length > 0) {
    console.log(`送出 ${allUpdates.length} 個更新...`);
    // 分批，每次最多 100 個
    for (let i = 0; i < allUpdates.length; i += 100) {
      const batch = allUpdates.slice(i, i + 100);
      try {
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: SHEET_ID,
          requestBody: {
            data: batch,
            valueInputOption: 'USER_ENTERED',
          },
        });
        console.log(`  批次 ${Math.floor(i / 100) + 1}：寫入 ${batch.length} 個更新`);
      } catch (e) {
        console.error(`  批次寫入失敗：${e.message}`);
      }
      await sleep(200);
    }
  }

  console.log(`\n===== 更新完成 =====`);
  console.log(`匹配成功：${matched} 款`);
  console.log(`填定價 N 欄：${priceFilled} 格`);
  console.log(`填圖片 U 欄：${imageFilled} 格（標記 v）`);
  console.log(`跳過定價（已有值）：${skippedPrice} 格`);
  console.log(`跳過圖片（已有值）：${skippedImage} 格`);
  console.log(`未匹配：${unmatched.length} 款`);
  if (unmatched.length > 0 && unmatched.length <= 30) {
    console.log(`  未匹配列表：${unmatched.join('、')}`);
  }
}

// === DOWNLOAD IMAGES ===
async function downloadImages() {
  if (!fs.existsSync(CACHE_PATH)) {
    console.error('找不到 broadway_cache.json，請先執行 crawl');
    process.exit(1);
  }

  const cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
  const products = Object.entries(cache).filter(([, v]) => !v.error && v.name && v.image);

  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const tab = meta.data.sheets.find(s => s.properties.sheetId === SHEET_GID) || meta.data.sheets[0];
  const sheetName = tab.properties.title;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:U`,
  });

  const rows = res.data.values || [];
  const IMAGES_DIR = path.join(__dirname, 'public', 'images');

  console.log(`開始下載圖片...\n`);

  let downloaded = 0;
  let skipped = 0;

  for (const [, product] of products) {
    const pName = (product.name || '').trim();
    if (!pName || !product.image) continue;

    // 找匹配行
    let sheetRow = rows.findIndex(r => (r[C.名稱] || '').trim() === pName);
    if (sheetRow === -1) {
      sheetRow = rows.findIndex(r => {
        const name = (r[C.名稱] || '').trim();
        return name && pName && (name.includes(pName) || pName.includes(name));
      });
    }
    if (sheetRow === -1) continue;

    const rowNum = sheetRow + 1;

    // 檢查是否已有圖片（U 欄有 v）
    const hasV = (rows[sheetRow][C.圖片] || '').trim() === 'v';

    // 檢查檔案是否已存在
    const existingFiles = [
      path.join(IMAGES_DIR, `row-${rowNum}.jpg`),
      path.join(IMAGES_DIR, `row-${rowNum}.webp`),
      path.join(IMAGES_DIR, `${rowNum}.jpg`),
      path.join(IMAGES_DIR, `${rowNum}.webp`),
    ];
    const fileExists = existingFiles.some(f => fs.existsSync(f));

    if (fileExists) {
      skipped++;
      continue;
    }

    // 下載圖片
    try {
      const imgUrl = product.image; // 用原始 URL，不轉尺寸
      const res = await fetch(imgUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': BROADWAY_BASE + '/',
          'Accept': 'image/webp,image/*',
        },
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const buffer = Buffer.from(await res.arrayBuffer());
      const outPath = path.join(IMAGES_DIR, `row-${rowNum}.jpg`);
      fs.writeFileSync(outPath, buffer);
      downloaded++;
      console.log(`  ✅ ${pName} → row-${rowNum}.jpg`);
    } catch (e) {
      console.error(`  ❌ ${pName}：下載失敗 - ${e.message}`);
    }

    await sleep(200);
  }

  console.log(`\n圖片下載完成：${downloaded} 張，跳過 ${skipped} 張`);
}

// === MAIN ===
const mode = process.argv[2] || 'all';

(async () => {
  if (mode === 'crawl') {
    await crawl();
  } else if (mode === 'update') {
    await update();
  } else if (mode === 'download') {
    await downloadImages();
  } else if (mode === 'all') {
    await crawl();
    console.log('\n--- 開始更新 Sheet ---\n');
    await update();
    console.log('\n--- 開始下載圖片 ---\n');
    await downloadImages();
  } else {
    console.log('用法：node broadway_update.mjs [crawl|update|download|all]');
  }
})();
