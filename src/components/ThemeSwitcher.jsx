import { useState, useRef, useEffect } from 'react';
import { useTheme, THEMES } from '../contexts/ThemeContext';
import { Palette } from 'lucide-react';

/**
 * 主題切換器 — 首頁 Header 右側的調色盤按鈕
 * 點擊展開 5 種主題選項面板，帶動畫效果
 */
export default function ThemeSwitcher() {
  const { themeId, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const btnRef = useRef(null);

  // 點擊外部關閉
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [open]);

  return (
    <div className="relative">
      {/* 觸發按鈕 */}
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="theme-switcher-btn"
        aria-label="切換主題"
        title="切換主題"
      >
        <Palette size={20} />
      </button>

      {/* 主題選單面板 */}
      {open && (
        <div
          ref={panelRef}
          className="theme-panel"
        >
          <div className="theme-panel-title">選擇主題</div>
          <div className="theme-panel-grid">
            {THEMES.map((t) => {
              const isActive = themeId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setOpen(false);
                  }}
                  className={`theme-option ${isActive ? 'theme-option-active' : ''}`}
                  title={t.name}
                >
                  {/* 色彩預覽圓 */}
                  <div
                    className="theme-preview-circle"
                    style={{ background: t.preview }}
                  />
                  {/* 選中指示器 */}
                  {isActive && (
                    <div className="theme-check">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                  <span className="theme-option-label">{t.emoji} {t.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
