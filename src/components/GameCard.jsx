import { useState } from 'react';
import { Users, Clock, MapPin, Star, ExternalLink, Gamepad2 } from 'lucide-react';

export default function GameCard({ game }) {
  const [imgError, setImgError] = useState(false);

  const {
    id,
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

  // Extract BGG ID from BGG link
  const bggIdMatch = bggLink?.match(/boardgamegeek\.com\/boardgame\/(\d+)/);
  const bggId = bggIdMatch ? bggIdMatch[1] : null;

  // Initial image source (BGG ID or CSV index fallback)
  const imgSrc = bggId ? `/images/${bggId}.jpg` : `/images/row-${id}.jpg`;

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
    <div className="game-card animate-fade-in-up bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col h-full">
      {/* Image Section */}
      {!imgError ? (
        <img
          src={imgSrc}
          alt={name}
          className="h-48 w-full object-cover shrink-0"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="h-48 w-full bg-gradient-to-br from-stone-100 to-stone-200 shrink-0 flex items-center justify-center">
          <Gamepad2 className="w-16 h-16 text-stone-300" strokeWidth={1.5} />
        </div>
      )}

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Top: Name + Rating */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-stone-900 leading-snug break-words" id={`game-name-${game.id}`}>
              {name}
            </h3>
            {englishName && englishName !== 'N/A' && (
              <p className="text-sm text-stone-500 font-medium mt-1 break-words">
                {englishName}
              </p>
            )}
          </div>
          
          {/* Rating Badge */}
          {rating && (
            <div className="flex flex-col items-center justify-center px-2.5 py-1.5 bg-amber-50 rounded-xl shrink-0 min-w-[3rem]">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span className="text-sm font-bold text-amber-700 tabular-nums">{rating.toFixed(1)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Category Badges */}
        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {categories.map((cat) => (
              <span
                key={cat}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold badge-${cat}`}
              >
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4 flex-1">
          {/* Players */}
          <div className="flex items-center gap-2 text-stone-600">
            <div className="p-1.5 bg-orange-50 rounded-lg">
              <Users className="w-4 h-4 text-orange-500" />
            </div>
            <span className="text-sm font-medium">{playersDisplay}</span>
          </div>

          {/* Play Time */}
          {timeDisplay && (
            <div className="flex items-center gap-2 text-stone-600">
              <div className="p-1.5 bg-blue-50 rounded-lg">
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-sm font-medium">{timeDisplay}</span>
            </div>
          )}

          {/* Location */}
          {location && (
            <div className="flex items-center gap-2 text-stone-600">
              <div className="p-1.5 bg-emerald-50 rounded-lg">
                <MapPin className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-sm font-bold text-emerald-700">
                {location}
              </span>
            </div>
          )}

          {/* Weight */}
          {weightLabel && (
            <div className="flex items-center gap-2 text-stone-600">
              <div className="p-1.5 bg-purple-50 rounded-lg">
                <span className="text-sm leading-none block">⚖️</span>
              </div>
              <span className="text-sm font-medium">{weightLabel} <span className="text-stone-400">({weight.toFixed(1)})</span></span>
            </div>
          )}
        </div>

        {/* Language Badge + BGG Link */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-100 mt-auto">
          <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-md uppercase tracking-wide">
            {language || '中文版'}
          </span>
          
          {bggLink && bggLink !== 'N/A' && (
            <a
              href={bggLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors"
            >
              BGG 頁面
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
