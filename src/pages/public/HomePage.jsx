import { Link, Navigate, useLocation } from 'react-router-dom';
import SEO, { businessSchema, websiteSchema } from '../../components/SEO';
import PublicNav, { PublicFooter } from './PublicNav';

const seo = {
  title: '烏嘎嘎桌遊｜台中東區桌遊店．1,600款桌遊．無低消免費教學',
  description:
    '烏嘎嘎桌遊位於台中市東區自由路四段309號，三層樓遊戲空間、1,600款以上桌遊自由借玩，入場會員150元起、沒有低消、遊戲教學免費。每日13:00–24:00營業，週二固定公休。',
  path: '/',
  schema: [businessSchema, websiteSchema],
};

const FACTS = [
  { label: '地址', value: '台中市東區自由路四段309號' },
  { label: '營業時間', value: '每日 13:00–24:00，週二固定公休' },
  { label: '電話', value: '04-2215-4321' },
  { label: '入場費', value: '會員全日暢玩平日150元／假日200元；非會員平日180元／假日250元' },
  { label: '低消', value: '沒有低消，付入場費即可' },
  { label: '桌遊數量', value: '1,600款以上開盒桌遊，入場後不限款數自由取用' },
  { label: '遊戲教學', value: '免費，店員依你選的遊戲教規則' },
  { label: '外食', value: '可帶外食；整桌共享性餐點（PIZZA、蛋糕等）加收200元清潔費' },
];

const HIGHLIGHTS = [
  {
    icon: '🎲',
    title: '1,600款以上桌遊，換玩不加價',
    desc: '1樓整面桌遊牆全部開盒可玩，從10分鐘的派對遊戲到三小時的重度策略都有。入場後想換幾款就換幾款，不另外計費。',
  },
  {
    icon: '🧑‍🏫',
    title: '不會玩？我們免費教',
    desc: '選好遊戲跟店員說一聲就會有人教規則，不額外收費。第一次玩桌遊、不知道挑什麼，直接告訴店員人數與想玩的感覺，我們幫你選。',
  },
  {
    icon: '💸',
    title: '沒有低消，費用一次算清',
    desc: '不用為了坐下而點餐。全日暢玩玩到打烊、輕鬆玩方案3小時內計費，入店超過20分鐘才開始計入場費，提早離場退差額。',
  },
];

const FLOORS = [
  { floor: '1F', title: '桌遊牆與販售專區', desc: '整面開盒桌遊自由借玩，同區設有販售專區，喜歡可以直接帶回家。' },
  { floor: '2F', title: '日式地板區', desc: '低桌坐墊設計，適合親子與想放鬆坐著玩的客人，也可整層包場（約30人）。' },
  { floor: '3F', title: '大桌椅空間＋電動麻將桌', desc: '容納人數最多的樓層，適合重度策略遊戲與團體包場；另設電動日麻桌（支援日麻／台麻），需預約。' },
];

const SCENES = [
  { who: '第一次來玩', text: '直接來就可以，不用先加入會員。到櫃台說人數與想玩的類型，店員會挑遊戲並教你玩。' },
  { who: '一個人來', text: '歡迎。想找人一起玩建議先用官方LINE或FB粉專問併團時段，我們協助湊團；臨時來店較難即時併桌。' },
  { who: '帶小孩來', text: '2樓日式地板區最適合親子。12歲以下需至少一位家長全程陪同，店員可以教孩子玩，但無法代為看顧。' },
  { who: '團體／包場', text: '2樓和室或3樓大空間各可容納約30人，平日整日4,000元、假日整日6,000元，整段時段計價不另計人數。' },
];

const FAQ_PREVIEW = [
  { q: '收費怎麼算？一個人大概多少錢？', a: '沒有低消。會員全日暢玩平日150元、假日200元；非會員平日180元、假日250元。只玩3小時內可選會員輕鬆玩，平日90元、假日120元起。' },
  { q: '需要事先預約嗎？', a: '建議預約。可用烏嘎嘎會員APP線上訂位，最多提前2個月、最晚可預約當日23:00；電動日麻桌另需私訊FB粉專預約。' },
  { q: '可以帶外食嗎？', a: '可以。店內也有泡麵、米漢堡、炸物拼盤、飲料與零食（供餐至21:00）。整桌共享性餐點需加收200元清潔費。' },
  { q: '桌遊可以租回家玩嗎？', a: '可以，限本店會員。押金為該遊戲定價全額，租金依定價每滿500元收50元，租期自出租隔天起算3天。' },
];

export default function HomePage() {
  const { search } = useLocation();

  // 舊書籤／舊 QR code 會帶 ?tab= 進首頁（那是會員 APP 的分頁參數）。
  // Vercel 端已有同樣的轉址，但裝過 PWA 的裝置會被 Service Worker 攔截而繞過它，
  // 所以前端再接一次，確保這些連結一定會落到 /app 而不是停在官網首頁。
  if (new URLSearchParams(search).has('tab')) {
    return <Navigate to={`/app${search}`} replace />;
  }

  return (
    <div className="public-page min-h-screen bg-stone-50">
      <SEO {...seo} />
      <PublicNav />

      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-500 to-amber-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-white">
          <h1 className="text-3xl sm:text-4xl font-bold leading-snug mb-4">
            烏嘎嘎桌遊｜台中東區的三層樓桌遊店
          </h1>
          <p className="text-base sm:text-lg leading-relaxed text-orange-50 mb-6">
            台中市東區自由路四段309號，店內超過 1,600 款桌遊全部開盒、入場後自由借玩，
            <span className="font-bold text-white">沒有低消、遊戲教學免費</span>，
            每日 13:00–24:00 營業（週二固定公休）。2016 年開店至今，是台中規模數一數二的桌遊店。
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="/app?tab=booking"
              className="bg-white text-orange-600 font-bold rounded-xl px-5 py-3 text-base shadow-sm hover:bg-orange-50"
            >
              📅 線上預約座位
            </a>
            <a
              href="/app?tab=gamelist"
              className="bg-orange-600/40 border border-white/50 text-white font-bold rounded-xl px-5 py-3 text-base hover:bg-orange-600/60"
            >
              🎲 查店內遊戲清單
            </a>
            <a
              href="tel:0422154321"
              className="bg-orange-600/40 border border-white/50 text-white font-bold rounded-xl px-5 py-3 text-base hover:bg-orange-600/60"
            >
              ☎️ 04-2215-4321
            </a>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {/* 快速事實 */}
        <section className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-stone-700 px-5 sm:px-6 py-3">
            <h2 className="font-bold text-white text-base">📌 一分鐘看懂烏嘎嘎</h2>
          </div>
          <dl className="divide-y divide-stone-100">
            {FACTS.map((f) => (
              <div key={f.label} className="px-5 sm:px-6 py-3 sm:flex sm:gap-4">
                <dt className="font-bold text-stone-800 text-base sm:w-28 shrink-0">{f.label}</dt>
                <dd className="text-stone-600 text-base leading-relaxed">{f.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* 三個特色 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {HIGHLIGHTS.map((h) => (
            <div key={h.title} className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
              <p className="text-2xl mb-2">{h.icon}</p>
              <h2 className="font-bold text-stone-800 text-base mb-2">{h.title}</h2>
              <p className="text-stone-600 text-base leading-relaxed">{h.desc}</p>
            </div>
          ))}
        </section>

        {/* 樓層 */}
        <section className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-teal-600 px-5 sm:px-6 py-3">
            <h2 className="font-bold text-white text-base">🏢 三層樓的遊戲空間</h2>
          </div>
          <ul className="divide-y divide-stone-100">
            {FLOORS.map((f) => (
              <li key={f.floor} className="px-5 sm:px-6 py-3">
                <p className="font-bold text-stone-800 text-base mb-1">{f.floor}｜{f.title}</p>
                <p className="text-stone-600 text-base leading-relaxed">{f.desc}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* 情境導引 */}
        <section className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          <h2 className="font-bold text-stone-800 text-lg mb-4">你是哪一種客人？</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SCENES.map((s) => (
              <div key={s.who} className="bg-stone-50 rounded-xl p-4">
                <p className="font-bold text-orange-600 text-base mb-1">{s.who}</p>
                <p className="text-stone-600 text-base leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 收費摘要 */}
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-5 sm:p-6">
          <h2 className="font-bold text-amber-800 text-base mb-3">💰 收費一覽</h2>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-stone-500 text-left">
                  <th className="py-2 px-3 font-medium">方案</th>
                  <th className="py-2 px-3 font-medium text-right">平日</th>
                  <th className="py-2 px-3 font-medium text-right">假日</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-200/60">
                <tr>
                  <td className="py-2.5 px-3 text-stone-700">會員．全日暢玩</td>
                  <td className="py-2.5 px-3 text-right font-bold tabular-nums">150元</td>
                  <td className="py-2.5 px-3 text-right font-bold tabular-nums">200元</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-stone-700">會員．輕鬆玩（3小時內）</td>
                  <td className="py-2.5 px-3 text-right font-bold tabular-nums">90元</td>
                  <td className="py-2.5 px-3 text-right font-bold tabular-nums">120元</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-stone-700">非會員．全日暢玩</td>
                  <td className="py-2.5 px-3 text-right font-bold tabular-nums">180元</td>
                  <td className="py-2.5 px-3 text-right font-bold tabular-nums">250元</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-stone-600 text-base leading-relaxed mt-3">
            入會費399元、永久有效無年費，當天辦當天就能用會員價。包場、租借與付款方式詳見{' '}
            <Link to="/pricing" className="font-bold text-orange-600 underline">服務與收費</Link>。
          </p>
        </section>

        {/* FAQ 精選 */}
        <section className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          <h2 className="font-bold text-stone-800 text-lg mb-4">常被問到的問題</h2>
          <div className="space-y-4">
            {FAQ_PREVIEW.map((f) => (
              <div key={f.q}>
                <p className="font-bold text-stone-800 text-base mb-1">Q．{f.q}</p>
                <p className="text-stone-600 text-base leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
          <p className="text-stone-600 text-base mt-4">
            還有其他問題？完整15題整理在{' '}
            <Link to="/faq" className="font-bold text-orange-600 underline">常見問題</Link>。
          </p>
        </section>

        {/* 交通與聯絡 */}
        <section className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 sm:px-6 py-3">
            <h2 className="font-bold text-white text-base">📍 怎麼來、怎麼找我們</h2>
          </div>
          <div className="p-5 sm:p-6 space-y-3 text-stone-600 text-base leading-relaxed">
            <p><span className="font-bold text-stone-800">地址：</span>台中市東區自由路四段309號。</p>
            <p><span className="font-bold text-stone-800">停車：</span>機車可停門口；汽車可停正對面自由路四段310號「車麻吉」停車場。</p>
            <p><span className="font-bold text-stone-800">公車：</span>站牌「東英自由路口」61、241路；站牌「自由東英路口」249路，下車步行約1分鐘。</p>
            <p>
              <span className="font-bold text-stone-800">聯絡：</span>
              電話 <a href="tel:0422154321" className="text-orange-600 font-bold">04-2215-4321</a>、
              LINE <a href="https://line.me/R/ti/p/@160qiryn" target="_blank" rel="noreferrer" className="text-orange-600 font-bold">@160qiryn</a>、
              Facebook <a href="https://www.facebook.com/UGGBG/" target="_blank" rel="noreferrer" className="text-orange-600 font-bold">UGGBG</a>、
              Instagram <a href="https://www.instagram.com/uggboardgame/" target="_blank" rel="noreferrer" className="text-orange-600 font-bold">@uggboardgame</a>。
            </p>
            <p>
              更多店家資訊見 <Link to="/about" className="font-bold text-orange-600 underline">店家資訊</Link>。
            </p>
          </div>
        </section>

        {/* 會員 APP 導引 */}
        <section className="bg-stone-800 rounded-2xl p-5 sm:p-6 text-stone-100">
          <h2 className="font-bold text-white text-base mb-2">📱 已經是會員？</h2>
          <p className="text-base leading-relaxed text-stone-300 mb-4">
            會員 APP 可以線上預約座位、查店內開盒遊戲清單與租借紀錄、看自己的消費與玩過紀錄。
          </p>
          <a href="/app" className="inline-block bg-orange-500 text-white font-bold rounded-xl px-5 py-3 text-base hover:bg-orange-600">
            前往烏嘎嘎會員 APP
          </a>
        </section>

        {/* 同棟照相館 */}
        <section className="bg-pink-50 border border-pink-200 rounded-2xl p-5 sm:p-6">
          <p className="text-stone-700 text-base leading-relaxed">
            <span className="font-bold text-pink-700">同棟3F為莎朗嘿yo韓式照相館</span>，提供韓式證件照與個人形象寫真，入口在烏嘎嘎桌遊店內，可直接向櫃台詢問。
            更多資訊請見 <a href="https://heyyo520.tw" target="_blank" rel="noreferrer" className="underline text-pink-700">heyyo520.tw</a>。
          </p>
        </section>
      </div>

      <PublicFooter />
    </div>
  );
}
