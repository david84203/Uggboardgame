import { useState, useMemo } from 'react';
import Header from './components/Header';
import NavTabs from './components/NavTabs';
import FilterBar from './components/FilterBar';
import GameList from './components/GameList';
import PlaceholderPage from './components/PlaceholderPage';
import useGoogleSheet from './hooks/useGoogleSheet';

export default function App() {
  const { games, loading, error } = useGoogleSheet();
  const [activeTab, setActiveTab] = useState('gamelist');

  const [filters, setFilters] = useState({
    searchQuery: '',
    playerCount: '',
    timeRange: '',
    category: '',
    tags: [],
    onlyHot: false,
  });

  const availableCategories = useMemo(() => {
    const baseCats = ['派對', '陣營', '小品', '兒童', '策略', '雙人', '紙筆', '解謎', '抽象', 'RPG'];
    const sheetCats = games.map((g) => g.category).filter((c) => c && c !== '');
    return Array.from(new Set([...baseCats, ...sheetCats]));
  }, [games]);

  const availableTags = useMemo(() => {
    const allTags = games.flatMap((g) => g.tags).filter((t) => t && t !== '');
    return Array.from(new Set(allTags));
  }, [games]);

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      if (filters.onlyHot && !game.isHot) return false;

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchName = game.name.toLowerCase().includes(query);
        const matchEnglish = game.englishName.toLowerCase().includes(query);
        if (!matchName && !matchEnglish) return false;
      }

      if (filters.playerCount) {
        const count = Number(filters.playerCount);
        if (game.minPlayers !== null && game.maxPlayers !== null) {
          if (count < game.minPlayers || count > game.maxPlayers) return false;
        }
      }

      if (filters.timeRange) {
        if (game.minTime === null) return false;
        const t = game.minTime;
        switch (filters.timeRange) {
          case '0-15':  if (t > 15) return false; break;
          case '15-30': if (t <= 15 || t > 30) return false; break;
          case '30-60': if (t <= 30 || t > 60) return false; break;
          case '60+':   if (t <= 60) return false; break;
          default: break;
        }
      }

      if (filters.category && game.category !== filters.category) return false;

      if (filters.tags && filters.tags.length > 0) {
        if (!filters.tags.every(tag => game.tags.includes(tag))) return false;
      }

      return true;
    });
  }, [games, filters]);

  const renderContent = () => {
    switch (activeTab) {
      case 'consume':
        return <PlaceholderPage title="店內消費方式" icon="💳" />;
      case 'food':
        return <PlaceholderPage title="餐點服務" icon="🍽️" />;
      case 'rent':
        return <PlaceholderPage title="租借遊戲規章" icon="📋" />;
      case 'gamelist':
        return (
          <>
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
          </>
        );
      case 'environment':
        return <PlaceholderPage title="環境介紹" icon="🏠" />;
      case 'member':
        return <PlaceholderPage title="會員專區" icon="⭐" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-dvh">
      <div className="ambient-bg" aria-hidden="true" />
      <Header />
      <NavTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {renderContent()}
    </div>
  );
}
