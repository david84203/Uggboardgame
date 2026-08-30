import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { LINE_URL } from '../../components/SEO';

const DESTINATIONS = {
  line: { label: '官方 LINE', href: LINE_URL },
  phone: { label: '電話撥號', href: 'tel:0422154321' },
  facebook: { label: 'Facebook', href: 'https://www.facebook.com/UGGBG/' },
  instagram: { label: 'Instagram', href: 'https://www.instagram.com/uggboardgame/' },
  review: {
    label: 'Google 評論',
    href: 'https://search.google.com/local/writereview?placeid=ChIJvyfuvk49aTQRzxcKCcky4UY',
  },
  map: {
    label: 'Google 地圖',
    href: 'https://www.google.com/maps/place/?q=place_id:ChIJvyfuvk49aTQRzxcKCcky4UY',
  },
  heyyo: { label: '莎朗嘿yo 韓式照相館', href: 'https://heyyo520.tw/' },
};

export default function OutboundRedirectPage() {
  const { channel } = useParams();
  const destination = DESTINATIONS[channel];

  useEffect(() => {
    if (!destination) return undefined;

    const timer = window.setTimeout(() => {
      window.location.replace(destination.href);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [destination]);

  if (!destination) {
    return (
      <main className="public-page min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <Helmet>
            <title>連結不存在｜烏嘎嘎桌遊</title>
            <meta name="robots" content="noindex, nofollow" />
          </Helmet>
          <h1 className="text-xl font-bold ug-ink mb-3">這個連結不存在</h1>
          <a href="/" className="ug-accent underline">回烏嘎嘎官網</a>
        </div>
      </main>
    );
  }

  return (
    <main className="public-page min-h-screen flex items-center justify-center px-6 text-center">
      <Helmet>
        <title>正在前往{destination.label}｜烏嘎嘎桌遊</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div>
        <p className="text-lg font-bold ug-ink mb-3">正在前往{destination.label}…</p>
        <p className="ug-ink-3 text-sm">
          沒有自動跳轉時，請<a href={destination.href} className="ug-accent underline ml-1">點這裡繼續</a>。
        </p>
      </div>
    </main>
  );
}
