import { BookingProvider } from '@/components/BookingProvider';
import CookieConsent from '@/components/CookieConsent';
import VkAdsPixel from '@/components/VkAdsPixel';
import MetrikaPageViews from '@/components/MetrikaPageViews';
import { SITE, OG_IMAGE, OG_IMAGE_ALT } from '@/lib/content';

import '@/styles/fonts.css';
import '@/styles/base.css';
import '@/styles/layout.css';
import '@/styles/components.css';
import '@/styles/service.css';
import '@/styles/responsive.css';
import '@/styles/patient.css';

const TITLE = 'Врач-проктолог, эндоскопист в Пятигорске: Эдуард Маркарян';
const DESCRIPTION =
  'Приём врача-проктолога, эндоскописта Эдуарда Маркаряна в Пятигорске. Диагностика и лечение заболеваний прямой кишки и анального канала. Запись на приём.';

export const metadata = {
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['проктолог Пятигорск', 'колопроктолог Пятигорск', 'проктолог', 'КМВ', 'геморрой', 'колоноскопия'],
  alternates: { canonical: '/' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE,
    siteName: 'Доктор Маркарян',
    locale: 'ru_RU',
    type: 'website',
    images: [{ url: OG_IMAGE, width: 1024, height: 1536, alt: OG_IMAGE_ALT }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: '#f8f6f0',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        {/* Preload the Russian text and heading subsets. Other glyphs and the
            label font load through CSS. Font bytes and fallbacks are unchanged. */}
        <link rel="preload" href="/fonts/ffe0837c71e69159-s.p.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/c1b11e140b58cf5a-s.p.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <BookingProvider>{children}</BookingProvider>
        <CookieConsent />
        <MetrikaPageViews />
        <VkAdsPixel />
      </body>
    </html>
  );
}
