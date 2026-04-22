import { SearchX, Frown } from 'lucide-react';
import GameCard from './GameCard';

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="h-5 w-32 rounded-md animate-shimmer mb-1.5" />
          <div className="h-3 w-24 rounded-md animate-shimmer" />
        </div>
        <div className="h-7 w-14 rounded-lg animate-shimmer" />
      </div>
      <div className="flex gap-3 mt-3">
        <div className="h-4 w-16 rounded animate-shimmer" />
        <div className="h-4 w-20 rounded animate-shimmer" />
        <div className="h-4 w-12 rounded animate-shimmer" />
      </div>
    </div>
  );
}

export default function GameList({ games, loading, error, totalCount }) {
  // Loading State
  if (loading) {
    return (
      <div className="px-4 py-4 space-y-3">
        <div className="flex items-center justify-center gap-2 py-6">
          <div className="w-5 h-5 border-2 border-orange-300 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-stone-400 font-medium">正在載入桌遊資料...</span>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonCard key={i} />
        ))}
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
    <div className="px-4 py-4">
      {/* Results Count */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-stone-400 font-medium">
          顯示 <span className="text-orange-500 font-bold">{games.length}</span> / {totalCount} 款遊戲
        </p>
      </div>

      {/* Game Cards Grid */}
      <div className="space-y-3">
        {games.map((game) => (
          <GameCard key={`${game.name}-${game.id}`} game={game} />
        ))}
      </div>

      {/* Bottom Spacer */}
      <div className="h-8" />
    </div>
  );
}
