// 測試幾個不同年代的頁面，找主商品價格的 HTML 結構
const urls = [
  ['新 goods-13008', 'https://bghut.com/goods-13008-%E9%81%8E%E6%A9%8B%E6%8B%86%E6%A9%8B+%28Pot+Gold%29.html'],
  ['舊 goods-7781', 'https://bghut.com/goods-7781-%E9%A6%99%E6%B8%AF%E5%A4%A7%E5%81%9C%E9%9B%BB+%28Blackout%3A+Hong+Kong%29.html'],
  ['舊 goods-8584', 'https://bghut.com/goods-8584-%E9%AA%B0%E5%AF%AB%E7%89%B9%E9%AD%AF%E7%93%A6+(Troyes+Dice).html'],
];

for (const [label, url] of urls) {
  const html = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html', 'Accept-Language': 'zh-TW,zh;q=0.9',
    },
    signal: AbortSignal.timeout(10000),
  }).then(r => r.text());

  // 所有可能的價格提取方式
  const meta = html.match(/<meta[^>]+property=["']price:amount["'][^>]+content=["'](\d+)["']/i)?.[1];
  const ld = html.match(/"price"\s*:\s*"(\d+)"/)?.[1];
  const shop = html.match(/shop_price\s*=\s*(\d+)/)?.[1];
  const market = html.match(/market_price\s*=\s*(\d+)/)?.[1];
  const currPrice = html.match(/currentPrice\s*=\s*(\d+)/)?.[1];
  const dataP = html.match(/data-price=["'](\d+)/)?.[1];

  // 找包含商品名的價格行
  const namePriceContext = (() => {
    const nameIdx = html.indexOf('大停電') !== -1 ? html.indexOf('大停電') :
                    html.indexOf('Blackout') !== -1 ? html.indexOf('Blackout') :
                    html.indexOf('過橋') !== -1 ? html.indexOf('過橋') :
                    html.indexOf('特魯瓦') !== -1 ? html.indexOf('特魯瓦') : -1;
    if (nameIdx < 0) return 'name not found';
    // 往後找最近的數字
    const after = html.substring(nameIdx, nameIdx + 500);
    const num = after.match(/\d{3,5}/)?.[0];
    return num || 'no price near name';
  })();

  console.log(`\n=== ${label} ===`);
  console.log('meta price:', meta || '-');
  console.log('ld price:', ld || '-');
  console.log('shop_price:', shop || '-');
  console.log('market_price:', market || '-');
  console.log('currentPrice:', currPrice || '-');
  console.log('data-price:', dataP || '-');
  console.log('name+price context:', namePriceContext);
}
