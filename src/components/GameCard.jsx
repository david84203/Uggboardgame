import { useState, useEffect } from 'react';
import { Users, Clock, MapPin, Star, ExternalLink, Gamepad2, X, Flame, PlayCircle } from 'lucide-react';

function extractYoutubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

export default function GameCard({ game }) {
  const [imgSrcIndex, setImgSrcIndex] = useState(0);
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
    sticker,
    price,
    rental,
    youtubeLink,
    source,
  } = game;

  const youtubeId = extractYoutubeId(youtubeLink);

  const STICKER_COLORS = {
    '紅色': '#ef4444',
    '綠色': '#22c55e',
    '黃色': '#eab308',
    '藍色': '#3b82f6',
    '橘色': '#f97316',
    '紫色': '#a855f7',
    '粉色': '#ec4899',
  };
  const STICKER_LABELS = {
    '綠色': '平易近人的規則，適合新手玩家',
    '黃色': '假日不提供教學服務',
    '紅色': '不提供教學，需自行研究規則',
  };
  const stickerColor = sticker ? STICKER_COLORS[sticker] || null : null;
  const stickerLabel = sticker ? (STICKER_LABELS[sticker] || sticker) : null;

  // Extract BGG ID from BGG link
  const bggIdMatch = bggLink?.match(/boardgamegeek\.com\/boardgame\/(\d+)/);
  const bggId = bggIdMatch ? bggIdMatch[1] : null;

  // Image sources to try in order: bggId.jpg → bggId.webp → bggId.png → row-{id}.jpg → row-{id}.webp → row-{id}.png
  const imgSources = [
    bggId ? `/images/${bggId}.jpg` : null,
    bggId ? `/images/${bggId}.webp` : null,
    bggId ? `/images/${bggId}.png` : null,
    `/images/row-${id}.jpg`,
    `/images/row-${id}.webp`,
    `/images/row-${id}.png`,
  ].filter(Boolean);

  const imgSrc = imgSources[imgSrcIndex] ?? null;
  const imgError = imgSrcIndex >= imgSources.length;

  const handleImgError = () => setImgSrcIndex(i => i + 1);

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
  // All tags combined for the bottom row, prioritizing Hot badge
  const allBadges = [
    ...(isHot ? ['🔥 熱門'] : []),
    ...displayCategories, 
    ...(tags || [])
  ].slice(0, 4); // Max 4 badges to prevent overflow

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
              onError={handleImgError}
            />
          ) : (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-stone-50">
              <img src="/images/LOGO.jpg" alt="Logo" className="w-16 h-16 object-contain opacity-20 grayscale" />
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="flex flex-col flex-1">
          {/* Title */}
          <h3 className="text-base sm:text-lg font-bold text-stone-800 leading-snug mb-1 flex items-center gap-1.5 truncate" id={`game-name-${game.id}`}>
            {stickerColor && (
              <span
                className="inline-block shrink-0 w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: stickerColor }}
                title={stickerLabel}
              />
            )}
            <span className="truncate">{name}</span>
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

          {/* Badges / Tags + 租金 (Bottom) */}
          <div className="flex items-center justify-between gap-1.5 mt-auto pt-2 border-t border-stone-100/50">
            <div className="flex flex-wrap gap-1.5">
              {allBadges.map((badge, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#f0e6c8] text-[#8c7335]"
                >
                  {badge}
                </span>
              ))}
              {youtubeId && (
                <span className="flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-600 border border-red-100">
                  <PlayCircle className="w-3 h-3" />
                  教學
                </span>
              )}
            </div>
            {rental && (
              <span className="shrink-0 text-[12px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">
                租 ${rental}
              </span>
            )}
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
                   <img src="/images/LOGO.jpg" alt="Logo" className="w-32 h-32 object-contain opacity-20 grayscale" />
                 </div>
              )}

              {/* Modal Content Body */}
              <div className="p-6">
                {/* Title Section */}
                <div className="mb-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h2 className="text-2xl font-extrabold text-stone-900 leading-tight flex items-center gap-2">
                        {stickerColor && (
                          <span
                            className="inline-block shrink-0 w-3 h-3 rounded-full"
                            style={{ backgroundColor: stickerColor }}
                            title={stickerLabel}
                          />
                        )}
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
                  {/* Sticker Notice */}
                  {stickerColor && stickerLabel && (
                    <div
                      className="flex items-center gap-2.5 mt-4 px-3 py-2.5 rounded-xl text-sm font-medium"
                      style={{ backgroundColor: `${stickerColor}18`, border: `1.5px solid ${stickerColor}40`, color: '#44403c' }}
                    >
                      <span className="inline-block shrink-0 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stickerColor }} />
                      {stickerLabel}
                    </div>
                  )}
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

                {/* 定價 & 租金 */}
                {(price || rental) && (
                  <div className="flex gap-3 mb-6">
                    {price && (
                      <div className="flex-1 flex items-center gap-3 p-3 bg-rose-50/50 border border-rose-100/50 rounded-xl">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-rose-500">
                          <span className="text-lg leading-none block">🏷️</span>
                        </div>
                        <div>
                          <p className="text-[11px] text-stone-500 font-medium mb-0.5">定價</p>
                          <p className="text-sm font-bold text-stone-800">NT$ {price}</p>
                        </div>
                      </div>
                    )}
                    {rental && (
                      <div className="flex-1 flex items-center gap-3 p-3 bg-emerald-50/50 border border-emerald-100/50 rounded-xl">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-emerald-500">
                          <span className="text-lg leading-none block">🎮</span>
                        </div>
                        <div>
                          <p className="text-[11px] text-stone-500 font-medium mb-0.5">租金</p>
                          <p className="text-sm font-bold text-emerald-700">NT$ {rental}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

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

                {/* YouTube 教學影片 */}
                {youtubeId && (
                  <div className="mb-6">
                    <p className="text-xs text-stone-500 font-bold mb-2 flex items-center gap-1.5">
                      <PlayCircle className="w-4 h-4 text-red-500" />
                      教學影片
                    </p>
                    <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingTop: '56.25%' }}>
                      <iframe
                        className="absolute inset-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${youtubeId}`}
                        title={`${name} 教學影片`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    {source && (
                      <p className="text-[11px] text-stone-400 mt-2 text-right">
                        出處：{source}
                      </p>
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
