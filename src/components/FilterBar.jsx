import { Users, Clock, Tag, RotateCcw, Minus, Plus } from 'lucide-react';

const TIME_OPTIONS = [
  { label: '不限時間', value: '' },
  { label: '15 分鐘內', value: '15' },
  { label: '30 分鐘內', value: '30' },
  { label: '1 小時內', value: '60' },
  { label: '超過 1 小時', value: '61' },
];

const CATEGORY_OPTIONS = [
  { label: '不限類型', value: '' },
  { label: '🎯 策略', value: '策略' },
  { label: '🎉 派對', value: '派對' },
  { label: '🕵️ 陣營', value: '陣營' },
  { label: '👶 兒童', value: '兒童' },
  { label: '💑 雙人', value: '雙人' },
];

export default function FilterBar({ filters, onFilterChange }) {
  const { playerCount, timeRange, category } = filters;

  const handlePlayerChange = (delta) => {
    const newVal = Math.max(0, (playerCount || 0) + delta);
    onFilterChange({ ...filters, playerCount: newVal === 0 ? '' : newVal });
  };

  const handleReset = () => {
    onFilterChange({ playerCount: '', timeRange: '', category: '' });
  };

  const hasActiveFilter = playerCount || timeRange || category;

  return (
    <div className="sticky top-[53px] z-40 bg-white/80 backdrop-blur-lg border-b border-stone-100">
      <div className="px-4 py-3 space-y-3">
        
        {/* Row 1: Player count + Reset */}
        <div className="flex items-center gap-3">
          {/* Player Count */}
          <div className="flex items-center gap-2 flex-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-500">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-stone-600 min-w-[3rem]">人數</span>
            <div className="flex items-center gap-1 bg-stone-50 rounded-xl p-1">
              <button
                onClick={() => handlePlayerChange(-1)}
                disabled={!playerCount || playerCount <= 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-sm text-stone-500 disabled:opacity-30 disabled:shadow-none active:scale-95 transition-all"
                id="player-decrease"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center text-base font-semibold text-stone-800 tabular-nums" id="player-count">
                {playerCount || '-'}
              </span>
              <button
                onClick={() => handlePlayerChange(1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-sm text-stone-500 active:scale-95 transition-all"
                id="player-increase"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Reset Button */}
          {hasActiveFilter && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 rounded-full hover:bg-orange-100 active:scale-95 transition-all"
              id="filter-reset"
            >
              <RotateCcw className="w-3 h-3" />
              清除
            </button>
          )}
        </div>

        {/* Row 2: Time + Category dropdowns */}
        <div className="flex gap-2.5">
          {/* Time Select */}
          <div className="relative flex-1">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-md bg-blue-50 text-blue-400 pointer-events-none">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <select
              value={timeRange}
              onChange={(e) => onFilterChange({ ...filters, timeRange: e.target.value })}
              className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-200/60 rounded-xl text-sm text-stone-700 font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-all"
              id="time-filter"
            >
              {TIME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Category Select */}
          <div className="relative flex-1">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-md bg-purple-50 text-purple-400 pointer-events-none">
              <Tag className="w-3.5 h-3.5" />
            </div>
            <select
              value={category}
              onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
              className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-200/60 rounded-xl text-sm text-stone-700 font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-all"
              id="category-filter"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
