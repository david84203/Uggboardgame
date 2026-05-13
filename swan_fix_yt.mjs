/**
 * swan_fix_yt.mjs - 只補抓 YouTube URL（修正 Embedly selector）
 */
import puppeteer from 'puppeteer';
import fs from 'fs';

const CACHE_PATH = 'D:/uggboardgame/swan_cache.json';
const cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
const products = cache.products;

// 找出所有 ytUrl 是空的（代表之前 selector 沒抓到）
const toFix = Object.entries(products).filter(([, p]) => !p.error && p.ytUrl === '');
console.log(`需要補 YouTube URL 的產品：${toFix.length} 筆`);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
page.setDefaultTimeout(15000);

let fixed = 0;
for (let i = 0; i < toFix.length; i++) {
  const [href, product] = toFix[i];
  try {
    await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 12000 });
    // 捲動觸發 lazy load
    await page.evaluate(() => window.scrollTo(0, 300));
    await sleep(1000);

    const ytUrl = await page.evaluate(() => {
      // Embedly iframe: src="//cdn.embedly.com/...?src=https%3A%2F%2Fwww.youtube.com%2Fembed%2FVIDEO_ID..."
      const iframe = document.querySelector('iframe.embedly-embed, iframe[src*="embedly"]');
      if (!iframe) return '';
      const src = iframe.src || '';
      const match = src.match(/youtube\.com%2Fembed%2F([a-zA-Z0-9_-]+)/i)
        || src.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/i);
      return match ? `https://www.youtube.com/watch?v=${match[1]}` : '';
    });

    if (ytUrl) {
      products[href].ytUrl = ytUrl;
      fixed++;
    }
  } catch {}

  process.stdout.write(`\r${i+1}/${toFix.length} 補到 ${fixed} 個影片`);
  if ((i+1) % 30 === 0) {
    fs.writeFileSync(CACHE_PATH, JSON.stringify({ products, updatedAt: new Date() }, null, 2));
  }
  await sleep(500);
}

await browser.close();
fs.writeFileSync(CACHE_PATH, JSON.stringify({ products, updatedAt: new Date() }, null, 2));
console.log(`\n完成！補到 ${fixed} 個 YouTube URL`);
