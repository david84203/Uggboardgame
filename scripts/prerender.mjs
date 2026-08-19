// Build 後預渲染：把 sitemap 列出的路由各跑一次，擷取 React + react-helmet-async
// 算好的 <head>（含正確 title/description/og/JSON-LD），寫成各頁靜態 HTML。
// 目的：讓不跑 JS 的爬蟲（LINE/FB/IG 分享、搜尋引擎）也能拿到每頁專屬的 SEO 標籤。
// 移植自 sarangheyo-site/scripts/prerender.mjs，拿掉 telegram webhook 相關邏輯。
import http from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 本機（Windows）用完整版 puppeteer 內建 Chrome；Vercel build 環境缺系統函式庫，
// 改用 @sparticuz/chromium 提供的、為 Amazon Linux 打包好的 Chromium。
async function launchBrowser() {
  if (process.env.VERCEL) {
    const chromium = (await import('@sparticuz/chromium')).default;
    const puppeteer = (await import('puppeteer-core')).default;
    return puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }
  const puppeteer = (await import('puppeteer')).default;
  return puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');
const PORT = 4737;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
};

// 靜態檔案伺服器；找不到對應檔案（即前端路由）時回退 index.html，讓 React Router 接手。
function startServer(template) {
  const server = http.createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url, `http://localhost`).pathname);
      const filePath = path.join(DIST, urlPath);
      if (path.extname(filePath) && existsSync(filePath)) {
        const data = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
        res.end(data);
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(template); // SPA fallback
    } catch (err) {
      res.writeHead(500);
      res.end(String(err));
    }
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

async function getRoutes() {
  const xml = await readFile(path.join(DIST, 'sitemap.xml'), 'utf-8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  return locs.map((loc) => new URL(loc).pathname);
}

async function main() {
  if (!existsSync(path.join(DIST, 'index.html'))) {
    throw new Error('找不到 dist/index.html，請先執行 vite build');
  }
  const template = await readFile(path.join(DIST, 'index.html'), 'utf-8');
  if (!/<body[\s\S]*<\/body>/i.test(template)) throw new Error('index.html 缺少 <body>');

  // react-helmet-async 在 React 19 下改用 React 原生的 head 標籤提升機制（不是手動 DOM 操作），
  // 它只認自己 render 出來的 <title>/<meta> 標籤，不知道 index.html 樣板裡原本寫死的那份，
  // 導致擷取到的 <head> 會同時存在「樣板預設值」與「Helmet 算好的正確值」兩份，
  // 而且兩者出現順序不一致（description 甚至是錯的樣板值排在前面，爬蟲會抓到錯的）。
  // 對策：擷取樣板原本的 title 文字／description 內容，寫檔前把這兩個「預設殘留」精準濾掉。
  const defaultTitleText = (template.match(/<title>([\s\S]*?)<\/title>/) || [])[1];
  const defaultDescText = (template.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/) || [])[1];
  // 去重規則：同類標籤只留一個，優先留「不等於樣板預設值」的那份（＝Helmet 算好的正確值）；
  // 若整頁只有預設值那一份（例如首頁的正確標題本來就跟樣板一樣），就保留它——
  // 寧可留預設值，也不能刪到一個不剩（曾把首頁 <title> 濾成 0 個）。
  const dedupe = (head, pattern, isDefault) => {
    const tags = head.match(pattern) || [];
    if (tags.length <= 1) return head;
    const keep = tags.find((t) => !isDefault(t)) || tags[0];
    let kept = false;
    return head.replace(pattern, (m) => {
      if (m === keep && !kept) {
        kept = true;
        return m;
      }
      return '';
    });
  };
  const stripStaleDefaults = (head) => {
    let result = head;
    result = dedupe(result, /<title>[\s\S]*?<\/title>/g, (t) =>
      defaultTitleText !== undefined ? t === `<title>${defaultTitleText}</title>` : false,
    );
    result = dedupe(result, /<meta[^>]*name="description"[^>]*>/g, (m) =>
      defaultDescText !== undefined ? m.includes(`content="${defaultDescText}"`) : false,
    );
    return result;
  };

  const routes = await getRoutes();
  const server = await startServer(template);
  const browser = await launchBrowser();

  let ok = 0;
  for (const route of routes) {
    let done = false;
    // Vercel build 機器慢，重試一次；只需要 helmet 算好的 <head>，
    // 所以等 domcontentloaded＋React 掛載即可，不等圖片載完（等 load 曾在 Vercel 逾時）。
    for (let attempt = 1; attempt <= 2 && !done; attempt++) {
      const page = await browser.newPage();
      try {
        await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForFunction(
          () => {
            const r = document.getElementById('root');
            return r && r.childElementCount > 0;
          },
          { timeout: 60000 },
        );
        await new Promise((r) => setTimeout(r, 600)); // 等 helmet 把標籤刷上 <head>
        const rawHead = await page.evaluate(() => document.head.innerHTML);
        const head = stripStaleDefaults(rawHead);

        // 注意：這裡刻意擷取「即時渲染後」的 document.body.innerHTML，而不是沿用 index.html
        // 樣板裡原本的空殼 <div id="root"></div>。原版 sarangheyo-site 的做法只拿樣板 body
        // 骨架去拼，body 永遠是空的，不執行 JS 的爬蟲什麼文字都看不到——這正是本次任務要解決的
        // 問題（爬蟲抓回來只有空殼），所以這裡必須抓「真的算出來的內容」，不能照抄空殼那段。
        const bodyHtml = await page.evaluate(() => document.body.innerHTML);

        const html = `<!doctype html>\n<html lang="zh-TW">\n<head>\n${head}\n</head>\n<body>\n${bodyHtml}\n</body>\n</html>\n`;
        const outDir = route === '/' ? DIST : path.join(DIST, route);
        await mkdir(outDir, { recursive: true });
        await writeFile(path.join(outDir, 'index.html'), html, 'utf-8');

        const title = await page.title();
        console.log(`  ok ${route}  ->  ${title}`);
        ok += 1;
        done = true;
      } catch (err) {
        console.error(`  FAIL ${route}（第${attempt}次）  ->  ${err.message}`);
      } finally {
        await page.close();
      }
    }
  }

  await browser.close();
  server.close();

  // 首頁（/）預渲染後會蓋掉 dist/index.html，而 index.html 同時是 SPA 的 fallback，
  // 若不處理，會員 APP 使用者打開 /app 會先閃一下官網首頁的內容再切成 APP。
  // 所以另外寫一份「乾淨空殼」到 dist/app/index.html 給 APP 用（vercel.json 的 rewrite 指向它），
  // 並標 noindex：APP 是會員工具頁，不需要被搜尋引擎收錄，也不該跟首頁互相稀釋。
  const appShell = template.replace(/<head([^>]*)>/i, '<head$1>\n    <meta name="robots" content="noindex, follow" />');
  await mkdir(path.join(DIST, 'app'), { recursive: true });
  await writeFile(path.join(DIST, 'app', 'index.html'), appShell, 'utf-8');
  console.log('  ok /app  ->  會員 APP 空殼（noindex）');

  // sitemap 的 lastmod 自動帶成本次 build 日期（台北時間），不用每次手改
  const today = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
  const sitemapPath = path.join(DIST, 'sitemap.xml');
  const sitemap = await readFile(sitemapPath, 'utf-8');
  await writeFile(sitemapPath, sitemap.replace(/<lastmod>[^<]*<\/lastmod>/g, `<lastmod>${today}</lastmod>`), 'utf-8');
  console.log(`  ok sitemap.xml lastmod -> ${today}`);

  console.log(`\n預渲染完成：${ok}/${routes.length} 條路由`);
  if (ok < routes.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
