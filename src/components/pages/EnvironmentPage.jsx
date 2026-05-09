import React from 'react';

const FLOORS = [
  {
    id: 'floor1',
    floor: '1F',
    title: '一樓 — 桌遊牆與遊戲空間',
    description: '踏進烏嘎嘎，迎面而來的就是超過千款桌遊組成的壯觀桌遊牆。除了免費借玩，也設有販售專區，讓你把喜歡的遊戲帶回家。',
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    titleColor: 'text-amber-900',
    hero: { src: '/images/env/env-floor1-game-wall.jpg', alt: '1F 桌遊牆' },
    photos: [
      { src: '/images/env/env-floor1-game-wall-2.jpg', caption: '桌遊牆全景' },
      { src: '/images/env/env-floor1-sales.jpg', caption: '販售專區' },
      { src: '/images/env/env-floor1-counter.jpg', caption: '服務櫃台' },
      { src: '/images/env/env-floor1-seating.jpg', caption: '遊戲座位' },
    ],
  },
  {
    id: 'floor2',
    floor: '2F',
    title: '二樓 — 輕鬆地板區',
    description: '二樓採日式低桌坐墊設計，坐在地板上、靠著玩偶，輕輕鬆鬆玩一整天。特別適合親子或喜歡放鬆氛圍的玩家。',
    gradient: 'from-teal-500 to-emerald-500',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    titleColor: 'text-teal-900',
    hero: { src: '/images/env/env-floor2-space.jpg', alt: '2F 地板座位' },
    photos: [
      { src: '/images/env/env-floor2-seating.jpg', caption: '熱鬧滿座' },
      { src: '/images/env/env-floor2-seating-2.jpg', caption: '大型聚會' },
    ],
  },
  {
    id: 'floor3',
    floor: '3F',
    title: '三樓 — 寬敞桌椅空間',
    description: '三樓備有標準桌椅，是店內容納人數最多的樓層，適合重度策略遊戲、多人包場，也是定期舉辦活動與比賽的主要場地。另設有電動日麻桌，支援日麻與台麻，需預約使用。',
    gradient: 'from-blue-500 to-indigo-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    titleColor: 'text-blue-900',
    hero: { src: '/images/env/env-floor3-space.jpg', alt: '3F 遊戲空間' },
    photos: [
      { src: '/images/env/env-floor3-space-2.jpg', caption: '賽事盛況' },
      { src: '/images/env/env-floor3-space-3.jpg', caption: '活動滿場' },
      { src: '/images/env/env-floor3-mahjong.jpg', caption: '電動日麻桌' },
      { src: '/images/env/env-floor3-mahjong-score.jpg', caption: '電子點棒計分' },
    ],
  },
];

export default function EnvironmentPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

      {/* 頂部介紹 */}
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4">
        <h2 className="font-bold text-stone-800 text-lg mb-2 flex items-center gap-2">
          <span>🏠</span> 店內環境介紹
        </h2>
        <p className="text-stone-600 text-sm leading-relaxed">
          烏嘎嘎桌遊位於台中市東區，共有三層遊戲空間，各樓層風格各異，從熱鬧的桌遊牆到放鬆的地板區，每層都有不同氛圍。超過千款桌遊供免費借玩，無論你是新手還是老手，都能在這裡找到屬於你的角落。
        </p>
      </div>

      {/* 店長專訪影片 */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-stone-700 to-stone-800 px-4 py-3 flex items-center gap-2">
          <span className="text-white text-lg">▶️</span>
          <h3 className="font-bold text-white text-base">媒體採訪 — 烏嘎嘎桌遊</h3>
        </div>
        <div className="p-3">
          <div className="w-full aspect-video rounded-xl overflow-hidden bg-stone-100">
            <iframe
              src="https://www.youtube.com/embed/C-LST48am2E"
              title="烏嘎嘎桌遊媒體採訪"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      </div>

      {/* 各樓層 */}
      {FLOORS.map((floor) => (
        <div key={floor.id} className={`${floor.bg} border ${floor.border} rounded-2xl overflow-hidden`}>

          {/* 樓層標題列 */}
          <div className={`bg-gradient-to-r ${floor.gradient} px-4 py-3 flex items-center gap-3`}>
            <span className="bg-white/30 text-white font-black text-sm px-2.5 py-1 rounded-lg">
              {floor.floor}
            </span>
            <h3 className="font-bold text-white text-base">{floor.title}</h3>
          </div>

          <div className="p-4 space-y-3">
            {/* 描述文字 */}
            <p className={`text-sm leading-relaxed ${floor.titleColor}`}>
              {floor.description}
            </p>

            {/* Hero 大圖 */}
            <div className="w-full aspect-video rounded-xl overflow-hidden bg-stone-100">
              <img
                src={floor.hero.src}
                alt={floor.hero.alt}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = 'https://placehold.co/600x338/e2e8f0/94a3b8?text=Photo'; }}
              />
            </div>

            {/* 小圖 Grid */}
            <div className="grid grid-cols-2 gap-2">
              {floor.photos.map((photo, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden bg-stone-100">
                  <div className="aspect-[4/3]">
                    <img
                      src={photo.src}
                      alt={photo.caption}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = 'https://placehold.co/400x300/e2e8f0/94a3b8?text=Photo'; }}
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-2 py-1.5">
                    <span className="text-white text-xs font-medium">{photo.caption}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 日麻桌資訊（限 3F） */}
            {floor.id === 'floor3' && (
              <div className="bg-white border border-blue-100 rounded-xl p-3 space-y-2">
                <h4 className="font-bold text-blue-800 text-sm flex items-center gap-1.5">
                  🀄 電動日麻桌使用說明
                </h4>
                <div className="space-y-1.5 text-xs text-stone-600">
                  <div className="flex gap-2">
                    <span className="shrink-0 text-blue-400">✦</span>
                    <span>需為會員才可使用，可當日辦理、當日使用，無年費。</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="shrink-0 text-blue-400">✦</span>
                    <span>需先在店家群組湊滿成桌人數並預約（私訊粉絲專頁加入群組）。</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="shrink-0 text-blue-400">✦</span>
                    <span>支援日麻與台麻，可調整三人麻或特殊規則。</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="shrink-0 text-blue-400">✦</span>
                    <span>電子點棒自動計點，可即時查看對手差分。</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="shrink-0 text-red-400">⚠</span>
                    <span className="text-red-600 font-medium">嚴禁賭博。</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

    </div>
  );
}
