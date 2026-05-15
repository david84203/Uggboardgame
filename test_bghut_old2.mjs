const url = 'https://bghut.com/goods-7781-%E9%A6%99%E6%B8%AF%E5%A4%A7%E5%81%9C%E9%9B%BB+%28Blackout%3A+Hong+Kong%29.html';
const html = await fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html',
    'Accept-Language': 'zh-TW,zh;q=0.9',
  },
  signal: AbortSignal.timeout(10000),
}).then(r => r.text());

// 找各種可能的價格呈現方式
const patterns = [
  /NT\$\s*[\d,]+/g,
  /price[^<]{0,100}/gi,
  /定價[^<]{0,50}/g,
  /\d{3,5}\s*元/g,
];
for (const p of patterns) {
  const hits = [...html.matchAll(p)].map(m => m[0].trim()).slice(0, 3);
  if (hits.length) console.log(p + ' → ' + hits.join(' | '));
}

// 看中間段落
console.log('\n--- HTML 片段 (5000-7000) ---');
console.log(html.substring(5000, 7000));
