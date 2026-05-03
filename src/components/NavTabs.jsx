const TABS = [
  { id: 'consume',    label: '店內消費方式' },
  { id: 'food',       label: '餐點服務' },
  { id: 'rent',       label: '租借遊戲規章' },
  { id: 'gamelist',   label: '店內開盒遊戲列表' },
  { id: 'environment',label: '環境介紹' },
  { id: 'member',     label: '會員專區' },
];

export { TABS };

export default function NavTabs({ activeTab, onTabChange }) {
  return (
    <nav className="sticky top-[60px] z-40 bg-white/90 backdrop-blur-lg border-b border-stone-200/60">
      <div className="flex overflow-x-auto scrollbar-hide px-2 gap-1 py-2">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap
                ${isActive
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-200'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'}
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
