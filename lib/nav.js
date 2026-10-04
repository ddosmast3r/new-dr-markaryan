// Главное меню — проекция реестра разделов (lib/sections.js).
// Отдельный модуль, а не часть content.js: sections.js импортирует SITE
// из content.js, и держать nav там замкнуло бы импорты в цикл.

import { sections } from './sections.js';
import { servicePages } from './pages.js';

// Раздел, к которому относится страница услуги, уже записан в её данных
// полем eyebrow («Лечение» / «Диагностика») — оно совпадает с подписью
// раздела. Отдельного поля-категории не заводим, чтобы не было двух
// источников правды, которые можно рассогласовать.
const childrenOf = (label) =>
  servicePages
    .filter((page) => page.eyebrow === label)
    .map((page) => ({ href: `/${page.slug}`, label: page.crumb }));

export const nav = sections.map(({ slug, label }) => ({
  href: `/${slug}`,
  label,
  children: childrenOf(label),
}));

// Сокращённое меню в подвале: без «Как проходит» и «Видео» — они
// не помещаются в одну строку на узком экране. Страницы направлений
// в подвале выводятся отдельным рядом (см. components/Footer.jsx).
export const footerNav = nav.filter(
  (item) => !['/kak-prohodit', '/video'].includes(item.href)
);
