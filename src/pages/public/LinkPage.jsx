// QR code 快速連結頁（uggboardgame.com/link）：給現場掃 QR 的客人一鍵直達各入口。
// 網址一旦印在實體物上，路徑 /link 就不可再改；要調整的是頁面內容，不是網址。
// noindex 且不進 sitemap（因此不會被 prerender），避免與官網門面頁在搜尋結果打架。
import { Link } from 'react-router-dom';
import { Globe, MapPin, MessageCircle, Phone, Star } from 'lucide-react';
import SEO, { LINE_URL } from '../../components/SEO';

// lucide 1.x 已移除品牌圖示，Instagram 標誌改用內嵌 SVG。
const InstagramIcon = ({ size = 20, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const LINKS = [
  {
    href: LINE_URL,
    icon: MessageCircle,
    label: '加入官方 LINE',
    sub: '訂位・活動通知・會員 APP 入口',
    primary: true,
  },
  // 刻意不放會員 APP 的直達連結：APP 入口在 LINE 圖文選單裡，
  // 這裡若開一條捷徑，客人就會跳過加 LINE 直接進 APP（Lu 2026-08-27 裁定）。
  {
    href: '/',
    icon: Globe,
    label: '官方網站',
    sub: '收費方式・店內介紹・常見問題',
    internal: true,
  },
  {
    href: 'https://www.instagram.com/uggboardgame/',
    icon: InstagramIcon,
    label: 'Instagram',
    sub: '@uggboardgame',
  },
  {
    // 直接開啟 Google「寫評論」視窗。Place ID 由店家地圖 ftid
    // (0x34693d4ebeee27bf:0x46e132c9090a17cf) 換算，已反查確認為烏嘎嘎桌遊。
    href: 'https://search.google.com/local/writereview?placeid=ChIJvyfuvk49aTQRzxcKCcky4UY',
    icon: Star,
    label: 'Google 五星好評',
    sub: '玩得開心的話，留個評論鼓勵我們',
  },
  {
    href: 'https://www.google.com/maps/place/?q=place_id:ChIJvyfuvk49aTQRzxcKCcky4UY',
    icon: MapPin,
    label: 'Google 地圖',
    sub: '台中市東區自由路四段309號',
  },
  {
    href: 'tel:0422154321',
    icon: Phone,
    label: '電話直撥',
    sub: '04-2215-4321',
  },
];

const LinkButton = ({ href, icon: Icon, label, sub, primary, internal }) => {
  const className = [
    'w-full flex items-center gap-4 px-5 py-4 rounded-[4px] border transition-colors',
    primary
      ? 'ug-btn-primary border-transparent'
      : 'ug-surface hover:border-[var(--ug-accent)]',
  ].join(' ');

  const content = (
    <>
      <Icon size={20} strokeWidth={1.75} className={`shrink-0 ${primary ? 'text-white' : 'ug-accent'}`} />
      <span className="flex flex-col text-left leading-snug">
        <span className={`text-[0.9375rem] font-bold ${primary ? 'text-white' : 'ug-ink'}`}>{label}</span>
        <span className={`text-xs mt-0.5 ${primary ? 'text-white/75' : 'ug-ink-3'}`}>{sub}</span>
      </span>
    </>
  );

  return internal ? (
    <Link to={href} className={className}>{content}</Link>
  ) : (
    <a
      href={href}
      target={href.startsWith('tel:') ? undefined : '_blank'}
      rel="noreferrer"
      className={className}
    >
      {content}
    </a>
  );
};

const LinkPage = () => (
  <>
    <SEO
      title="快速連結｜烏嘎嘎桌遊"
      description="烏嘎嘎桌遊快速連結：官方 LINE、官方網站、Instagram、Google 地圖與電話。"
      path="/link"
      noindex
    />
    <div className="public-page min-h-screen flex flex-col items-center px-6 py-14">
      <div className="w-full max-w-sm flex flex-col items-center">
        <img
          src="/images/LOGO.jpg"
          alt="烏嘎嘎桌遊 Logo"
          width="512"
          height="512"
          className="w-24 h-24 object-cover rounded-[4px] mb-5"
          fetchpriority="high"
          decoding="async"
        />
        <h1 className="text-2xl font-bold ug-ink tracking-tight mb-2">烏嘎嘎桌遊</h1>
        <p className="ug-accent text-xs font-bold tracking-[0.25em] mb-10">台中東區・1,700款桌遊</p>

        <div className="w-full flex flex-col gap-3">
          {LINKS.map((item) => (
            <LinkButton key={item.label} {...item} />
          ))}
        </div>

        <p className="ug-ink-3 text-[11px] mt-12 text-center leading-relaxed">
          台中市東區自由路四段309號<br />
          每日 13:00–24:00，週二固定公休<br />
          © {new Date().getFullYear()} 烏嘎嘎桌遊
        </p>
      </div>
    </div>
  </>
);

export default LinkPage;
