// JSON-LD для сайта. Здесь только реально существующие данные:
// имя врача, адрес приёма, телефон, часы, профиль на ПроДокторов и услуги,
// которые уже перечислены на сайте. Рейтинги и отзывы намеренно не размечаются.

import {
  SITE,
  DOCTOR_NAME,
  PHONE,
  EMAIL,
  ADDRESS,
  CLINIC,
  PRODOCTOROV,
  OG_IMAGE,
  services,
  diagnostics,
} from './content';

export const PHYSICIAN_ID = `${SITE}/#physician`;
export const CLINIC_ID = `${SITE}/#clinic`;

const postalAddress = {
  '@type': 'PostalAddress',
  postalCode: ADDRESS.postalCode,
  addressRegion: ADDRESS.region,
  addressLocality: ADDRESS.city,
  streetAddress: ADDRESS.street,
  addressCountry: 'RU',
};

// Услуги берём из того же источника, что и карточки на сайте,
// чтобы разметка не разошлась с текстом страницы.
const availableService = [
  ...services.map((s) => ({
    '@type': 'MedicalProcedure',
    name: s.title,
    description: s.text,
  })),
  ...diagnostics.map((d) => ({
    '@type': 'MedicalTest',
    name: d.title,
    description: d.text,
  })),
];

// Юридическое лицо, оказывающее медицинские услуги, — отдельная сущность.
// Врач ведёт приём в ней, поэтому связываем их через worksFor / parentOrganization.
export const clinicSchema = {
  '@type': 'MedicalOrganization',
  '@id': CLINIC_ID,
  name: CLINIC.name,
  legalName: CLINIC.legalName,
  taxID: CLINIC.inn,
  identifier: CLINIC.ogrn,
  url: `${SITE}/license`,
  telephone: PHONE,
  address: postalAddress,
};

export const physicianSchema = {
  '@type': 'Physician',
  '@id': PHYSICIAN_ID,
  name: DOCTOR_NAME,
  alternateName: 'Маркарян Эдуард Жорикович',
  url: SITE,
  image: `${SITE}${OG_IMAGE}`,
  telephone: PHONE,
  email: EMAIL,
  address: postalAddress,
  areaServed: ['Пятигорск', 'Ессентуки', 'Кавказские Минеральные Воды'],
  medicalSpecialty: ['https://schema.org/Gastroenterologic', 'https://schema.org/Surgical'],
  knowsAbout: ['Проктология', 'Колопроктология', 'Эндоскопия'],
  knowsLanguage: 'ru',
  sameAs: [PRODOCTOROV],
  worksFor: { '@id': CLINIC_ID },
  parentOrganization: { '@id': CLINIC_ID },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
  ],
  availableService,
};

export function breadcrumbSchema(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      item: `${SITE}${item.href}`,
    })),
  };
}

// Только вопросы с реально показанным на странице ответом.
export function faqSchema(items) {
  if (!items.length) return null;
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: Array.isArray(item.a) ? item.a.join(' ') : item.a,
      },
    })),
  };
}

export function graph(nodes) {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes.filter(Boolean),
  };
}
