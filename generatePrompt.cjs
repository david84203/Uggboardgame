const fs = require('fs');
const Papa = require('papaparse');

const script = fs.readFileSync('UpdateSheet.gs','utf8');
const rulesMatch = script.match(/const rules = \[([\s\S]*?)\];/);
const dictMatch = script.match(/const dict = {([\s\S]*?)};\n\n  function/);
let rules = [], dict = {};
if(rulesMatch) eval('rules = ['+rulesMatch[1]+']');
if(dictMatch) eval('dict = {'+dictMatch[1]+'}');

const csv = fs.readFileSync('games.csv','utf8').replace(/^\uFEFF/,'');
const lines = csv.split(/\r?\n/);
const hIdx = lines.findIndex(l => l.includes('中文名稱'));
const data = Papa.parse(lines.slice(hIdx).join('\n'),{header:true}).data;

let missing = [];
data.forEach(r => {
  let name = r['中文名稱'];
  let cat = r['分類'];
  if (name && !cat) {
    let match = false;
    if(dict[name]) match = true;
    else {
      for(let rule of rules){
        if(name.includes(rule.match)){ match = true; break; }
      }
    }
    if(!match) missing.push(name.trim());
  }
});

const validTags = ['體感','密室逃脫','記憶', '心機', '吹牛', '單人', '拼圖', '棋類', '牌類', '邏輯推理', '骰寫', '卡牌', '台灣國產', '重策', '工人擺放', '平衡', '輕策', '幾何', '板塊拼放', '卡牌combo', '中策', '競標', '牌庫構築', '手牌管理', '合約', '抽象', '偵探', '合作', '4X', '地圖擴張', '反應', '資源轉換', '競速', '運氣', '純卡牌', '區域控制', '卡牌對戰', '算數', '猜心','骰子工擺','引擎構築', '卡牌Combo', '大富翁', '英語學習', '星', '畫畫', '輪抽', '成套蒐集', '金融', '吃墩', '爬階', '1對多', '成套收集', '對戰', '聯想', '說故事', '知識', '表演', '18禁'];

const prompt = `請幫我為以下的桌遊清單建立一個 Javascript 的 Dictionary 物件。

【任務目標】
我有一長串的桌遊名稱，請你運用你的桌遊知識，判斷它們的「分類(c)」與最多三個「標籤(t1, t2, t3)」，並輸出成 JavaScript 的物件格式。

【嚴格規則】
1. 分類 (c) 只能從以下清單中選擇其一：雙人, 小品, 派對, 陣營, 策略, 抽象, 紙筆, 兒童, RPG, 解謎。
2. 標籤 (t1, t2, t3) 只能從以下合法清單中挑選，不能自己發明新標籤：
   ${validTags.join(', ')}
3. 只要分類是「策略」，那麼 t1 就必須嚴格是「輕策」、「中策」或「重策」三者之一。
4. 每個桌遊最多 3 個標籤，不需要填滿，沒有的標籤請給空字串 ""。
5. 請直接輸出 const extraDict = { 開頭的 JavaScript 物件程式碼，不要廢話。

【輸出範例】
const extraDict = {
  "姬路城": { c: "策略", t1: "中策", t2: "工人擺放", t3: "" },
  "截碼戰": { c: "陣營", t1: "猜心", t2: "聯想", t3: "" },
  "犯人在跳舞": { c: "陣營", t1: "手牌管理", t2: "心機", t3: "純卡牌" }
};

【桌遊清單】(共 ${missing.length} 款)
${missing.join('\n')}
`;

fs.writeFileSync('prompt_for_gemini.txt', prompt, 'utf8');
console.log('Done');
