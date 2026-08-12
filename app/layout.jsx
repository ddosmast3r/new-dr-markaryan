import { Manrope, Lora } from 'next/font/google';
import { BookingProvider } from '@/components/BookingProvider';
import CookieConsent from '@/components/CookieConsent';
import { SITE, OG_IMAGE, OG_IMAGE_ALT } from '@/lib/content';

import '@/styles/base.css';
import '@/styles/layout.css';
import '@/styles/components.css';
import '@/styles/service.css';
import '@/styles/responsive.css';

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  variable: '--font-serif',
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
  themeColor: '#4f6b57',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru" className={`${manrope.variable} ${lora.variable}`}>
      <body>
        <BookingProvider>{children}</BookingProvider>
        <CookieConsent />
      </body>
    </html>
  );
}
