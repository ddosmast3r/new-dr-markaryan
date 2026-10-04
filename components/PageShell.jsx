import Header from './Header';
import Footer from './Footer';
import Fab from './Fab';
import PageHero from './PageHero';
import JsonLd from './JsonLd';
import { crumbsFor, sectionBySlug } from '@/lib/sections';
import { graph, physicianSchema, clinicSchema, breadcrumbSchema } from '@/lib/schema';

// Общая обвязка внутренней страницы раздела. Структура повторяет главную:
// стеклянная шапка поверх тёмного первого экрана, ниже светлая часть,
// затем подвал. Содержимое приходит детьми — это те же секции, что
// раньше стояли на одностраничнике.
export default function PageShell({ slug, children, extraSchema = [] }) {
  const crumbs = crumbsFor(slug);
  const jsonLd = graph([
    physicianSchema,
    clinicSchema,
    breadcrumbSchema(crumbs),
    ...extraSchema,
  ]);

  return (
    <>
      <JsonLd data={jsonLd} />
      <Header transparent />

      <main>
        <PageHero crumbs={crumbs} title={sectionBySlug[slug].h1} />
        {children}
      </main>

      <Footer />
      <Fab />
    </>
  );
}
