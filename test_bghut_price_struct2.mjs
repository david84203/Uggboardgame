const url = 'https://bghut.com/goods-7781-%E9%A6%99%E6%B8%AF%E5%A4%A7%E5%81%9C%E9%9B%BB+%28Blackout%3A+Hong+Kong%29.html';
const html = await fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html', 'Accept-Language': 'zh-TW,zh;q=0.9',
  },
  signal: AbortSignal.timeout(10000),
}).then(r => r.text());

// 找 PRICE_1 附近的 HTML
const idx = html.indexOf('PRICE_1');
if (idx >= 0) {
  console.log('PRICE_1 found at index:', idx);
  console.log(html.substring(idx - 100, idx + 200));
} else {
  console.log('PRICE_1 not found');
}

// 找 data-goods-url 或 price= 屬性 (新版有 price="750 元")
const dataPrice = html.match(/data-price=["']([^"']+)["']/);
const attrPrice = [...html.matchAll(/\bprice=["']([^"']+)["']/g)].slice(0, 3);
console.log('data-price:', dataPrice?.[1]);
attrPrice.forEach(m => console.log('price attr:', m[1]));

// 看 script 裡有沒有 price
const scriptPrices = [...html.matchAll(/(?:price|shop_price|market_price)\s*[:=]\s*["']?(\d+)["']?/gi)].slice(0, 5);
scriptPrices.forEach(m => console.log('script price:', m[0]));
