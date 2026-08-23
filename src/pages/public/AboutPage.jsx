import SEO, { businessSchema, websiteSchema, breadcrumbSchema } from '../../components/SEO';
import PublicNav, { PublicFooter } from './PublicNav';

const seo = {
  title: '烏嘎嘎桌遊｜台中東區桌遊店 地址、電話、營業時間',
  description:
    '烏嘎嘎桌遊位於台中市東區自由路四段309號，營業時間每日13:00–24:00、週二公休。店內超過1,600款桌遊可直接借玩，提供入場計時制與遊戲教學服務。',
  path: '/about',
  schema: [
    businessSchema,
    websiteSchema,
    breadcrumbSchema([
      { name: '首頁', path: '/' },
      { name: '店家資訊', path: '/about' },
    ]),
  ],
};

const FLOORS = [
  {
    floor: '1F',
    title: '桌遊牆與販售專區',
    desc: '超過1,600款開盒桌遊自由借玩，同區設有販售專區，喜歡可直接帶回家。',
    photo: '/images/env/web/floor1.webp',
    alt: '烏嘎嘎桌遊1樓的桌遊販售專區',
  },
  {
    floor: '2F',
    title: '日式地板區',
    desc: '低桌坐墊設計，適合親子與喜歡放鬆氛圍的玩家。',
    photo: '/images/env/web/floor2.webp',
    alt: '烏嘎嘎桌遊2樓日式地板區的矮桌與坐墊',
  },
  {
    floor: '3F',
    title: '桌椅空間＋電動麻將桌',
    desc: '店內容納人數最多的樓層，適合重度策略遊戲與包場；另設電動日麻桌（支援日麻／台麻），需預約使用。',
    photo: '/images/env/web/floor3.webp',
    alt: '烏嘎嘎桌遊3樓的大桌椅空間，多桌客人同時遊玩',
  },
];

const CONTACTS = [
  { label: '電話', value: '04-2215-4321', href: 'tel:0422154321' },
  { label: 'LINE 官方帳號', value: '@160qiryn', href: 'https://line.me/R/ti/p/@160qiryn', external: true },
  { label: 'Facebook', value: 'UGGBG', href: 'https://www.facebook.com/UGGBG/', external: true },
  { label: 'Instagram', value: '@uggboardgame', href: 'https://www.instagram.com/uggboardgame/', external: true },
];

export default function AboutPage() {
  return (
    <div className="public-page min-h-screen">
      <SEO {...seo} />
      <PublicNav />

      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        {/* Hero：左文右圖 */}
        <header className="pt-12 sm:pt-20 pb-14 sm:pb-20 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7">
            <h1 className="text-[28px] sm:text-[40px] font-black ug-ink mb-4">烏嘎嘎桌遊</h1>
            <p className="ug-lead ug-ink-2 max-w-[44ch]">
              台中市東區自由路四段309號，共有三層開放遊戲空間，店內超過1,600款桌遊可直接借玩，是台中規模數一數二的桌遊店。
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="aspect-[4/3]">
              <img
                src="/images/env/web/game-wall.webp"
                alt="烏嘎嘎桌遊店內整面開盒桌遊牆"
                width="1400"
                height="1050"
                fetchPriority="high"
                className="ug-photo"
              />
            </div>
          </div>
        </header>

        {/* 營業時間：整段獨立，這是最常被查的事實 */}
        <section className="pb-16 sm:pb-20">
          <h2 className="ug-section-title text-lg mb-4">營業時間</h2>
          <p className="ug-lead ug-ink-2 max-w-[62ch]">
            <span className="font-bold ug-ink">每日 13:00–24:00，週二固定公休</span>（其餘六天含國定假日皆正常營業）。最晚可預約時段為 23:00。
            12/31 跨年夜例外延長營業至隔天 02:00。
          </p>
        </section>

        {/* 地址與交通：左文右照 */}
        <section className="pb-16 sm:pb-20">
          <h2 className="ug-section-title text-lg mb-5">地址與交通</h2>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-7 space-y-3 ug-body ug-ink-2">
              <p><span className="font-bold ug-ink">地址：</span>台中市東區自由路四段309號（同棟3樓為莎朗嘿yo韓式照相館，入口在店內，可請櫃台人員引導上樓）。</p>
              <p><span className="font-bold ug-ink">停車：</span>機車可停門口；汽車可停正對面自由路四段310號「車麻吉」停車場。</p>
              <p><span className="font-bold ug-ink">公車：</span>站牌「東英自由路口」61、241路；站牌「自由東英路口」249路，下車步行約1分鐘。</p>
            </div>
            <div className="lg:col-span-5">
              <div className="aspect-[4/3]">
                <img
                  src="/images/env/web/counter.webp"
                  alt="烏嘎嘎桌遊店內櫃台"
                  width="1000"
                  height="750"
                  loading="lazy"
                  className="ug-photo"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 樓層：照片牆 */}
        <section className="pb-16 sm:pb-20">
          <h2 className="ug-section-title text-lg mb-5">店內樓層</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {FLOORS.map((f) => (
              <article key={f.floor}>
                <div className="aspect-[4/3]">
                  <img src={f.photo} alt={f.alt} width="1000" height="750" loading="lazy" className="ug-photo" />
                </div>
                {/* 分隔號｜保留在 DOM 裡（純文字要與舊版一致），只是視覺上淡化 */}
                <h3 className="flex items-baseline gap-2 font-bold ug-ink text-base mt-3">
                  <span className="ug-floor-no text-[28px]">{f.floor}</span>
                  <span className="ug-ink-3 font-normal">｜</span>
                  <span>{f.title}</span>
                </h3>
                <p className="ug-body ug-ink-2 mt-1.5">{f.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* 聯絡方式：細線列表 */}
        <section className="pb-16 sm:pb-20">
          <h2 className="ug-section-title text-lg mb-5">聯絡方式</h2>
          <dl className="ug-divide ug-hair max-w-[52ch]">
            {CONTACTS.map((c) => (
              <div key={c.label} className="flex items-center justify-between gap-4 py-3.5">
                <dt className="ug-ink-3 text-[15px]">{c.label}</dt>
                <dd>
                  <a
                    href={c.href}
                    {...(c.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                    className="font-bold ug-accent text-[15px]"
                  >
                    {c.value}
                  </a>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="ug-surface p-6 max-w-[70ch]">
          <p className="ug-body ug-ink-2">
            <span className="font-bold ug-ink">同棟3F為莎朗嘿yo韓式照相館</span>，提供韓式證件照與個人形象寫真，入口在烏嘎嘎桌遊店內，可直接向櫃台詢問。
            更多資訊請見 <a href="https://heyyo520.tw" target="_blank" rel="noreferrer" className="underline ug-accent">heyyo520.tw</a>。
          </p>
        </section>
      </div>

      <PublicFooter />
    </div>
  );
}
