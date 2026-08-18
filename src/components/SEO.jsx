import { Helmet } from 'react-helmet-async';

export const SITE_URL = 'https://uggboardgame.vercel.app';
export const SITE_NAME = '烏嘎嘎桌遊';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/LOGO.jpg`;

export const absoluteUrl = (path = '/') => {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

// 營業時間：13:00–24:00，週二公休（其餘六天皆營業）
export const businessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': `${SITE_URL}/#business`,
  name: SITE_NAME,
  url: SITE_URL,
  image: `${SITE_URL}/images/LOGO.jpg`,
  logo: `${SITE_URL}/images/LOGO.jpg`,
  telephone: '+886-4-2215-4321',
  priceRange: '$$',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '自由路四段309號',
    addressLocality: '東區',
    addressRegion: '台中市',
    addressCountry: 'TW',
  },
  areaServed: [
    { '@type': 'City', name: '台中市' },
    { '@type': 'Country', name: '台灣' },
  ],
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '13:00',
      closes: '24:00',
    },
  ],
  sameAs: [
    'https://www.facebook.com/UGGBG/',
    'https://www.instagram.com/uggboardgame/',
  ],
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: 'zh-Hant-TW',
  publisher: { '@id': `${SITE_URL}/#business` },
};

export const faqSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
});

const breadcrumbSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

export { breadcrumbSchema };

const SEO = ({
  title,
  description,
  path = '/',
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  locale = 'zh_TW',
  noindex = false,
  schema,
}) => {
  const canonicalUrl = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);
  const schemas = Array.isArray(schema) ? schema : schema ? [schema] : [];

  return (
    <Helmet prioritizeSeoTags>
      <html lang="zh-TW" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={locale} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {schemas.map((item, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
