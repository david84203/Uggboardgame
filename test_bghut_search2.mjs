const html = await fetch('https://bghut.com/search.php?keywords=' + encodeURIComponent('瘋王城堡'), {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept-Language': 'zh-TW' },
  signal: AbortSignal.timeout(10000)
}).then(r => r.text());

const links = [...html.matchAll(/href="(goods-\d+[^"#?]+\.html)"/g)].map(m => m[1]).slice(0, 5);
console.log('搜尋結果：', links);
