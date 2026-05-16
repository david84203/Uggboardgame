// 測試各平台能不能直接抓到價格 HTML
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'zh-TW,zh;q=0.9',
};

const keyword = encodeURIComponent('卡坦島');
const keyword2 = encodeURIComponent('卡坦島 桌遊');

const tests = [
  ['龐奇', `https://www.punchboardgame.com/search?q=${keyword}`],
  ['龐奇商品頁', 'https://www.punchboardgame.com/products/blackout-hong-kong'],
  ['陽光桌遊', `https://www.sunny22ya.com/search?q=${keyword}`],
  ['陽光(另一網域)', `https://sunny22ya.ec2store.com/search?q=${keyword}`],
  ['桌遊侍Rakuten', `https://www.rakuten.com.tw/shop/boardgamesamurai/search/?q=${keyword}`],
  ['樂天搜尋', `https://search.rakuten.com.tw/search/1099660/${keyword2}/`],
  ['PChome搜尋', `https://ecshweb.pchome.com.tw/search/v3.3/?q=${keyword2}&scope=all`],
  ['PChome API', `https://ecshweb.pchome.com.tw/search/v3.3/all/results?q=${keyword2}&page=1&sort=rnk/dc`],
];

for (const [name, url] of tests) {
  try {
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000), redirect: 'follow' });
    const html = await res.text();
    // 找價格特徵
    const priceHits = [...html.matchAll(/(?:NT\$|定價|售價|原價)\s*[\d,]+/g)].slice(0,3).map(m=>m[0]);
    const hasPrice = priceHits.length > 0;
    // 找商品連結
    const prodLinks = [...html.matchAll(/href="([^"]*(?:product|goods|item|shop)[^"]*)"[^>]*>/gi)].slice(0,2).map(m=>m[1]);
    console.log(`[${res.status}] ${name}: ${hasPrice ? '有價格! ' + priceHits.join(' | ') : '無價格'} ${prodLinks[0] ? '| 連結:'+prodLinks[0].substring(0,60) : ''}`);
  } catch(e) {
    console.log(`[ERR] ${name}: ${e.message}`);
  }
}
