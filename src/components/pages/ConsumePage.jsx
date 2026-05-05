import { useState } from 'react';

/* =============================================
 *  CollapsibleSection — 可展開/收合的區塊
 * ============================================= */
function CollapsibleSection({ icon, title, defaultOpen = false, badge, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm transition-all duration-300">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-stone-50 to-white active:bg-stone-100 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{icon}</span>
          <h2 className="font-bold text-stone-700 text-base">{title}</h2>
          {badge && (
            <span className="text-xs font-semibold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-stone-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =============================================
 *  PriceRow — 價格行
 * ============================================= */
function PriceRow({ label, weekday, weekend, note }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-stone-100 last:border-0">
      <span className="text-stone-600 text-base font-medium">{label}</span>
      <div className="flex items-center gap-3">
        {weekday && (
          <div className="text-right">
            <span className="text-xs text-stone-400 block leading-tight">平日</span>
            <span className="text-orange-600 font-bold text-base">{weekday}</span>
          </div>
        )}
        {weekend && (
          <div className="text-right">
            <span className="text-xs text-stone-400 block leading-tight">假日</span>
            <span className="text-orange-600 font-bold text-base">{weekend}</span>
          </div>
        )}
        {note && <span className="text-stone-500 text-base">{note}</span>}
      </div>
    </div>
  );
}

/* =============================================
 *  ConsumePage
 * ============================================= */
export default function ConsumePage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

      {/* ===== 1. 入場收費 ===== */}
      <CollapsibleSection icon="🎟️" title="入場收費" defaultOpen={true}>
        {/* 會員專屬優惠 */}
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-base">👑</span>
            <h3 className="text-base font-bold text-amber-700">會員專屬優惠</h3>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 space-y-0.5">
            <PriceRow label="輕鬆玩（3小時內）" weekday="90 元" weekend="90 元" />
            <div className="text-sm text-stone-400 pt-1 pb-1.5 leading-snug">
              ⏱ 3小時以上，每小時 30 元（最高僅收全日暢玩價）
            </div>
            <PriceRow label="全日暢玩" weekday="120 元" weekend="180 元" />
          </div>
        </div>

        {/* 非會員收費 */}
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-base">👤</span>
            <h3 className="text-base font-bold text-stone-600">非會員收費</h3>
          </div>
          <div className="bg-stone-50 rounded-xl p-3">
            <PriceRow label="全日暢玩" weekday="150 元" weekend="200 元" />
          </div>
        </div>

        {/* 同行朋友補充 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
          <span className="text-base shrink-0 mt-0.5">💡</span>
          <p className="text-blue-700 text-sm leading-relaxed">
            與會員<span className="font-bold">同時進場與離場</span>的朋友，可一同以會員價計費。
          </p>
        </div>

        {/* 入場與結帳須知 */}
        <div className="mt-3 bg-stone-50 rounded-xl p-3 space-y-2">
          <h3 className="text-sm font-bold text-stone-500 flex items-center gap-1.5">
            📌 入場與結帳須知
          </h3>
          <ul className="space-y-1.5">
            <li className="text-sm text-stone-500 leading-relaxed flex items-start gap-2">
              <span className="shrink-0 mt-0.5">•</span>
              <span>入場時將預收「全日費用」，提早離場將依實際時數退還差額。</span>
            </li>
            <li className="text-sm text-stone-500 leading-relaxed flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>
                <span className="font-semibold text-amber-700">付款提醒：</span>
                電子支付恕無法辦理退款。若需依時數彈性計費，請使用「現金」結帳。
              </span>
            </li>
            <li className="text-sm text-stone-500 leading-relaxed flex items-start gap-2">
              <span className="shrink-0 mt-0.5">•</span>
              <span>為維護遊玩品質，入店停留超過 20 分鐘即會開始計算入場費。</span>
            </li>
          </ul>
        </div>
      </CollapsibleSection>

      {/* ===== 2. 包場方案 ===== */}
      <CollapsibleSection icon="🏢" title="包場方案">
        <div className="space-y-3">
          {/* 包場說明 */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-base text-stone-600 leading-relaxed">
              <span className="font-bold text-amber-700">包場範圍：</span>2樓和室 or 3樓大間空間
            </p>
            <p className="text-base text-stone-600 leading-relaxed mt-1">
              <span className="font-bold text-amber-700">容納人數：</span>兩層樓都各可容納約 <span className="font-bold">30 人</span>
            </p>
          </div>

          {/* 平日包場 */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-base">📅</span>
              <h3 className="text-base font-bold text-stone-600">平日包場</h3>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="divide-y divide-stone-100">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-stone-600 text-base">13:00 ~ 18:00</span>
                  <span className="text-orange-600 font-bold text-base">3,000 元</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-stone-600 text-base">18:00 ~ 24:00</span>
                  <span className="text-orange-600 font-bold text-base">3,500 元</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-orange-50">
                  <span className="text-stone-700 text-base font-medium">整日</span>
                  <span className="text-orange-600 font-bold text-base">4,000 元</span>
                </div>
              </div>
            </div>
          </div>

          {/* 假日包場 */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-base">🎉</span>
              <h3 className="text-base font-bold text-stone-600">假日包場</h3>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="divide-y divide-stone-100">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-stone-600 text-base">13:00 ~ 18:00</span>
                  <span className="text-orange-600 font-bold text-base">4,000 元</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-stone-600 text-base">18:00 ~ 24:00</span>
                  <span className="text-orange-600 font-bold text-base">4,000 元</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-orange-50">
                  <span className="text-stone-700 text-base font-medium">整日</span>
                  <span className="text-orange-600 font-bold text-base">6,000 元</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* ===== 3. 購買遊戲 ===== */}
      <CollapsibleSection icon="🛒" title="購買遊戲">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-xl shrink-0">🎲</span>
          <div>
            <p className="text-stone-600 text-base leading-relaxed">
              如欲購買遊戲，可參考
              <span className="font-bold text-green-700">店內遊戲清單定價</span>
              ，或直接洽詢店員。
            </p>
            <p className="text-sm text-stone-400 mt-1.5">
              💬 歡迎到店內詢問，店員會提供最新的庫存與價格資訊
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* ===== 4. 租借遊戲 ===== */}
      <CollapsibleSection icon="📦" title="租借遊戲">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-xl shrink-0">📋</span>
          <div>
            <p className="text-stone-600 text-base leading-relaxed">
              租借遊戲收費方式，請參考
              <span className="font-bold text-amber-700">「租借遊戲規章」</span>頁面。
            </p>
            <p className="text-sm text-stone-400 mt-1.5">
              可從上方導覽列「租借規章」進入查看完整說明
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* ===== 5. 密室逃脫 ===== */}
      <CollapsibleSection icon="🔐" title="密室逃脫">
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-xl shrink-0">🚪</span>
          <div>
            <p className="text-stone-600 text-base leading-relaxed">
              5F系列密室逃脫的主題與收費資訊，請參考
              <span className="font-bold text-purple-700">「密室逃脫專區」</span>頁面。
            </p>
            <p className="text-sm text-stone-400 mt-1.5">
              可從上方導覽列「密室逃脫專區」進入查看完整介紹
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* ===== 底部提示 ===== */}
      <p className="text-center text-sm text-stone-400 pb-2">
        如有任何疑問，歡迎洽詢店員 🙏
      </p>

    </div>
  );
}
