import { useState, useEffect } from 'react';
import { Users, Clock, MapPin, Star, ExternalLink, Gamepad2, X, Flame, PlayCircle, Heart, CheckCircle, TrendingUp } from 'lucide-react';
import GameLeaderboard from './GameLeaderboard';

function extractYoutubeIds(urlString) {
  if (!urlString) return [];
  return urlString
    .split('\n')
    .map(url => {
      const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
      return match ? match[1] : null;
    })
    .filter(Boolean);
}

function StarRatingPopup({ onRate, onClose }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-5 w-64 text-center" onClick={e => e.stopPropagation()}>
        <p className="font-bold text-stone-800 mb-1">這款遊戲怎麼樣？</p>
        <p className="text-xs text-stone-400 mb-4">給個評分吧（可略過）</p>
        <div className="flex justify-center gap-2 mb-4">
          {[1,2,3,4,5].map(i => (
            <button key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} onClick={() => onRate(i)}>
              <Star className={`w-8 h-8 transition-colors ${i <= hover ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`} />
            </button>
          ))}
        </div>
        <button onClick={() => onRate(null)} className="text-xs text-stone-400 underline">略過</button>
      </div>
    </div>
  )
}

export default function GameCard({ game, memberId, getStatus, getRecord, onToggle, onRate, isRented, getRentalCount, defaultOpen = false, hideCard = false, onModalClose }) {
  const [imgSrcIndex, setImgSrcIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(defaultOpen);
  const [showRating, setShowRating] = useState(false);

  function closeModal() { setIsModalOpen(false); onModalClose?.(); }

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
    description,
    isNew,
    imageUrl,
    isSoldOut,
  } = game;

  const youtubeIds = extractYoutubeIds(youtubeLink);
  const gameIsRented = isRented?.(game) ?? false;
  const isUnavailable = gameIsRented || isSoldOut;
  const unavailableLabel = isSoldOut ? '已售出' : '租借中';
  const rentalCount = getRentalCount?.(id, name) ?? 0;

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
  const bggIdMatch = bggLink?.match(/boardgamegeek\.com\/boardgame(?:expansion)?\/(\d+)/);
  const bggId = bggIdMatch ? bggIdMatch[1] : null;
  const safeEnglishName = englishName ? englishName.replace(/[\\/:*?"<>|]/g, '-').trim() : null;
  const dashedEnglishName = safeEnglishName ? safeEnglishName.replace(/\s+/g, '-') : null;

  // Image sources to try in order: Firebase URL -> bggId -> englishName (spaces) -> englishName (dashes) -> row-{id}
  const imgSources = [
    imageUrl || null,
    bggId ? `/images/${bggId}.jpg` : null,
    bggId ? `/images/${bggId}.webp` : null,
    bggId ? `/images/${bggId}.png` : null,
    bggId ? `/images/${bggId}.avif` : null,
    bggId ? `/images/${bggId}.jpeg` : null,
    safeEnglishName ? `/images/${safeEnglishName}.jpg` : null,
    safeEnglishName ? `/images/${safeEnglishName}.webp` : null,
    safeEnglishName ? `/images/${safeEnglishName}.png` : null,
    safeEnglishName ? `/images/${safeEnglishName}.avif` : null,
    dashedEnglishName ? `/images/${dashedEnglishName}.jpg` : null,
    dashedEnglishName ? `/images/${dashedEnglishName}.webp` : null,
    dashedEnglishName ? `/images/${dashedEnglishName}.png` : null,
    dashedEnglishName ? `/images/${dashedEnglishName}.avif` : null,
    youtubeIds[0] ? `https://img.youtube.com/vi/${youtubeIds[0]}/hqdefault.jpg` : null,
    `/images/row-${id}.jpg`,
    `/images/row-${id}.webp`,
    `/images/row-${id}.png`,
    `/images/row-${id}.avif`,
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
  const allBadges = [...displayCategories, ...(tags || [])];
  const visibleBadgeLimit = youtubeIds.length > 0 ? 1 : 2;
  const visibleBadges = allBadges.slice(0, visibleBadgeLimit);
  const hiddenBadgeCount = Math.max(0, allBadges.length - visibleBadges.length);

  return (
    <>
      {!hideCard && (
      <div
        role="button"
        tabIndex={0}
        aria-labelledby={`game-name-${game.id}`}
        className="game-card animate-fade-in-up bg-white rounded-2xl shadow-sm border border-[#e6d9b6] p-2.5 hover:shadow-md active:scale-[0.99] transition-all duration-200 flex h-[156px] cursor-pointer relative group overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        onClick={() => setIsModalOpen(true)}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsModalOpen(true);
          }
        }}
      >
        {/* Image Section */}
        <div className="relative h-full w-[112px] overflow-hidden shrink-0 rounded-xl bg-stone-100">
          {!imgError ? (
            <img
              src={imgSrc}
              alt={name}
              className={`absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ${isUnavailable ? 'opacity-50 grayscale' : ''}`}
              loading="lazy"
              onError={handleImgError}
            />
          ) : (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-stone-50">
              <img src="/images/LOGO.jpg" alt="Logo" className="w-14 h-14 object-contain opacity-20 grayscale" />
            </div>
          )}
          <div className="absolute inset-x-1.5 top-1.5 z-10 flex items-start justify-between gap-1 pointer-events-none">
            {isNew ? (
              <span className="px-1.5 py-0.5 bg-orange-500 text-white text-[9px] leading-4 font-extrabold tracking-wide rounded-full shadow-sm">NEW</span>
            ) : <span />}
            {isHot && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-red-500 text-white text-[9px] leading-4 font-bold rounded-full shadow-sm">
                <Flame className="w-2.5 h-2.5 fill-white" />熱門
              </span>
            )}
          </div>
          {isUnavailable && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-stone-800/85 text-white text-[11px] font-bold px-2.5 py-1 rounded-full tracking-wide">
                {unavailableLabel}
              </span>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="flex flex-col flex-1 min-w-0 pl-3 py-0.5">
          {/* Title */}
          <h3 className="text-[15px] font-extrabold text-stone-800 leading-snug mb-0.5 flex items-start gap-1.5 min-w-0" id={`game-name-${game.id}`}>
            {stickerColor && (
              <span
                className="inline-block shrink-0 w-2.5 h-2.5 rounded-full mt-1"
                style={{ backgroundColor: stickerColor }}
                title={stickerLabel}
              />
            )}
            <span className="line-clamp-2 break-words">{name}</span>
          </h3>
          
          {/* Subtitle / Description (English Name) */}
          <p className="text-[11px] leading-4 text-stone-400 font-medium truncate mb-1.5">
            {englishName && englishName !== 'N/A' ? englishName : '經典桌遊推薦...'}
          </p>

          {/* 核心資訊：膠囊寬度由內容決定，避免手機雙欄互相擠壓 */}
          <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
            {/* Players */}
            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 min-w-0">
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] leading-4 font-bold truncate">{playersDisplay}</span>
            </div>

            {/* Difficulty / Rating */}
            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 shrink-0" aria-label={`難度：${weightLabel || '普通'}`}>
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
              <span className="text-[11px] leading-4 font-bold">{weightLabel || '普通'}</span>
            </div>
          </div>

          {/* 標籤固定單行，只顯示前兩個，其餘以數量提示 */}
          <div className="flex items-center gap-1 min-h-5 overflow-hidden mb-1">
            {visibleBadges.map((badge, idx) => (
              <span key={`${badge}-${idx}`} className="max-w-[72px] truncate px-1.5 py-0.5 rounded text-[10px] leading-4 font-semibold bg-[#f0e6c8] text-[#8c7335] shrink-0">{badge}</span>
            ))}
            {youtubeIds.length > 0 && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] leading-4 font-semibold bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
                <PlayCircle className="w-3 h-3" />教學
              </span>
            )}
            {hiddenBadgeCount > 0 && (
              <span className="text-[10px] leading-4 font-bold text-stone-400 shrink-0">+{hiddenBadgeCount}</span>
            )}
          </div>

          {/* Bottom Section */}
          <div className="mt-auto pt-1.5 border-t border-stone-100">
            <div className="flex items-center justify-between min-h-7 gap-2">
              <div className="min-w-0">
                {rental && (
                  <span className="inline-flex text-[11px] leading-5 font-bold text-emerald-700 bg-emerald-50 px-2 rounded-full border border-emerald-200 whitespace-nowrap">
                    租 ${rental}
                  </span>
                )}
              </div>
              {memberId && (
                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  {getRecord(game.id)?.rating ? (
                    <button
                      aria-label="修改我的評分"
                      title="已評分，點擊修改"
                      onClick={(e) => { e.stopPropagation(); setShowRating(true); }}
                      className="h-8 flex items-center gap-1 px-2 rounded-full bg-amber-50 border border-amber-200 text-amber-600 active:scale-95"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-[11px] font-bold">{getRecord(game.id).rating}</span>
                    </button>
                  ) : (
                    <button
                      aria-label="標記為玩過"
                      title="玩過"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle(game, 'played')
                        if (getStatus(game.id) !== 'played') setShowRating(true)
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition-all ${getStatus(game.id) === 'played' ? 'bg-green-500 text-white shadow-sm' : 'bg-stone-100 text-stone-500 hover:bg-green-100 hover:text-green-600'}`}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    aria-label="加入想玩清單"
                    title="想玩"
                    onClick={(e) => { e.stopPropagation(); onToggle(game, 'wishlist'); }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition-all ${getStatus(game.id) === 'wishlist' ? 'bg-rose-500 text-white shadow-sm' : 'bg-stone-100 text-stone-500 hover:bg-rose-100 hover:text-rose-600'}`}
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {showRating && (
        <StarRatingPopup
          onRate={(r) => { if (r) onRate?.(game.id, r); setShowRating(false) }}
          onClose={() => setShowRating(false)}
        />
      )}

      {/* Detail Modal Overlay */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-stone-900/60 backdrop-blur-sm"
          onClick={closeModal}
        >
          {/* Modal Container */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`game-detail-title-${game.id}`}
            className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh] animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              aria-label="關閉遊戲詳情"
              onClick={closeModal}
              className="absolute top-2.5 right-2.5 z-10 w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-black/55 text-white rounded-full backdrop-blur-md transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="overflow-y-auto no-scrollbar">
              {/* Large Image Header */}
              {!imgError ? (
                <img
                  src={imgSrc}
                  alt={name}
                  className="w-full max-h-52 sm:max-h-60 object-contain bg-stone-50"
                  onError={handleImgError}
                />
              ) : (
                 <div className="w-full h-48 bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center">
                   <img src="/images/LOGO.jpg" alt="Logo" className="w-32 h-32 object-contain opacity-20 grayscale" />
                 </div>
              )}

              {/* Modal Content Body */}
              <div className="p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {/* Title Section */}
                <div className="mb-5">
                  <div>
                    <div className="min-w-0">
                      <h2 id={`game-detail-title-${game.id}`} className="text-xl sm:text-2xl font-extrabold text-stone-900 leading-tight flex items-start gap-2 break-words">
                        {stickerColor && (
                          <span
                            className="inline-block shrink-0 w-3 h-3 rounded-full mt-1.5"
                            style={{ backgroundColor: stickerColor }}
                            title={stickerLabel}
                          />
                        )}
                        {name}
                      </h2>
                      {gameIsRented && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-1 bg-stone-100 text-stone-500 text-xs font-bold rounded-full">
                          📦 目前租借中
                        </span>
                      )}
                      {isSoldOut && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-1 bg-stone-800 text-white text-xs font-bold rounded-full">
                          已售出
                        </span>
                      )}
                      {englishName && englishName !== 'N/A' && (
                        <p className="text-stone-500 font-medium mt-1">
                          {englishName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Badges Row */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {isHot && (
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 rounded-lg border border-red-100/50">
                        <Flame className="w-4 h-4 fill-red-500" />
                        <span className="text-xs font-bold whitespace-nowrap">店內熱門</span>
                      </div>
                    )}
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

                {/* 遊戲簡介 */}
                {description && (
                  <div className="mb-6 p-4 bg-stone-50 border border-stone-200 rounded-xl">
                    <p className="text-xs text-stone-500 font-bold mb-2">遊戲簡介</p>
                    <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">{description}</p>
                  </div>
                )}

                {/* Info Grid (Detailed) */}
                <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-5 sm:mb-6">
                  {/* Players */}
                  <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-orange-50/50 border border-orange-100/50 rounded-xl min-w-0">
                    <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm text-orange-500 shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-stone-500 font-medium mb-0.5">遊玩人數</p>
                      <p className="text-sm font-bold text-stone-800 break-words">{playersDisplay}</p>
                    </div>
                  </div>

                  {/* Play Time */}
                  {timeDisplay && (
                    <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-blue-50/50 border border-blue-100/50 rounded-xl min-w-0">
                      <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm text-blue-500 shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-stone-500 font-medium mb-0.5">預計時間</p>
                        <p className="text-sm font-bold text-stone-800 break-words">{timeDisplay}</p>
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  {location && (
                    <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-emerald-50/50 border border-emerald-100/50 rounded-xl min-w-0">
                      <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm text-emerald-500 shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-stone-500 font-medium mb-0.5">放置櫃位</p>
                        <p className="text-sm font-bold text-emerald-800 break-words">{location}</p>
                      </div>
                    </div>
                  )}

                  {/* Weight */}
                  {weightLabel && (
                    <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-purple-50/50 border border-purple-100/50 rounded-xl min-w-0">
                      <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm text-purple-500 shrink-0">
                        <span className="text-lg leading-none block">⚖️</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-stone-500 font-medium mb-0.5">難度評級</p>
                        <p className="text-sm font-bold text-stone-800 break-words">{weightLabel} <span className="text-stone-400 font-medium">({weight.toFixed(1)})</span></p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 租借次數 */}
                {rentalCount > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-amber-50/50 border border-amber-100/50 rounded-xl mb-6">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-amber-600">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[11px] text-stone-500 font-medium mb-0.5">熱門租借</p>
                      <p className="text-sm font-bold text-stone-800">已被租借 <span className="text-amber-600">{rentalCount}</span> 次</p>
                    </div>
                  </div>
                )}

                {/* 定價 & 租金 */}
                {(price || rental) && (
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6">
                    {price && (
                      <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-rose-50/50 border border-rose-100/50 rounded-xl min-w-0">
                        <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm text-rose-500 shrink-0">
                          <span className="text-lg leading-none block">🏷️</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-stone-500 font-medium mb-0.5">定價</p>
                          <p className="text-sm font-bold text-stone-800 break-words">NT$ {price}</p>
                        </div>
                      </div>
                    )}
                    {rental && (
                      <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-emerald-50/50 border border-emerald-100/50 rounded-xl min-w-0">
                        <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm text-emerald-500 shrink-0">
                          <span className="text-lg leading-none block">🎮</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] text-stone-500 font-medium mb-0.5">租金</p>
                          <p className="text-sm font-bold text-emerald-700 break-words">NT$ {rental}</p>
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
                {youtubeIds.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs text-stone-500 font-bold mb-2 flex items-center gap-1.5">
                      <PlayCircle className="w-4 h-4 text-red-500" />
                      教學影片{youtubeIds.length > 1 && ` (${youtubeIds.length})`}
                    </p>
                    {youtubeIds.map((id, idx) => (
                      <div key={id} className={`relative w-full rounded-xl overflow-hidden bg-black ${idx > 0 ? 'mt-3' : ''}`} style={{ paddingTop: '56.25%' }}>
                        <iframe
                          className="absolute inset-0 w-full h-full"
                          src={`https://www.youtube.com/embed/${id}`}
                          title={`${name} 教學影片${youtubeIds.length > 1 ? ` ${idx + 1}` : ''}`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ))}
                    {source && (
                      <p className="text-[11px] text-stone-400 mt-2 text-right">
                        出處：{source}
                      </p>
                    )}
                  </div>
                )}

                {/* 會員互動：玩過 / 想玩 / 評分 */}
                {memberId && (
                  <div className="mb-4 pt-4 border-t border-stone-100">
                    <p className="text-xs text-stone-400 font-medium mb-2">我的紀錄</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { onToggle(game, 'played'); if (getStatus(game.id) !== 'played') setShowRating(true) }}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition-all ${getStatus(game.id) === 'played' ? 'bg-green-500 text-white' : 'bg-stone-100 text-stone-500 hover:bg-green-50 hover:text-green-600'}`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        {getStatus(game.id) === 'played' ? '玩過 ✓' : '標記玩過'}
                      </button>
                      <button
                        onClick={() => onToggle(game, 'wishlist')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition-all ${getStatus(game.id) === 'wishlist' ? 'bg-rose-500 text-white' : 'bg-stone-100 text-stone-500 hover:bg-rose-50 hover:text-rose-600'}`}
                      >
                        <Heart className="w-4 h-4" />
                        {getStatus(game.id) === 'wishlist' ? '想玩 ♡' : '加入想玩'}
                      </button>
                    </div>
                    {getRecord(game.id)?.rating && (
                      <div className="flex items-center gap-1 mt-2 justify-center">
                        <span className="text-xs text-stone-400">我的評分：</span>
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className={`w-4 h-4 ${i <= getRecord(game.id).rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`} />
                        ))}
                        <button onClick={() => setShowRating(true)} className="text-xs text-stone-400 underline ml-1">改</button>
                      </div>
                    )}
                    {getStatus(game.id) === 'played' && !getRecord(game.id)?.rating && (
                      <button onClick={() => setShowRating(true)} className="w-full mt-2 text-xs text-amber-500 underline text-center">給個評分？</button>
                    )}
                  </div>
                )}

                {/* 歷史排行榜 */}
                <GameLeaderboard gameName={name} />

                {/* Bottom Action */}
                {bggLink && bggLink !== 'N/A' && (
                  <div className="pt-4 border-t border-stone-100">
                    <a href={bggLink} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-bold transition-colors">
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
