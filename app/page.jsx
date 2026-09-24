import Header from '@/components/Header';
import Hero from '@/components/Hero';
import TrustStrip from '@/components/TrustStrip';
import About from '@/components/About';
import SectionLinks from '@/components/SectionLinks';
import Contacts from '@/components/Contacts';
import Footer from '@/components/Footer';
import Fab from '@/components/Fab';
import JsonLd from '@/components/JsonLd';
import HashRedirect from '@/components/HashRedirect';
import { graph, physicianSchema, clinicSchema } from '@/lib/schema';

// Главная — вход и навигатор. Развёрнутые блоки (биография, направления,
// диагностика, вопросы, видео) переехали на собственные адреса: см.
// lib/sections.js. Здесь только первый экран, короткие анонсы и контакты,
// чтобы один и тот же текст не стоял на двух адресах сразу.
//
// FAQPage-разметки тут больше нет: вопросы живут на /voprosy и
// /kak-prohodit, разметка уехала вместе с ними.
const structuredData = graph([physicianSchema, clinicSchema]);

export default function Home() {
  return (
    <>
      <JsonLd data={structuredData} />
      <HashRedirect />
      <Header transparent />
      <main>
        <Hero />
        <TrustStrip />
        <About teaser />
        <SectionLinks />
        <Contacts />
      </main>
      <Footer />
      <Fab />
    </>
  );
}
