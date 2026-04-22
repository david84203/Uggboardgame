import { Users, Clock, MapPin, Star, ExternalLink } from 'lucide-react';

export default function GameCard({ game }) {
  const {
    name,
    englishName,
    language,
    minPlayers,
    maxPlayers,
    playersRaw,
    location,
    rating,
    minTime,
    maxTime,
    playTimeRaw,
    weight,
    bggLink,
    categories,
  } = game;

  // 格式化人數顯示
  const playersDisplay = playersRaw || `${minPlayers}${maxPlayers && maxPlayers !== minPlayers ? `-${maxPlayers}` : ''} 人`;

  // 格式化時間顯示
  const timeDisplay = playTimeRaw && playTimeRaw !== 'N/A' ? `${playTimeRaw} 分鐘` : null;

  // 難度等級文字
  const getWeightLabel = (w) => {
    if (!w) return null;
    if (w < 1.5) return '入門';
    if (w < 2.5) return '簡單';
    if (w < 3.5) return '中等';
    if (w < 4.5) return '困難';
    return '專家';
  };

  const weightLabel = getWeightLabel(weight);

  return (
    <div className="game-card animate-fade-in-up bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
      {/* Card Body */}
      <div className="p-4">
        {/* Top: Name + Rating */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-stone-900 leading-snug truncate" id={`game-name-${game.id}`}>
              {name}
            </h3>
            {englishName && englishName !== 'N/A' && (
              <p className="text-xs text-stone-400 font-medium mt-0.5 truncate">
                {englishName}
              </p>
            )}
          </div>
          
          {/* Rating Badge */}
          {rating && (
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-lg shrink-0">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span className="text-xs font-bold text-amber-700 tabular-nums">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Category Badges */}
        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {categories.map((cat) => (
              <span
                key={cat}
                className={`px-2 py-0.5 rounded-md text-xs font-semibold badge-${cat}`}
              >
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Info Grid */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5">
          {/* Players */}
          <div className="flex items-center gap-1.5 text-stone-500">
            <Users className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-medium">{playersDisplay}</span>
          </div>

          {/* Play Time */}
          {timeDisplay && (
            <div className="flex items-center gap-1.5 text-stone-500">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-medium">{timeDisplay}</span>
            </div>
          )}

          {/* Location */}
          {location && (
            <div className="flex items-center gap-1.5 text-stone-500">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                {location}
              </span>
            </div>
          )}

          {/* Weight */}
          {weightLabel && (
            <div className="flex items-center gap-1.5 text-stone-500">
              <span className="text-xs">⚖️</span>
              <span className="text-xs font-medium">{weightLabel} ({weight.toFixed(1)})</span>
            </div>
          )}
        </div>

        {/* Language Badge + BGG Link */}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-stone-50">
          <span className="text-[10px] font-semibold text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
            {language || '中'}
          </span>
          
          {bggLink && bggLink !== 'N/A' && (
            <a
              href={bggLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] font-medium text-blue-400 hover:text-blue-600 transition-colors"
            >
              BGG
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
