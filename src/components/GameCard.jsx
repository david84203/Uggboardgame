import { useState, useEffect } from 'react';
import { Users, Clock, MapPin, Star, ExternalLink, Gamepad2, X, Flame } from 'lucide-react';

export default function GameCard({ game }) {
  const [imgError, setImgError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

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
    category,
    tags,
    isHot,
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
  
  const displayCategories = category ? [category] : [];
  // All tags combined for the bottom row
  const allBadges = [...displayCategories, ...(tags || [])].slice(0, 4); // Max 4 badges to prevent overflow

  return (
    <>
      <div 
        className="game-card animate-fade-in-up bg-white rounded-[14px] shadow-sm border-2 border-[#e6d9b6] p-3 hover:shadow-md transition-shadow duration-300 flex flex-col h-full cursor-pointer relative group"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Hot Badge Absolute */}
        {isHot && (
          <div className="absolute -top-2 -right-2 z-10 flex items-center gap-0.5 px-2 py-1 bg-red-500 text-white rounded-full shadow-md">
             <Flame className="w-3 h-3 fill-white" />
             <span className="text-[10px] font-bold">熱門</span>
          </div>
        )}

        {/* Image Section */}
        <div className="relative h-32 sm:h-40 w-full overflow-hidden shrink-0 rounded-lg mb-3 bg-stone-100">
          {!imgError ? (
            <img
              src={imgSrc}
              alt={name}
              className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center">
              <Gamepad2 className="w-10 h-10 text-stone-300" strokeWidth={1.5} />
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="flex flex-col flex-1">
          {/* Title */}
          <h3 className="text-base sm:text-lg font-bold text-stone-800 leading-snug mb-1 truncate" id={`game-name-${game.id}`}>
            {name}
          </h3>
          
          {/* Subtitle / Description (English Name) */}
          <p className="text-[13px] text-stone-500 font-medium truncate mb-3">
            {englishName && englishName !== 'N/A' ? englishName : '經典桌遊推薦...'}
          </p>

          {/* Info Rows */}
          <div className="flex items-center gap-2 mb-3">
            {/* Players */}
            <div className="flex items-center gap-1.5 w-1/2">
              <Users className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-[13px] text-stone-600 truncate">{playersDisplay}</span>
            </div>

            {/* Difficulty / Rating */}
            <div className="flex items-center gap-1.5 w-1/2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
              <span className="text-[13px] text-stone-600 truncate">
                難度: {weightLabel || '普通'}
              </span>
            </div>
          </div>

          {/* Badges / Tags (Bottom) */}
          <div className="flex flex-wrap gap-1.5 mt-auto pt-2 border-t border-stone-100/50">
            {allBadges.map((badge, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f0e6c8] text-[#8c7335]"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Modal Overlay */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-sm" 
          onClick={() => setIsModalOpen(false)}
        >
          {/* Modal Container */}
          <div 
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-md transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="overflow-y-auto no-scrollbar">
              {/* Large Image Header */}
              {!imgError ? (
                <img
                  src={imgSrc}
                  alt={name}
                  className="w-full h-64 sm:h-72 object-cover object-top"
                />
              ) : (
                 <div className="w-full h-64 sm:h-72 bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center">
                   <Gamepad2 className="w-20 h-20 text-stone-300" strokeWidth={1.5} />
                 </div>
              )}

              {/* Modal Content Body */}
              <div className="p-6">
                {/* Title Section */}
                <div className="mb-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h2 className="text-2xl font-extrabold text-stone-900 leading-tight">
                        {name}
                      </h2>
                      {englishName && englishName !== 'N/A' && (
                        <p className="text-stone-500 font-medium mt-1">
                          {englishName}
                        </p>
                      )}
                    </div>
                    {isHot && (
                      <div className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-600 rounded-xl border border-red-100/50 shrink-0">
                        <Flame className="w-4 h-4 fill-red-500" />
                        <span className="text-xs font-bold whitespace-nowrap">店內熱門</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Badges Row */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {rating && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-lg text-amber-700">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                        <span className="text-sm font-bold">{rating.toFixed(1)} 評分</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 rounded-lg text-stone-600">
                      <span className="text-sm font-bold uppercase tracking-wider">{language || '中文版'}</span>
                    </div>
                  </div>
                </div>

                {/* Info Grid (Detailed) */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Players */}
                  <div className="flex items-center gap-3 p-3 bg-orange-50/50 border border-orange-100/50 rounded-xl">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-orange-500">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[11px] text-stone-500 font-medium mb-0.5">遊玩人數</p>
                      <p className="text-sm font-bold text-stone-800">{playersDisplay}</p>
                    </div>
                  </div>

                  {/* Play Time */}
                  {timeDisplay && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50/50 border border-blue-100/50 rounded-xl">
                      <div className="p-2 bg-white rounded-lg shadow-sm text-blue-500">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[11px] text-stone-500 font-medium mb-0.5">預計時間</p>
                        <p className="text-sm font-bold text-stone-800">{timeDisplay}</p>
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  {location && (
                    <div className="flex items-center gap-3 p-3 bg-emerald-50/50 border border-emerald-100/50 rounded-xl">
                      <div className="p-2 bg-white rounded-lg shadow-sm text-emerald-500">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[11px] text-stone-500 font-medium mb-0.5">放置櫃位</p>
                        <p className="text-sm font-bold text-emerald-800">{location}</p>
                      </div>
                    </div>
                  )}

                  {/* Weight */}
                  {weightLabel && (
                    <div className="flex items-center gap-3 p-3 bg-purple-50/50 border border-purple-100/50 rounded-xl">
                      <div className="p-2 bg-white rounded-lg shadow-sm text-purple-500">
                        <span className="text-lg leading-none block">⚖️</span>
                      </div>
                      <div>
                        <p className="text-[11px] text-stone-500 font-medium mb-0.5">難度評級</p>
                        <p className="text-sm font-bold text-stone-800">{weightLabel} <span className="text-stone-400 font-medium">({weight.toFixed(1)})</span></p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Categories and Tags */}
                {(displayCategories.length > 0 || tags?.length > 0) && (
                  <div className="mb-6 space-y-4">
                    {displayCategories.length > 0 && (
                      <div>
                        <p className="text-xs text-stone-500 font-bold mb-2">分類</p>
                        <div className="flex flex-wrap gap-1.5">
                          {displayCategories.map((cat) => (
                            <span key={cat} className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-md text-sm font-bold">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {tags?.length > 0 && (
                      <div>
                        <p className="text-xs text-stone-500 font-bold mb-2">標籤</p>
                        <div className="flex flex-wrap gap-1.5">
                          {tags.map((tag) => (
                            <span key={tag} className="px-2.5 py-1 bg-stone-100 text-stone-600 border border-stone-200 rounded-md text-xs font-semibold">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Action */}
                {bggLink && bggLink !== 'N/A' && (
                  <div className="pt-6 border-t border-stone-100">
                    <a
                      href={bggLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-bold transition-colors"
                    >
                      前往 BGG 查看完整頁面
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
