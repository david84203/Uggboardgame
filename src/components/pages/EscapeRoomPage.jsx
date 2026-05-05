import React from 'react';

const THEMES = [
  {
    title: '5F系列－惱羞巫師',
    image: '/images/escape_wizard.jpg', // 👈 惱羞巫師海報
    story: '一位愛玩桌遊的巫師由於屢戰屢敗，所以一氣之下將世界上所有的桌遊都封印到他的世界中，不明的世人們接到了他的挑戰書，為了挽回世界上所有的桌遊以及打敗惱羞巫師，各位即將進入到惱羞巫師的桌遊世界......',
    players: '2~4人',
    duration: '40分鐘',
    price: '平日 350 / 人；假日 400 / 人 (4人滿團全團折100元)',
    icon: '🧙‍♂️',
    color: 'from-purple-500 to-indigo-500'
  },
  {
    title: '5F系列－遺失的手稿',
    image: '/images/escape_manuscript.jpg', // 👈 遺失的手稿海報
    story: '昨夜，辦公室的警報響起，接著，一聲槍響，他倒臥在血泊中，完美的密室、豪門的血案、下落不明的收藏品，還有各懷鬼胎的繼承人們...... 各種疑點令人匪夷所思，身為秘密警探的你們，能否找出真相呢？',
    players: '4~7人',
    duration: '90分鐘 + 30分鐘結案及解說',
    price: '平日 450 / 人；假日 500 / 人 (6人以上每人額外折20)',
    icon: '🕵️‍♂️',
    color: 'from-rose-600 to-red-700'
  }
];

export default function EscapeRoomPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

      {/* 關於密室 */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <h2 className="font-bold text-amber-800 text-lg mb-2 flex items-center gap-2">
          <span>🚪</span> 5F系列－密室逃脫
        </h2>
        <p className="text-stone-700 text-sm leading-relaxed">
          烏嘎嘎桌遊的5樓有兩個不同主題的密室逃脫，秉持著一貫的桌遊魂，密室逃脫主題都環繞著桌遊主題，不管是喜歡桌遊的你，或是喜歡密室的你，抑或是兩者都喜歡的你，一定會喜歡我們工作室所設計的主題！除此之外我們也販售與主題相關之桌遊，讓各位玩家在遊戲後依然可以在桌遊中找到樂趣。
        </p>
      </div>

      {/* 遊戲主題列表 */}
      <div className="space-y-4">
        {THEMES.map((theme, index) => (
          <div key={index} className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
            {/* 海報圖 */}
            <div className="w-full aspect-[2/3] bg-stone-100 overflow-hidden relative">
              <img 
                src={theme.image} 
                alt={theme.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/600x900/e2e8f0/94a3b8?text=Poster+Image';
                }}
              />
            </div>

            {/* 標題區 */}
            <div className={`bg-gradient-to-r ${theme.color} px-4 py-3 flex items-center gap-2`}>
              <span className="text-white text-xl">{theme.icon}</span>
              <h2 className="font-bold text-white text-lg tracking-wide">{theme.title}</h2>
            </div>
            
            {/* 內容區 */}
            <div className="p-4 space-y-4">
              {/* 故事背景 */}
              <div>
                <h3 className="font-bold text-stone-800 text-base mb-1.5 flex items-center gap-1.5">
                  <span className="text-stone-400">📖</span> 故事背景
                </h3>
                <p className="text-stone-600 text-sm leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-100">
                  {theme.story}
                </p>
              </div>

              {/* 資訊列表 */}
              <div className="space-y-2.5">
                <div className="flex items-start gap-2">
                  <span className="shrink-0 text-stone-400 mt-0.5">👥</span>
                  <div>
                    <span className="text-stone-500 text-sm block">遊戲人數</span>
                    <span className="text-stone-800 font-medium">{theme.players}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="shrink-0 text-stone-400 mt-0.5">⏳</span>
                  <div>
                    <span className="text-stone-500 text-sm block">遊戲時間</span>
                    <span className="text-stone-800 font-medium">{theme.duration}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="shrink-0 text-stone-400 mt-0.5">💰</span>
                  <div>
                    <span className="text-stone-500 text-sm block">遊戲收費</span>
                    <span className="text-stone-800 font-medium">{theme.price}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 底部提醒 */}
      <div className="bg-stone-100 rounded-xl p-3 text-center">
        <p className="text-stone-500 text-sm font-medium flex items-center justify-center gap-1.5">
          <span>⚠️</span> 禮拜二固定公休
        </p>
      </div>

    </div>
  );
}
