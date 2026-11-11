import { useEffect, useRef } from 'react';

// 手機返回手勢先關彈出視窗，沒有彈窗才換頁（換頁邏輯在 App.jsx）。
// 每開一個彈窗就在瀏覽器紀錄墊一筆，返回時吃掉那筆並關掉最上層的彈窗。
const stack = []; // 目前開著的彈窗（後開的在後面）
let skip = 0; // 用按鈕關彈窗時自己收掉墊的那筆，這種返回事件要略過

// App.jsx 的返回事件先問這裡：回傳 true 代表已處理（關了彈窗），不要再換頁
export function consumeBackPop() {
  if (skip > 0) { skip--; return true; }
  const top = stack.pop();
  if (top) { top.close(); return true; }
  return false;
}

export function useBackClose(open, onClose) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const entry = { close: () => closeRef.current?.() };
    stack.push(entry);
    window.history.pushState({ ...window.history.state, uggModal: true }, '');
    return () => {
      const i = stack.indexOf(entry);
      if (i === -1) return; // 是被返回手勢關掉的，紀錄已經退過了
      stack.splice(i, 1);
      skip++;
      window.history.back();
    };
  }, [open]);
}
