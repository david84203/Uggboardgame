import fs from 'fs';
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function extractPrice(html) {
  return html.match(/"price"\s*:\s*"(\d+)"/)?.[1]
    || html.match(/<meta[^>]+property=["']price:amount["'][^>]+content=["'](\d+)["']/i)?.[1]
    || null;
}
async function fetchPrice(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'text/html', 'Accept-Language': 'zh-TW,zh;q=0.9' },
      signal: AbortSignal.timeout(10000),
    });
    return extractPrice(await res.text());
  } catch { return null; }
}

const targets = [
  { name: '牛頓',                url: 'https://bghut.com/goods-7422-%E7%89%9B%E9%A0%93+(Newton).html' },
  { name: '溫達克',              url: 'https://bghut.com/goods-7127-%E6%BA%AB%E9%81%94%E5%85%8B+(Wendake).html' },
  { name: '夢境之地',            url: 'https://bghut.com/goods-7813-%E5%A4%A2%E5%A2%83%E4%B9%8B%E5%9C%B0+(Dreamscape).html' },
  { name: '加勒多尼亞氏族',      url: 'https://bghut.com/goods-6677-%E5%8A%A0%E5%8B%92%E5%A4%9A%E5%B0%BC%E4%BA%9E+(Clans+of+Caledonia).html' },
  { name: '特奧蒂瓦坎：眾神之城', url: 'https://bghut.com/goods-6991-%E7%89%B9%E5%A5%A7%E8%92%82%E7%93%A6%E5%9D%8E%EF%BC%9A%E7%9C%BE%E7%A5%9E%E4%B9%8B%E5%9F%8E+(Teotihuacan:+City+of+Gods).html' },
  { name: '文藝復興大師',        url: 'https://bghut.com/goods-8565-%E6%96%87%E8%97%9D%E5%BE%A9%E8%88%88%E5%A4%A7%E5%B8%AB+(Masters+of+Renaissance).html' },
  { name: '里斯本',              url: 'https://bghut.com/goods-9455-%E9%87%8C%E6%96%AF%E6%9C%AC+(Lisboa).html' },
  { name: '陰屍路',              url: 'https://bghut.com/goods-3480-The+Walking+Dead:+The+Board+Game.html' },
];

for (const t of targets) {
  const price = await fetchPrice(t.url);
  console.log(t.name + ': ' + (price ? price + '元 ✓' : '× 無法取得'));
  t.price = price;
  await sleep(400);
}

// 存結果
const prev = JSON.parse(fs.readFileSync('batch_price_results.json', 'utf8'));
const all = [...prev, ...targets];
fs.writeFileSync('batch_price_results.json', JSON.stringify(all, null, 2));
console.log('結果已合併，共 ' + all.length + ' 筆');
