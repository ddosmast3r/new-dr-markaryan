import Header from '@/components/Header';
import Hero from '@/components/Hero';
import TrustStrip from '@/components/TrustStrip';
import About from '@/components/About';
import Services from '@/components/Services';
import Diagnostics from '@/components/Diagnostics';
import Steps from '@/components/Steps';
import BeforeVisit from '@/components/BeforeVisit';
import Faq from '@/components/Faq';
import Reviews from '@/components/Reviews';
import Works from '@/components/Works';
import Contacts from '@/components/Contacts';
import Footer from '@/components/Footer';
import Fab from '@/components/Fab';
import JsonLd from '@/components/JsonLd';
import { faq, beforeVisit } from '@/lib/content';
import { graph, physicianSchema, clinicSchema, faqSchema } from '@/lib/schema';

// Вопросы и ответы FAQ выводятся на странице целиком (внутри <details>),
// поэтому FAQPage-разметка соответствует видимому контенту.
const structuredData = graph([physicianSchema, clinicSchema, faqSchema([...faq, ...beforeVisit])]);

export default function Home() {
  return (
    <>
      <JsonLd data={structuredData} />
      <Header />
      <main>
        <Hero />
        <TrustStrip />
        <About />
        <Services />
        <Diagnostics />
        <Steps />
        <BeforeVisit />
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
