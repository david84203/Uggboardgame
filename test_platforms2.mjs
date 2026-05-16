const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/json',
  'Accept-Language': 'zh-TW,zh;q=0.9',
};

// === 龐奇 ===
console.log('=== 龐奇 (punchboardgame.com) ===');
const pHtml = await fetch('https://www.punchboardgame.com/products/blackout-hong-kong', {
  headers: HEADERS, signal: AbortSignal.timeout(10000)
}).then(r => r.text());

// 找 JSON-LD 或 meta 定價
const pLd = pHtml.match(/"price"\s*:\s*"?([\d.]+)"?/g)?.slice(0,5);
const pCompare = pHtml.match(/"compare_at_price"\s*:\s*"?([\d.]+)"?/g)?.slice(0,3);
const pMeta = pHtml.match(/<meta[^>]+property="og:price:amount"[^>]+content="([\d.]+)"/)?.[1];
console.log('JSON-LD price:', pLd);
console.log('compare_at_price:', pCompare);
console.log('og:price:amount:', pMeta);

// 搜尋功能測試
console.log('\n龐奇搜尋「殖民火星」:');
const pSearch = await fetch('https://www.punchboardgame.com/search?q=' + encodeURIComponent('殖民火星'), {
  headers: HEADERS, signal: AbortSignal.timeout(10000)
}).then(r => r.text());
// 找商品 slug
const pSlugs = [...pSearch.matchAll(/href="\/products\/([^"?]+)"/g)].map(m=>m[1]).slice(0,5);
console.log('商品slug:', pSlugs);

// === PChome API ===
console.log('\n=== PChome ===');
const pcRes = await fetch(
  'https://ecshweb.pchome.com.tw/search/v3.3/all/results?q=' + encodeURIComponent('卡坦島 桌遊') + '&page=1&sort=rnk/dc',
  { headers: { ...HEADERS, Accept: 'application/json' }, signal: AbortSignal.timeout(10000) }
).then(r => r.text());
// 看前500字
console.log('PChome API 回應前500字:', pcRes.substring(0, 500));

// === 博客來 JSON ===
console.log('\n=== 博客來 API ===');
const bkRes = await fetch(
  'https://search.books.com.tw/search/query/key/' + encodeURIComponent('卡坦島 桌遊') + '/cat/1/?output=json',
  { headers: HEADERS, signal: AbortSignal.timeout(10000) }
).then(r => r.text());
console.log('博客來 JSON 前300字:', bkRes.substring(0, 300));
