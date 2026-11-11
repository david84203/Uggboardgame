import { useState, useEffect } from 'react';

// 跟 useState 一樣用，但每次改動都存進手機（localStorage），
// 不小心按到返回、跳出 APP、重新整理，回來時資料還在。
const PREFIX = 'ugg_keep:';

export function usePersistedState(key, init) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(PREFIX + key);
      if (saved !== null) return JSON.parse(saved);
    } catch { /* 無痕模式或資料壞掉就用預設值 */ }
    return typeof init === 'function' ? init() : init;
  });
  useEffect(() => {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* 存不了就算了，不影響使用 */ }
  }, [key, value]);
  return [value, setValue];
}

// 清掉某個前綴底下的存檔（例如開新一局時）
export function clearPersisted(prefix) {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX + prefix))
      .forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
}
