const TABS = [
  { id: 'consume',      label: '店內消費方式',      icon: '💳',  desc: '計時制方案與費用說明' },
  { id: 'food',         label: '餐點服務',           icon: '🍜',  desc: '飲料、輕食與餐點選擇' },
  { id: 'rent',         label: '租借遊戲規章',       icon: '📋',  desc: '遊戲外借規則與注意事項' },
  { id: 'gamelist',     label: '店內開盒遊戲列表',   icon: '🎲',  desc: '搜尋、篩選所有在架桌遊' },
  { id: 'event-board',  label: '活動看板',           icon: '🗓️', desc: '最新賽事、新遊戲與優惠公告' },
  { id: 'environment',  label: '環境介紹',           icon: '🏠',  desc: '場地空間與設施一覽' },
  // { id: 'escape',       label: '密室逃脫專區',       icon: '🔐',  desc: '主題密室資訊與預約' },
  { id: 'helper-menu',  label: '實用桌遊輔助 APP',   icon: '🛠️', desc: '計分、語音旁白、抽籤工具' },
  { id: 'member',       label: '會員專區',           icon: '👤',  desc: '查詢資料、預約桌位、玩過紀錄' },
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
              className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all duration-200 active:scale-[0.98]"
              style={isActive ? {
                background: 'var(--theme-card-active-gradient)',
                color: 'var(--theme-active-text)',
                boxShadow: 'var(--theme-card-active-shadow)',
                border: '1px solid transparent',
              } : {
                background: 'var(--theme-card-bg)',
                color: 'var(--theme-text-secondary)',
                boxShadow: 'var(--theme-card-shadow)',
                border: `1px solid var(--theme-card-border)`,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'var(--theme-card-hover-border)';
                  e.currentTarget.style.boxShadow = 'var(--theme-card-hover-shadow)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'var(--theme-card-border)';
                  e.currentTarget.style.boxShadow = 'var(--theme-card-shadow)';
                }
              }}
            >
              {/* Icon */}
              <div
                className="text-3xl w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: isActive ? 'var(--theme-card-active-icon-bg)' : 'var(--theme-card-icon-bg)',
                }}
              >
                {tab.icon}
              </div>

              {/* 文字 */}
              <div className="flex-1 min-w-0">
                <div
                  className="text-base font-bold leading-snug"
                  style={{
                    color: isActive ? 'var(--theme-active-text)' : 'var(--theme-card-label)',
                  }}
                >
                  {tab.label}
                </div>
                <div
                  className="text-sm mt-0.5"
                  style={{
                    color: isActive ? 'var(--theme-active-desc)' : 'var(--theme-card-desc)',
                  }}
                >
                  {tab.desc}
                </div>
              </div>

              {/* 箭頭 */}
              <div
                className="text-lg shrink-0"
                style={{
                  color: isActive ? 'var(--theme-active-arrow)' : 'var(--theme-arrow)',
                }}
              >
                ›
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
