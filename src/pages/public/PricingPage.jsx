import SEO, { businessSchema, breadcrumbSchema } from '../../components/SEO';
import PublicNav, { PublicFooter } from './PublicNav';

const seo = {
  title: '烏嘎嘎桌遊收費方式｜入場費、包場、租借遊戲價格',
  description:
    '烏嘎嘎桌遊沒有低消，採入場計時／全日制收費：會員全日暢玩平日150元、假日200元；非會員平日180元、假日250元。另提供包場、桌遊租借與免費遊戲教學服務。',
  path: '/pricing',
  schema: [
    businessSchema,
    breadcrumbSchema([
      { name: '首頁', path: '/about' },
      { name: '服務與收費', path: '/pricing' },
    ]),
  ],
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <SEO {...seo} />
      <PublicNav />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <section className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
          <h1 className="text-xl font-bold text-stone-800 mb-2">服務與收費</h1>
          <p className="text-stone-600 text-base leading-relaxed">
            <span className="font-bold">烏嘎嘎沒有低消規則，每人依入場方案付費即可</span>，入場費已包含店內超過1,600款桌遊自由借玩與免費遊戲教學。
          </p>
        </section>

        {/* 入場費 */}
        <section className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5">
            <h2 className="font-bold text-white text-base">🎟️ 入場費</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <p className="font-bold text-stone-800 text-base mb-1">會員．全日暢玩</p>
              <p className="text-stone-600 text-base">平日 <span className="font-bold text-orange-600">150元</span>／假日 <span className="font-bold text-orange-600">200元</span>，玩到打烊不限時。</p>
            </div>
            <div>
              <p className="font-bold text-stone-800 text-base mb-1">會員．輕鬆玩（3小時內）</p>
              <p className="text-stone-600 text-base">平日 <span className="font-bold text-orange-600">90元</span>／假日 <span className="font-bold text-orange-600">120元</span>；超過3小時每小時平日加收30元、假日加收40元，上限為全日暢玩價。</p>
            </div>
            <div>
              <p className="font-bold text-stone-800 text-base mb-1">非會員．全日暢玩</p>
              <p className="text-stone-600 text-base">平日 <span className="font-bold text-orange-600">180元</span>／假日 <span className="font-bold text-orange-600">250元</span>。</p>
            </div>
            <div className="bg-stone-50 rounded-xl p-3 text-stone-500 text-sm leading-relaxed">
              <p>入會費 <span className="font-bold text-stone-700">399元</span>，永久有效、無年費，當天辦理當天可用會員價。</p>
              <p className="mt-1">入場採預收全日費用，提早離場依實際時數退差額；入店超過20分鐘才開始計入場費。</p>
            </div>
          </div>
        </section>

        {/* 外食與餐點 */}
        <section className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-teal-600 px-4 py-2.5">
            <h2 className="font-bold text-white text-base">🍽️ 外食與餐點</h2>
          </div>
          <div className="p-4 text-stone-600 text-base leading-relaxed space-y-2">
            <p><span className="font-bold text-stone-800">可以帶外食</span>，店內也有販售泡麵、米漢堡、炸物拼盤、飲料與零食（供餐至21:00）。</p>
            <p>若攜帶<span className="font-bold text-stone-800">整桌共享性餐點</span>（例如PIZZA、蛋糕、烤雞、烤鴨等），需加收<span className="font-bold text-orange-600">200元清潔費</span>（以桌計費，非每人）。</p>
          </div>
        </section>

        {/* 遊戲教學 */}
        <section className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <h2 className="font-bold text-emerald-800 text-base mb-2">🎲 需要教學嗎？我們免費教。</h2>
          <p className="text-stone-700 text-base leading-relaxed">
            店員會依照你選的遊戲提供規則教學，不另外收費。假日或現場較忙時，教學時間較長（超過30分鐘）的重度遊戲可能無法即時安排，建議先詢問櫃台或事先預約，我們會幫你安排適合的時段或推薦上手更快的選擇。
          </p>
        </section>

        {/* 包場 */}
        <section className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-stone-700 px-4 py-2.5">
            <h2 className="font-bold text-white text-base">🏠 包場方案</h2>
          </div>
          <div className="p-4 space-y-2 text-stone-600 text-base leading-relaxed">
            <p>可包場空間為 <span className="font-bold text-stone-800">2樓和室</span> 或 <span className="font-bold text-stone-800">3樓大空間</span>，各可容納約30人。</p>
            <table className="w-full text-sm mt-2">
              <thead>
                <tr className="text-stone-400 text-left">
                  <th className="py-1 font-normal">時段</th>
                  <th className="py-1 font-normal text-right">平日</th>
                  <th className="py-1 font-normal text-right">假日</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                <tr>
                  <td className="py-1.5">13:00–18:00</td>
                  <td className="py-1.5 text-right font-bold">3,000元</td>
                  <td className="py-1.5 text-right font-bold">4,000元</td>
                </tr>
                <tr>
                  <td className="py-1.5">18:00–24:00</td>
                  <td className="py-1.5 text-right font-bold">3,500元</td>
                  <td className="py-1.5 text-right font-bold">4,000元</td>
                </tr>
                <tr>
                  <td className="py-1.5">整日</td>
                  <td className="py-1.5 text-right font-bold">4,000元</td>
                  <td className="py-1.5 text-right font-bold">6,000元</td>
                </tr>
              </tbody>
            </table>
            <p className="text-stone-600 text-sm mt-2">包場為整段時段計價、不另計人數。要包場請先透過官方LINE或Facebook粉絲專頁洽詢檔期。</p>
          </div>
        </section>

        {/* 租借遊戲 */}
        <section className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-amber-600 px-4 py-2.5">
            <h2 className="font-bold text-white text-base">📦 桌遊租借（限會員）</h2>
          </div>
          <div className="p-4 space-y-2 text-stone-600 text-base leading-relaxed">
            <p><span className="font-bold text-stone-800">押金＝該遊戲定價全額</span>，租金依定價分級：500元以下收50元，每多500元加收50元（例如1,001~1,500元收150元）。</p>
            <p>租期自出租隔天起算，以<span className="font-bold text-stone-800">3天</span>為限；會員等級Lv.3（棋盤老手）以上延長為<span className="font-bold text-stone-800">5天</span>。逾期視同續借，需再付租金。歸還後購買同款新品享85折。</p>
          </div>
        </section>

        {/* 付款方式 */}
        <section className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold text-stone-800 text-base mb-2">💳 付款方式</h2>
          <p className="text-stone-600 text-base leading-relaxed">
            接受現金、銀行轉帳、街口支付與LINE Pay，目前無法使用信用卡刷卡。若採計時彈性收費、事後可能需退差額，建議以現金結帳；電子支付恕無法辦理退款。
          </p>
        </section>
      </div>

      <PublicFooter />
    </div>
  );
}
