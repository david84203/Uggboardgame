import { Link, useLocation } from 'react-router-dom';
import { LINE_URL } from '../../components/SEO';

const LINKS = [
  { to: '/about', label: '店家資訊' },
  { to: '/pricing', label: '服務與收費' },
  { to: '/faq', label: '常見問題' },
];

export default function PublicNav() {
  const { pathname } = useLocation();
  return (
    <header
      className="sticky top-0 z-20 border-b"
      style={{ borderColor: 'var(--ug-line)', background: 'var(--ug-bg)' }}
    >
      <div className="max-w-5xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="font-black ug-ink text-[17px] shrink-0">烏嘎嘎桌遊</Link>
        <nav className="flex items-center gap-5 text-sm whitespace-nowrap">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={pathname === link.to ? 'font-bold ug-accent' : 'ug-ink-2 hover:text-[var(--ug-accent)]'}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t mt-20" style={{ borderColor: 'var(--ug-line)' }}>
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm ug-ink-3">
        <p>烏嘎嘎桌遊｜台中市東區自由路四段309號</p>
        <p>
          會員請加 <a href={LINE_URL} target="_blank" rel="noreferrer" className="ug-accent underline">官方 LINE</a>，從選單進入會員 APP 查詢消費、預約與租借
        </p>
      </div>
    </footer>
  );
}
