const PRICE_TIERS = [
  { range: '定價 0 ~ 500 元',      rent: 50 },
  { range: '定價 501 ~ 1000 元',   rent: 100 },
  { range: '定價 1001 ~ 1500 元',  rent: 150 },
  { range: '定價 1501 ~ 2000 元',  rent: 200 },
  { range: '定價 2001 元 以上',    rent: '以此類推' },
];

const RULES = [
  '租期為出租日隔天算起，以三天為限',
  '出租時為避免歸還爭議，請會員先清點所有配件',
  '歸還時由店員清點配件，若無缺件即退還押金全額',
  '若逾期歸還則視同續借，需再支付租金',
  '歸還時配件不全，將不退還押金，並會將該遊戲交予租借方',
  '歸還時若購買該款遊戲（全新），享有85折優惠',
];

export default function RentRulesPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

      {/* 會員資格 */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
        <span className="text-xl shrink-0">🎫</span>
        <div>
          <h2 className="font-bold text-red-700 text-base mb-1">會員資格限定</h2>
          <p className="text-red-600 text-base leading-relaxed">
            租借遊戲服務<span className="font-bold">限定本店會員</span>使用。非會員請先至櫃台辦理入會，方可進行租借。
          </p>
        </div>
      </div>

      {/* 押金說明 */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">💰</span>
          <h2 className="font-bold text-amber-800 text-base">押金規定</h2>
        </div>
        <p className="text-stone-600 text-base leading-relaxed">
          租借時需支付該遊戲<span className="font-bold text-amber-700">定價全額作為押金</span>，
          另外再依下方租金計算表支付租金。
        </p>
      </div>

      {/* 租金計算表 */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 flex items-center gap-2">
          <span className="text-white text-base">📊</span>
          <h2 className="font-bold text-white text-base">租金計算表</h2>
        </div>
        <div className="divide-y divide-stone-100">
          {PRICE_TIERS.map((tier, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <span className="text-stone-600 text-base">{tier.range}</span>
              <span className={`font-bold text-base ${typeof tier.rent === 'number' ? 'text-orange-600' : 'text-stone-400'}`}>
                {typeof tier.rent === 'number' ? `租金 ${tier.rent} 元` : tier.rent}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 注意事項 */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-stone-700 px-4 py-2.5 flex items-center gap-2">
          <span className="text-white text-base">📋</span>
          <h2 className="font-bold text-white text-base">注意事項</h2>
        </div>
        <ul className="divide-y divide-stone-100">
          {RULES.map((rule, i) => (
            <li key={i} className="flex items-start gap-3 px-4 py-3">
              <span className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-stone-600 text-base leading-relaxed">{rule}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 底部提示 */}
      <p className="text-center text-sm text-stone-400 pb-2">
        如有疑問請洽店員，感謝配合 🙏
      </p>

    </div>
  );
}
