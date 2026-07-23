import Header from '@/components/Header';
import Hero from '@/components/Hero';
import TrustStrip from '@/components/TrustStrip';
import About from '@/components/About';
import Services from '@/components/Services';
import Diagnostics from '@/components/Diagnostics';
import Steps from '@/components/Steps';
import Faq from '@/components/Faq';
import Reviews from '@/components/Reviews';
import Works from '@/components/Works';
import Contacts from '@/components/Contacts';
import Footer from '@/components/Footer';
import Fab from '@/components/Fab';
import { PHONE } from '@/lib/content';

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  name: 'Доктор Маркарян — проктолог в Пятигорске',
  url: 'https://dr-markaryan.ru',
  telephone: PHONE,
  description:
    'Приём врача-проктолога, хирурга-колопроктолога Эдуарда Маркаряна в Пятигорске.',
  address: {
    '@type': 'PostalAddress',
    postalCode: '357502',
    addressRegion: 'Ставропольский край',
    addressLocality: 'Пятигорск',
    streetAddress: 'пр-кт Калинина, зд. 90А',
    addressCountry: 'RU',
  },
  areaServed: ['Пятигорск', 'Кавказские Минеральные Воды'],
  medicalSpecialty: [
    'https://schema.org/Gastroenterologic',
    'https://schema.org/Surgical',
  ],
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '09:00',
    closes: '18:00',
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Header />
      <main>
        <Hero />
        <TrustStrip />
        <About />
        <Services />
        <Diagnostics />
        <Steps />
        <Faq />
        <Reviews />
        <Works />
        <Contacts />
      </main>
      <Footer />
      <Fab />
    </>
  );
}
