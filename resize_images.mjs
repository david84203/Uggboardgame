/**
 * resize_images.mjs
 * 將 public/images/ 內所有圖片（jpg/jpeg/png/webp/jfif）：
 *   1. 若短邊 > 400px → 縮小至短邊 = 400px，等比例，不裁切不填充
 *   2. 若副檔名與實際格式不符 → 強制轉換為副檔名所對應的格式
 *   3. .jfif → 改副檔名為 .jpg 並轉為 JPEG
 * 已符合條件（尺寸 OK 且格式正確）的圖片跳過。
 *
 * 用法：node resize_images.mjs [--dry-run]
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, 'public', 'images');
const SHORT_SIDE = 400;
const DRY_RUN = process.argv.includes('--dry-run');

const SUPPORTED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.jfif']);

// 副檔名 → 期望的 sharp format 名稱
const EXT_TO_FORMAT = {
  '.jpg':  'jpeg',
  '.jpeg': 'jpeg',
  '.png':  'png',
  '.webp': 'webp',
  '.jfif': 'jpeg',
};

// 先清理殘留的 .tmp 檔
function cleanTmp() {
  const files = fs.readdirSync(IMAGES_DIR);
  let count = 0;
  for (const f of files) {
    if (f.endsWith('.tmp')) {
      fs.unlinkSync(path.join(IMAGES_DIR, f));
      count++;
    }
  }
  if (count > 0) console.log(`已清理 ${count} 個殘留 .tmp 檔\n`);
}

// 安全覆蓋：用 copyFile + unlink 兩步驟，避開 Windows rename 的 EBUSY 問題
function safeRename(src, dst) {
  fs.copyFileSync(src, dst);
  fs.unlinkSync(src);
}

async function processImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  // jfif → 輸出為 .jpg
  const outExt  = ext === '.jfif' ? '.jpg' : ext;
  const outPath = ext === '.jfif'
    ? filePath.slice(0, -ext.length) + '.jpg'
    : filePath;

  const expectedFormat = EXT_TO_FORMAT[ext] ?? 'jpeg';

  // 先用 fs 讀成 Buffer，避免 sharp 在 Windows 對某些路徑直接 open 失敗
  const inputBuf = fs.readFileSync(filePath);
  const meta = await sharp(inputBuf).metadata();
  const { width, height, format: actualFormat } = meta;
  const shortSide = Math.min(width, height);

  const sizeOk   = shortSide <= SHORT_SIDE;
  const formatOk = actualFormat === expectedFormat && outPath === filePath;

  // 兩者都 OK → 跳過
  if (sizeOk && formatOk) {
    return { skipped: true };
  }

  // 計算目標尺寸
  let newW, newH;
  if (sizeOk) {
    // 尺寸已 OK，只需轉格式，保持原尺寸
    newW = width;
    newH = height;
  } else {
    const scale = SHORT_SIDE / shortSide;
    newW = Math.round(width * scale);
    newH = Math.round(height * scale);
  }

  const reason = [];
  if (!sizeOk) reason.push(`縮小 ${width}x${height}→${newW}x${newH}`);
  if (!formatOk) reason.push(`格式 ${actualFormat}→${expectedFormat}`);
  if (outPath !== filePath) reason.push(`副檔名 ${ext}→${outExt}`);

  if (DRY_RUN) {
    return { skipped: false, dryRun: true, reason: reason.join(', ') };
  }

  const pipeline = sharp(inputBuf).resize(newW, newH);

  // 產生 buffer（不依賴中間檔）
  let buf;
  if (expectedFormat === 'jpeg') {
    buf = await pipeline.jpeg({ quality: 85, progressive: true }).toBuffer();
  } else if (expectedFormat === 'png') {
    buf = await pipeline.png({ compressionLevel: 9 }).toBuffer();
  } else if (expectedFormat === 'webp') {
    buf = await pipeline.webp({ quality: 85 }).toBuffer();
  } else {
    buf = await pipeline.jpeg({ quality: 85 }).toBuffer();
  }

  // 寫入，遇到 EBUSY/UNKNOWN 最多重試 3 次
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      fs.writeFileSync(outPath, buf);
      break;
    } catch (e) {
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, 300 * attempt));
      } else {
        throw e;
      }
    }
  }

  // 副檔名改變時（jfif→jpg），刪除舊檔
  if (outPath !== filePath) {
    fs.unlinkSync(filePath);
  }

  return { skipped: false, reason: reason.join(', ') };
}

async function main() {
  // 先清理殘留 tmp
  cleanTmp();

  const files = fs.readdirSync(IMAGES_DIR).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return SUPPORTED_EXTS.has(ext);
  });

  console.log(`掃描到 ${files.length} 個圖片${DRY_RUN ? '（試跑模式，不實際修改）' : ''}\n`);

  let processed = 0, skipped = 0, errors = 0;
  const errorList = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(IMAGES_DIR, file);

    try {
      const result = await processImage(filePath);
      if (result.skipped) {
        skipped++;
      } else {
        processed++;
        const tag = result.dryRun ? '[試跑]' : '[✓]';
        console.log(`${tag} (${i + 1}/${files.length}) ${file}: ${result.reason}`);
      }
    } catch (err) {
      errors++;
      errorList.push({ file, error: err.message });
      console.error(`[錯誤] ${file}: ${err.message}`);
    }
  }

  console.log(`\n完成！`);
  console.log(`  ✓ 處理：${processed} 個`);
  console.log(`  - 跳過：${skipped} 個（尺寸格式皆OK）`);
  console.log(`  ✗ 錯誤：${errors} 個`);

  if (errorList.length > 0) {
    console.log('\n錯誤詳情：');
    errorList.forEach(e => console.log(`  ${e.file}: ${e.error}`));
  }
}

main().catch(e => { console.error(e); process.exit(1); });
