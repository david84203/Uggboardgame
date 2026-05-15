const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Referer': 'https://bghut.com/',
};

const tests = [
  'https://bghut.com/ajax/goods_price.php?goods_id=7781',
  'https://bghut.com/goods/7781/price',
  'https://bghut.com/api/goods/7781',
  'https://bghut.com/goods_api.php?goods_id=7781',
  'https://bghut.com/flow.php?step=ajax_get_goods_price&goods_id=7781',
];

for (const url of tests) {
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(6000) });
    const body = await res.text();
    console.log(res.status + ' | ' + url.replace('https://bghut.com',''));
    if (res.status === 200 && body.trim()) console.log('  → ' + body.substring(0, 100));
  } catch (e) {
    console.log('ERR | ' + url.replace('https://bghut.com',''));
  }
}
