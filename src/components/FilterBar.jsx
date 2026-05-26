import { useState } from 'react';
import { Users, Clock, Tag, RotateCcw, Minus, Plus, Search, Layers, ChevronDown, ChevronUp, Flame, SlidersHorizontal, X, PlayCircle } from 'lucide-react';

const TIME_OPTIONS = [
  { label: '不限時間', value: '' },
  { label: '15 分鐘內', value: '0-15' },
  { label: '15-30 分鐘', value: '15-30' },
  { label: '30-60 分鐘', value: '30-60' },
  { label: '1 小時以上', value: '60+' },
];

const TIME_LABELS = { '0-15': '15分內', '15-30': '15-30分', '30-60': '30-60分', '60+': '1小時+' };

const PLAYER_MODES = [
  { value: '',        emoji: '🎲', label: '全部',  desc: '不限難度', color: 'stone' },
  { value: '輕鬆',   emoji: '😊', label: '輕鬆',  desc: '派對·兒童', color: 'emerald' },
  { value: '動腦',   emoji: '🤔', label: '動腦',  desc: '陣營·解謎', color: 'blue' },
  { value: '超燒腦', emoji: '🧠', label: '超燒腦', desc: '策略·抽象', color: 'orange' },
];

const MODE_ACTIVE = {
  stone:   'bg-stone-600 text-white border-stone-600 shadow-md',
  emerald: 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-200/60',
  blue:    'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-200/60',
  orange:  'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200/60',
};
const MODE_IDLE = {
  stone:   'bg-white text-stone-600 border-stone-200 hover:bg-stone-50',
  emerald: 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50',
  blue:    'bg-white text-blue-700 border-blue-200 hover:bg-blue-50',
  orange:  'bg-white text-orange-700 border-orange-200 hover:bg-orange-50',
};

export default function FilterBar({ filters, onFilterChange, availableCategories = [], availableTags = [] }) {
  const { searchQuery, playerCount, timeRange, category, tags = [], onlyHot, onlyTutorial = false, playerMode = '' } = filters;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
  const [isCatsExpanded, setIsCatsExpanded] = useState(false);

  const handlePlayerChange = (delta) => {
    const newVal = Math.max(0, (playerCount || 0) + delta);
    onFilterChange({ ...filters, playerCount: newVal === 0 ? '' : newVal });
  };

  const handleReset = () => {
    onFilterChange({ searchQuery: '', playerCount: '', timeRange: '', category: '', tags: [], onlyHot: false, onlyTutorial: false, playerMode: '' });
  };

  const togglePlayerMode = (mode) => {
    onFilterChange({ ...filters, playerMode: mode });
  };

  const hasActiveFilter = searchQuery || playerCount || timeRange || category || tags.length > 0 || onlyHot || onlyTutorial || playerMode;
  const activeFilterCount = [playerMode, playerCount, timeRange, category, onlyHot, onlyTutorial].filter(Boolean).length + tags.length;

  const activeChips = [
    playerMode && { label: PLAYER_MODES.find(m => m.value === playerMode)?.emoji + ' ' + playerMode, key: 'playerMode', onRemove: () => onFilterChange({ ...filters, playerMode: '' }) },
    playerCount && { label: `👥 ${playerCount}人`, key: 'playerCount', onRemove: () => onFilterChange({ ...filters, playerCount: '' }) },
    timeRange && { label: `⏱ ${TIME_LABELS[timeRange]}`, key: 'timeRange', onRemove: () => onFilterChange({ ...filters, timeRange: '' }) },
    category && { label: `🏷 ${category}`, key: 'category', onRemove: () => onFilterChange({ ...filters, category: '' }) },
    onlyHot && { label: '🔥 熱門', key: 'onlyHot', onRemove: () => onFilterChange({ ...filters, onlyHot: false }) },
    onlyTutorial && { label: '▶ 教學', key: 'onlyTutorial', onRemove: () => onFilterChange({ ...filters, onlyTutorial: false }) },
    ...tags.map(tag => ({ label: tag, key: `tag-${tag}`, onRemove: () => onFilterChange({ ...filters, tags: tags.filter(t => t !== tag) }) })),
  ].filter(Boolean);

  return (
    <div className="sticky top-[53px] z-40 bg-white/80 backdrop-blur-lg border-b border-stone-100 shadow-sm">
      <div className="px-4 py-3 space-y-2.5">

        {/* Row 1: 搜尋欄 + 篩選按鈕 */}
        <div className="flex gap-2">
          <div className="relative flex-1">
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
          <button
            onClick={() => setIsExpanded(v => !v)}
            className={`relative flex items-center gap-1.5 px-3 h-9 rounded-xl text-sm font-bold transition-all shrink-0 cursor-pointer border ${
              isExpanded || activeFilterCount > 0
                ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
            <span>{isExpanded ? '收合' : '篩選'}</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* 已選條件標籤（收合時顯示） */}
        {!isExpanded && activeChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 items-center">
            {activeChips.map(chip => (
              <span key={chip.key} className="flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-xs font-semibold">
                {chip.label}
                <button onClick={chip.onRemove} className="hover:text-red-500 transition-colors cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button onClick={handleReset} className="text-xs text-stone-400 hover:text-red-400 font-medium transition-colors cursor-pointer">
              全部清除
            </button>
          </div>
        )}

        {/* 展開的篩選面板 */}
        {isExpanded && (
          <>
            {/* 玩家模式 */}
            <div className="grid grid-cols-4 gap-1.5">
              {PLAYER_MODES.map(({ value, emoji, label, desc, color }) => {
                const isActive = playerMode === value;
                return (
                  <button
                    key={value}
                    onClick={() => togglePlayerMode(value)}
                    className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl border font-semibold transition-all cursor-pointer ${isActive ? MODE_ACTIVE[color] : MODE_IDLE[color]}`}
                  >
                    <span className="text-base leading-none">{emoji}</span>
                    <span className="text-xs font-bold">{label}</span>
                    <span className={`text-[9px] font-medium leading-tight text-center ${isActive ? 'text-white/80' : 'text-stone-400'}`}>{desc}</span>
                  </button>
                );
              })}
            </div>

            {/* 人數 + 時間 + 熱門 + 清除 */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-500 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1 bg-white border border-stone-100 rounded-xl p-1 shadow-sm shrink-0">
                  <button
                    onClick={() => handlePlayerChange(-1)}
                    disabled={!playerCount || playerCount <= 0}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-500 disabled:opacity-30 transition-all cursor-pointer disabled:cursor-auto"
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

              <div className="relative flex-1 min-w-0">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-md bg-blue-50 text-blue-400 pointer-events-none">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <select
                  value={timeRange || ''}
                  onChange={(e) => onFilterChange({ ...filters, timeRange: e.target.value })}
                  className="w-full pl-9 pr-8 py-2 bg-white border border-stone-100 shadow-sm rounded-xl text-sm text-stone-700 font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all cursor-pointer"
                >
                  {TIME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                  onFilterChange({ ...filters, onlyHot: !onlyHot, ...(!onlyHot ? { playerCount: '', timeRange: '', category: '', tags: [] } : {}) });
                }}
                className={`flex items-center gap-1 px-2.5 h-9 rounded-xl text-sm font-bold transition-all shrink-0 cursor-pointer border ${
                  onlyHot ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-200' : 'bg-white text-red-500 border-red-100 hover:bg-red-50'
                }`}
              >
                <Flame className={`w-4 h-4 ${onlyHot ? 'fill-white' : 'fill-red-500'}`} />
                <span>熱門</span>
              </button>

              <button
                onClick={() => onFilterChange({ ...filters, onlyTutorial: !onlyTutorial })}
                className={`flex items-center gap-1 px-2.5 h-9 rounded-xl text-sm font-bold transition-all shrink-0 cursor-pointer border ${
                  onlyTutorial ? 'bg-purple-500 text-white border-purple-500 shadow-md shadow-purple-200' : 'bg-white text-purple-500 border-purple-100 hover:bg-purple-50'
                }`}
              >
                <PlayCircle className={`w-4 h-4 ${onlyTutorial ? 'fill-white text-purple-500' : 'text-purple-500'}`} />
                <span>教學</span>
              </button>

              {hasActiveFilter && (
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center w-9 h-9 text-orange-600 bg-orange-50 rounded-xl hover:bg-orange-100 active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 分類 */}
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
                    onClick={() => setIsCatsExpanded(v => !v)}
                    className="flex items-center gap-1 text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1.5 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    {isCatsExpanded ? '收起' : '展開'}
                    {isCatsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {(isCatsExpanded || category) && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(isCatsExpanded ? availableCategories : [category].filter(Boolean)).map(cat => (
                      <button
                        key={cat}
                        onClick={() => onFilterChange({ ...filters, category: category === cat ? '' : cat })}
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

            {/* 標籤 */}
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
                    onClick={() => setIsTagsExpanded(v => !v)}
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    {isTagsExpanded ? '收起' : '展開'}
                    {isTagsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {(isTagsExpanded || tags.length > 0) && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(isTagsExpanded ? availableTags : tags).map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          const newTags = tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag];
                          onFilterChange({ ...filters, tags: newTags });
                        }}
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
          </>
        )}

      </div>
    </div>
  );
}
