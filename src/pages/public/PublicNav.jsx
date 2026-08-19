import { Link, useLocation } from 'react-router-dom';

const LINKS = [
  { to: '/about', label: '店家資訊' },
  { to: '/pricing', label: '服務與收費' },
  { to: '/faq', label: '常見問題' },
];

export default function PublicNav() {
  const { pathname } = useLocation();
  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link to="/" className="font-bold text-orange-600 text-lg">烏嘎嘎桌遊</Link>
        <nav className="flex items-center gap-3 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={
                pathname === link.to
                  ? 'font-bold text-orange-600'
                  : 'text-stone-500 hover:text-orange-600'
              }
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
    <footer className="max-w-3xl mx-auto px-4 sm:px-6 py-10 text-center text-sm text-stone-400 space-y-1">
      <p>烏嘎嘎桌遊｜台中市東區自由路四段309號</p>
      <p>
        會員請至 <a href="/app" className="text-orange-600 underline">烏嘎嘎會員 APP</a> 查詢消費、預約與租借
      </p>
    </footer>
  );
}
