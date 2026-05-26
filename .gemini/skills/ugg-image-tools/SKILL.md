---
name: ugg-image-tools
description: 烏嘎嘎桌遊館專用工具 — 圖片瘦身（短邊縮至 400px、修正格式）及 Google Sheet U 欄圖片 v 標記填寫。
---

# 烏嘎嘎圖片工具 (ugg-image-tools)

此 skill 提供兩個維護腳本，位於專案根目錄：

| 腳本 | 說明 |
|------|------|
| `resize_images.mjs` | 圖片瘦身 + 格式修正 |
| `fill_image_v.mjs`  | Google Sheet U 欄補 v |

---

## 1. 圖片瘦身 — `resize_images.mjs`

### 功能

- 掃描 `public/images/` 內所有圖片（`.jpg` `.jpeg` `.png` `.webp` `.jfif`）
- **短邊 > 400px** → 等比例縮小至短邊 = 400px，不裁切不填充
- **副檔名與實際格式不符**（如 `.jpg` 但實際是 webp）→ 強制轉換為副檔名對應的格式
- `.jfif` → 轉為 `.jpg`（JPEG 格式）並刪除舊檔
- 短邊已 ≤ 400 且格式正確 → 跳過（不放大）
- 輸出品質：JPEG/JFIF = 85、PNG 壓縮等級 9、WebP = 85

### 執行方式

```powershell
# 正式執行（原地覆蓋）
node resize_images.mjs

# 試跑（只顯示會做什麼，不修改檔案）
node resize_images.mjs --dry-run
```

### 輸出範例

```
掃描到 946 個圖片

[✓] (778/946) Garden Nation.jpg: 縮小 1728x1696→408x400, 格式 webp→jpeg
[✓] (836/946) UNO.jpg: 縮小 600x600→400x400, 格式 webp→jpeg
...

完成！
  ✓ 處理：140 個
  - 跳過：806 個（尺寸格式皆OK）
  ✗ 錯誤：0 個
```

### 注意事項

- 需要安裝 `sharp`（已在 devDependencies，直接 `npm install` 即可）
- 腳本使用 `fs.readFileSync` → `sharp(Buffer)` 模式讀取，避免 Windows 路徑鎖定問題
- 執行前請確認 Vite dev server 或其他佔用 `public/images/` 的程序已關閉

---

## 2. Google Sheet U 欄補 v — `fill_image_v.mjs`

### 功能

- 掃描 `public/images/` 取得所有圖片的對應識別碼
- 與 Google Sheet 的 **BGG連結** 欄（K 欄）比對，提取 BGG ID
- 有圖片對應的遊戲，在 **U 欄**（圖片欄）補上 `v`
- 已有 `v` 的格子跳過，無圖片的列跳過

### 比對規則

| 圖片命名方式 | 比對方式 |
|-------------|---------|
| `{bggId}.jpg` 等（純數字） | 與 BGG連結 欄提取的 BGG ID 比對 |
| `row-{n}.jpg` | 與 Sheet 實際列號 n 比對 |

### 執行方式

```powershell
# 正式執行（寫入 Google Sheet）
node fill_image_v.mjs

# 試跑（只顯示結果，不寫入）
node fill_image_v.mjs --dry-run
```

### 輸出範例

```
圖片資料夾：948 個檔案
  BGG ID 命名：724 個
  row-N 命名：35 個

Sheet：工作表1
  標題在第 8 列
  BGG連結：K 欄（index 10）
  寫入目標：U 欄

  [需補] 第 20 列：數獨 (BGG:20801)
  ...

統計：
  已有 v：735 筆
  需補 v：15 筆
  無圖片：902 筆（跳過）

完成！補填 15 個 v 到 U 欄
```

### 前置條件

- 專案根目錄需有 `service-account.json`（Google Sheets API 服務帳號金鑰）
- Sheet ID：`1ihFg-9I9QBG9bXK3XtipsD9ymtPvlBcQJk4KA5YeMnw`
- Sheet GID：`540615026`（工作表1）

---

## 標準維護流程

每次新增或更換遊戲圖片後，依序執行：

```powershell
# 步驟 1：瘦身 + 格式修正
node resize_images.mjs

# 步驟 2：更新 Google Sheet U 欄
node fill_image_v.mjs
```
