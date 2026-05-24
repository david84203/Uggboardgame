import { useMemo, useState } from 'react';
import { SearchX, Frown, Sparkles } from 'lucide-react';
import GameCard from './GameCard';
import GameListTips from './GameListTips';
import useRentalCounts from '../hooks/useRentalCounts';

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

export default function GameList({ games, loading, error, totalCount, memberId, memberGames, onToggle, onRate, allGames, isRented }) {
  const { getRentalCount } = useRentalCounts()
  const [showTips, setShowTips] = useState(false)

  // 遊戲推薦（根據玩過 / 想玩的 category + tags）
  const recommended = useMemo(() => {
    if (!memberId || !memberGames?.length || !allGames?.length) return []
    const playedIds = new Set(memberGames.map(g => g.gameId))
    const likedCats = new Set(memberGames.map(g => g.gameCategory).filter(Boolean))
    const likedTags = new Set(memberGames.flatMap(g => g.gameTags || []))
    if (!likedCats.size && !likedTags.size) return []

    return allGames
      .filter(g => !playedIds.has(g.id))
      .map(g => {
        let score = 0
        if (likedCats.has(g.category)) score += 2
        ;(g.tags || []).forEach(t => { if (likedTags.has(t)) score++ })
        return { ...g, _score: score }
      })
      .filter(g => g._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 6)
  }, [memberId, memberGames, allGames])

  const getStatus = (gameId) => memberGames?.find(g => g.gameId === gameId)?.status || null
  const getRecord = (gameId) => memberGames?.find(g => g.gameId === gameId) || null

  if (loading) {
    return (
      <div className="px-3 sm:px-4 py-4">
        <div className="flex items-center justify-center gap-2 py-6 mb-2">
          <div className="w-5 h-5 border-2 border-orange-300 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-stone-400 font-medium">正在載入桌遊資料...</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

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

  const cardProps = { memberId, getStatus, getRecord, onToggle, onRate, isRented, getRentalCount }

  return (
    <div className="px-3 sm:px-4 py-4">
      {/* 推薦區塊 */}
      {recommended.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-1.5 mb-3">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-stone-700">根據你的喜好推薦</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {recommended.map(game => (
              <div key={game.id} className="w-40 shrink-0">
                <GameCard game={game} {...cardProps} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-stone-400 font-medium">
          顯示 <span className="text-orange-500 font-bold">{games.length}</span> / {totalCount} 款遊戲
        </p>
        <button
          onClick={() => setShowTips(v => !v)}
          className="text-xs text-amber-600 font-medium flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 active:scale-95 transition-transform"
        >
          使用說明
          <span className={`transition-transform duration-200 ${showTips ? 'rotate-180' : ''}`}>▾</span>
        </button>
      </div>
      {showTips && <GameListTips onClose={() => setShowTips(false)} />}

      {/* Game Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {games.map((game) => (
          <GameCard key={`${game.name}-${game.id}`} game={game} {...cardProps} />
        ))}
      </div>

      <div className="h-8" />
    </div>
  );
}
