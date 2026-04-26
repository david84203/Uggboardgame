import { Users, Clock, Tag, RotateCcw, Minus, Plus, Search, Layers } from 'lucide-react';

const TIME_OPTIONS = [
  { label: '不限時間', value: '' },
  { label: '15 分鐘內', value: '15' },
  { label: '30 分鐘內', value: '30' },
  { label: '1 小時內', value: '60' },
  { label: '超過 1 小時', value: '61' },
];

export default function FilterBar({ filters, onFilterChange, availableCategories = [], availableTags = [] }) {
  const { searchQuery, playerCount, timeRange, category, tags = [] } = filters;

  const handlePlayerChange = (delta) => {
    const newVal = Math.max(0, (playerCount || 0) + delta);
    onFilterChange({ ...filters, playerCount: newVal === 0 ? '' : newVal });
  };

  const handleReset = () => {
    onFilterChange({ searchQuery: '', playerCount: '', timeRange: '', category: '', tags: [] });
  };

  const toggleTag = (tag) => {
    const newTags = tags.includes(tag) 
      ? tags.filter(t => t !== tag) 
      : [...tags, tag];
    onFilterChange({ ...filters, tags: newTags });
  };

  const toggleCategory = (cat) => {
    const newCat = category === cat ? '' : cat;
    onFilterChange({ ...filters, category: newCat });
  };

  const hasActiveFilter = searchQuery || playerCount || timeRange || category || tags.length > 0;

  return (
    <div className="sticky top-[53px] z-40 bg-white/80 backdrop-blur-lg border-b border-stone-100 shadow-sm">
      <div className="px-4 py-3 space-y-3">
        
        {/* Row 1: Search Bar */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="搜尋遊戲名稱 (中/英文)..."
            value={searchQuery || ''}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-all shadow-sm"
          />
        </div>

        {/* Row 2: Player count + Reset & Time */}
        <div className="flex items-center gap-3">
          {/* Player Count */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-500 shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1 bg-white border border-stone-100 rounded-xl p-1 shadow-sm shrink-0">
              <button
                onClick={() => handlePlayerChange(-1)}
                disabled={!playerCount || playerCount <= 0}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-500 disabled:opacity-30 disabled:hover:bg-stone-50 transition-all cursor-pointer disabled:cursor-auto"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center text-sm font-semibold text-stone-800 tabular-nums">
                {playerCount || '-'}
              </span>
              <button
                onClick={() => handlePlayerChange(1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-500 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Time Select */}
          <div className="relative flex-1 min-w-0">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-md bg-blue-50 text-blue-400 pointer-events-none">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <select
              value={timeRange || ''}
              onChange={(e) => onFilterChange({ ...filters, timeRange: e.target.value })}
              className="w-full pl-9 pr-8 py-2 bg-white border border-stone-100 shadow-sm rounded-xl text-sm text-stone-700 font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-all truncate cursor-pointer"
            >
              {TIME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Reset Button */}
          {hasActiveFilter && (
            <button
              onClick={handleReset}
              className="flex items-center justify-center w-9 h-9 text-orange-600 bg-orange-50 rounded-xl hover:bg-orange-100 active:scale-95 transition-all shrink-0 cursor-pointer"
              title="清除所有篩選"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Row 3: Categories Pills */}
        {availableCategories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pb-1">
             <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-50 text-purple-500 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            {availableCategories.map(cat => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                  category === cat 
                    ? 'bg-purple-500 text-white border-purple-500 shadow-md shadow-purple-200/50 scale-105' 
                    : 'bg-white text-stone-600 border-stone-200 hover:border-purple-300 hover:bg-purple-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Row 4: Tags Pills */}
        {availableTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pb-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            {availableTags.map(tag => (
               <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                  tags.includes(tag)
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-200/50 scale-105' 
                    : 'bg-white text-stone-600 border-stone-200 hover:border-emerald-300 hover:bg-emerald-50'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
        
      </div>
    </div>
  );
}
