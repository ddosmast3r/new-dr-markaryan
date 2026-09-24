import { Golos_Text, Rubik, JetBrains_Mono } from 'next/font/google';
import { BookingProvider } from '@/components/BookingProvider';
import CookieConsent from '@/components/CookieConsent';
import VkAdsPixel from '@/components/VkAdsPixel';
import { SITE, OG_IMAGE, OG_IMAGE_ALT } from '@/lib/content';

import '@/styles/base.css';
import '@/styles/layout.css';
import '@/styles/components.css';
import '@/styles/service.css';
import '@/styles/responsive.css';

// Тройка под кириллицу: Golos Text (Паратайп) для текста, Rubik —
// скруглённый гротеск для заголовков, JetBrains Mono — для капслочных
// надзаголовков и микро-подписей.
//
// --font-display держит именно гротеск, не сериф: у Rubik скруглены углы
// штрихов, поэтому тяжёлые заголовки читаются мягко, а не агрессивно.
// Акцент в слогане сделан цветом, а не наклоном: курсив у жирного
// гротеска выглядит инородно (см. h1 em в styles/base.css).
const sans = Golos_Text({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const display = Rubik({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  variable: '--font-display',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

const TITLE = 'Проктолог и колопроктолог в Пятигорске — Эдуард Маркарян';
const DESCRIPTION =
  'Приём проктолога и хирурга-колопроктолога Эдуарда Маркаряна в Пятигорске. Диагностика и лечение заболеваний прямой кишки и анального канала. Запись на приём.';

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
    <html lang="ru" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body>
        <BookingProvider>{children}</BookingProvider>
        <CookieConsent />
        <VkAdsPixel />
      </body>
    </html>
  );
}
