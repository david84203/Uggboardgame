/**
 * dogbarktrain_update.mjs
 * 從狗吠火車 dogbarktrain.com 抓取產品名稱、定價、圖片
 * 比對 Google Sheet 並更新 N 欄（定價）和 U 欄（圖片）
 *
 * 用法：
 *   node dogbarktrain_update.mjs crawl    ← 爬所有產品頁，存成 dogbarktrain_cache.json
 *   node dogbarktrain_update.mjs update   ← 比對 Sheet，更新 N/U 欄
 *   node dogbarktrain_update.mjs all      ← 兩步驟一起跑
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SHEET_ID = '1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw';
const SHEET_GID = 540615026;
const CACHE_PATH = path.join(__dirname, 'dogbarktrain_cache.json');
const BASE = 'https://www.dogbarktrain.com';

const C = {
  名稱: 0,  // A
  定價: 13, // N
  圖片: 20, // U
};

const PRODUCT_URLS = [
  '/products/babylon',
  '/products/thunder-road-vendetta',
  '/products/glyphx',
  '/products/dino',
  '/products/color8',
  '/products/9upper-tableside-wonder-ver',
  '/products/green-team-wins',
  '/products/olenon',
  '/products/card-bullet-reload',
  '/products/meow-ten',
  '/products/pride-of-ninja',
  '/products/tableside-wander',
  '/products/the-white-castle-duel',
  '/products/wibble-wobble-where',
  '/products/burger-master',
  '/products/onstage',
  '/products/xingling-hegemony',
  '/products/sky-towers',
  '/products/phonic-garden-eel',
  '/products/adventurers-guild-girls-the-board-game',
  '/products/super-boss-monster',
  '/products/red-dragon-inn',
  '/products/9upper-pictures',
  '/products/buffet-boss',
  '/products/isekai-guild-masters-expansions',
  '/products/isekai-guild-masters',
  '/products/save-the-princess',
  '/products/temple-code',
  '/products/club-of-cthulhu',
  '/products/genius-examinee',
  '/products/one-deck-dungeon-artifact-quests',
  '/products/one-deck-dungeon-abyssal-depths',
  '/products/landmarks',
  '/products/reef-project',
  '/products/the-masters',
  '/products/life-express',
  '/products/soulmist-a-journey-from-darkness-to-light-5e',
  '/products/vale-of-eternity-artifacts',
  '/products/mooncake-master',
  '/products/oh-my-orchids',
  '/products/endurance-the-game-–-24h-le-mans',
  '/products/one-deck-dungeon-forest-of-shadows',
  '/products/one-deck-dungeon',
  '/products/like-herding-cats',
  '/products/romi-rami',
  '/products/number-chain',
  '/products/interstellar-miner',
  '/products/idolalive-1',
  '/products/idolalive',
  '/products/deep-sea-adventure-1',
  '/products/salton-sea',
  '/products/sand',
  '/products/petrichor',
  '/products/kitsune-switch',
  '/products/mr-ms-bunny-hunt',
  '/products/seven-vice',
  '/products/cat-between-us',
  '/products/almost-innocent',
  '/products/distilled',
  '/products/dune-2',
  '/products/dune-1',
  '/products/dune',
  '/products/cyberpunk-2077-gangs-of-night-city-legend-pledge-3d-hideouts-drones',
  '/products/cyberpunk-2077-gangs-of-night-city-3d-hideouts-drones',
  '/products/cyberpunk-2077-gangs-of-night-city-legend-pledge',
  '/products/cyberpunk-2077-gangs-of-night-city-edgerunner-pledge',
  '/products/worms-1',
  '/products/worms',
  '/products/arkham-cultist-1',
  '/products/arkham-cultist',
  '/products/蘿菠蘿菠2',
  '/products/fateforge-chronicles-of-kaan',
  '/products/werewolves-1',
  '/products/tabriz',
  '/products/dominant-species-token',
  '/products/dominant-species-marine-token',
  '/products/dominant-species',
  '/products/dominant-species-marine',
  '/products/werewolves',
  '/products/aves',
  '/products/animania',
  '/products/soulaween',
  '/products/stereo-mind-classical',
  '/products/mino-dice',
  '/products/faraway',
  '/products/huat\'s-up',
  '/products/master-sinseh',
  '/products/shop-until-you-drop',
  '/products/trash-or-cash',
  '/products/haito-diamond',
  '/products/dog-bone-dog',
  '/products/my-best-friend',
  '/products/codex-naturalis',
  '/products/factoria-addon',
  '/products/factoria',
  '/products/marvel-zombies-undead-pledge',
  '/products/marvel-zombies-hungry-pledge',
  '/products/lets-go-to-japan',
  '/products/coffee-rush-1',
  '/products/orléans-the-plague',
  '/products/the-cathedral-of-orléans',
  '/products/décorum-movin-out',
  '/products/crown-ash-2',
  '/products/crown-ash-1',
  '/products/the-diamond-swap',
  '/products/moneybags',
  '/products/mr-face',
  '/products/hey-yo',
  '/products/flotsam-fight',
  '/products/tricks-and-the-phantom',
  '/products/zogen',
  '/products/rafter-five',
  '/products/tomatomato-1',
  '/products/make-the-difference',
  '/products/tomatomato',
  '/products/moving-wild',
  '/products/a-fake-artist-goes-to-new-york',
  '/products/maskmen',
  '/products/deep-sea-adventure',
  '/products/quickity-pickity',
  '/products/fafnir',
  '/products/insider-black',
  '/products/insider',
  '/products/order-overload-cafe',
  '/products/moon-adventure',
  '/products/town-66',
  '/products/kobayakawa',
  '/products/troika',
  '/products/nine-tiles-extreme',
  '/products/nine-tiles-panic',
  '/products/vita-mors-conspiro',
  '/products/vita-mors',
  '/products/reload-compilation-2',
  '/products/reload-compilation-1',
  '/products/reload-compilation',
  '/products/mythos-tales-1',
  '/products/wayfarers-of-the-south-tigris',
  '/products/momiji',
  '/products/terminus',
  '/products/hidden-leaders',
  '/products/unfair-expansion-alien-b-movie-dinosaur-western-1',
  '/products/unfair',
  '/products/oranienburger-kanal',
  '/products/就算是無雙勇者，也怕遇上這款豬隊友',
  '/products/in-this-way-i-become-an-excalibur-king',
  '/products/decorum',
  '/products/world-wonders-mundo',
  '/products/dots',
  '/products/books-of-time-promo',
  '/products/𝐋𝐢𝐯𝐢𝐧𝐠-𝐅𝐨𝐫𝐞𝐬𝐭-1',
  '/products/windmill-valley',
  '/products/𝐋𝐢𝐯𝐢𝐧𝐠-𝐅𝐨𝐫𝐞𝐬𝐭',
  '/products/crown-ash',
  '/products/派遣小鎮-新的使命-擴充',
  '/products/townsfolk-wanted',
  '/products/sea-salt-paper-extra-salt',
  '/products/the-vale-of-eternity',
  '/products/wakeari-girls-collection',
  '/products/spy-royale',
  '/products/瞎掰王-sdgs-教育版',
  '/products/everdell-farshore',
  '/products/go-cuckoo',
  '/products/habitats',
  '/products/chickent',
  '/products/3-ring-circus',
  '/products/circle-the-wagons-1-1-1-1',
  '/products/circle-the-wagons-1-1-1',
  '/products/circle-the-wagons-1-1',
  '/products/circle-the-wagons-1',
  '/products/circle-the-wagons',
  '/products/海王舔狗對的人-成人版',
  '/products/mrright',
  '/products/hello！tea-time',
  '/products/hello-bonfire',
  '/products/point-city',
  '/products/graffiti-6',
  '/products/youkai-hyakki-yakou',
  '/products/sea-salt-paper',
  '/products/the-white-castle-matcha',
  '/products/the-white-castle',
  '/products/age-of-galaxy',
  '/products/boom！boom！',
  '/products/beacon-patrol',
  '/products/evenfall',
  '/products/wyrmspan',
  '/products/nucleum-australia',
  '/products/the-pursuit-of-happiness-big-box',
  '/products/pixies',
  '/products/dorfromantik-the-duel',
  '/products/coffee-rush-piece-of-cake',
  '/products/regroup-chicken-army',
  '/products/circus-break',
  '/products/circus-rescue',
  '/products/evolution-new-world',
  '/products/zombicide-undead-or-alive',
  '/products/stellamonolith',
  '/products/hackclad-crossfate',
  '/products/bulygames',
  '/products/gun-n-gungun-n-gun',
  '/products/lemures',
  '/products/serviam',
  '/products/midrash',
  '/products/漫威絕密檔案',
  '/products/plantopia',
  '/products/the-korean-wave',
  '/products/wok-and-roll',
  '/products/reef',
  '/products/alpha-beasts-attack',
  '/products/chope',
  '/products/durian-dash',
  '/products/kopi-king',
  '/products/night-parade-of-a-hundred-yokai',
  '/products/keep-the-heroes-out',
  '/products/first-rat',
  '/products/expeditions',
  '/products/books-of-time',
  '/products/skate-summe',
  '/products/garden-nation',
  '/products/amygdala',
  '/products/delta',
  '/products/lockdown',
  '/products/world-wonders',
  '/products/coffee-rush',
  '/products/trolls-princesses',
  '/products/cutthroat-caverns-death-incarnate',
  '/products/cutthroat-caverns',
  '/products/reload',
  '/products/wonderlands-war-promo-card-pack',
  '/products/bitoku-resutoran',
  '/products/wonderlands-war-shards-of-madness-exp',
  '/products/dorfromantik',
  '/products/wonderlands-war-chips-box',
  '/products/wonderland-s-war',
  '/products/office-survival',
  '/products/fantastic-factories-exp',
  '/products/fantastic-factories',
  '/products/flash-point-fire-rescue',
  '/products/avalon',
  '/products/night-of-the-ninja',
  '/products/nucleum',
  '/products/no-context',
  '/products/dont-wake-up-cthulhu',
  '/products/9upper-expansion',
  '/products/9upper',
  '/products/pizhexianzhi',
  '/products/mythos-tales',
  '/products/munchkin-cthulhu',
  '/products/munchkin-expansion-compilation-2',
  '/products/munchkin-expansion-compilation-1',
  '/products/munchkin',
  '/products/coup-rebellion-g54',
  '/products/coup-reformation',
  '/products/coup',
  '/products/onkl',
  '/products/boom%EF%BC%81boom%EF%BC%81',
  '/products/hello%EF%BC%81tea-time',
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getAuth() {
  const keyPath = path.join(__dirname, 'service-account.json');
  return new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function crawl() {
  let cached = {};
  if (fs.existsSync(CACHE_PATH)) {
    try { cached = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')); } catch {}
    const count = Object.keys(cached).filter(k => !cached[k].error).length;
    console.log(`載入既有快取：${count} 筆`);
  }

  console.log(`\n開始爬取 ${PRODUCT_URLS.length} 個產品頁面...\n`);

  let done = 0, skipped = 0, errors = 0;

  for (const urlPath of PRODUCT_URLS) {
    const fullUrl = BASE + urlPath;
    const key = urlPath.replace('/products/', '');

    if (cached[key] && !cached[key].error) {
      skipped++; done++;
      process.stdout.write(`\r  進度 ${done}/${PRODUCT_URLS.length}（跳過 ${skipped}，錯誤 ${errors}）`);
      continue;
    }

    try {
      const res = await fetch(fullUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html',
        },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const html = await res.text();
      const ldMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/i);
      if (!ldMatch) throw new Error('找不到 LD+JSON');

      const data = JSON.parse(ldMatch[1]);
      cached[key] = {
        name: data.name || '',
        price: data.offers?.price || 0,
        image: Array.isArray(data.image) ? data.image[0] : (data.image || ''),
        url: fullUrl,
        crawledAt: new Date().toISOString(),
      };
      done++;
    } catch (e) {
      cached[key] = { error: e.message, url: fullUrl };
      errors++; done++;
    }

    process.stdout.write(`\r  進度 ${done}/${PRODUCT_URLS.length}（跳過 ${skipped}，錯誤 ${errors}）`);
    await sleep(200);
  }

  fs.writeFileSync(CACHE_PATH, JSON.stringify(cached, null, 2), 'utf8');
  const success = Object.keys(cached).filter(k => !cached[k].error).length;
  console.log(`\n\n爬取完成！成功 ${success}，錯誤 ${errors}`);
}

async function update() {
  if (!fs.existsSync(CACHE_PATH)) {
    console.error('找不到快取檔，請先執行 crawl');
    process.exit(1);
  }

  const cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
  const products = Object.entries(cache).filter(([, v]) => !v.error && v.name);
  console.log(`快取中有 ${products.length} 筆有效產品\n`);

  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const tab = meta.data.sheets.find(s => s.properties.sheetId === SHEET_GID) || meta.data.sheets[0];
  const sheetName = tab.properties.title;
  console.log(`工作表：${sheetName}`);

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:Y`,
  });
  const rows = res.data.values || [];
  console.log(`Sheet 共 ${rows.length} 列\n`);

  const allUpdates = [];
  let matched = 0, priceFilled = 0, imageFilled = 0, skippedPrice = 0, skippedImage = 0;
  const unmatched = [];

  for (const [, product] of products) {
    const pName = (product.name || '').trim();
    if (!pName) continue;

    let sheetRow = rows.findIndex(r => (r[C.名稱] || '').trim() === pName);
    if (sheetRow === -1) {
      sheetRow = rows.findIndex(r => {
        const name = (r[C.名稱] || '').trim();
        return name && pName && (name.includes(pName) || pName.includes(name));
      });
    }
    if (sheetRow === -1) { unmatched.push(pName); continue; }

    matched++;
    const rowIndex = sheetRow + 1;
    const currentRow = rows[sheetRow];

    if (!currentRow[C.定價] || currentRow[C.定價].trim() === '') {
      allUpdates.push({ range: `${sheetName}!N${rowIndex}`, values: [[product.price]] });
      priceFilled++;
    } else { skippedPrice++; }

    if (!currentRow[C.圖片] || currentRow[C.圖片].trim() === '') {
      allUpdates.push({ range: `${sheetName}!U${rowIndex}`, values: [['v']] });
      imageFilled++;
    } else { skippedImage++; }
  }

  if (allUpdates.length > 0) {
    console.log(`送出 ${allUpdates.length} 個更新...`);
    for (let i = 0; i < allUpdates.length; i += 100) {
      const batch = allUpdates.slice(i, i + 100);
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: { data: batch, valueInputOption: 'USER_ENTERED' },
      });
      console.log(`  批次 ${Math.floor(i / 100) + 1}：寫入 ${batch.length} 個`);
      await sleep(200);
    }
  }

  console.log(`\n===== 更新完成 =====`);
  console.log(`匹配成功：${matched} 款`);
  console.log(`填定價 N 欄：${priceFilled} 格`);
  console.log(`填圖片 U 欄：${imageFilled} 格（標記 v）`);
  console.log(`跳過定價：${skippedPrice} 格 / 跳過圖片：${skippedImage} 格`);
  console.log(`未匹配：${unmatched.length} 款`);
}

// === DOWNLOAD IMAGES ===
async function downloadImages() {
  if (!fs.existsSync(CACHE_PATH)) {
    console.error('找不到快取檔，請先執行 crawl');
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

  let downloaded = 0, skipped = 0;

  for (const [, product] of products) {
    const pName = (product.name || '').trim();
    if (!pName || !product.image) continue;

    let sheetRow = rows.findIndex(r => (r[C.名稱] || '').trim() === pName);
    if (sheetRow === -1) {
      sheetRow = rows.findIndex(r => {
        const name = (r[C.名稱] || '').trim();
        return name && pName && (name.includes(pName) || pName.includes(name));
      });
    }
    if (sheetRow === -1) continue;

    const rowNum = sheetRow + 1;
    const existingFiles = [
      path.join(IMAGES_DIR, `row-${rowNum}.jpg`),
      path.join(IMAGES_DIR, `row-${rowNum}.webp`),
      path.join(IMAGES_DIR, `${rowNum}.jpg`),
      path.join(IMAGES_DIR, `${rowNum}.webp`),
    ];
    if (existingFiles.some(f => fs.existsSync(f))) { skipped++; continue; }

    try {
      const imgUrl = product.image; // 用原始 URL，不轉尺寸
      const res = await fetch(imgUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': BASE + '/',
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

const mode = process.argv[2] || 'all';

(async () => {
  if (mode === 'crawl') await crawl();
  else if (mode === 'update') await update();
  else if (mode === 'download') await downloadImages();
  else if (mode === 'all') { await crawl(); console.log('\n--- 更新 Sheet ---\n'); await update(); console.log('\n--- 下載圖片 ---\n'); await downloadImages(); }
  else console.log('用法：node dogbarktrain_update.mjs [crawl|update|download|all]');
})();
