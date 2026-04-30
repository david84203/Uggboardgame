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
      // 🔴 熱門遊戲過濾 (優先檢查)
      if (filters.onlyHot && !game.isHot) {
        return false;
      }

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

      // 2️⃣ 時間過濾：依 minTime 互斥分配，每款遊戲只會出現在一個區間
      // 邊界規則（左開右閉）：15→「15分鐘內」、30→「15-30」、60→「30-60」、>60→「1小時以上」
      if (filters.timeRange) {
        if (game.minTime === null) return false;
        const t = game.minTime;
        switch (filters.timeRange) {
          case '0-15':
            if (t > 15) return false;
            break;
          case '15-30':
            if (t <= 15 || t > 30) return false;
            break;
          case '30-60':
            if (t <= 30 || t > 60) return false;
            break;
          case '60+':
            if (t <= 60) return false;
            break;
          default:
            break;
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

      return true;
    });
  }, [games, filters]);

  return (
    <div className="min-h-dvh">
      <div className="ambient-bg" aria-hidden="true" />
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
