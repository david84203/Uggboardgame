// 值班固定工作清單
// 來源：老闆 2026-09-05 規格。要改清單直接改這個檔。

export const OPENING_CASH = 4000; // 抽屜備用金

export const DUTIES = [
  // ── 上班（開班）點錢＝打卡上班 ──────────────────────────────
  { id: 'open_drawer', group: 'open', kind: 'count', title: '點抽屜現金（應有 4000）' },
  { id: 'open_deposit', group: 'open', kind: 'count', title: '點押金盒（輸入金額比對）' },

  // ── 上班固定工作（依序）─────────────────────────────────────
  { id: 'd1', group: 'shift', title: '一樓沒客人先掃拖，然後擦桌子' },
  { id: 'd2', group: 'shift', title: '掃拖一二三樓廁所（馬桶、洗手台要刷）' },
  { id: 'd3', group: 'shift', title: '掃拖一二三樓樓梯、走廊、廚房' },
  { id: 'd4', group: 'shift', title: '二樓和室內掃拖、擦桌子' },
  { id: 'd5', group: 'shift', title: '二三樓＋一二三樓廁所＋廚房垃圾打包，丟外面垃圾桶' },
  { id: 'd6', group: 'shift', title: '水槽有碗盤就洗碗' },
  { id: 'd7', group: 'shift', title: '掃騎樓的落葉跟垃圾' },
  { id: 'd8', group: 'shift', title: '三樓掃拖、擦桌子', skippable: true, note: '看現場情況決定' },

  // ── 下班前 20 分鐘 ──────────────────────────────────────────
  { id: 'c1', group: 'close', title: '一二三樓廁所掃拖' },
  { id: 'c2', group: 'close', title: '所有垃圾桶再檢查、整理打包一次' },
];

export const GROUP_LABELS = {
  open: '上班先點錢',
  shift: '上班固定工作',
  close: '下班前 20 分鐘',
};

// 營業日：凌晨 8 點前算前一天（與入場系統 utils/billing.js 的 getBusinessDate 相同規則）
export function getBusinessDate(d = new Date()) {
  const t = new Date(d);
  if (t.getHours() < 8) t.setDate(t.getDate() - 1);
  const p = (n) => String(n).padStart(2, '0');
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`;
}
