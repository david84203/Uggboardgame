const TABS = [
  { id: 'consume',     label: '店內消費方式' },
  { id: 'food',        label: '餐點服務' },
  { id: 'rent',        label: '租借遊戲規章' },
  { id: 'gamelist',    label: '店內開盒遊戲列表' },
  { id: 'environment', label: '環境介紹' },
  { id: 'member',      label: '會員專區' },
  { id: 'helper',      label: '實用桌遊輔助app' },
  { id: 'escape',      label: '密室逃脫專區' },
];

export { TABS };

export default function NavTabs({ activeTab, onTabChange }) {
  return (
    <nav className="sticky top-[60px] z-40 bg-white/90 backdrop-blur-lg border-b border-stone-200/60">
      <div className="grid grid-cols-2 gap-1.5 p-2">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                py-2 px-1 rounded-lg text-sm font-medium transition-all duration-200
                text-center leading-tight min-h-[2.4rem] flex items-center justify-center
                ${isActive
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-200'
                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700'}
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
