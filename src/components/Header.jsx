export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-stone-200/60">
      <div className="flex items-center justify-center gap-2.5 px-4 py-3">
        {/* Logo Icon */}
        <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-orange-200 shrink-0">
          <img src="/images/LOGO.jpg" alt="烏嘎嘎桌遊" className="w-full h-full object-cover" />
        </div>
        
        {/* Title */}
        <h1 className="text-xl font-bold tracking-wide bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
          烏嘎嘎桌遊
        </h1>
      </div>
    </header>
  );
}
