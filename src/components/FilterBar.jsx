import { useState } from 'react';
import { Users, Clock, Tag, RotateCcw, Minus, Plus, Search, Layers, ChevronDown, ChevronUp, Flame } from 'lucide-react';

const TIME_OPTIONS = [
  { label: '不限時間', value: '' },
  { label: '15 分鐘內', value: '0-15' },
  { label: '15 分鐘至 30 分鐘', value: '15-30' },
  { label: '30 分鐘至 1 小時', value: '30-60' },
  { label: '1 小時以上', value: '60+' },
];

const PLAYER_MODES = [
  { value: '輕鬆', emoji: '😊', desc: '派對 · 兒童', color: 'emerald' },
  { value: '動腦', emoji: '🤔', desc: '陣營 · 解謎', color: 'blue' },
  { value: '超燒腦', emoji: '🧠', desc: '策略 · 抽象', color: 'orange' },
];

export default function FilterBar({ filters, onFilterChange, availableCategories = [], availableTags = [] }) {
  const { searchQuery, playerCount, timeRange, category, tags = [], onlyHot, playerMode = '' } = filters;
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
  const [isCatsExpanded, setIsCatsExpanded] = useState(false);

  const handlePlayerChange = (delta) => {
    const newVal = Math.max(0, (playerCount || 0) + delta);
    onFilterChange({ ...filters, playerCount: newVal === 0 ? '' : newVal });
  };

  const handleReset = () => {
    onFilterChange({ searchQuery: '', playerCount: '', timeRange: '', category: '', tags: [], onlyHot: false, playerMode: '' });
  };

  const togglePlayerMode = (mode) => {
    onFilterChange({ ...filters, playerMode: playerMode === mode ? '' : mode });
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

  const hasActiveFilter = searchQuery || playerCount || timeRange || category || tags.length > 0 || onlyHot || playerMode;

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

        {/* Row 2: 玩家模式快速篩選 */}
        <div className="grid grid-cols-3 gap-2">
          {PLAYER_MODES.map(({ value, emoji, desc, color }) => {
            const isActive = playerMode === value;
            const colorMap = {
              emerald: isActive
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-200/60'
                : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50',
              blue: isActive
                ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-200/60'
                : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50',
              orange: isActive
                ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200/60'
                : 'bg-white text-orange-700 border-orange-200 hover:bg-orange-50',
            };
            return (
              <button
                key={value}
                onClick={() => togglePlayerMode(value)}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl border font-semibold transition-all cursor-pointer ${colorMap[color]}`}
              >
                <span className="text-lg leading-none">{emoji}</span>
                <span className="text-sm font-bold">{value}</span>
                <span className={`text-[10px] font-medium ${isActive ? 'text-white/80' : 'text-stone-400'}`}>{desc}</span>
              </button>
            );
          })}
        </div>

        {/* Row 3: Player count + Reset & Time */}
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

          <button
            onClick={() => {
              const nextOnlyHot = !onlyHot;
              if (nextOnlyHot) {
                // If turning ON, clear other specific filters to show all hot games directly
                onFilterChange({ 
                  ...filters, 
                  onlyHot: true,
                  playerCount: '',
                  timeRange: '',
                  category: '',
                  tags: []
                });
              } else {
                onFilterChange({ ...filters, onlyHot: false });
              }
            }}
            className={`flex items-center gap-1.5 px-3 h-9 rounded-xl text-sm font-bold transition-all shrink-0 cursor-pointer border ${
              onlyHot 
                ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-200' 
                : 'bg-white text-red-500 border-red-100 hover:bg-red-50'
            }`}
          >
            <Flame className={`w-4 h-4 ${onlyHot ? 'fill-white' : 'fill-red-500'}`} />
            <span>店內熱門</span>
          </button>

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
          <div className="flex flex-col gap-2 pb-1 border-t border-stone-100 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-50 text-purple-500 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-stone-600">遊戲分類 ({availableCategories.length})</span>
              </div>
              <button 
                onClick={() => setIsCatsExpanded(!isCatsExpanded)}
                className="flex items-center gap-1 text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1.5 rounded-lg hover:bg-purple-100 transition-colors"
              >
                {isCatsExpanded ? '收起分類' : '展開分類'}
                {isCatsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Content: show all if expanded, or just selected if collapsed */}
            {(isCatsExpanded || category) && (
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {(isCatsExpanded ? availableCategories : [category].filter(Boolean)).map(cat => (
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
          </div>
        )}

        {/* Row 4: Tags Pills */}
        {availableTags.length > 0 && (
          <div className="flex flex-col gap-2 pb-1 border-t border-stone-100 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 shrink-0">
                  <Tag className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-stone-600">遊戲標籤 ({availableTags.length})</span>
              </div>
              <button 
                onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                {isTagsExpanded ? '收起標籤' : '展開標籤'}
                {isTagsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Content: show all if expanded, or just selected if collapsed */}
            {(isTagsExpanded || tags.length > 0) && (
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {(isTagsExpanded ? availableTags : tags).map(tag => (
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
        )}
        
      </div>
    </div>
  );
}
