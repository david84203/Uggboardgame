const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/html', 'Accept-Language': 'zh-TW,zh;q=0.9',
};

// 龐奇 Shopline products API
console.log('=== 龐奇 API 嘗試 ===');
const punchApis = [
  'https://www.punchboardgame.com/products.json?limit=5',
  'https://www.punchboardgame.com/collections/all/products.json?limit=5',
  'https://www.punchboardgame.com/api/v1/products?limit=5',
];
for (const api of punchApis) {
  try {
    const r = await fetch(api, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
    const t = await r.text();
    console.log(`[${r.status}] ${api.split('/').slice(-1)}: ${t.substring(0,200)}`);
  } catch(e) { console.log(`ERR ${api.split('/').slice(-1)}: ${e.message.substring(0,50)}`); }
}

// 龐奇 搜尋特定遊戲
console.log('\n=== 龐奇 搜尋香港大停電 ===');
const pSearch = await fetch(
  'https://www.punchboardgame.com/search?q=' + encodeURIComponent('blackout hong kong'),
  { headers: HEADERS, signal: AbortSignal.timeout(10000) }
).then(r => r.text());
// 找 JSON-LD
const ldMatch = pSearch.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g);
ldMatch?.forEach(s => { if (s.includes('price')) console.log('LD+JSON:', s.substring(0,300)); });
// 找價格 pattern
const pricePatterns = [...pSearch.matchAll(/(?:NT\$|"price"[^,]{0,30})/g)].slice(0,5).map(m=>m[0]);
console.log('價格 pattern：', pricePatterns);
// 找商品 handle
const handles = [...pSearch.matchAll(/\/products\/([a-z0-9-]+)/g)].map(m=>m[1])
  .filter((v,i,a)=>a.indexOf(v)===i).slice(0,5);
console.log('商品 handle：', handles);

// 如果找到 handle，試抓商品 JSON
if (handles.length > 0) {
  const prodJson = await fetch(
    `https://www.punchboardgame.com/products/${handles[0]}.json`,
    { headers: HEADERS, signal: AbortSignal.timeout(8000) }
  ).then(r => r.json()).catch(() => null);
  if (prodJson) {
    const v = prodJson.product?.variants?.[0];
    console.log('商品 JSON 定價：', v?.compare_at_price || v?.price, '商品名：', prodJson.product?.title);
  }
}

// 桌遊侍 Rakuten API
console.log('\n=== 桌遊侍 Rakuten ===');
const rkSearch = await fetch(
  'https://www.rakuten.com.tw/shop/boardgamesamurai/?l-id=search_boardgamesamurai&q=' + encodeURIComponent('卡坦島'),
  { headers: HEADERS, signal: AbortSignal.timeout(10000) }
).then(r => r.text()).catch(() => '');
const rkPrices = [...rkSearch.matchAll(/(?:"price"\s*:\s*"?(\d+)"?|NT\$\s*[\d,]+|定價\s*[\d,]+)/g)].slice(0,5).map(m=>m[0]);
console.log('桌遊侍 價格：', rkPrices);
