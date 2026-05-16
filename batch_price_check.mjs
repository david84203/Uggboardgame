// 批次抓 BGhut 頁面定價，結果存到 batch_price_results.json
import fs from 'fs';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function extractPrice(html) {
  return html.match(/"price"\s*:\s*"(\d+)"/)?.[1]
    || html.match(/<meta[^>]+property=["']price:amount["'][^>]+content=["'](\d+)["']/i)?.[1]
    || html.match(/<meta[^>]+content=["'](\d+)["'][^>]+property=["']price:amount["']/i)?.[1]
    || null;
}

async function fetchPrice(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html', 'Accept-Language': 'zh-TW,zh;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();
    return extractPrice(html);
  } catch (e) {
    return null;
  }
}

// 從 WebSearch 收集的 BGhut URLs（只取中文版 zhName 含中文的頁面）
const targets = [
  { name: '骰寫特魯瓦',   row: 22,  url: 'https://bghut.com/goods-8584-%E9%AA%B0%E5%AF%AB%E7%89%B9%E9%AD%AF%E7%93%A6+(Troyes+Dice).html' },
  { name: '阿勒農場',     row: 25,  url: 'https://bghut.com/goods-7719-%E9%98%BF%E5%8B%92%E8%BE%B2%E5%A0%B4+%E5%A4%A7%E7%9B%92%E7%89%88+(Fields+of+Arle)++%E4%BA%9E%E5%8B%92%E5%A4%A7%E5%9C%B0.html' },
  { name: '暖秋物語',     row: 23,  url: 'https://bghut.com/goods-6699-%E6%9A%96%E7%A7%8B%E7%89%A9%E8%AA%9E+(Indian+Summer).html' },
  { name: '玻璃之路',     row: 24,  url: 'https://bghut.com/goods-6814-%E7%8E%BB%E7%92%83%E4%B9%8B%E8%B7%AF+(Glass+Road).html' },
  { name: '瘋王城堡',     row: 15,  url: 'https://bghut.com/goods-4958-%E7%98%8B%E7%8E%8B%E5%9F%8E%E5%A0%A1Castles+of+Mad+King+Ludwig.html' },
  { name: '香港大停電',   row: 17,  url: 'https://bghut.com/goods-7781-%E9%A6%99%E6%B8%AF%E5%A4%A7%E5%81%9C%E9%9B%BB+%28Blackout%3A+Hong+Kong%29.html' },
  { name: '黑天使號',     row: 18,  url: 'https://bghut.com/goods-7653-%E9%BB%91%E5%A4%A9%E4%BD%BF+(Black+Angel)%E3%80%90%E7%B0%A1%E4%B8%AD%E3%80%91.html' },
  { name: '總督',         row: 14,  url: 'https://bghut.com/goods-5862-%E7%B8%BD%E7%9D%A3+Viceroy.html' },
  { name: '骰子城',       row: 11,  url: 'https://bghut.com/goods-6964-%E9%AA%B0%E5%AD%90%E5%9F%8E%E5%B8%82+(Dice+City).html' },
  { name: '城區',         row: 13,  url: 'https://bghut.com/goods-4158-Subdivision+(%E5%9F%8E%E5%8D%80).html' },
  { name: '蓋亞計畫',     row: 28,  url: 'https://bghut.com/goods-6454-%E8%93%8B%E4%BA%9E%E8%A8%88%E5%8A%83+(Gaia+Project%E8%93%8B%E4%BA%9E%E8%A8%88%E7%95%AB).html' },
  { name: '強國爭壩',     row: 26,  url: 'https://bghut.com/goods-8072-%E5%BC%B7%E5%9C%8B%E7%88%AD%E5%A3%A9+(Barrage%E6%B0%B4%E5%A3%A9).html' },
  { name: '強國爭壩：利格沃特計劃擴充', row: 27, url: 'https://bghut.com/goods-8073-%E5%BC%B7%E5%9C%8B%E7%88%AD%E5%A3%A9%EF%BC%9A%E5%88%A9%E6%A0%BC%E6%B2%83%E7%89%B9%E8%A8%88%E5%8A%83%E6%93%B4%E5%85%85+(Barrage:+The+Leeghwater+Project).html' },
  { name: '國民經濟',     row: 30,  url: 'https://bghut.com/goods-6713-%E5%9C%8B%E6%B0%91%E7%B6%93%E6%BF%9F+(National+Economy).html' },
  { name: 'XCOM: The Board Game', row: 21, url: 'https://bghut.com/goods-4695-XCOM:+The+Board+Game.html' },
];

const results = [];
for (const t of targets) {
  const price = await fetchPrice(t.url);
  const status = price ? `✓ ${price}元` : '× 無法取得';
  console.log(`[${t.row}] ${t.name}: ${status}`);
  results.push({ ...t, price });
  await sleep(400);
}

fs.writeFileSync('batch_price_results.json', JSON.stringify(results, null, 2));
console.log('\n結果存到 batch_price_results.json');
