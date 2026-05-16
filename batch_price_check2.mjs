import fs from 'fs';
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function extractPrice(html) {
  return html.match(/"price"\s*:\s*"(\d+)"/)?.[1]
    || html.match(/<meta[^>]+property=["']price:amount["'][^>]+content=["'](\d+)["']/i)?.[1]
    || html.match(/<meta[^>]+content=["'](\d+)["'][^>]+property=["']price:amount["']/i)?.[1]
    || null;
}

async function fetchPrice(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html', 'Accept-Language': 'zh-TW,zh;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();
    return extractPrice(html);
  } catch { return null; }
}

const targets = [
  { name: '九局下半',       row: 28,  url: 'http://bghut.com/goods-7003-%E4%B9%9D%E5%B1%80%E4%B8%8B%E5%8D%8A+(Bottom+of+the+9th).html' },
  { name: '花舍物語',       row: 22,  url: 'https://bghut.com/goods-6284.html' },
  { name: '倫敦商會',       row: 44,  url: 'https://bghut.com/goods-5519-Guilds+of+London+(%E5%80%AB%E6%95%A6%E5%85%AC%E6%9C%83).html' },
  { name: '埃馬拉之冠',     row: 58,  url: 'https://bghut.com/goods-7427-Crown+of+Emara+(%E5%9F%83%E9%A6%AC%E6%8B%89%E7%8E%8B%E5%86%A0).html' },
  // 也試試其他格式
  { name: '貓與花毯',       row: 10,  url: 'https://bghut.com/goods-8573-Calico.html' },  // 英文版，試試
  { name: '瘋王城堡(繁)',   row: 15,  url: 'https://bghut.com/goods-4958-%E7%98%8B%E7%8E%8B%E5%9F%8E%E5%A0%A1Castles+of+Mad+King+Ludwig+%E7%B9%81%E9%AB%94%E4%B8%AD%E6%96%87%E7%89%88.html' },
];

const results = [];
for (const t of targets) {
  const price = await fetchPrice(t.url);
  const status = price ? `✓ ${price}元` : '× 無法取得';
  console.log(`[${t.row}] ${t.name}: ${status}`);
  results.push({ ...t, price });
  await sleep(400);
}

// 合併第一批結果
const prev = JSON.parse(fs.readFileSync('batch_price_results.json', 'utf8'));
const all = [...prev, ...results];
fs.writeFileSync('batch_price_results.json', JSON.stringify(all, null, 2));
console.log('\n結果合併到 batch_price_results.json，共 ' + all.length + ' 筆');
