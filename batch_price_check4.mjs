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
  { name: '極東之旅',                    url: 'https://bghut.com/goods-9552-%E6%A5%B5%E6%9D%B1%E4%B9%8B%E6%97%85+(Stroganov).html' },
  { name: '拉格蘭莊園',                  url: 'https://bghut.com/goods-6518-%E6%8B%89%E6%A0%BC%E8%98%AD%E5%93%88%E8%8E%8A%E5%9C%92+(La+Granja).html' },
  { name: '殖民火星：阿瑞斯探險隊－純卡牌版', url: 'https://bghut.com/goods-9151-%E9%87%8D%E5%A1%91%E7%81%AB%E6%98%9F%EF%BC%9A%E9%98%BF%E7%91%9E%E6%96%AF%E6%8E%A2%E9%9A%AA%E9%9A%8A%EF%BC%8D%E5%8D%A1%E7%89%8C%E7%89%88+(Terraforming+Mars:+Ares+Expedition).html' },
  { name: '殖民火星：序幕擴充',           url: 'https://bghut.com/goods-6933-Terraforming+Mars:+Prelude.html' },
  { name: '漫威英雄套牌構築遊戲',         url: 'https://bghut.com/goods-3364-Legendary+Marvel+DBG+%E6%BC%AB%E5%A8%81%E8%8B%B1%E9%9B%84%E5%A5%97%E7%89%8C%E6%A7%8B%E7%AF%89%E9%81%8A%E6%88%B2.html' },
  { name: '巨龍峽谷',                    url: 'https://bghut.com/goods-5719-%E5%B7%A8%E9%BE%8D%E5%B3%BD%E8%B0%B7+Dragon+Canyon.html' },
];

for (const t of targets) {
  const price = await fetchPrice(t.url);
  console.log(t.name + ': ' + (price ? price + '元 ✓' : '× 無法取得'));
  t.price = price;
  await sleep(400);
}

const prev = JSON.parse(fs.readFileSync('batch_price_results.json', 'utf8'));
const all = [...prev, ...targets];
fs.writeFileSync('batch_price_results.json', JSON.stringify(all, null, 2));
console.log('共 ' + all.length + ' 筆');
