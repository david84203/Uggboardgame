// 測試各種 BGhut 搜尋 URL 格式
const keyword = '香港大停電';
const encoded = encodeURIComponent(keyword);

const urls = [
  `https://bghut.com/search/${encoded}/`,
  `https://bghut.com/search.php?keyword=${encoded}`,
  `https://bghut.com/goods/search?keyword=${encoded}`,
  `https://bghut.com/category-1-b0-min0-max0-attr0-1-goods_id-DESC-${encoded}.html`,
  `https://bghut.com/search?q=${encoded}`,
];

for (const url of urls) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    });
    const links = res.status === 200
      ? [...(await res.text()).matchAll(/href="(goods-\d+[^"#?]+\.html)"/g)].slice(0, 2).map(m => m[1])
      : [];
    console.log(res.status + ' | ' + url.replace('https://bghut.com', '') + (links.length ? ' → ' + links[0] : ''));
  } catch (e) {
    console.log('ERR | ' + url.replace('https://bghut.com', '') + ' | ' + e.message);
  }
}
