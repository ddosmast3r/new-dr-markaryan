import Header from './Header';
import Footer from './Footer';
import Fab from './Fab';
import PageHero from './PageHero';
import JsonLd from './JsonLd';
import { Children } from 'react';
import Contacts from './Contacts';
import UploadedVideos from './UploadedVideos';
import { crumbsFor, sectionBySlug } from '@/lib/sections';
import { graph, physicianSchema, clinicSchema, breadcrumbSchema } from '@/lib/schema';

// Общая обвязка внутренней страницы раздела. Структура повторяет главную:
// стеклянная шапка поверх тёмного первого экрана, ниже светлая часть,
// затем подвал. Содержимое приходит детьми — это те же секции, что
// раньше стояли на одностраничнике.
export default function PageShell({ slug, children, extraSchema = [] }) {
  const content = Children.toArray(children);
  const contactsIndex = content.findIndex((child) => child.type === Contacts);
  if (!['video', 'kontakty'].includes(slug)) {
    content.splice(contactsIndex < 0 ? content.length : contactsIndex, 0, <UploadedVideos key="uploaded-videos" slug={slug} />);
  }
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
        {content}
      </main>

      <Footer />
      <Fab />
    </>
  );
}
