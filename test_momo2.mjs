const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html', 'Accept-Language': 'zh-TW,zh;q=0.9',
};

// momo TP 格式商品頁
const tpUrl = 'https://www.momoshop.com.tw/TP/TP0002451/goodsDetail/TP00024510009497';
const html = await fetch(tpUrl, { headers: HEADERS, signal: AbortSignal.timeout(10000) }).then(r => r.text());

// 找定價
const price = html.match(/"marketPrice"\s*:\s*(\d+)/)?.[1]
  || html.match(/"price"\s*:\s*(\d+)/)?.[1]
  || html.match(/定價[^<]{0,30}/)?.[0]
  || html.match(/NT\$\s*[\d,]+/)?.[0];
console.log('TP商品頁定價：', price);
console.log('前2000字片段：', html.substring(0, 2000).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').substring(0,500));

// 也試 momo API
console.log('\n=== momo 商品 API ===');
const apis = [
  `https://www.momoshop.com.tw/TP/TP0002451/goodsDetail/TP00024510009497?_format=json`,
  `https://api.momoshop.com.tw/goods/TP00024510009497`,
];
for (const api of apis) {
  try {
    const r = await fetch(api, { headers: { ...HEADERS, Accept: 'application/json' }, signal: AbortSignal.timeout(5000) });
    const t = await r.text();
    console.log(`[${r.status}] ${api.split('?')[0].split('/').slice(-1)}: ${t.substring(0,200)}`);
  } catch(e) { console.log('ERR:', e.message.substring(0,50)); }
}

// PChome 的 originPrice 確認是市場定價嗎？
console.log('\n=== PChome 卡坦島 各版本 ===');
const pcData = await fetch(
  'https://ecshweb.pchome.com.tw/search/v3.3/all/results?q=' + encodeURIComponent('卡坦島 桌遊新天鵝堡') + '&page=1&sort=rnk/dc',
  { headers: HEADERS, signal: AbortSignal.timeout(10000) }
).then(r => r.json());
pcData.prods?.slice(0,5).forEach(p => {
  console.log(`${p.name}: price=${p.price}, originPrice=${p.originPrice}`);
});
