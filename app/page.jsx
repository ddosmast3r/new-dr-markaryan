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

export default function Home() {
  return (
    <>
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
