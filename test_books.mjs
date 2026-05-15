const html = await fetch('https://www.books.com.tw/products/N000192575', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html',
    'Accept-Language': 'zh-TW,zh;q=0.9',
  },
  signal: AbortSignal.timeout(10000),
}).then(r => r.text());

const title = html.match(/<title>(.*?)<\/title>/)?.[1];
console.log('標題：' + title);

// 找定價相關
const snippets = [...html.matchAll(/(定價|price)[^<]{0,100}/gi)].slice(0, 8);
snippets.forEach(m => console.log('  > ' + m[0].substring(0, 100)));
