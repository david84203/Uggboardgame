// 測試 momo 的定價結構
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html',
  'Accept-Language': 'zh-TW,zh;q=0.9',
};

const html = await fetch(
  'https://www.momoshop.com.tw/search/searchShop.jsp?keyword=' + encodeURIComponent('卡坦島 桌遊') + '&searchType=1&cateLevel=-1&ent=k',
  { headers: HEADERS, signal: AbortSignal.timeout(10000) }
).then(r => r.text());

// 找 JSON 嵌入資料
const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});?\s*<\/script>/s)
  || html.match(/var\s+searchResultModel\s*=\s*({.+?});\s*\n/s);

if (jsonMatch) {
  console.log('找到 JSON，前500字：', jsonMatch[1].substring(0,500));
} else {
  // 找 goodsCode 和價格
  const codes = [...html.matchAll(/"goodsCode":"([^"]+)"/g)].slice(0,3).map(m=>m[1]);
  const prices = [...html.matchAll(/"goodsPrice"[^}]{0,200}/g)].slice(0,3).map(m=>m[0].substring(0,100));
  const mktPrice = [...html.matchAll(/"marketPrice"[^}]{0,200}/g)].slice(0,3).map(m=>m[0].substring(0,100));
  console.log('商品代碼：', codes);
  console.log('售價：', prices);
  console.log('市場定價：', mktPrice);

  // 試找 TP 商品頁面
  const tpLinks = [...html.matchAll(/\/TP\/TP\d+\/goodsDetail\/([^"?]+)/g)].slice(0,3).map(m=>m[1]);
  console.log('商品連結：', tpLinks);
}

// 試直接抓一個商品頁
console.log('\n=== momo 商品頁 ===');
const prodHtml = await fetch('https://www.momoshop.com.tw/goods/GoodsDetail.jsp?i_code=4998014', {
  headers: HEADERS, signal: AbortSignal.timeout(10000)
}).then(r => r.text());
const mktP = prodHtml.match(/"marketPrice"\s*:\s*(\d+)/)?.[1]
  || prodHtml.match(/市場價.*?(\d{3,5})/)?.[1]
  || prodHtml.match(/定價.*?(\d{3,5})/)?.[1];
const saleP = prodHtml.match(/"goodsPrice"\s*:\s*(\d+)/)?.[1];
console.log('市場定價 (marketPrice)：', mktP);
console.log('售價 (goodsPrice)：', saleP);
