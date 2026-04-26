import { SearchX, Frown } from 'lucide-react';
import GameCard from './GameCard';

function SkeletonCard() {
  return (
    <div className="bg-white border-2 border-[#e6d9b6] rounded-xl overflow-hidden p-3">
      <div className="h-32 sm:h-40 bg-stone-100 rounded-lg mb-3 animate-pulse" />
      <div className="h-5 w-3/4 rounded animate-shimmer mb-1" />
      <div className="h-4 w-1/2 rounded animate-shimmer mb-3" />
      <div className="flex gap-3 mb-3">
        <div className="h-4 w-1/2 rounded animate-shimmer" />
        <div className="h-4 w-1/2 rounded animate-shimmer" />
      </div>
      <div className="flex gap-2 mt-auto">
        <div className="h-5 w-12 rounded animate-shimmer" />
        <div className="h-5 w-12 rounded animate-shimmer" />
      </div>
    </div>
  );
}

export default function GameList({ games, loading, error, totalCount }) {
  // Loading State
  if (loading) {
    return (
      <div className="px-3 sm:px-4 py-4">
        <div className="flex items-center justify-center gap-2 py-6 mb-2">
          <div className="w-5 h-5 border-2 border-orange-300 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-stone-400 font-medium">正在載入桌遊資料...</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-red-50 mb-4">
          <Frown className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-base font-semibold text-stone-700 mb-1">資料載入失敗</p>
        <p className="text-sm text-stone-400 text-center">{error}</p>
      </div>
    );
  }

  // Empty State
  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-stone-100 mb-4">
          <SearchX className="w-8 h-8 text-stone-400" />
        </div>
        <p className="text-base font-semibold text-stone-700 mb-1">找不到符合的遊戲</p>
        <p className="text-sm text-stone-400 text-center">試著調整篩選條件吧！</p>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 py-4">
      {/* Results Count */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-stone-400 font-medium">
          顯示 <span className="text-orange-500 font-bold">{games.length}</span> / {totalCount} 款遊戲
        </p>
      </div>

      {/* Game Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {games.map((game) => (
          <GameCard key={`${game.name}-${game.id}`} game={game} />
        ))}
      </div>

      {/* Bottom Spacer */}
      <div className="h-8" />
    </div>
  );
}
