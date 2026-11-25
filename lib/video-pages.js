import { sections } from './sections.js';
import { servicePages } from './pages.js';

// The website and the bot share the actual page registry.
export const videoPages = [
  { slug: 'home', label: 'Главная', href: '/' },
  ...sections.filter(({ slug }) => !['video', 'kontakty'].includes(slug))
    .map(({ slug, label }) => ({ slug, label, href: `/${slug}` })),
  ...servicePages.map(({ slug, crumb }) => ({ slug, label: crumb, href: `/${slug}` })),
];

export function validVideoPages(slugs) {
  const available = new Set(videoPages.map(({ slug }) => slug));
  return [...new Set(slugs)].filter((slug) => available.has(slug));
}
