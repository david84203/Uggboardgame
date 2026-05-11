function autoFillCategoriesAndTags() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // ==========================================
  const PREVIEW_MODE = false; 
  // ==========================================

  // 1. 自動尋找包含「中文名稱」的主要資料表
  const allSheets = ss.getSheets();
  let mainSheet = null;
  let headerRowIdx = -1;
  let headers = [];
  
  for (let s of allSheets) {
    if (s.getName() === "填寫預覽清單") continue;
    
    let tempValues = s.getRange(1, 1, Math.min(20, s.getLastRow() || 1), Math.min(20, s.getLastColumn() || 1)).getValues();
    for (let i = 0; i < tempValues.length; i++) {
      if (tempValues[i].includes("中文名稱")) {
        mainSheet = s;
        headerRowIdx = i;
        headers = tempValues[i];
        break;
      }
    }
    if (mainSheet) break;
  }
  
  if (!mainSheet) {
    SpreadsheetApp.getUi().alert("找不到包含『中文名稱』標題列的資料表！");
    return;
  }
  
  const nameCol = headers.indexOf("中文名稱");
  const catCol = headers.indexOf("分類");
  const tag1Col = headers.indexOf("標籤1");
  const tag2Col = headers.indexOf("標籤2");
  const tag3Col = headers.indexOf("標籤3"); // 支援第3個標籤

  // 如果是正式寫入模式
  if (!PREVIEW_MODE) {
    const previewSheet = ss.getSheetByName("填寫預覽清單");
    if (!previewSheet) {
      SpreadsheetApp.getUi().alert("找不到「填寫預覽清單」分頁！請先將 PREVIEW_MODE 設為 true 執行！");
      return;
    }
    
    const pData = previewSheet.getDataRange().getValues();
    let applyCount = 0;
    
    for (let i = 1; i < pData.length; i++) {
      let rowNum = parseInt(pData[i][0]);
      let cat = pData[i][2];
      let t1 = pData[i][3] || "";
      let t2 = pData[i][4] || "";
      let t3 = pData[i][5] || "";
      
      if (!isNaN(rowNum) && rowNum > 0) {
        if (catCol >= 0) mainSheet.getRange(rowNum, catCol + 1).setValue(cat);
        if (tag1Col >= 0) mainSheet.getRange(rowNum, tag1Col + 1).setValue(t1);
        if (tag2Col >= 0) mainSheet.getRange(rowNum, tag2Col + 1).setValue(t2);
        if (tag3Col >= 0) mainSheet.getRange(rowNum, tag3Col + 1).setValue(t3);
        applyCount++;
      }
    }
    
    SpreadsheetApp.getUi().alert(`✅ 寫入完成！更新了 ${applyCount} 筆資料。`);
    return;
  }

  // =========================================================
  // 產生預覽清單邏輯
  // =========================================================
  const data = mainSheet.getDataRange().getValues();
  let updatedCount = 0;
  
  // 建立已存在的有效標籤庫 (Rule 3)
  const validTags = new Set([
    "體感", "密室逃脫", "記憶", "心機", "吹牛", "單人", "拼圖", "棋類", "牌類", "邏輯推理", "骰寫", "卡牌", "台灣國產", "重策", "工人擺放", "平衡", "輕策", "幾何", "板塊拼放", "卡牌combo", "中策", "競標", "牌庫構築", "手牌管理", "合約", "抽象", "偵探", "合作", "4X", "地圖擴張", "反應", "資源轉換", "競速", "運氣", "純卡牌", "區域控制", "卡牌對戰", "算數", "猜心", "骰子工擺", "引擎構築", "卡牌Combo", "大富翁", "英語學習", "星", "畫畫", "輪抽", "成套蒐集", "金融", "吃墩", "爬階", "1對多", "成套收集", "對戰", "聯想", "說故事", "知識", "表演", "18禁"
  ]);

  // 掃描並儲存已經填寫過的遊戲 (為了 Rule 4：主遊戲和擴充一樣)
  const existingGames = {};
  for (let i = headerRowIdx + 1; i < data.length; i++) {
    const name = data[i][nameCol];
    const cat = data[i][catCol];
    if (name && cat && cat.toString().trim() !== "") {
      existingGames[String(name).trim()] = {
        c: cat,
        t1: tag1Col >= 0 ? data[i][tag1Col] : "",
        t2: tag2Col >= 0 ? data[i][tag2Col] : "",
        t3: tag3Col >= 0 ? data[i][tag3Col] : ""
      };
    }
  }

  const rules = [
    { match: "大搜查", c: "解謎", t1: "邏輯推理", t2: "合作", t3: "" },
    { match: "Oink", c: "小品", t1: "純卡牌", t2: "心機", t3: "" },
    { match: "狼人", c: "陣營", t1: "心機", t2: "吹牛", t3: "猜心" },
    { match: "阿瓦隆", c: "陣營", t1: "心機", t2: "猜心", t3: "" },
    { match: "七大奇蹟", c: "策略", t1: "卡牌", t2: "輪抽", t3: "輕策" },
    { match: "傳情畫意", c: "派對", t1: "畫畫", t2: "聯想", t3: "" },
    { match: "卡坦島", c: "策略", t1: "資源轉換", t2: "運氣", t3: "中策" },
    { match: "密室", c: "解謎", t1: "合作", t2: "邏輯推理", t3: "" },
    { match: "貓與巧克力", c: "派對", t1: "說故事", t2: "聯想", t3: "" },
    { match: "核子激盪", c: "策略", t1: "工人擺放", t2: "資源轉換", t3: "中策" },
    { match: "重裝上陣", c: "策略", t1: "對戰", t2: "卡牌", t3: "中策" },
    { match: "掘跡藍星", c: "策略", t1: "資源轉換", t2: "中策", t3: "" },
    { match: "瓦萊利亞", c: "策略", t1: "卡牌", t2: "資源轉換", t3: "輕策" },
    { match: "阿瑞斯探險隊", c: "策略", t1: "牌庫構築", t2: "卡牌", t3: "中策" },
    { match: "璀璨寶石", c: "策略", t1: "成套收集", t2: "輕策", t3: "" },
    { match: "花磚", c: "策略", t1: "抽象", t2: "板塊拼放", t3: "輕策" },
    { match: "矮人礦坑", c: "陣營", t1: "心機", t2: "合作", t3: "" },
    { match: "說書人", c: "派對", t1: "聯想", t2: "說故事", t3: "" },
    { match: "砰！", c: "陣營", t1: "卡牌", t2: "心機", t3: "" },
    { match: "大富翁", c: "家庭", t1: "大富翁", t2: "運氣", t3: "" },
    { match: "UNO", c: "小品", t1: "純卡牌", t2: "運氣", t3: "" },
    { match: "驚爆倫敦", c: "陣營", t1: "心機", t2: "猜心", t3: "" },
    { match: "世界奇觀", c: "策略", t1: "板塊拼放", t2: "輕策", t3: "" },
    { match: "大爆格", c: "派對", t1: "反應", t2: "運氣", t3: "" },
    { match: "動物農場", c: "派對", t1: "反應", t2: "記憶", t3: "" },
    { match: "超級犀牛", c: "派對", t1: "操作", t2: "運氣", t3: "" },
    { match: "誰是臥底", c: "派對", t1: "猜心", t2: "聯想", t3: "心機" },
    { match: "誰是牛頭王", c: "小品", t1: "純卡牌", t2: "吃墩", t3: "" },
  ];
  
  const dict = {
    "貓街": { c: "策略", t1: "卡牌", t2: "成套收集", t3: "輕策" },
    "曼哈頓": { c: "策略", t1: "區域控制", t2: "板塊拼放", t3: "中策" },
    "洛可可": { c: "策略", t1: "牌庫構築", t2: "區域控制", t3: "中策" },
    "卓爾金曆：瑪雅曆法－部落與預言": { c: "策略", t1: "工人擺放", t2: "重策", t3: "" },
    "柯南": { c: "策略", t1: "對戰", t2: "中策", t3: "" },
    "夢工廠": { c: "策略", t1: "競標", t2: "成套收集", t3: "中策" },
    "邪馬臺": { c: "策略", t1: "板塊拼放", t2: "中策", t3: "" },
    "駱駝大賽2020年版": { c: "派對", t1: "運氣", t2: "猜心", t3: "" },
    "犯人在跳舞": { c: "派對", t1: "手牌管理", t2: "心機", t3: "" },
    "奶酪大盜": { c: "陣營", t1: "心機", t2: "", t3: "" },
    "深谷酒館": { c: "策略", t1: "牌庫構築", t2: "中策", t3: "" },
    "雅典衛城": { c: "策略", t1: "板塊拼放", t2: "輕策", t3: "" },
    "馬可波羅遊記：威尼斯": { c: "策略", t1: "工人擺放", t2: "重策", t3: "" },
    "蓋亞計畫：失落的艦隊": { c: "策略", t1: "區域控制", t2: "重策", t3: "" }
  };

  function normalizeTags(c, t1, t2, t3) {
    // 過濾不合法標籤
    let tags = [t1, t2, t3].filter(t => t && validTags.has(t));
    
    // Rule 2: 策略遊戲必須有難度標籤，且放在第一個
    if (c === "策略") {
      let weightTag = tags.find(t => t === "輕策" || t === "中策" || t === "重策");
      if (!weightTag) weightTag = "輕策"; // 預設給輕策
      
      tags = tags.filter(t => t !== weightTag); // 移除原本的難度標籤
      tags.unshift(weightTag); // 塞到最前面當標籤 1
    }
    
    return {
      t1: tags[0] || "",
      t2: tags[1] || "",
      t3: tags[2] || ""
    };
  }

  function getGameInfo(name) {
    name = String(name).trim();
    let info = null;
    
    // 優先檢查 Rule 4：主遊戲與擴充相同
    // 利用常見的分隔符尋找主遊戲名稱
    let separators = ["-", "：", ":", " ", "—", "－"];
    for (let sep of separators) {
      if (name.includes(sep)) {
        let prefix = name.split(sep)[0].trim();
        if (existingGames[prefix]) {
          info = existingGames[prefix];
          break;
        }
      }
    }
    
    // 暴力尋找有沒有任何已填寫遊戲是目前遊戲的前綴
    if (!info) {
      let longestMatch = "";
      for (let eg in existingGames) {
        if (eg.length >= 2 && name.startsWith(eg)) {
          if (eg.length > longestMatch.length) longestMatch = eg;
        }
      }
      if (longestMatch) info = existingGames[longestMatch];
    }

    // 如果沒有主遊戲繼承，才使用字典與規則
    if (!info) {
      if (dict[name]) {
        info = dict[name];
      } else {
        for (let r of rules) {
          if (name.includes(r.match)) {
            info = { c: r.c, t1: r.t1, t2: r.t2, t3: r.t3 };
            break;
          }
        }
      }
    }
    
    if (info) {
      // ⚠️ 不管資料來自哪裡（繼承主遊戲、規則、字典），最後一定要套用嚴格的標籤過濾！
      let norm = normalizeTags(info.c, info.t1, info.t2, info.t3);
      return { c: info.c, t1: norm.t1, t2: norm.t2, t3: norm.t3 };
    }
    
    // 如果字典跟規則都找不到，就回傳一個空白殼，讓它能顯示在預覽表裡等您手動填
    return { c: "", t1: "", t2: "", t3: "" };
  }

  let previewData = [["原本的行號", "遊戲名稱", "預計填入: 分類", "預計填入: 標籤1", "預計填入: 標籤2", "預計填入: 標籤3"]];

  for (let i = headerRowIdx + 1; i < data.length; i++) {
    const row = data[i];
    const name = row[nameCol];
    const cat = row[catCol];
    
    if (name && (!cat || cat.toString().trim() === "")) {
      const info = getGameInfo(name);
      if (info) {
        previewData.push([i + 1, name, info.c, info.t1 || "", info.t2 || "", info.t3 || ""]);
        updatedCount++;
      }
    }
  }
  
  if (updatedCount === 0) {
    SpreadsheetApp.getUi().alert("預覽完成：目前沒有找到符合規則的空白資料。");
    return;
  }
  
  let previewSheetName = "填寫預覽清單";
  let previewSheet = ss.getSheetByName(previewSheetName);
  if (previewSheet) previewSheet.clear(); 
  else previewSheet = ss.insertSheet(previewSheetName);
  
  previewSheet.getRange(1, 1, previewData.length, previewData[0].length).setValues(previewData);
  previewSheet.getRange("A1:F1").setFontWeight("bold").setBackground("#f3f4f6");
  previewSheet.autoResizeColumns(1, 6);
  ss.setActiveSheet(previewSheet);
  
  SpreadsheetApp.getUi().alert(`【預覽模式已完成】\n已列出 ${updatedCount} 筆資料。修改完畢後請改 PREVIEW_MODE 為 false 再跑一次。`);
}
