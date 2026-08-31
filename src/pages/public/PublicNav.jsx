import { Link, useLocation } from 'react-router-dom';

const LINKS = [
  { to: '/about', label: '店家資訊' },
  { to: '/pricing', label: '服務與收費' },
  { to: '/faq', label: '常見問題' },
];

export default function PublicNav() {
  const { pathname } = useLocation();
  return (
    <header className="ug-public-nav sticky top-0 z-20">
      <div className="ug-nav-inner max-w-6xl mx-auto px-4 sm:px-8 flex items-center justify-between gap-3">
        <Link to="/" className="ug-brand shrink-0" aria-label="烏嘎嘎桌遊首頁">
          <img src="/favicon.svg" alt="" width="40" height="40" aria-hidden="true" />
          <span className="ug-brand-copy">
            <strong>烏嘎嘎桌遊</strong>
            <small>TAICHUNG · SINCE 2016</small>
          </span>
        </Link>
        <nav className="ug-nav-links flex items-center whitespace-nowrap" aria-label="主要導覽">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              aria-current={pathname === link.to ? 'page' : undefined}
              className={pathname === link.to ? 'ug-nav-link is-active' : 'ug-nav-link'}
            >
              {link.label}
            </Link>
          ))}
          <a href="/go/line/nav" target="_blank" rel="nofollow noreferrer" className="ug-nav-cta">加入 LINE</a>
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="ug-footer mt-20">
      <div className="ug-footer-inner max-w-6xl mx-auto px-5 sm:px-8 py-10">
        <div className="ug-footer-brand">
          <img src="/favicon.svg" alt="" width="42" height="42" aria-hidden="true" />
          <div>
            <p className="font-black ug-ink">烏嘎嘎桌遊</p>
            <p className="text-sm ug-ink-3">台中市東區自由路四段309號</p>
          </div>
        </div>
        <p className="ug-footer-copy text-sm ug-ink-3">
          會員請加 <a href="/go/line/footer" target="_blank" rel="nofollow noreferrer" className="ug-accent underline">官方 LINE</a>，從選單進入會員 APP 查詢消費、預約與租借
        </p>
      </div>
    </footer>
  );
}
