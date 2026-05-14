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
    id: 'cherry-blossom',
    name: '櫻花粉',
    emoji: '🌸',
    preview: 'linear-gradient(135deg, #FFF1F2, #FFE4E6, #FECDD3)',
    body: {
      background: `
        radial-gradient(ellipse 70% 50% at 15% 0%, #FFE4E6 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 95% 25%, #FECDD3 0%, transparent 55%),
        radial-gradient(ellipse 80% 60% at 50% 100%, #FED7AA 0%, transparent 50%),
        linear-gradient(180deg, #FFF1F2 0%, #FFF5F5 50%, #FFFAF0 100%)
      `,
    },
    root: {
      backgroundColor: 'rgba(255, 255, 255, 0.48)',
    },
    ambient: {
      before: 'radial-gradient(circle, #FDA4AF 0%, transparent 70%)',
      after: 'radial-gradient(circle, #FDBA74 0%, transparent 70%)',
    },
    header: {
      background: 'rgba(255, 255, 255, 0.82)',
      borderColor: 'rgba(253, 164, 175, 0.40)',
      titleGradient: 'linear-gradient(to right, #E11D48, #F97316)',
      logoShadow: '0 4px 6px -1px rgba(251, 113, 133, 0.25)',
      backBtnText: '#78716C',
      backBtnHoverBg: 'rgba(255, 228, 230, 0.5)',
    },
    card: {
      background: '#FFFFFF',
      border: 'rgba(253, 164, 175, 0.30)',
      hoverBorder: 'rgba(251, 113, 133, 0.45)',
      shadow: '0 1px 3px rgba(159, 18, 57, 0.05)',
      hoverShadow: '0 4px 12px rgba(251, 113, 133, 0.12)',
      activeGradient: 'linear-gradient(to right, #FB7185, #F97316)',
      activeShadow: '0 4px 12px rgba(251, 113, 133, 0.28)',
      iconBg: 'rgba(255, 241, 242, 1)',
      activeIconBg: 'rgba(255, 255, 255, 0.20)',
    },
    text: {
      primary: '#1C1917',
      secondary: '#57534E',
      muted: '#A8A29E',
      cardLabel: '#44403C',
      cardDesc: '#A8A29E',
      activeText: '#FFFFFF',
      activeDesc: 'rgba(255,255,255,0.80)',
      arrow: '#D6D3D1',
      activeArrow: 'rgba(255,255,255,0.70)',
    },
    scrollbar: '#fecdd3',
  },
  {
    id: 'mocha-brown',
    name: '摩卡棕',
    emoji: '☕',
    preview: 'linear-gradient(135deg, #FAF5F0, #F5E6D3, #EFDBCC)',
    body: {
      background: `
        radial-gradient(ellipse 70% 50% at 15% 0%, #F5E6D3 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 95% 25%, #EFDBCC 0%, transparent 55%),
        radial-gradient(ellipse 80% 60% at 50% 100%, #E8D5C4 0%, transparent 50%),
        linear-gradient(180deg, #FAF5F0 0%, #F7F0E8 50%, #F5EDE3 100%)
      `,
    },
    root: {
      backgroundColor: 'rgba(255, 255, 255, 0.42)',
    },
    ambient: {
      before: 'radial-gradient(circle, #D4A574 0%, transparent 70%)',
      after: 'radial-gradient(circle, #C09060 0%, transparent 70%)',
    },
    header: {
      background: 'rgba(255, 253, 250, 0.82)',
      borderColor: 'rgba(196, 164, 132, 0.35)',
      titleGradient: 'linear-gradient(to right, #92400E, #B45309)',
      logoShadow: '0 4px 6px -1px rgba(180, 83, 9, 0.20)',
      backBtnText: '#78716C',
      backBtnHoverBg: 'rgba(245, 230, 211, 0.5)',
    },
    card: {
      background: 'rgba(255, 253, 250, 1)',
      border: 'rgba(196, 164, 132, 0.30)',
      hoverBorder: 'rgba(180, 83, 9, 0.35)',
      shadow: '0 1px 3px rgba(120, 53, 15, 0.06)',
      hoverShadow: '0 4px 12px rgba(180, 83, 9, 0.10)',
      activeGradient: 'linear-gradient(to right, #B45309, #92400E)',
      activeShadow: '0 4px 12px rgba(146, 64, 14, 0.28)',
      iconBg: 'rgba(250, 245, 240, 1)',
      activeIconBg: 'rgba(255, 255, 255, 0.20)',
    },
    text: {
      primary: '#292524',
      secondary: '#57534E',
      muted: '#A8A29E',
      cardLabel: '#44403C',
      cardDesc: '#A8A29E',
      activeText: '#FFFFFF',
      activeDesc: 'rgba(255,255,255,0.80)',
      arrow: '#D6D3D1',
      activeArrow: 'rgba(255,255,255,0.70)',
    },
    scrollbar: '#d6c4b0',
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
  {
    id: 'deep-forest',
    name: '深林綠',
    emoji: '🍃',
    preview: 'linear-gradient(135deg, #1A3C2A, #2D4A3E, #3A5A4A)',
    body: {
      background: `
        radial-gradient(ellipse 70% 50% at 15% 0%, #2D4A3E 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 100% 30%, #1A3C2A 0%, transparent 55%),
        radial-gradient(ellipse 80% 60% at 50% 100%, #253D30 0%, transparent 55%),
        linear-gradient(180deg, #162E22 0%, #1A3328 50%, #1E3A2E 100%)
      `,
    },
    root: {
      backgroundColor: 'rgba(26, 50, 38, 0.70)',
    },
    ambient: {
      before: 'radial-gradient(circle, #4A7C5C 0%, transparent 70%)',
      after: 'radial-gradient(circle, #8B7355 0%, transparent 70%)',
    },
    header: {
      background: 'rgba(26, 50, 38, 0.88)',
      borderColor: 'rgba(74, 124, 92, 0.30)',
      titleGradient: 'linear-gradient(to right, #8FBC8F, #D4A574)',
      logoShadow: '0 4px 6px -1px rgba(74, 124, 92, 0.30)',
      backBtnText: '#A8B5A0',
      backBtnHoverBg: 'rgba(74, 124, 92, 0.25)',
    },
    card: {
      background: 'rgba(35, 62, 48, 0.80)',
      border: 'rgba(74, 124, 92, 0.30)',
      hoverBorder: 'rgba(143, 188, 143, 0.45)',
      shadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
      hoverShadow: '0 4px 12px rgba(74, 124, 92, 0.20)',
      activeGradient: 'linear-gradient(to right, #4A7C5C, #6B8F5C)',
      activeShadow: '0 4px 12px rgba(74, 124, 92, 0.35)',
      iconBg: 'rgba(45, 74, 58, 0.90)',
      activeIconBg: 'rgba(255, 255, 255, 0.15)',
    },
    text: {
      primary: '#E8EDE8',
      secondary: '#B5C4B0',
      muted: '#7A8F74',
      cardLabel: '#D4DDD0',
      cardDesc: '#7A8F74',
      activeText: '#FFFFFF',
      activeDesc: 'rgba(255,255,255,0.75)',
      arrow: '#4A6050',
      activeArrow: 'rgba(255,255,255,0.60)',
    },
    scrollbar: '#3A5A4A',
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
