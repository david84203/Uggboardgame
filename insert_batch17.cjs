const fs = require('fs');
const path = require('path');

const target = path.resolve(__dirname, 'apply_trim.mjs');
let content = fs.readFileSync(target, 'utf8');

const batchRaw = [
  ["330533", "苗栗客家元宵炸龍習俗搬上桌面——手持鞭炮朝舞龍隊伍投擲，火光煙硝中祈求整年平安。同時出牌搶尾刀：主動堆火力壓制某條龍身鎖定目標，還是先出小牌觀察局勢等累積值逼近門檻再以高炮收尾截胡？正向版搶分對抗，台灣在地節慶的獨特魅力。"],
  ["285775", "羅馬恐龍風格的蜥蜴族與星艦聯盟降臨熔爐秘境，徹底打破世界秩序。每回合三選一勢力，同時處理壓制場面、收割琥珀與保留強牌三條壓力線。卡牌連鎖一旦串連瞬間逆轉——每副牌組出廠唯一無法複製，只能深度探索手中這副牌的隱藏協同，隨機性本身就是冒險。"],
  ["316080", "全新勢力異淵主打橫置控制——凍結敵方生物讓對手難以攻勢，深海般的壓制節奏令人窒息。潮位牌系統讓每張卡在高潮時強化、低潮時打折：咬牙撐過去還是犧牲鎖鏈換回優勢？不只要想當下這回合，還要預判兩三步後潮位對雙方的影響，每副牌組都是一道等待破解的專屬謎題。"],
];

const existingIds = new Set();
const idPattern = /"(\d+)":/g;
let m;
while ((m = idPattern.exec(content)) !== null) {
  existingIds.add(m[1]);
}

const seen = new Set();
const batch = [];
for (const [id, desc] of batchRaw) {
  if (!id) { console.log('Skipping empty ID'); continue; }
  if (existingIds.has(id)) { console.log('Skipping already-existing:', id); continue; }
  if (seen.has(id)) { console.log('Skipping batch duplicate:', id); continue; }
  seen.add(id);
  batch.push([id, desc]);
}

console.log('Entries to insert:', batch.length);
if (batch.length === 0) { console.log('Nothing to insert, exiting.'); process.exit(0); }

const match = content.match(/\n(\t*)\};/);
if (!match) { console.log('Could not find closing };'); process.exit(1); }
const idx = match.index;
const tab = match[1];
console.log('Closing }; found at index:', idx, 'tab:', JSON.stringify(tab));

let insertText = '\n\t  // === Batch 17: final entries (3 entries, origLen 712-964) ===';
for (const [bggId, desc] of batch) {
  insertText += '\n\t  "' + bggId + '": "' + desc + '",';
}

content = content.slice(0, idx) + insertText + '\n' + tab + '};';
fs.writeFileSync(target, content, 'utf8');
console.log('Done! Wrote to:', target);
console.log('New size:', content.length, 'bytes');
