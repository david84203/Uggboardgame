import { Link, Navigate, useLocation } from 'react-router-dom';
import SEO, { businessSchema, websiteSchema, LINE_URL } from '../../components/SEO';
import PublicNav, { PublicFooter } from './PublicNav';

const seo = {
  title: '烏嘎嘎桌遊｜台中東區桌遊店．1,700款桌遊．無低消免費教學',
  description:
    '烏嘎嘎桌遊位於台中市東區自由路四段309號，三層樓遊戲空間、1,700款以上桌遊自由借玩，入場會員150元起、沒有低消、遊戲教學免費。每日13:00–24:00營業，週二固定公休。',
  path: '/',
  schema: [businessSchema, websiteSchema],
};

const FACTS = [
  { label: '地址', value: '台中市東區自由路四段309號' },
  { label: '營業時間', value: '每日 13:00–24:00，週二固定公休' },
  { label: '電話', value: '04-2215-4321' },
  { label: '入場費', value: '會員全日暢玩平日150元／假日200元；非會員平日180元／假日250元' },
  { label: '低消', value: '沒有低消，付入場費即可' },
  { label: '桌遊數量', value: '1,700款以上開盒桌遊，入場後不限款數自由取用' },
  { label: '遊戲教學', value: '免費，店員依你選的遊戲教規則' },
  { label: '外食', value: '可帶外食；整桌共享性餐點（PIZZA、蛋糕等）加收200元清潔費' },
];

const HIGHLIGHTS = [
  {
    title: '1,700款以上桌遊，換玩不加價',
    desc: '1樓整面桌遊牆全部開盒可玩，從10分鐘的派對遊戲到三小時的重度策略都有。入場後想換幾款就換幾款，不另外計費。',
    photo: '/images/env/web/game-heavy.webp',
    alt: '烏嘎嘎桌遊店內攤開的重度策略遊戲盤面與配件',
  },
  {
    title: '不會玩？我們免費教',
    desc: '選好遊戲跟店員說一聲就會有人教規則，不額外收費。第一次玩桌遊、不知道挑什麼，直接告訴店員人數與想玩的感覺，我們幫你選。',
    photo: '/images/env/web/table-group.webp',
    alt: '一桌客人在烏嘎嘎桌遊店內一起玩桌遊',
  },
  {
    title: '沒有低消，費用一次算清',
    desc: '不用為了坐下而點餐。全日暢玩玩到打烊、輕鬆玩方案3小時內計費，入店超過20分鐘才開始計入場費，提早離場退差額。',
    photo: '/images/env/web/crowd.webp',
    alt: '客人在烏嘎嘎桌遊店內邊吃邊玩桌遊',
  },
];

// 樓層照片一律用 public/images/env/web/ 的縮圖版（原圖 2~3MB 是會員 APP 環境頁在用的）。
// 挑片原則：只用沒有拍到客人臉的照片，門面頁是對外公開頁。
const FLOORS = [
  {
    floor: '1F',
    title: '桌遊牆與販售專區',
    desc: '整面開盒桌遊自由借玩，同區設有販售專區，喜歡可以直接帶回家。',
    photo: '/images/env/web/wall-close.webp',
    alt: '烏嘎嘎桌遊1樓整面開盒桌遊牆與販售專區',
    wide: true,
  },
  {
    floor: '2F',
    title: '日式地板區',
    desc: '低桌坐墊設計，適合親子與想放鬆坐著玩的客人，也可整層包場（約30人）。',
    photo: '/images/env/web/tatami.webp',
    alt: '烏嘎嘎桌遊2樓日式地板區的矮桌與坐墊',
  },
  {
    floor: '3F',
    title: '大桌椅空間＋電動麻將桌',
    desc: '容納人數最多的樓層，適合重度策略遊戲與團體包場；另設電動日麻桌（支援日麻／台麻），需預約。',
    photo: '/images/env/web/floor3.webp',
    alt: '烏嘎嘎桌遊3樓的大桌椅空間，多桌客人同時遊玩',
  },
];

const SCENES = [
  { who: '第一次來玩', text: '直接來就可以，不用先加入會員。到櫃台說人數與想玩的類型，店員會挑遊戲並教你玩。' },
  { who: '一個人來', text: '歡迎。想找人一起玩建議先用官方LINE或FB粉專問併團時段，我們協助湊團；臨時來店較難即時併桌。' },
  { who: '帶小孩來', text: '2樓日式地板區最適合親子。12歲以下需至少一位家長全程陪同，店員可以教孩子玩，但無法代為看顧。' },
  { who: '團體／包場', text: '2樓和室或3樓大空間各可容納約30人，平日整日4,000元、假日整日6,000元，整段時段計價不另計人數。' },
];

const PRICES = [
  { plan: '會員．全日暢玩', weekday: '150元', weekend: '200元' },
  { plan: '會員．輕鬆玩（3小時內）', weekday: '90元', weekend: '120元' },
  { plan: '非會員．全日暢玩', weekday: '180元', weekend: '250元' },
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
    <div className="public-page min-h-screen">
      <SEO {...seo} />
      <PublicNav />

      {/* 1. Hero：左文右圖的不對稱分割。
          註：這段導言比一般 hero 長很多，是因為文案本身要餵給 AI 搜尋、不能刪字，
          所以改用較小的字級把它當「前言段落」處理，而不是硬撐成大標。 */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pt-12 sm:pt-20 pb-14 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-6">
            <h1 className="text-[28px] sm:text-[40px] font-black leading-[1.25] ug-ink mb-5">
              烏嘎嘎桌遊｜台中東區的三層樓桌遊店
            </h1>
            <p className="ug-lead ug-ink-2 mb-8 max-w-[46ch]">
              台中市東區自由路四段309號，店內超過 1,700 款桌遊全部開盒、入場後自由借玩，
              <span className="font-bold ug-ink">沒有低消、遊戲教學免費</span>，
              每日 13:00–24:00 營業（週二固定公休）。2016 年開店至今，是台中規模數一數二的桌遊店。
            </p>
            {/* 預約與遊戲清單都在會員 APP 裡，APP 入口又在 LINE 圖文選單裡，
                所以這兩件事併成一顆 LINE 按鈕——不做兩顆連到同一個網址的按鈕。 */}
            <div className="flex flex-wrap gap-2.5">
              <a href={LINE_URL} target="_blank" rel="noreferrer" className="ug-btn ug-btn-primary px-4">加 LINE 預約座位</a>
              <a href="/pricing" className="ug-btn ug-btn-ghost px-4">看收費方式</a>
              <a href="tel:0422154321" className="ug-btn ug-btn-ghost px-4">04-2215-4321</a>
            </div>
          </div>
          <div className="lg:col-span-6">
            <div className="aspect-[14/9]">
              <img
                src="/images/env/web/wall-aisle.webp"
                alt="烏嘎嘎桌遊店內整排開盒桌遊的桌遊牆走道"
                width="1400"
                height="900"
                fetchPriority="high"
                className="ug-photo"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. 快速事實：方格，取代原本一列一條橫線的規格表 */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-16 sm:pb-20">
        <h2 className="ug-section-title text-lg mb-5">一分鐘看懂烏嘎嘎</h2>
        <dl className="ug-facts">
          {FACTS.map((f) => (
            <div key={f.label} className="ug-fact">
              <dt>{f.label}</dt>
              <dd>
                {f.label === '電話'
                  ? <a href="tel:0422154321" className="ug-accent font-bold">{f.value}</a>
                  : f.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 3. 三個特色：照片在上、文字在下的三欄。不加外框，靠照片與留白分組 */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-16 sm:pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-5">
          {HIGHLIGHTS.map((h) => (
            <div key={h.title}>
              <div className="aspect-[4/3] mb-4">
                <img src={h.photo} alt={h.alt} width="900" height="675" loading="lazy" className="ug-photo" />
              </div>
              <h2 className="font-bold ug-ink text-base mb-2 leading-snug">{h.title}</h2>
              <p className="ug-body ug-ink-2">{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. 樓層：三格不對稱照片牆（1F 佔滿一列，2F／3F 並排） */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-16 sm:pb-20">
        <h2 className="ug-section-title text-lg mb-5">三層樓的遊戲空間</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FLOORS.map((f) => (
            <article key={f.floor} className={f.wide ? 'sm:col-span-2' : ''}>
              <div className={f.wide ? 'aspect-[16/7]' : 'aspect-[4/3]'}>
                <img src={f.photo} alt={f.alt} width="1000" height="750" loading="lazy" className="ug-photo" />
              </div>
              <div className="mt-4">
                {/* 「1F｜桌遊牆與販售專區」原本是一整串文字，分隔線保留在 DOM 裡不刪，
                    只是把樓層數字放大、分隔號淡化，讓純文字讀起來仍然一模一樣。 */}
                <h3 className="flex items-baseline gap-2 font-bold ug-ink text-base mb-1.5">
                  <span className="ug-floor-no">{f.floor}</span>
                  <span className="ug-ink-3 font-normal">｜</span>
                  <span>{f.title}</span>
                </h3>
                <p className="ug-body ug-ink-2">{f.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 5. 情境導引：2×2 細線方格 */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-16 sm:pb-20">
        <h2 className="ug-section-title text-lg mb-5">你是哪一種客人？</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-0">
          {SCENES.map((s) => (
            <div key={s.who} className="ug-hair py-6">
              <h3 className="font-bold ug-accent text-base mb-2">{s.who}</h3>
              <p className="ug-body ug-ink-2">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. 收費：真表格，不包卡片 */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-16 sm:pb-20">
        <h2 className="ug-section-title text-lg mb-5">收費一覽</h2>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 overflow-x-auto">
            <table className="ug-table">
              <thead>
                <tr>
                  <th>方案</th>
                  <th>平日</th>
                  <th>假日</th>
                </tr>
              </thead>
              <tbody>
                {PRICES.map((p) => (
                  <tr key={p.plan}>
                    <td>{p.plan}</td>
                    <td className="ug-num">{p.weekday}</td>
                    <td className="ug-num">{p.weekend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="lg:col-span-5">
            <p className="ug-body ug-ink-2 mb-5">
              入會費399元、永久有效無年費，當天辦當天就能用會員價。包場、租借與付款方式詳見{' '}
              <Link to="/pricing" className="font-bold ug-accent underline">服務與收費</Link>。
            </p>
            <div className="aspect-[4/3]">
              <img
                src="/images/env/web/group.webp"
                alt="烏嘎嘎桌遊店內多桌客人同時遊玩的滿場情況"
                width="900"
                height="675"
                loading="lazy"
                className="ug-photo"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ 精選：懸掛縮排問答，不做成卡片堆 */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-16 sm:pb-20">
        <h2 className="ug-section-title text-lg mb-5">常被問到的問題</h2>
        <div className="max-w-[68ch] space-y-7">
          {FAQ_PREVIEW.map((f) => (
            <div key={f.q}>
              <h3 className="font-bold ug-ink text-base mb-1.5">Q．{f.q}</h3>
              <p className="ug-body ug-ink-2">{f.a}</p>
            </div>
          ))}
          <p className="ug-body ug-ink-2">
            還有其他問題？完整15題整理在{' '}
            <Link to="/faq" className="font-bold ug-accent underline">常見問題</Link>。
          </p>
        </div>
      </section>

      {/* 8. 交通與聯絡：左資訊右照片 */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 pb-16 sm:pb-20">
        <h2 className="ug-section-title text-lg mb-5">怎麼來、怎麼找我們</h2>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-7 space-y-3 ug-body ug-ink-2">
            <p><span className="font-bold ug-ink">地址：</span>台中市東區自由路四段309號。</p>
            <p><span className="font-bold ug-ink">停車：</span>機車可停門口；汽車可停正對面自由路四段310號「車麻吉」停車場。</p>
            <p><span className="font-bold ug-ink">公車：</span>站牌「東英自由路口」61、241路；站牌「自由東英路口」249路，下車步行約1分鐘。</p>
            <p>
              <span className="font-bold ug-ink">聯絡：</span>
              電話 <a href="tel:0422154321" className="ug-accent font-bold">04-2215-4321</a>、
              LINE <a href="https://line.me/R/ti/p/@160qiryn" target="_blank" rel="noreferrer" className="ug-accent font-bold">@160qiryn</a>、
              Facebook <a href="https://www.facebook.com/UGGBG/" target="_blank" rel="noreferrer" className="ug-accent font-bold">UGGBG</a>、
              Instagram <a href="https://www.instagram.com/uggboardgame/" target="_blank" rel="noreferrer" className="ug-accent font-bold">@uggboardgame</a>。
            </p>
            <p>
              更多店家資訊見 <Link to="/about" className="font-bold ug-accent underline">店家資訊</Link>。
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="aspect-[4/3]">
              <img
                src="/images/env/web/storefront.webp"
                alt="烏嘎嘎桌遊位於台中市東區自由路四段309號的店門口招牌"
                width="1000"
                height="750"
                loading="lazy"
                className="ug-photo"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 9. 兩則導引：會員 APP 與同棟照相館 */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="ug-surface p-6">
            <h2 className="font-bold ug-ink text-base mb-2">會員 APP 在官方 LINE 裡</h2>
            <p className="ug-body ug-ink-2 mb-5">
              會員 APP 可以線上預約座位、查店內開盒遊戲清單與租借紀錄、看自己的消費與玩過紀錄。
              加入官方 LINE 後，從下方圖文選單就能進入。
            </p>
            <a href={LINE_URL} target="_blank" rel="noreferrer" className="ug-btn ug-btn-primary">加 LINE 領取 APP 入口</a>
          </div>
          <div className="ug-surface p-6">
            <p className="ug-body ug-ink-2">
              <span className="font-bold ug-ink">同棟3F為莎朗嘿yo韓式照相館</span>，提供韓式證件照與個人形象寫真，入口在烏嘎嘎桌遊店內，可直接向櫃台詢問。
              更多資訊請見 <a href="https://heyyo520.tw" target="_blank" rel="noreferrer" className="underline ug-accent">heyyo520.tw</a>。
            </p>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
