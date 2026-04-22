import { useState, useMemo } from 'react';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import GameList from './components/GameList';
import useGoogleSheet from './hooks/useGoogleSheet';

export default function App() {
  const { games, loading, error } = useGoogleSheet();

  const [filters, setFilters] = useState({
    playerCount: '',
    timeRange: '',
    category: '',
  });

  /**
   * 過濾邏輯
   */
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      // 1️⃣ 人數過濾: 輸入人數必須在 minPlayers ~ maxPlayers 之間
      if (filters.playerCount) {
        const count = Number(filters.playerCount);
        if (game.minPlayers !== null && game.maxPlayers !== null) {
          if (count < game.minPlayers || count > game.maxPlayers) {
            return false;
          }
        }
      }

      // 2️⃣ 時間過濾
      if (filters.timeRange) {
        const timeVal = Number(filters.timeRange);
        
        if (timeVal <= 60) {
          // "15分鐘內", "30分鐘內", "1小時內"
          // 遊戲的最小時間應該 <= 選擇的時間上限
          if (game.minTime !== null) {
            if (game.minTime > timeVal) return false;
          } else {
            return false; // 沒有時間資料的不顯示
          }
        } else {
          // "超過1小時" (value = 61)
          // 遊戲的最大時間或最小時間 > 60
          if (game.maxTime !== null) {
            if (game.maxTime <= 60) return false;
          } else if (game.minTime !== null) {
            if (game.minTime <= 60) return false;
          } else {
            return false;
          }
        }
      }

      // 3️⃣ 分類過濾 (目前 categories 欄位尚未填入，預留邏輯)
      if (filters.category) {
        if (game.categories && game.categories.length > 0) {
          if (!game.categories.includes(filters.category)) {
            return false;
          }
        } else {
          // 如果遊戲沒有分類資料，暫時不過濾（等分類資料建好後改為 return false）
          // return false;
        }
      }

      return true;
    });
  }, [games, filters]);

  return (
    <div className="min-h-dvh bg-stone-50">
      <Header />
      <FilterBar filters={filters} onFilterChange={setFilters} />
      <GameList
        games={filteredGames}
        loading={loading}
        error={error}
        totalCount={games.length}
      />
    </div>
  );
}
