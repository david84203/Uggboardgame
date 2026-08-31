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
      { name: '首頁', path: '/' },
      { name: '服務與收費', path: '/pricing' },
    ]),
  ],
};

const ENTRY = [
  {
    plan: '會員．全日暢玩',
    body: (
      <>平日 <b className="ug-accent">150元</b>／假日 <b className="ug-accent">200元</b>，玩到打烊不限時。</>
    ),
  },
  {
    plan: '會員．輕鬆玩（3小時內）',
    body: (
      <>平日 <b className="ug-accent">90元</b>／假日 <b className="ug-accent">120元</b>；超過3小時每小時平日加收30元、假日加收40元，上限為全日暢玩價。</>
    ),
  },
  {
    plan: '非會員．全日暢玩',
    body: (
      <>平日 <b className="ug-accent">180元</b>／假日 <b className="ug-accent">250元</b>。</>
    ),
  },
];

const VENUE = [
  { slot: '13:00–18:00', weekday: '3,000元', weekend: '4,000元' },
  { slot: '18:00–24:00', weekday: '3,500元', weekend: '4,000元' },
  { slot: '整日', weekday: '4,000元', weekend: '6,000元' },
];

export default function PricingPage() {
  return (
    <div className="public-page min-h-screen">
      <SEO {...seo} />
      <PublicNav />

      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <header className="pt-12 sm:pt-20 pb-12 sm:pb-16 max-w-[52ch]">
          <h1 className="text-[28px] sm:text-[40px] font-black ug-ink mb-4">服務與收費</h1>
          <p className="ug-lead ug-ink-2">
            <span className="font-bold ug-ink">烏嘎嘎沒有低消規則，每人依入場方案付費即可</span>，入場費已包含店內超過1,700款桌遊自由借玩與免費遊戲教學。
          </p>
        </header>

        {/* 入場費：左標題右內容的兩欄結構 */}
        <section className="pb-16 sm:pb-20">
          <h2 className="ug-section-title text-lg mb-5">入場費</h2>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 ug-divide ug-hair">
              {ENTRY.map((e) => (
                <div key={e.plan} className="py-5">
                  <h3 className="font-bold ug-ink text-base mb-1">{e.plan}</h3>
                  <p className="ug-body ug-ink-2">{e.body}</p>
                </div>
              ))}
            </div>
            <aside className="lg:col-span-5 ug-surface p-5 text-sm leading-[1.85] ug-ink-3 self-start">
              <p>入會費 <span className="font-bold ug-ink">399元</span>，永久有效、無年費，當天辦理當天可用會員價。</p>
              <p className="mt-2">入場採預收全日費用，提早離場依實際時數退差額；入店超過20分鐘才開始計入場費。</p>
            </aside>
          </div>
        </section>

        {/* 外食與教學：兩欄並排的短段落 */}
        <section className="pb-16 sm:pb-20 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
          <div>
            <h2 className="ug-section-title text-lg mb-4">外食與餐點</h2>
            <div className="ug-body ug-ink-2 space-y-2">
              <p><span className="font-bold ug-ink">可以帶外食</span>，店內也有販售泡麵、米漢堡、炸物拼盤、飲料與零食（供餐至21:00）。</p>
              <p>個人餐點與飲料不另收費。若攜帶<span className="font-bold ug-ink">整桌共享性餐點</span>（例如PIZZA、蛋糕、烤雞、烤鴨等），需加收清潔費<span className="font-bold ug-accent">每桌200元</span>——依實際放置餐點的桌子計算，非以人數計；餐點集中在一桌就只算一桌。</p>
            </div>
          </div>
          <div>
            <h2 className="ug-section-title text-lg mb-4">需要教學嗎？我們免費教。</h2>
            <p className="ug-body ug-ink-2">
              店員會依照你選的遊戲提供規則教學，不另外收費。假日或現場較忙時，教學時間較長（超過30分鐘）的重度遊戲可能無法即時安排，建議先詢問櫃台或事先預約，我們會幫你安排適合的時段或推薦上手更快的選擇。
            </p>
          </div>
        </section>

        {/* 包場：真表格 */}
        <section className="pb-16 sm:pb-20">
          <h2 className="ug-section-title text-lg mb-5">包場方案</h2>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <p className="ug-body ug-ink-2 mb-5">可包場空間為 <span className="font-bold ug-ink">2樓和室</span> 或 <span className="font-bold ug-ink">3樓大空間</span>，各可容納約30人。</p>
              <div className="overflow-x-auto">
                <table className="ug-table">
                  <thead>
                    <tr>
                      <th>時段</th>
                      <th>平日</th>
                      <th>假日</th>
                    </tr>
                  </thead>
                  <tbody>
                    {VENUE.map((v) => (
                      <tr key={v.slot}>
                        <td>{v.slot}</td>
                        <td className="ug-num">{v.weekday}</td>
                        <td className="ug-num">{v.weekend}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="lg:col-span-5">
              <p className="text-sm leading-[1.85] ug-ink-3 mb-5">
                包場為整段時段計價、不另計人數。包場如攜帶共享性餐點，收固定清潔費500元（不逐桌計；個人餐點與飲料不在此限）。要包場請先透過官方LINE或Facebook粉絲專頁洽詢檔期。
              </p>
              <div className="aspect-[4/3]">
                <img
                  src="/images/env/web/tatami-busy.webp"
                  alt="烏嘎嘎桌遊2樓和室包場時坐滿客人的情況"
                  width="900"
                  height="675"
                  loading="lazy"
                  className="ug-photo"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 租借與付款：兩欄並排 */}
        <section className="pb-16 sm:pb-20 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10">
          <div>
            <h2 className="ug-section-title text-lg mb-4">桌遊租借（限會員）</h2>
            <div className="ug-body ug-ink-2 space-y-2">
              <p><span className="font-bold ug-ink">押金＝該遊戲定價全額</span>，租金依定價分級：500元以下收50元，每多500元加收50元（例如1,001~1,500元收150元）。</p>
              <p>租期自出租隔天起算，以<span className="font-bold ug-ink">3天</span>為限；會員等級Lv.3（棋盤老手）以上延長為<span className="font-bold ug-ink">5天</span>。逾期視同續借，需再付租金。歸還後購買同款新品享85折。</p>
            </div>
          </div>
          <div>
            <h2 className="ug-section-title text-lg mb-4">付款方式</h2>
            <p className="ug-body ug-ink-2">
              接受現金、銀行轉帳、街口支付與LINE Pay，目前無法使用信用卡刷卡。若採計時彈性收費、事後可能需退差額，建議以現金結帳；電子支付恕無法辦理退款。
            </p>
          </div>
        </section>
      </div>

      <PublicFooter />
    </div>
  );
}
