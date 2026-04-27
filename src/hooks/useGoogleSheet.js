import { useState, useEffect } from 'react';
import Papa from 'papaparse';

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTBJylM7ousC0ift39FwzpIB7NrFgYZBfaKug_pBLXU_l0UZKTKKlcfO9663eetX13d5pbsWBLGinVE/pub?gid=540615026&single=true&output=csv';

/**
 * =============================================
 *  欄位名稱 Mapping（資料對應）
 * =============================================
 *  打開瀏覽器 Console 查看第一筆資料的 key，
 *  然後替換下方的字串即可。
 *
 *  目前已根據實際 CSV 欄位完成對應：
 *    中文名稱 → name
 *    遊戲人數 → players (原始格式如 "2-4")
 *    BGG遊戲時間(分鐘) → playTime
 *    放置櫃位 → location
 *    BGG玩家評分 → rating
 *    BGG遊戲難度 → weight
 *    英文名稱 → englishName
 *    語言版本 → language
 *    BGG連結 → bggLink
 *    所有人 → owner
 */
const FIELD_MAP = {
  name: '中文名稱',
  englishName: '英文名稱',
  language: '語言版本',
  players: '遊戲人數',         // 原始格式如 "2-4", "1-5"
  location: '放置櫃位',
  rating: 'BGG玩家評分',
  bestPlayers: 'BGG建議最佳人數',
  playTime: 'BGG遊戲時間(分鐘)',  // 原始格式如 "30-60", "90"
  weight: 'BGG遊戲難度',
  bggLink: 'BGG連結',
  owner: '所有人',
  category: '分類',
  tag1: '標籤1',
  tag2: '標籤2',
  tag3: '標籤3',
  isHot: '店內熱門',
  image: '圖片',
};

/**
 * 解析人數欄位 "2-4" → { min: 2, max: 4 }
 * 支援格式: "2", "2-4", "1-99"
 */
function parsePlayers(raw) {
  if (!raw || raw === 'N/A') return { min: null, max: null };
  const str = String(raw).trim();
  
  // Handle "2-4" format
  const rangeMatch = str.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (rangeMatch) {
    return { min: parseInt(rangeMatch[1], 10), max: parseInt(rangeMatch[2], 10) };
  }
  
  // Handle single number "2"
  const singleMatch = str.match(/^(\d+)$/);
  if (singleMatch) {
    const n = parseInt(singleMatch[1], 10);
    return { min: n, max: n };
  }
  
  return { min: null, max: null };
}

/**
 * 解析遊玩時間欄位 "30-60" → { min: 30, max: 60 }
 * 支援格式: "30", "30-60", "90-120"
 */
function parsePlayTime(raw) {
  if (!raw || raw === 'N/A') return { min: null, max: null };
  const str = String(raw).replace(/[.]/g, '-').trim();
  
  const rangeMatch = str.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (rangeMatch) {
    return { min: parseInt(rangeMatch[1], 10), max: parseInt(rangeMatch[2], 10) };
  }
  
  const singleMatch = str.match(/^(\d+)$/);
  if (singleMatch) {
    const n = parseInt(singleMatch[1], 10);
    return { min: n, max: n };
  }
  
  return { min: null, max: null };
}

/**
 * useGoogleSheet Hook
 * 抓取 Google Sheets CSV 並轉換為結構化 JSON
 */
export default function useGoogleSheet() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(SHEET_CSV_URL);
        const csvText = await response.text();

        // 預處理 CSV：找到真正的欄位標題行（包含 "中文名稱" 的那行）
        const lines = csvText.split('\n');
        const headerIndex = lines.findIndex(line => line.includes('中文名稱'));
        const cleanedCsv = headerIndex >= 0 ? lines.slice(headerIndex).join('\n') : csvText;
        
        console.log(`📋 找到標題行在第 ${headerIndex + 1} 行，跳過前面 ${headerIndex} 行裝飾行`);

        Papa.parse(cleanedCsv, {
          header: true,
          skipEmptyLines: false,
          complete: (results) => {
            // 🔍 Debug: 印出第一筆原始資料，方便確認 key 名稱
            if (results.data.length > 0) {
              console.log('📋 CSV 欄位列表 (Keys):', Object.keys(results.data[0]));
              console.log('📋 第一筆原始資料:', results.data[0]);
            }

            // 過濾掉標題行和空行，將資料轉為結構化格式
            // 先標記原始索引，再過濾，確保列數對應正確
            const mapped = results.data
              .map((row, originalIndex) => ({ row, originalIndex }))
              .filter(({ row }) => {
                const name = row[FIELD_MAP.name];
                const playersRaw = row[FIELD_MAP.players];
                // 過濾無遊戲名稱、或是標題/空行
                return (
                  name &&
                  name.trim() !== '' &&
                  name !== '中文名稱' &&
                  playersRaw &&
                  playersRaw.trim() !== ''
                );
              })
              .map(({ row, originalIndex }) => {
                // 計算實際的 Google Sheet 列數 (1-based)
                // headerIndex 是 0-based line index, header 在 Sheet 第 (headerIndex+1) 列
                // 第一筆資料在 Sheet 第 (headerIndex+2) 列
                const sheetRowNumber = headerIndex + originalIndex + 2;

                const playersParsed = parsePlayers(row[FIELD_MAP.players]);
                const timeParsed = parsePlayTime(row[FIELD_MAP.playTime]);
                const rating = parseFloat(row[FIELD_MAP.rating]);
                const weight = parseFloat(row[FIELD_MAP.weight]);

                return {
                  id: sheetRowNumber,
                  name: row[FIELD_MAP.name]?.trim() || '',
                  englishName: row[FIELD_MAP.englishName]?.trim() || '',
                  language: row[FIELD_MAP.language]?.trim() || '',
                  minPlayers: playersParsed.min,
                  maxPlayers: playersParsed.max,
                  playersRaw: row[FIELD_MAP.players]?.trim() || '',
                  location: row[FIELD_MAP.location]?.trim() || '',
                  rating: isNaN(rating) ? null : rating,
                  bestPlayers: row[FIELD_MAP.bestPlayers]?.trim() || '',
                  minTime: timeParsed.min,
                  maxTime: timeParsed.max,
                  playTimeRaw: row[FIELD_MAP.playTime]?.trim() || '',
                  weight: isNaN(weight) ? null : weight,
                  bggLink: row[FIELD_MAP.bggLink]?.trim() || '',
                  owner: row[FIELD_MAP.owner]?.trim() || '',
                  category: row[FIELD_MAP.category]?.trim() || '',
                  tags: [
                    row[FIELD_MAP.tag1]?.trim(),
                    row[FIELD_MAP.tag2]?.trim(),
                    row[FIELD_MAP.tag3]?.trim(),
                  ].filter((t) => t && t !== ''),
                  isHot: row[FIELD_MAP.isHot]?.trim()?.toLowerCase() === 'v',
                  hasImage: row[FIELD_MAP.image]?.trim()?.toLowerCase() === 'v',
                };
              });

            console.log(`✅ 成功載入 ${mapped.length} 款桌遊資料`);
            setGames(mapped);
            setLoading(false);
          },
          error: (err) => {
            console.error('❌ CSV 解析錯誤:', err);
            setError('資料解析失敗');
            setLoading(false);
          },
        });
      } catch (err) {
        console.error('❌ 資料載入錯誤:', err);
        setError('無法連線取得資料，請檢查網路連線');
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { games, loading, error };
}
