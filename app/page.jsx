import Header from '@/components/Header';
import Hero from '@/components/Hero';
import TrustStrip from '@/components/TrustStrip';
import About from '@/components/About';
import FirstVisit from '@/components/FirstVisit';
import Reviews from '@/components/Reviews';
import SectionLinks from '@/components/SectionLinks';
import Contacts from '@/components/Contacts';
import Footer from '@/components/Footer';
import Fab from '@/components/Fab';
import JsonLd from '@/components/JsonLd';
import HashRedirect from '@/components/HashRedirect';
import { graph, physicianSchema, clinicSchema } from '@/lib/schema';

// Главная помогает выбрать направление и подготовиться к первому визиту.
// Подробные материалы остаются на отдельных страницах.
const structuredData = graph([physicianSchema, clinicSchema]);

export default function Home() {
  return (
    <>
      <JsonLd data={structuredData} />
      <HashRedirect />
      <Header transparent />
      <main>
        <Hero />
        <SectionLinks />
        <TrustStrip />
        <FirstVisit />
        <About teaser />
        <Reviews />
        <Contacts />
      </main>
      <Footer />
      <Fab />
    </>
  );
}
