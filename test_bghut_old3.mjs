const url = 'https://bghut.com/goods-7781-%E9%A6%99%E6%B8%AF%E5%A4%A7%E5%81%9C%E9%9B%BB+%28Blackout%3A+Hong+Kong%29.html';
const html = await fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/StringBuilder.37',
    'Accept': 'text/html',
    'Accept-Language': 'zh-TW,zh;q=0.9',
  },
  signal: AbortSignal.timeout(10000),
}).then(r => r.text());

// 找所有 元 前後的 context
const hits = [...html.matchAll(/\d{3,5}\s*元/g)];
for (const m of hits) {
  const start = Math.max(0, m.index - 150);
  const end = Math.min(html.length, m.index + 50);
  console.log('--- 命中: ' + m[0] + ' ---');
  console.log(html.substring(start, end).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  console.log();
}

// 也試 BGhut 目錄搜尋
console.log('=== 測試 category 搜尋 ===');
const cat = await fetch('https://bghut.com/category-1-b0-min0-max0-attr0-1-goods_id-DESC.html', {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  signal: AbortSignal.timeout(10000),
}).then(r => { console.log('狀態：' + r.status); return r.text(); });
const recentLinks = [...cat.matchAll(/href="(goods-(\d+)-[^"#?]+\.html)"/g)].slice(0, 3);
recentLinks.forEach(m => console.log('連結：' + m[1] + ' (ID:' + m[2] + ')'));
