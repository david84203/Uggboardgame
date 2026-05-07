const TABS = [
  {
    id: 'consume',
    label: '店內消費方式',
    icon: '💳',
    desc: '計時制方案與費用說明',
  },
  {
    id: 'food',
    label: '餐點服務',
    icon: '🍜',
    desc: '飲料、輕食與餐點選擇',
  },
  {
    id: 'rent',
    label: '租借遊戲規章',
    icon: '📋',
    desc: '遊戲外借規則與注意事項',
  },
  {
    id: 'gamelist',
    label: '店內開盒遊戲列表',
    icon: '🎲',
    desc: '搜尋、篩選所有在架桌遊',
  },
  {
    id: 'environment',
    label: '環境介紹',
    icon: '🏠',
    desc: '場地空間與設施一覽',
  },
  {
    id: 'escape',
    label: '密室逃脫專區',
    icon: '🔐',
    desc: '主題密室資訊與預約',
  },
  {
    id: 'helper-menu',
    label: '實用桌遊輔助 APP',
    icon: '🛠️',
    desc: '計分、語音旁白、抽籤工具',
  },
  {
    id: 'member',
    label: '會員專區',
    icon: '👤',
    desc: '查詢會員資料與消費紀錄',
  },
];

export { TABS };

export default function NavTabs({ activeTab, onTabChange }) {
  return (
    <nav className="px-3 pb-6">
      <div className="grid grid-cols-1 gap-3">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                w-full flex items-center gap-4 px-5 py-4 rounded-2xl
                text-left transition-all duration-200 active:scale-[0.98]
                ${isActive
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-200'
                  : 'bg-white text-stone-700 shadow-sm border border-stone-100 hover:shadow-md hover:border-orange-200'}
              `}
            >
              {/* Icon */}
              <div className={`
                text-3xl w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                ${isActive ? 'bg-white/20' : 'bg-stone-50'}
              `}>
                {tab.icon}
              </div>

              {/* 文字 */}
              <div className="flex-1 min-w-0">
                <div className={`text-base font-bold leading-snug ${isActive ? 'text-white' : 'text-stone-800'}`}>
                  {tab.label}
                </div>
                <div className={`text-sm mt-0.5 ${isActive ? 'text-white/80' : 'text-stone-400'}`}>
                  {tab.desc}
                </div>
              </div>

              {/* 箭頭 */}
              <div className={`text-lg shrink-0 ${isActive ? 'text-white/70' : 'text-stone-300'}`}>
                ›
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
