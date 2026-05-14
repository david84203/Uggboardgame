import { ArrowLeft } from 'lucide-react';
import ThemeSwitcher from './ThemeSwitcher';

export default function Header({ showBackButton, onBack }) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg"
      style={{
        background: 'var(--theme-header-bg)',
        borderBottom: '1px solid var(--theme-header-border)',
      }}
    >
      <div className="relative flex items-center justify-center h-14 px-4">
        {/* 返回按鈕 */}
        {showBackButton && (
          <button 
            onClick={onBack}
            className="absolute left-4 flex items-center justify-center p-2 rounded-full transition-colors"
            style={{
              color: 'var(--theme-header-back-text)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--theme-header-back-hover-bg)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            aria-label="回到主頁"
          >
            <ArrowLeft size={24} />
          </button>
        )}
        
        {/* Logo 區塊 */}
        <div className="flex items-center gap-2.5">
        {/* Logo Icon */}
        <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0"
          style={{ boxShadow: 'var(--theme-header-logo-shadow)' }}
        >
          <img src="/images/LOGO.jpg" alt="烏嘎嘎桌遊" className="w-full h-full object-cover" />
        </div>
        
        {/* Title */}
        <h1 className="text-xl font-bold tracking-wide bg-clip-text text-transparent"
          style={{ backgroundImage: 'var(--theme-header-title-gradient)' }}
        >
          烏嘎嘎桌遊
        </h1>
        </div>

        {/* 主題切換按鈕 — 僅首頁顯示 */}
        {!showBackButton && (
          <div className="absolute right-4">
            <ThemeSwitcher />
          </div>
        )}
      </div>
    </header>
  );
}
