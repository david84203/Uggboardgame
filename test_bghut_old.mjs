const url = 'https://bghut.com/goods-7781-%E9%A6%99%E6%B8%AF%E5%A4%A7%E5%81%9C%E9%9B%BB+%28Blackout%3A+Hong+Kong%29.html';
const res = await fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html',
    'Accept-Language': 'zh-TW,zh;q=0.9',
  },
  signal: AbortSignal.timeout(10000),
});
console.log('狀態：' + res.status);
const html = await res.text();
const metaPrice = html.match(/<meta[^>]+property=["']price:amount["'][^>]+content=["'](\d+)["']/i)?.[1]
  || html.match(/<meta[^>]+content=["'](\d+)["'][^>]+property=["']price:amount["']/i)?.[1];
const ldPrice = html.match(/"price"\s*:\s*"(\d+)"/)?.[1];
console.log('定價(meta)：' + metaPrice);
console.log('定價(ld)：' + ldPrice);

// 測試 BGhut 搜尋
console.log('\n--- 測試搜尋 ---');
const searchRes = await fetch('https://bghut.com/search.html?keywords=%E8%B2%93%E8%88%87%E8%8A%B1%E6%AF%AF', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html',
    'Accept-Language': 'zh-TW,zh;q=0.9',
  },
  signal: AbortSignal.timeout(10000),
});
console.log('搜尋狀態：' + searchRes.status);
const searchHtml = await searchRes.text();
const goodsLinks = [...searchHtml.matchAll(/href="(goods-\d+[^"#?]+\.html)"/g)].map(m => m[1]).slice(0, 3);
console.log('搜尋結果連結：', goodsLinks);
