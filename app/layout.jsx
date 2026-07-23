import { Manrope, Lora } from 'next/font/google';
import { BookingProvider } from '@/components/BookingProvider';
import CookieConsent from '@/components/CookieConsent';

import '@/styles/base.css';
import '@/styles/layout.css';
import '@/styles/components.css';
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

const SITE = 'https://dr-markaryan.ru';
const TITLE = 'Проктолог в Пятигорске — доктор Эдуард Маркарян';
const DESCRIPTION =
  'Проктолог в Пятигорске Эдуард Маркарян. Приём взрослых пациентов, диагностика и лечение геморроя, анальных трещин и свищей на КМВ.';

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
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
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
