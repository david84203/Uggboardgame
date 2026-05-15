// 找老頁面的主商品價格 HTML 結構
const url = 'https://bghut.com/goods-7781-%E9%A6%99%E6%B8%AF%E5%A4%A7%E5%81%9C%E9%9B%BB+%28Blackout%3A+Hong+Kong%29.html';
const html = await fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html', 'Accept-Language': 'zh-TW,zh;q=0.9',
  },
  signal: AbortSignal.timeout(10000),
}).then(r => r.text());

// 找 PRICE_1 或 span id=PRICE 或 class=price
const pricePatterns = [
  /PRICE_1[^>]*>([^<]+)/,
  /id=["']PRICE[^"']*["'][^>]*>([^<]+)/,
  /class=["'][^"']*price[^"']*["'][^>]*>([^<]+)/i,
  /"price"\s*:\s*(\d+)/,
  /市售價.*?(\d{3,5})/,
  /本店售價.*?(\d{3,5})/,
  /標價.*?(\d{3,5})/,
  /零售定價.*?(\d{3,5})/,
];

for (const p of pricePatterns) {
  const m = html.match(p);
  if (m) console.log(p + '\n  → ' + m[1]?.trim() + '\n');
}

// 找 "id=" 和 price 相關的 span/div
const spans = [...html.matchAll(/<(?:span|div|p)[^>]+(?:id|class)=["'][^"']*(?:price|Price|PRICE)[^"']*["'][^>]*>([^<]*)/gi)];
spans.slice(0, 10).forEach(m => {
  if (m[1].trim()) console.log('  tag: ' + m[0].substring(0, 60) + ' | content: ' + m[1].trim());
});
