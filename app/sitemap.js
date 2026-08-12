import { SITE } from '@/lib/content';
import { servicePageSlugs } from '@/lib/pages';

// В карту сайта попадают только реально индексируемые страницы.
// Служебных, API- и noindex-адресов на сайте нет.
export default function sitemap() {
  const lastModified = new Date();

  return [
    { url: `${SITE}/`, lastModified, changeFrequency: 'monthly', priority: 1 },

    ...servicePageSlugs.map((slug) => ({
      url: `${SITE}/${slug}`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    })),

    { url: `${SITE}/license`, lastModified, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE}/privacy`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
