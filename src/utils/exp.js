export const LEVELS = [
  { level: 1, name: '骰子新手', minExp: 0, benefits: [
    '享有計時制計費方案（詳情請見「店內消費方式」）',
    '購買桌遊享 9 折優惠',
    '享有遊戲租借權利',
    '生日當天入場免費',
    '消費累積經驗值，升級解鎖更多專屬福利',
    '3 樓「莎朗嘿yo 攝影工作室」預約拍照全項目 9 折',
    '可使用已上鎖的實用桌遊輔助 APP',
  ] },
  { level: 2, name: '卡牌探索者', minExp: 30, benefits: ['壽星免費入場延長為前三後三天'] },
  { level: 3, name: '棋盤老手', minExp: 90, benefits: ['租期延長為 5 天'] },
  { level: 4, name: '桌遊達人', minExp: 210, benefits: ['每季一次免費輕鬆玩（平假日皆可）'] },
  { level: 5, name: '烏嘎嘎傳奇', minExp: 450, benefits: ['升級時獲得 $500 購物金'] },
]

export const EXP_RULES = [
  { icon: '🎮', label: '每次入場', exp: '+5 EXP' },
  { icon: '👥', label: '每帶一位朋友入場', exp: '+1 EXP' },
  { icon: '📦', label: '每租借一款遊戲', exp: '+1 EXP' },
  { icon: '🛒', label: '每購買 $500 桌遊', exp: '+4 EXP' },
]

export function calcLevel(exp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (exp >= LEVELS[i].minExp) return LEVELS[i]
  }
  return LEVELS[0]
}

export function calcNextLevel(exp) {
  const current = calcLevel(exp)
  const next = LEVELS.find(l => l.level === current.level + 1)
  return next || null
}
