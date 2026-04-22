import { Dices } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-stone-200/60">
      <div className="flex items-center justify-center gap-2.5 px-4 py-3">
        {/* Logo Icon */}
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-md shadow-orange-200">
          <Dices className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        
        {/* Title */}
        <h1 className="text-xl font-bold tracking-wide bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
          烏嘎嘎桌遊
        </h1>
      </div>
    </header>
  );
}
