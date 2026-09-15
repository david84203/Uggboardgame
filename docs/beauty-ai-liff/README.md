# LINE LIFF「AI 妝容與風格診斷」專案文件

韓式照相館 × 美妝諮詢 × 保養品電商的 LINE 官方帳號互動系統。客人從六格選單點進 LIFF，拍照 → AI 分析臉型 / 五官量感 / 冷暖色調 / 膚質 → 勾選風格 → 產出客製化報告（含腮紅、修容、打亮圖解與服裝配色），系統自動貼標籤，最後導流至保養品官網、彩妝課程與 IG 限動分享卡。

| 文件 | 內容 |
|---|---|
| [01-PRD 與使用者體驗動線](./01-PRD.md) | 目標、KPI、人物誌、功能需求（FR）、非功能需求、User Journey Map、風險 |
| [02-技術架構](./02-技術架構.md) | LIFF + React + Vercel Functions + Firebase + Claude Vision 的整體設計、資料模型、AI 輸出 Schema、成本試算、資安與個資 |
| [03-臉部圖解渲染策略](./03-臉部圖解渲染策略.md) | 「AI 動態生成」vs「AI 回傳標籤 → 前端匹配預製圖庫」vs「特徵點參數化疊圖」的分析與建議 |
| [04-開發時程與模組拆解](./04-開發時程與模組拆解.md) | 8 週 MVP 排程、工程模組（M0–M8）、人力、驗收標準 |
| [05-AI 系統提示與錯誤處理](./05-AI系統提示與錯誤處理.md) | 完整 System Prompt v1.0、判斷準則、位置代碼對照、三層 Fallback 矩陣、校準計畫 |
| [06-文案與導流](./06-文案與導流.md) | 立牌文案、六格選單、報告 CTA（含新增的寫真預約）、分享語錄、流程微文案、分眾推播 |
| [analysis-schema.json](./analysis-schema.json) | AI 回傳的 JSON Schema（系統化版：五個分類 + 兩句話；由 `src/beauty/rules/aiOutputSchema.js` 產生） |
| [07-實作狀態與部署](./07-實作狀態與部署.md) | 程式碼位置、系統化架構（AI 只做分類，規則做決定）、部署需要的設定與環境變數、待辦 |
| [products-template.csv](./products-template.csv) | 商品對照表範本（匯入 Google Sheet 後，由 Han 依玫琳凱型錄填入品名與貨號） |

## 一句話結論

- **前端**：沿用現有 React 19 + Vite + Tailwind 4，新增 `/beauty` LIFF 路由；相機用 `<input capture="user">`，不用 getUserMedia。
- **後端**：Vercel Serverless Function（Node/TypeScript）驗證 LIFF ID Token → 呼叫 Claude 視覺模型（`claude-opus-5`，Structured Output 固定 JSON）→ 寫入 Firestore 標籤 → 回傳報告。
- **圖解**：MVP 採「AI 回傳標籤 → 前端匹配預製 SVG 圖庫」（6 臉型 × 3 圖層），Phase 2 再用 MediaPipe 臉部特徵點把圖層貼到客人自己的照片上。
- **成本**：每次分析約 NT$1–2（含 AI 與雲端），LINE 訊息費用靠 `liff.sendMessages` 由使用者端送出報告來省。
- **時程**：1 位全端 + 1 位設計（兼職）約 8 週上線 MVP。
