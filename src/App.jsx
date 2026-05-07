import { useState, useMemo } from 'react';
import Header from './components/Header';
import NavTabs from './components/NavTabs';
import FilterBar from './components/FilterBar';
import GameList from './components/GameList';
import PlaceholderPage from './components/PlaceholderPage';
import ConsumePage from './components/pages/ConsumePage';
import FoodPage from './components/pages/FoodPage';
import EscapeRoomPage from './components/pages/EscapeRoomPage';
import AgricolaScoreCalculator from './components/pages/AgricolaScoreCalculator';
import HelperMenuPage from './components/pages/HelperMenuPage';
import ChessClockPage from './components/pages/ChessClockPage';
import CheeseThiefPage from './components/pages/CheeseThiefPage';
import BladesAndRosePage from './components/pages/BladesAndRosePage';
import StarPlayerPage from './components/pages/StarPlayerPage';
import RentRulesPage from './components/pages/RentRulesPage';
import MemberPage from './components/pages/MemberPage';
import useGoogleSheet from './hooks/useGoogleSheet';

export default function App() {
  const { games, loading, error } = useGoogleSheet();
  const [activeTab, setActiveTab] = useState('home');

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
        return <ConsumePage />;
      case 'food':
        return <FoodPage />;
      case 'rent':
        return <RentRulesPage />;
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
        return <MemberPage />;
      case 'helper-menu':
        return <HelperMenuPage onSelect={setActiveTab} />;
      case 'helper-agricola':
        return <AgricolaScoreCalculator />;
      case 'helper-clock':
        return <ChessClockPage />;
      case 'helper-cheese-thief':
        return <CheeseThiefPage />;
      case 'helper-blades-rose':
        return <BladesAndRosePage />;
      case 'helper-star-player':
        return <StarPlayerPage />;
      case 'escape':
        return <EscapeRoomPage />;

      default:
        return null;
    }
  };

  const handleBack = () => {
    if (activeTab === 'helper-agricola' || activeTab === 'helper-clock' || activeTab === 'helper-cheese-thief' || activeTab === 'helper-blades-rose' || activeTab === 'helper-star-player') {
      setActiveTab('helper-menu');
    } else {
      setActiveTab('home');
    }
  };

  return (
    <div className="min-h-dvh">
      <div className="ambient-bg" aria-hidden="true" />
      <Header 
        showBackButton={activeTab !== 'home'} 
        onBack={handleBack} 
      />
      {activeTab === 'home' ? (
        <div className="pt-8 px-2 pb-10">
          <NavTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      ) : (
        renderContent()
      )}
    </div>
  );
}
