// 官網門面頁（/ /about /pricing /faq）用的照片最佳化。
//
// 來源有兩處，都不要直接拿原圖給網頁用：
//   1. public/images/env/          會員 APP 環境介紹頁在用的舊照，最大 2.8MB，不可動
//   2. assets-src/site-photos/     Lu 2026-08-24 補的素材（已在匯入時縮到 2200px 內）
// 這支只產出門面頁專用縮圖到 public/images/env/web/。
//
// 挑片規則見 memory reference_ugg_store_photos，兩條重點：
//   - 有客人入鏡的照片 Lu 已授權使用（2026-08-23）
//   - 牆上的 5F 密室系列海報要裁掉：那條業務三年前已轉給草咩咩，
//     留在畫面裡會讓客人／AI 以為烏嘎嘎還在做密室
//
// 用法：node scripts/optimize-public-photos.mjs
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const OLD = 'public/images/env';
const NEW = 'assets-src/site-photos';
const OUT = 'public/images/env/web';

const JOBS = [
  // 首頁 hero：桌遊牆走道，有縱深，最能撐大圖
  { dir: NEW, file: 'PXL_20260529_055616662.jpg', name: 'wall-aisle', width: 1400, height: 900 },

  // 首頁三個特色
  { dir: NEW, file: 'PXL_20260213_104416313.jpg', name: 'game-heavy', width: 900, height: 675 },
  // 左側牆上有密室海報，裁掉左邊三成（右上角的烏嘎嘎招牌要留著）
  { dir: NEW, file: 'PXL_20260502_074707180.jpg', name: 'table-group', width: 900, height: 675, cropLeft: 0.3 },
  // 舊照，上緣同樣有密室海報
  { dir: OLD, file: 'env-floor1-seating.jpg', name: 'crowd', width: 900, height: 675, cropTop: 0.34 },

  // 樓層
  { dir: NEW, file: 'PXL_20260529_060048730.jpg', name: 'wall-close', width: 1400, height: 612 },
  { dir: NEW, file: 'FB_IMG_1729843599047.jpg', name: 'tatami', width: 900, height: 675 },
  { dir: OLD, file: 'env-floor3-space.jpg', name: 'floor3', width: 900, height: 675 },
  // 右緣有旁邊客人的外套佔掉一塊，裁掉再縮
  { dir: NEW, file: 'PXL_20230106_130453511.jpg', name: 'mahjong', width: 900, height: 675, cropRight: 0.14 },

  // 其他版位
  { dir: NEW, file: 'PXL_20260325_161638000.jpg', name: 'sales', width: 1000, height: 750 },
  { dir: NEW, file: 'PXL_20260324_100925989.jpg', name: 'storefront', width: 1000, height: 750 },
  { dir: NEW, file: 'FB_IMG_1735464853970.jpg', name: 'group', width: 900, height: 675 },
  { dir: NEW, file: 'FB_IMG_1684727340383.jpg', name: 'tatami-busy', width: 900, height: 675 },
];

fs.mkdirSync(OUT, { recursive: true });

let total = 0;
for (const job of JOBS) {
  const out = path.join(OUT, `${job.name}.webp`);
  let img = sharp(path.join(job.dir, job.file));
  if (job.cropLeft || job.cropRight || job.cropTop) {
    const { width, height } = await img.metadata();
    const left = Math.round(width * (job.cropLeft || 0));
    const top = Math.round(height * (job.cropTop || 0));
    img = img.extract({
      left,
      top,
      width: Math.round(width * (1 - (job.cropLeft || 0) - (job.cropRight || 0))),
      height: height - top,
    });
  }
  await img.resize(job.width, job.height, { fit: 'cover', position: 'centre' }).webp({ quality: 74 }).toFile(out);
  const kb = fs.statSync(out).size / 1024;
  total += kb;
  console.log(`  ${job.name.padEnd(12)} ${job.width}x${job.height}  ${kb.toFixed(0)} KB   <- ${job.file}`);
}
console.log(`完成 ${JOBS.length} 張，合計 ${(total / 1024).toFixed(2)} MB`);

// 清掉本輪沒產出的舊檔，避免 public/ 累積沒人用的圖
const keep = new Set(JOBS.map((j) => `${j.name}.webp`));
for (const f of fs.readdirSync(OUT)) {
  if (!keep.has(f)) {
    fs.unlinkSync(path.join(OUT, f));
    console.log(`  已移除未使用的 ${f}`);
  }
}
