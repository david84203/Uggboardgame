import { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * 五種高質感主題設計
 * 每個主題包含：背景漸層、環境光暈、卡片樣式、文字顏色、Header 樣式、強調色
 */
export const THEMES = [
  {
    id: 'warm-sunset',
    name: '暖陽橘',
    emoji: '🌅',
    preview: 'linear-gradient(135deg, #FFF8F0, #FFEDD5, #FEF3C7)',
    body: {
      background: `
        radial-gradient(ellipse 70% 50% at 15% 0%, #FFEDD5 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 100% 30%, #FEF3C7 0%, transparent 55%),
        radial-gradient(ellipse 80% 60% at 50% 100%, #FFE4E6 0%, transparent 55%),
        linear-gradient(180deg, #FFF8F0 0%, #FAF7F2 50%, #FFF4E6 100%)
      `,
    },
    root: {
      backgroundColor: 'rgba(255, 255, 255, 0.45)',
    },
    ambient: {
      before: 'radial-gradient(circle, #FB923C 0%, transparent 70%)',
      after: 'radial-gradient(circle, #FBBF24 0%, transparent 70%)',
    },
    header: {
      background: 'rgba(255, 255, 255, 0.80)',
      borderColor: 'rgba(214, 211, 209, 0.60)',
      titleGradient: 'linear-gradient(to right, #EA580C, #D97706)',
      logoShadow: '0 4px 6px -1px rgba(251, 146, 60, 0.25)',
      backBtnText: '#78716C',
      backBtnHoverBg: 'rgba(214, 211, 209, 0.3)',
    },
    card: {
      background: '#FFFFFF',
      border: 'rgba(214, 211, 209, 0.35)',
      hoverBorder: 'rgba(251, 146, 60, 0.40)',
      shadow: '0 1px 3px rgba(28, 25, 23, 0.06)',
      hoverShadow: '0 4px 12px rgba(251, 146, 60, 0.12)',
      activeGradient: 'linear-gradient(to right, #F97316, #F59E0B)',
      activeShadow: '0 4px 12px rgba(249, 115, 22, 0.25)',
      iconBg: 'rgba(245, 245, 244, 1)',
      activeIconBg: 'rgba(255, 255, 255, 0.20)',
    },
    text: {
      primary: '#1C1917',
      secondary: '#57534E',
      muted: '#A8A29E',
      cardLabel: '#292524',
      cardDesc: '#A8A29E',
      activeText: '#FFFFFF',
      activeDesc: 'rgba(255,255,255,0.80)',
      arrow: '#D6D3D1',
      activeArrow: 'rgba(255,255,255,0.70)',
    },
    scrollbar: '#d6d3d1',
  },
  {
    id: 'ocean-breeze',
    name: '海洋藍',
    emoji: '🌊',
    preview: 'linear-gradient(135deg, #F0F9FF, #DBEAFE, #E0F2FE)',
    body: {
      background: `
        radial-gradient(ellipse 70% 50% at 10% 0%, #DBEAFE 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 95% 25%, #BAE6FD 0%, transparent 55%),
        radial-gradient(ellipse 80% 60% at 50% 100%, #C7D2FE 0%, transparent 55%),
        linear-gradient(180deg, #F0F9FF 0%, #EFF6FF 50%, #E0F2FE 100%)
      `,
    },
    root: {
      backgroundColor: 'rgba(255, 255, 255, 0.50)',
    },
    ambient: {
      before: 'radial-gradient(circle, #60A5FA 0%, transparent 70%)',
      after: 'radial-gradient(circle, #38BDF8 0%, transparent 70%)',
    },
    header: {
      background: 'rgba(255, 255, 255, 0.82)',
      borderColor: 'rgba(191, 219, 254, 0.60)',
      titleGradient: 'linear-gradient(to right, #2563EB, #0EA5E9)',
      logoShadow: '0 4px 6px -1px rgba(96, 165, 250, 0.25)',
      backBtnText: '#64748B',
      backBtnHoverBg: 'rgba(219, 234, 254, 0.5)',
    },
    card: {
      background: '#FFFFFF',
      border: 'rgba(191, 219, 254, 0.45)',
      hoverBorder: 'rgba(96, 165, 250, 0.50)',
      shadow: '0 1px 3px rgba(30, 64, 175, 0.05)',
      hoverShadow: '0 4px 12px rgba(96, 165, 250, 0.15)',
      activeGradient: 'linear-gradient(to right, #3B82F6, #06B6D4)',
      activeShadow: '0 4px 12px rgba(59, 130, 246, 0.30)',
      iconBg: 'rgba(239, 246, 255, 1)',
      activeIconBg: 'rgba(255, 255, 255, 0.20)',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      muted: '#94A3B8',
      cardLabel: '#1E293B',
      cardDesc: '#94A3B8',
      activeText: '#FFFFFF',
      activeDesc: 'rgba(255,255,255,0.80)',
      arrow: '#CBD5E1',
      activeArrow: 'rgba(255,255,255,0.70)',
    },
    scrollbar: '#bfdbfe',
  },
  {
    id: 'forest-moss',
    name: '森林綠',
    emoji: '🌿',
    preview: 'linear-gradient(135deg, #F0FDF4, #DCFCE7, #D1FAE5)',
    body: {
      background: `
        radial-gradient(ellipse 70% 50% at 10% 5%, #DCFCE7 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 90% 30%, #D1FAE5 0%, transparent 55%),
        radial-gradient(ellipse 80% 60% at 50% 100%, #CFFAFE 0%, transparent 55%),
        linear-gradient(180deg, #F0FDF4 0%, #ECFDF5 50%, #F0FDFA 100%)
      `,
    },
    root: {
      backgroundColor: 'rgba(255, 255, 255, 0.45)',
    },
    ambient: {
      before: 'radial-gradient(circle, #4ADE80 0%, transparent 70%)',
      after: 'radial-gradient(circle, #34D399 0%, transparent 70%)',
    },
    header: {
      background: 'rgba(255, 255, 255, 0.82)',
      borderColor: 'rgba(167, 243, 208, 0.60)',
      titleGradient: 'linear-gradient(to right, #16A34A, #0D9488)',
      logoShadow: '0 4px 6px -1px rgba(74, 222, 128, 0.25)',
      backBtnText: '#64748B',
      backBtnHoverBg: 'rgba(220, 252, 231, 0.5)',
    },
    card: {
      background: '#FFFFFF',
      border: 'rgba(167, 243, 208, 0.40)',
      hoverBorder: 'rgba(74, 222, 128, 0.50)',
      shadow: '0 1px 3px rgba(22, 101, 52, 0.05)',
      hoverShadow: '0 4px 12px rgba(74, 222, 128, 0.15)',
      activeGradient: 'linear-gradient(to right, #22C55E, #14B8A6)',
      activeShadow: '0 4px 12px rgba(34, 197, 94, 0.30)',
      iconBg: 'rgba(240, 253, 244, 1)',
      activeIconBg: 'rgba(255, 255, 255, 0.20)',
    },
    text: {
      primary: '#14532D',
      secondary: '#3F6212',
      muted: '#6B8F71',
      cardLabel: '#166534',
      cardDesc: '#6B8F71',
      activeText: '#FFFFFF',
      activeDesc: 'rgba(255,255,255,0.80)',
      arrow: '#A7C4AA',
      activeArrow: 'rgba(255,255,255,0.70)',
    },
    scrollbar: '#bbf7d0',
  },
  {
    id: 'lavender-dream',
    name: '薰衣紫',
    emoji: '💜',
    preview: 'linear-gradient(135deg, #FAF5FF, #EDE9FE, #F3E8FF)',
    body: {
      background: `
        radial-gradient(ellipse 70% 50% at 15% 0%, #EDE9FE 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 90% 25%, #F3E8FF 0%, transparent 55%),
        radial-gradient(ellipse 80% 60% at 50% 100%, #FCE7F3 0%, transparent 55%),
        linear-gradient(180deg, #FAF5FF 0%, #FDF4FF 50%, #FFF1F2 100%)
      `,
    },
    root: {
      backgroundColor: 'rgba(255, 255, 255, 0.48)',
    },
    ambient: {
      before: 'radial-gradient(circle, #A78BFA 0%, transparent 70%)',
      after: 'radial-gradient(circle, #C084FC 0%, transparent 70%)',
    },
    header: {
      background: 'rgba(255, 255, 255, 0.82)',
      borderColor: 'rgba(196, 181, 253, 0.50)',
      titleGradient: 'linear-gradient(to right, #7C3AED, #A855F7)',
      logoShadow: '0 4px 6px -1px rgba(167, 139, 250, 0.25)',
      backBtnText: '#7C7C8A',
      backBtnHoverBg: 'rgba(237, 233, 254, 0.5)',
    },
    card: {
      background: '#FFFFFF',
      border: 'rgba(196, 181, 253, 0.35)',
      hoverBorder: 'rgba(167, 139, 250, 0.50)',
      shadow: '0 1px 3px rgba(91, 33, 182, 0.05)',
      hoverShadow: '0 4px 12px rgba(167, 139, 250, 0.15)',
      activeGradient: 'linear-gradient(to right, #8B5CF6, #D946EF)',
      activeShadow: '0 4px 12px rgba(139, 92, 246, 0.30)',
      iconBg: 'rgba(250, 245, 255, 1)',
      activeIconBg: 'rgba(255, 255, 255, 0.20)',
    },
    text: {
      primary: '#1E1B4B',
      secondary: '#4C1D95',
      muted: '#8B7FB5',
      cardLabel: '#312E81',
      cardDesc: '#8B7FB5',
      activeText: '#FFFFFF',
      activeDesc: 'rgba(255,255,255,0.80)',
      arrow: '#B8AED4',
      activeArrow: 'rgba(255,255,255,0.70)',
    },
    scrollbar: '#c4b5fd',
  },
  {
    id: 'midnight-noir',
    name: '暗夜黑',
    emoji: '🌙',
    preview: 'linear-gradient(135deg, #18181B, #1E1B2E, #1C1917)',
    body: {
      background: `
        radial-gradient(ellipse 70% 50% at 15% 0%, #312E81 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 100% 30%, #1E293B 0%, transparent 55%),
        radial-gradient(ellipse 80% 60% at 50% 100%, #1E1B2E 0%, transparent 55%),
        linear-gradient(180deg, #0F0F14 0%, #121218 50%, #0F172A 100%)
      `,
    },
    root: {
      backgroundColor: 'rgba(24, 24, 30, 0.75)',
    },
    ambient: {
      before: 'radial-gradient(circle, #6366F1 0%, transparent 70%)',
      after: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)',
    },
    header: {
      background: 'rgba(24, 24, 30, 0.85)',
      borderColor: 'rgba(63, 63, 70, 0.50)',
      titleGradient: 'linear-gradient(to right, #A78BFA, #818CF8)',
      logoShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.30)',
      backBtnText: '#A1A1AA',
      backBtnHoverBg: 'rgba(63, 63, 70, 0.4)',
    },
    card: {
      background: 'rgba(30, 30, 38, 0.85)',
      border: 'rgba(63, 63, 70, 0.50)',
      hoverBorder: 'rgba(99, 102, 241, 0.50)',
      shadow: '0 1px 3px rgba(0, 0, 0, 0.20)',
      hoverShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
      activeGradient: 'linear-gradient(to right, #6366F1, #8B5CF6)',
      activeShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
      iconBg: 'rgba(39, 39, 48, 1)',
      activeIconBg: 'rgba(255, 255, 255, 0.15)',
    },
    text: {
      primary: '#F4F4F5',
      secondary: '#A1A1AA',
      muted: '#71717A',
      cardLabel: '#E4E4E7',
      cardDesc: '#71717A',
      activeText: '#FFFFFF',
      activeDesc: 'rgba(255,255,255,0.75)',
      arrow: '#52525B',
      activeArrow: 'rgba(255,255,255,0.60)',
    },
    scrollbar: '#3f3f46',
  },
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    try {
      return localStorage.getItem('ugg_theme') || 'warm-sunset';
    } catch {
      return 'warm-sunset';
    }
  });

  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];

  const setTheme = useCallback((id) => {
    setThemeId(id);
    try {
      localStorage.setItem('ugg_theme', id);
    } catch {
      // ignore
    }
  }, []);

  // Apply theme CSS custom properties to document
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Body background
    body.style.background = theme.body.background;
    body.style.backgroundAttachment = 'fixed';

    // Root container
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.style.backgroundColor = theme.root.backgroundColor;
    }

    // CSS custom properties for components to consume
    root.style.setProperty('--theme-ambient-before', theme.ambient.before);
    root.style.setProperty('--theme-ambient-after', theme.ambient.after);

    root.style.setProperty('--theme-header-bg', theme.header.background);
    root.style.setProperty('--theme-header-border', theme.header.borderColor);
    root.style.setProperty('--theme-header-title-gradient', theme.header.titleGradient);
    root.style.setProperty('--theme-header-logo-shadow', theme.header.logoShadow);
    root.style.setProperty('--theme-header-back-text', theme.header.backBtnText);
    root.style.setProperty('--theme-header-back-hover-bg', theme.header.backBtnHoverBg);

    root.style.setProperty('--theme-card-bg', theme.card.background);
    root.style.setProperty('--theme-card-border', theme.card.border);
    root.style.setProperty('--theme-card-hover-border', theme.card.hoverBorder);
    root.style.setProperty('--theme-card-shadow', theme.card.shadow);
    root.style.setProperty('--theme-card-hover-shadow', theme.card.hoverShadow);
    root.style.setProperty('--theme-card-active-gradient', theme.card.activeGradient);
    root.style.setProperty('--theme-card-active-shadow', theme.card.activeShadow);
    root.style.setProperty('--theme-card-icon-bg', theme.card.iconBg);
    root.style.setProperty('--theme-card-active-icon-bg', theme.card.activeIconBg);

    root.style.setProperty('--theme-text-primary', theme.text.primary);
    root.style.setProperty('--theme-text-secondary', theme.text.secondary);
    root.style.setProperty('--theme-text-muted', theme.text.muted);
    root.style.setProperty('--theme-card-label', theme.text.cardLabel);
    root.style.setProperty('--theme-card-desc', theme.text.cardDesc);
    root.style.setProperty('--theme-active-text', theme.text.activeText);
    root.style.setProperty('--theme-active-desc', theme.text.activeDesc);
    root.style.setProperty('--theme-arrow', theme.text.arrow);
    root.style.setProperty('--theme-active-arrow', theme.text.activeArrow);

    root.style.setProperty('--theme-scrollbar', theme.scrollbar);

    // Set body text color
    body.style.color = theme.text.primary;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, themeId, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
