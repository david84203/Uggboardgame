import SEO, { businessSchema, breadcrumbSchema, faqSchema } from '../../components/SEO';
import PublicNav, { PublicFooter } from './PublicNav';

// 事實來源：會員 APP 的 RentRulesPage（租金級距、注意事項）＋收費頁租借段（Lv.3 延長 5 天）。改規則三處一起改。
const TIERS = [
  { range: '定價 500 元以下', rent: '50 元' },
  { range: '定價 501～1,000 元', rent: '100 元' },
  { range: '定價 1,001～1,500 元', rent: '150 元' },
  { range: '定價 1,501～2,000 元', rent: '200 元' },
  { range: '定價 2,001 元以上', rent: '每多 500 元加收 50 元' },
];

const STEPS = [
  '到店出示會員身分（非會員先在櫃台入會，入會費 399 元、永久有效無年費，當天辦當天就能租）。',
  '挑好要租的遊戲，和店員一起清點配件。',
  '付押金（該遊戲定價全額）＋租金，即可帶回家。',
  '租期自出租隔天起算 3 天；會員等級 Lv.3（棋盤老手）以上延長為 5 天。',
  '歸還時由店員清點配件，沒有缺件就全額退還押金。',
];

const FAQS = [
  {
    q: '台中哪裡可以租桌遊？',
    a: '烏嘎嘎桌遊（台中市東區自由路四段309號）提供會員桌遊租借：押金為遊戲定價全額，租金依定價分級，定價500元以下租金50元，每多500元加收50元；租期自出租隔天起算3天，會員等級Lv.3以上延長為5天。',
  },
  {
    q: '不是會員可以租嗎？',
    a: '租借限本店會員。非會員可在櫃台現場入會，入會費399元、永久有效、無年費，當天辦當天就能租借。',
  },
  {
    q: '逾期還或缺件怎麼辦？',
    a: '逾期歸還視同續借，需再付一次租金。歸還時配件不全，押金不退還，該遊戲直接交由租借方帶回。',
  },
  {
    q: '租回家玩得喜歡，可以直接買嗎？',
    a: '可以。歸還時購買同款全新遊戲享85折優惠。',
  },
  {
    q: '租借時間跟營業時間有關嗎？',
    a: '租借與歸還都在營業時間內辦理：每日13:00–24:00，週二公休。',
  },
];

const seo = {
  title: '台中桌遊租借｜烏嘎嘎桌遊．租金50元起．租期3天',
  description:
    '台中東區烏嘎嘎桌遊會員桌遊租借：押金＝遊戲定價，租金依定價分級50元起，租期3天（Lv.3以上5天），歸還後買同款新品85折。入會費399元、當天辦當天租。',
  path: '/rent',
  schema: [
    businessSchema,
    breadcrumbSchema([
      { name: '首頁', path: '/' },
      { name: '桌遊租借', path: '/rent' },
    ]),
    faqSchema(FAQS.map(({ q, a }) => ({ question: q, answer: a }))),
  ],
};

export default function RentPage() {
  return (
    <div className="public-page public-rent min-h-screen">
      <SEO {...seo} />
      <PublicNav />

      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <header className="ug-subpage-hero ug-subpage-hero-copy pt-12 sm:pt-20 pb-12 sm:pb-16 max-w-[58ch]">
          <h1 className="text-[28px] sm:text-[40px] font-black ug-ink mb-4">台中桌遊租借</h1>
          <p className="ug-lead ug-ink-2">
            <span className="font-bold ug-ink">桌遊租借限烏嘎嘎會員</span>。押金是遊戲定價全額、歸還沒缺件就全退，租金 50 元起，可以把桌遊帶回家玩 3 天。
          </p>
        </header>

        <section className="ug-section pb-12 sm:pb-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="ug-section-title text-lg mb-4">租金怎麼算</h2>
            <table className="w-full ug-body ug-ink-2">
              <tbody>
                {TIERS.map((t) => (
                  <tr key={t.range} className="border-b border-current/10">
                    <td className="py-2 pr-4">{t.range}</td>
                    <td className="py-2 font-bold ug-ink text-right">{t.rent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="ug-body ug-ink-2 mt-3">另付押金＝該遊戲定價全額，歸還清點無缺件即全額退還。</p>
          </div>
          <div>
            <h2 className="ug-section-title text-lg mb-4">怎麼租、怎麼還</h2>
            <ol className="ug-body ug-ink-2 space-y-2 list-decimal pl-5">
              {STEPS.map((s) => <li key={s}>{s}</li>)}
            </ol>
          </div>
        </section>

        <section className="ug-faq-list pb-16 sm:pb-20">
          {FAQS.map((item, i) => (
            <div key={i} className="ug-faq-row grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-10">
              <h2 className="lg:col-span-5 font-bold ug-ink text-base sm:text-[17px] leading-[1.7] flex gap-3">
                <span className="ug-accent shrink-0 tabular-nums font-black">Q{i + 1}.</span>
                <span>{item.q}</span>
              </h2>
              <p className="lg:col-span-7 ug-body ug-ink-2 pl-9 lg:pl-0">{item.a}</p>
            </div>
          ))}
        </section>
      </div>

      <PublicFooter />
    </div>
  );
}
