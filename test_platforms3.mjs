const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/html',
  'Accept-Language': 'zh-TW,zh;q=0.9',
};

// === PChome 完整價格欄位 ===
console.log('=== PChome 第一筆商品完整結構 ===');
const pcData = await fetch(
  'https://ecshweb.pchome.com.tw/search/v3.3/all/results?q=' + encodeURIComponent('卡坦島 桌遊') + '&page=1&sort=rnk/dc',
  { headers: HEADERS, signal: AbortSignal.timeout(10000) }
).then(r => r.json());
if (pcData.prods?.length > 0) {
  const p = pcData.prods[0];
  console.log('第一筆:', JSON.stringify(p, null, 2));
}

// === momo ===
console.log('\n=== momo 搜尋 API ===');
// momo 可能有 JSON API
const momoUrls = [
  'https://www.momoshop.com.tw/search/searchShop.jsp?keyword=' + encodeURIComponent('卡坦島') + '&_isFuzzy=0&searchType=1&cateLevel=-1&ent=k',
  'https://m.momoshop.com.tw/search.momo?searchKeyword=' + encodeURIComponent('卡坦島') + '&searchType=1',
  'https://api.momoshop.com.tw/goods/listGoodsByKeyword?keyword=' + encodeURIComponent('卡坦島'),
];
for (const url of momoUrls) {
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000), redirect: 'follow' });
    const text = await res.text();
    const priceHits = [...text.matchAll(/(?:定價|售價|原價|市場).*?[\d,]{3,6}/g)].slice(0,3).map(m=>m[0].substring(0,60));
    console.log(`[${res.status}] ${url.split('.momo')[0].split('/').slice(-1)}: ${priceHits.length > 0 ? priceHits.join(' | ') : text.substring(0,100)}`);
  } catch(e) {
    console.log(`ERR: ${e.message.substring(0,50)}`);
  }
}

// === 博客來 透過 WebFetch 格式 ===
console.log('\n=== 桌遊侍 Rakuten 商品頁 ===');
// 試直接商品頁
const rkProd = await fetch('https://www.rakuten.com.tw/shop/boardgamesamurai/product/CATANCP/', {
  headers: HEADERS, signal: AbortSignal.timeout(10000)
}).then(r => r.text()).catch(() => '');
const rkPrice = rkProd.match(/"price"\s*:\s*"?([\d.]+)"?/)?.[1]
  || rkProd.match(/NT\$\s*[\d,]+/)?.[0]
  || rkProd.match(/定價.*?[\d,]+/)?.[0];
console.log('桌遊侍 卡坦島 定價:', rkPrice || '未找到');

// === PCHOME 透過商品 API ===
console.log('\n=== PChome 商品 API ===');
// PChome 商品 API: 取第一筆結果的商品 ID，再用產品 API
if (pcData.prods?.length > 0) {
  const pid = pcData.prods[0].Id;
  console.log('商品 ID:', pid);
  const prodData = await fetch(
    `https://ecapi.pchome.com.tw/cdn/ecshop/prodapi/v2/prod/${pid}&fields=Seq,Id,Price,Discount,Title,Pic,isBig&1748310000`,
    { headers: HEADERS, signal: AbortSignal.timeout(10000) }
  ).then(r => r.json()).catch(() => null);
  console.log('商品價格:', prodData ? JSON.stringify(prodData).substring(0,300) : '失敗');
}
