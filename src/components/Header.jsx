import { ArrowLeft } from 'lucide-react';

export default function Header({ showBackButton, onBack }) {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-stone-200/60">
      <div className="relative flex items-center justify-center h-14 px-4">
        {/* 返回按鈕 */}
        {showBackButton && (
          <button 
            onClick={onBack}
            className="absolute left-4 flex items-center justify-center p-2 rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition-colors"
            aria-label="回到主頁"
          >
            <ArrowLeft size={24} />
          </button>
        )}
        
        {/* Logo 區塊 */}
        <div className="flex items-center gap-2.5">
        {/* Logo Icon */}
        <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-orange-200 shrink-0">
          <img src="/images/LOGO.jpg" alt="烏嘎嘎桌遊" className="w-full h-full object-cover" />
        </div>
        
        {/* Title */}
        <h1 className="text-xl font-bold tracking-wide bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
          烏嘎嘎桌遊
        </h1>
        </div>
      </div>
    </header>
  );
}
