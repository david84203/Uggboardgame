import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import Papa from 'papaparse';

// 延遲函數：讓程式暫停，避免被 BGG 封鎖
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 從 BGG 網址萃取 ID (例如：https://boardgamegeek.com/boardgame/31260/agricola -> 31260)
const extractBggId = (url) => {
  if (!url) return null;
  const match = url.match(/\/boardgame\/(\d+)/) || url.match(/\/boardgameexpansion\/(\d+)/);
  return match ? match[1] : null;
};

async function processGames() {
  const inputFile = 'games.csv';
  const outputFile = 'games_with_images.csv';
  // 設定圖片儲存路徑為專案內的 public/images
  const imagesDir = path.join(process.cwd(), 'public', 'images');

  // 如果資料夾不存在，則自動建立
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  console.log('載入 CSV 並處理編碼與標題列...');

  // 1. 直讀 UTF-8，移除 iconv-lite
  let csvText = fs.readFileSync(inputFile, 'utf8');

  // 處理可能的 UTF-8 BOM，以防檔首有隱藏字元
  csvText = csvText.replace(/^\uFEFF/, '');

  // 2. 自動過濾前面多餘的標題列：往下找直到出現 "中文名稱" 為止
  const lines = csvText.split('\n');
  const headerIndex = lines.findIndex(line => line.includes('中文名稱'));
  
  if (headerIndex === -1) {
    console.error('❌ 無法在 CSV 內找到標題列 (找不到「中文名稱」)，請確認 CSV 內容。');
    return;
  }
  
  const cleanedCsv = lines.slice(headerIndex).join('\n');

  // 3. 解析過濾好的 CSV 文字，並加入去除 header 空白與隱藏字元的邏輯
  const parseResult = Papa.parse(cleanedCsv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header ? header.trim() : header
  });

  const games = parseResult.data;
  console.log(`✅ 共成功解析 ${games.length} 款遊戲。準備開始向 BGG 抓取真實圖片...`);

  // 📌 加上完整的 Browser Header 偽裝，騙過 BGG 的防禦機制
  const headers = { 
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' 
  };

  // 4. 逐一取得圖片與下載
  for (let i = 0; i < games.length; i++) {
    const game = games[i];
    
    // 確保有找到正確欄位並處理可能殘留的字串空白
    const name = game['中文名稱']?.trim();
    const bggLink = game['BGG連結']?.trim();
    const bggId = extractBggId(bggLink);

    if (!bggId) {
      console.log(`[${i + 1}/${games.length}] ⏭️  略過: ${name} (無效的 BGG 連結)`);
      game['localImagePath'] = '';
      continue;
    }

    try {
      // 呼叫 BGG API 獲取圖片連結，攜帶偽裝 Header
      const xmlRes = await axios.get(`https://boardgamegeek.com/xmlapi2/thing?id=${bggId}`, { headers });
      const xmlData = await parseStringPromise(xmlRes.data);
      const item = xmlData.items?.item?.[0];
      
      if (!item) {
        console.log(`[${i + 1}/${games.length}] ⏭️  略過: ${name} (BGG 回傳查無資料)`);
        game['localImagePath'] = '';
        continue;
      }

      // 優先抓取高解析度 image，其次是 thumbnail
      const imageUrl = item.image ? item.image[0] : (item.thumbnail ? item.thumbnail[0] : null);
      
      if (imageUrl) {
        // 從圖片 URL 取得副檔名（預設給 .jpg）
        const urlObj = new URL(imageUrl);
        const ext = path.extname(urlObj.pathname) || '.jpg';
        const fileName = `${bggId}${ext}`;
        const filePath = path.join(imagesDir, fileName);
        
        // [下載圖片] 請求二進位圖片流，一樣攜帶偽裝 Header 防止 401
        const imageRes = await axios.get(imageUrl, { responseType: 'stream', headers });
        const writer = fs.createWriteStream(filePath);
        
        imageRes.data.pipe(writer);
        
        // 等待圖片寫入完成
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        // 寫入相對路徑至 CSV 的 localImagePath 欄位
        game['localImagePath'] = `/images/${fileName}`;
        console.log(`[${i + 1}/${games.length}] 💾 成功下載圖片: ${name} -> ${fileName}`);
      } else {
         game['localImagePath'] = '';
         console.log(`[${i + 1}/${games.length}] 🚫 無圖片可載: ${name}`);
      }
    } catch (error) {
      console.error(`[${i + 1}/${games.length}] ❌ 失敗: ${name} (ID: ${bggId}) - ${error.message}`);
      game['localImagePath'] = '';
    }

    // ★ 防護機制：強制等待 2 秒鐘不搶快，保護您的 IP 不被 BGG 封鎖 ★
    await delay(2000); 
  }

  // 5. 將結果輸出成新的 CSV
  const finalCsv = Papa.unparse(games);
  
  // 寫入檔案時加上 UTF-8 BOM，以避免您用 Excel 開啟時又變回亂碼
  fs.writeFileSync(outputFile, '\ufeff' + finalCsv, 'utf8');
  console.log(`\n✨ 大功告成！檔案已儲存為 ${outputFile}，所有圖片已存放於 public/images 中`);
}

processGames();
