// 官網門面頁用的店內照片最佳化。
// 原圖（public/images/env/*.jpg）最大 2.8MB，是會員 APP 環境介紹頁在用的，不可動；
// 這支只產出門面頁專用的縮圖到 public/images/env/web/。
// 只挑「沒有拍到客人臉」的幾張——門面頁是對外公開頁，不放可辨識人臉。
// 用法：node scripts/optimize-public-photos.mjs
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'public/images/env';
const OUT = 'public/images/env/web';

const JOBS = [
  // 首頁主視覺：客人在打牌的實況。Lu 2026-08-23 確認可以使用有客人入鏡的照片。
  // 上緣裁掉一部分：牆上還貼著 5F 密室系列海報，那條業務三年前已轉給草咩咩，
  // 留在主視覺裡會讓客人／AI 誤以為烏嘎嘎還在做密室。
  { file: 'env-floor1-seating.jpg', name: 'crowd', width: 1400, height: 900, cropTop: 0.34 },
  { file: 'env-floor1-game-wall-2.jpg', name: 'game-wall', width: 1400, height: 1050 },
  { file: 'env-floor1-sales.jpg', name: 'floor1', width: 1000, height: 750 },
  { file: 'env-floor2-space.jpg', name: 'floor2', width: 1000, height: 750 },
  { file: 'env-floor3-space.jpg', name: 'floor3', width: 1000, height: 750 },
  { file: 'env-floor1-counter.jpg', name: 'counter', width: 1000, height: 750 },
];

fs.mkdirSync(OUT, { recursive: true });

for (const job of JOBS) {
  const src = path.join(SRC, job.file);
  const out = path.join(OUT, `${job.name}.webp`);
  let img = sharp(src);
  if (job.cropRight || job.cropTop) {
    const { width, height } = await img.metadata();
    const top = Math.round(height * (job.cropTop || 0));
    img = img.extract({
      left: 0,
      top,
      width: Math.round(width * (1 - (job.cropRight || 0))),
      height: height - top,
    });
  }
  await img
    .resize(job.width, job.height, { fit: 'cover', position: 'centre' })
    .webp({ quality: 74 })
    .toFile(out);
  const kb = (fs.statSync(out).size / 1024).toFixed(0);
  console.log(`  ${job.file} -> ${out}  ${job.width}x${job.height}  ${kb} KB`);
}
console.log(`完成 ${JOBS.length} 張`);
