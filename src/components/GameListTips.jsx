export default function GameListTips({ onClose }) {
  return (
    <div className="mx-3 mb-3 rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden">
      <div className="px-4 py-4 space-y-4">

        {/* 篩選功能 */}
        <div>
          <p className="text-sm font-bold text-amber-700 mb-2">🔍 篩選功能</p>
          <ol className="space-y-2 text-sm text-stone-600 list-none">
            <li className="flex gap-2"><span className="shrink-0 font-bold text-amber-600">1.</span><span>先選難度模式：😊 輕鬆 / 🤔 動腦 / 🧠 超燒腦，快速縮小範圍</span></li>
            <li className="flex gap-2"><span className="shrink-0 font-bold text-amber-600">2.</span><span>輸入 👥 人數＋點選 🔥 熱門</span></li>
            <li className="flex gap-2"><span className="shrink-0 font-bold text-amber-600">3.</span><span>點選 ▶️ 教學可直接線上看教學影片</span></li>
          </ol>
        </div>

        {/* 其他篩選 */}
        <div>
          <p className="text-sm font-bold text-amber-700 mb-2">其他篩選功能：</p>
          <ul className="space-y-2 text-sm text-stone-600">
            <li className="flex gap-2"><span className="shrink-0">⏱</span><span>依時間篩選：可選 30 分鐘內、1 小時以上等範圍</span></li>
            <li className="flex gap-2"><span className="shrink-0">🏷</span><span>依分類＋標籤篩選：派對、策略、陣營…可疊加多個條件</span></li>
          </ul>
        </div>

        {/* 貼紙說明 */}
        <div>
          <p className="text-sm font-bold text-amber-700 mb-2">遊戲旁邊的彩色圓點</p>
          <ul className="space-y-2 text-sm text-stone-600">
            <li className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500 shrink-0"></span>
              <span>綠點：規則平易近人，適合新手入門</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-400 shrink-0"></span>
              <span>黃點：假日不提供教學服務，請事先自學</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 shrink-0"></span>
              <span>紅點：不提供教學，需自行研究規則</span>
            </li>
          </ul>
        </div>

        <button
          onClick={onClose}
          className="text-sm text-amber-500 underline underline-offset-2"
        >
          關閉說明
        </button>
      </div>
    </div>
  )
}
