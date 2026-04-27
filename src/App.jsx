import { useState, useMemo } from 'react';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import GameList from './components/GameList';
import useGoogleSheet from './hooks/useGoogleSheet';

export default function App() {
  const { games, loading, error } = useGoogleSheet();

  const [filters, setFilters] = useState({
    searchQuery: '',
    playerCount: '',
    timeRange: '',
    category: '',
    tags: [],
    onlyHot: false,
  });

  // 動態取得所有可用分類與標籤，並預先放入核心類別
  const availableCategories = useMemo(() => {
    const baseCats = ['派對', '陣營', '小品', '兒童', '策略', '雙人', '紙筆', '解謎', '抽象', 'RPG'];
    const sheetCats = games.map((g) => g.category).filter((c) => c && c !== '');
    return Array.from(new Set([...baseCats, ...sheetCats]));
  }, [games]);

  const availableTags = useMemo(() => {
    const allTags = games.flatMap((g) => g.tags).filter((t) => t && t !== '');
    return Array.from(new Set(allTags));
  }, [games]);

  /**
   * 過濾邏輯
   */
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      // 0️⃣ 搜尋列過濾 (包含字元即可)
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchName = game.name.toLowerCase().includes(query);
        const matchEnglish = game.englishName.toLowerCase().includes(query);
        if (!matchName && !matchEnglish) {
          return false;
        }
      }

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

      // 3️⃣ 分類過濾 (單選)
      if (filters.category) {
        if (game.category !== filters.category) {
          return false;
        }
      }

      // 4️⃣ 標籤過濾 (多選 - 交集)
      if (filters.tags && filters.tags.length > 0) {
        const hasAllTags = filters.tags.every(selectedTag => game.tags.includes(selectedTag));
        if (!hasAllTags) {
          return false;
        }
      }

      // 5️⃣ 熱門遊戲過濾
      if (filters.onlyHot && !game.isHot) {
        return false;
      }

      return true;
    });
  }, [games, filters]);

  return (
    <div className="min-h-dvh bg-stone-50">
      <Header />
      <FilterBar 
        filters={filters} 
        onFilterChange={setFilters} 
        availableCategories={availableCategories}
        availableTags={availableTags}
      />
      <GameList
        games={filteredGames}
        loading={loading}
        error={error}
        totalCount={games.length}
      />
    </div>
  );
}
