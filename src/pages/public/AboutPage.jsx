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
      { name: '首頁', path: '/about' },
      { name: '店家資訊', path: '/about' },
    ]),
  ],
};

const FLOORS = [
  { floor: '1F', title: '桌遊牆與販售專區', desc: '超過1,600款開盒桌遊自由借玩，同區設有販售專區，喜歡可直接帶回家。' },
  { floor: '2F', title: '日式地板區', desc: '低桌坐墊設計，適合親子與喜歡放鬆氛圍的玩家。' },
  { floor: '3F', title: '桌椅空間＋電動麻將桌', desc: '店內容納人數最多的樓層，適合重度策略遊戲與包場；另設電動日麻桌（支援日麻／台麻），需預約使用。' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <SEO {...seo} />
      <PublicNav />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        <section className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-stone-800 mb-3">烏嘎嘎桌遊</h1>
          <p className="text-stone-600 text-base leading-relaxed">
            台中市東區自由路四段309號，共有三層開放遊戲空間，店內超過1,600款桌遊可直接借玩，是台中規模數一數二的桌遊店。
          </p>
        </section>

        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-5 sm:p-6">
          <h2 className="font-bold text-amber-800 text-base mb-2">🕐 營業時間</h2>
          <p className="text-stone-700 text-base leading-relaxed">
            <span className="font-bold">每日 13:00–24:00，週二固定公休</span>（其餘六天含國定假日皆正常營業）。最晚可預約時段為 23:00。
            12/31 跨年夜例外延長營業至隔天 02:00。
          </p>
        </section>

        <section className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 sm:px-6 py-3">
            <h2 className="font-bold text-white text-base">📍 地址與交通</h2>
          </div>
          <div className="p-5 sm:p-6 space-y-3 text-stone-600 text-base leading-relaxed">
            <p><span className="font-bold text-stone-800">地址：</span>台中市東區自由路四段309號（同棟3樓為莎朗嘿yo韓式照相館，入口在店內，可請櫃台人員引導上樓）。</p>
            <p><span className="font-bold text-stone-800">停車：</span>機車可停門口；汽車可停正對面自由路四段310號「車麻吉」停車場。</p>
            <p><span className="font-bold text-stone-800">公車：</span>站牌「東英自由路口」61、241路；站牌「自由東英路口」249路，下車步行約1分鐘。</p>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-stone-700 px-5 sm:px-6 py-3">
              <h2 className="font-bold text-white text-base">☎️ 聯絡方式</h2>
            </div>
            <div className="divide-y divide-stone-100">
              <div className="px-5 sm:px-6 py-3 flex items-center justify-between">
                <span className="text-stone-500 text-base">電話</span>
                <a href="tel:0422154321" className="font-bold text-orange-600 text-base">04-2215-4321</a>
              </div>
              <div className="px-5 sm:px-6 py-3 flex items-center justify-between">
                <span className="text-stone-500 text-base">LINE 官方帳號</span>
                <a href="https://line.me/R/ti/p/@160qiryn" target="_blank" rel="noreferrer" className="font-bold text-orange-600 text-base">@160qiryn</a>
              </div>
              <div className="px-5 sm:px-6 py-3 flex items-center justify-between">
                <span className="text-stone-500 text-base">Facebook</span>
                <a href="https://www.facebook.com/UGGBG/" target="_blank" rel="noreferrer" className="font-bold text-orange-600 text-base">UGGBG</a>
              </div>
              <div className="px-5 sm:px-6 py-3 flex items-center justify-between">
                <span className="text-stone-500 text-base">Instagram</span>
                <a href="https://www.instagram.com/uggboardgame/" target="_blank" rel="noreferrer" className="font-bold text-orange-600 text-base">@uggboardgame</a>
              </div>
            </div>
          </section>

          <section className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-teal-600 px-5 sm:px-6 py-3">
              <h2 className="font-bold text-white text-base">🏢 店內樓層</h2>
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
        </div>

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
