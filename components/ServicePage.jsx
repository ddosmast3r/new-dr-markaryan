import Image from 'next/image';
import Link from 'next/link';
import Header from './Header';
import Footer from './Footer';
import Fab from './Fab';
import Reveal from './Reveal';
import Icon from './Icon';
import BookButton from './BookButton';
import Breadcrumbs from './Breadcrumbs';
import Contacts from './Contacts';
import DoctorCard from './DoctorCard';
import FaqList from './FaqList';
import Steps from './Steps';
import Procedures from './Procedures';
import Reels from './Reels';
import JsonLd from './JsonLd';
import TrackedLink from './TrackedLink';
import { GOALS } from '@/lib/metrika';
import {
  PHONE, PHONE_HREF, ADDRESS, HOURS_TEXT, MAP_URL, DOCTOR_NAME, SITE,
  OG_IMAGE, OG_IMAGE_ALT,
} from '@/lib/content';
import { servicePageBySlug, answeredFaq } from '@/lib/pages';
import { graph, physicianSchema, clinicSchema, breadcrumbSchema, faqSchema } from '@/lib/schema';

export function breadcrumbsFor(page) {
  return [
    { href: '/', label: 'Главная' },
    { href: `/${page.slug}`, label: page.crumb },
  ];
}

export default function ServicePage({ slug }) {
  const page = servicePageBySlug[slug];
  const crumbs = breadcrumbsFor(page);
  const faqItems = answeredFaq(page);

  const jsonLd = graph([
    physicianSchema,
    clinicSchema,
    breadcrumbSchema(crumbs),
    faqSchema(faqItems),
  ]);

  return (
    <>
      <JsonLd data={jsonLd} />
      <Header />

      <main>
        <section className="svc-hero">
          <div className="container">
            <Breadcrumbs items={crumbs} />

            <div className="svc-hero-grid">
              <div className="svc-hero-copy">
                <p className="eyebrow">{page.eyebrow}</p>
                <h1>{page.h1}</h1>
                <p className="lead">{page.intro}</p>
                {page.note && <p className="svc-note">{page.note}</p>}

                <div className="svc-actions">
                  <BookButton className="btn btn-primary btn-lg">
                    Записаться на приём
                    <Icon name="arrowRight" width="20" height="20" />
                  </BookButton>
                  <TrackedLink goal={GOALS.PHONE} href={PHONE_HREF} className="btn btn-ghost">
                    <Icon name="phone" width="18" height="18" />
                    {PHONE}
                  </TrackedLink>
                </div>
              </div>

              {/* Кадр справа: страница услуги — точка входа из поиска,
                  и до этого первый экран был текстом на пустом поле. */}
              {page.media && (
                <div className="svc-hero-media">
                  <Image
                    src={page.media.src}
                    alt={page.media.alt}
                    fill
                    priority
                    sizes="(max-width: 960px) 100vw, 460px"
                    style={{ objectFit: 'cover', objectPosition: page.media.position }}
                  />
                  {page.media.chip && (
                    <span className="svc-hero-chip"><span className="dot" />{page.media.chip}</span>
                  )}
                  {page.media.caption && (
                    <span className="svc-hero-cap">{page.media.caption}</span>
                  )}
                </div>
              )}
            </div>

            <ul className="svc-facts">
              <li><span>Врач</span><strong>{DOCTOR_NAME}</strong></li>
              <li>
                <span>Адрес приёма</span>
                <a href={MAP_URL} target="_blank" rel="noopener">
                  {ADDRESS.city}, {ADDRESS.street}
                </a>
              </li>
              <li><span>Часы приёма</span><strong>{HOURS_TEXT}</strong></li>
            </ul>
          </div>
        </section>

        {/* Секции чередуют фон (бежевый / белый) — как на главной */}
        {page.blocks.map((block, i) => (
          <section className={`section svc-block${i % 2 ? ' section-tint' : ''}`} key={block.heading}>
            <div className="container">
              <Reveal className="section-head">
                <h2>{block.heading}</h2>
                {block.lead && <p className="section-sub">{block.lead}</p>}
              </Reveal>

              <div className="diag-grid">
                {block.cards.map((card) => {
                  // Ссылка есть только у направлений с собственной страницей
                  // и никогда — на саму текущую страницу.
                  const href = card.href === `/${page.slug}` ? null : card.href;
                  return (
                    <Reveal
                      as="article"
                      className={`diag${href ? ' card-linked' : ''}`}
                      key={card.title}
                    >
                      <span className="diag-ico"><Icon name={card.icon} /></span>
                      <div>
                        <h3>{card.title}</h3>
                        <p>{card.text}</p>
                        {href && (
                          <Link className="card-link" href={href}>
                            {card.anchor}
                            <Icon name="arrowRight" width="16" height="16" />
                          </Link>
                        )}
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>
        ))}

        {page.video && (
          <section className={`section${page.blocks.length % 2 ? ' section-tint' : ''}`}>
            <div className="container">
              <Reveal className="section-head">
                <h2>{page.video.heading}</h2>
                {page.video.lead && <p className="section-sub">{page.video.lead}</p>}
              </Reveal>
              <Procedures items={page.video.items} />
              {page.reel && <Reels items={[page.reel]} />}
            </div>
          </section>
        )}

        <Steps />

        <DoctorCard tint={false} />

        {faqItems.length > 0 && (
          <section className="section section-tint" id="faq">
            <div className="container faq-grid">
              <Reveal className="faq-intro">
                <p className="eyebrow">Вопросы</p>
                <h2>Частые вопросы</h2>
                <p className="section-sub">
                  Не нашли свой вопрос — напишите в мессенджер, отвечу сам.
                </p>
                <BookButton className="btn btn-ghost">Задать свой вопрос</BookButton>
              </Reveal>
              <Reveal>
                <FaqList items={faqItems} />
              </Reveal>
            </div>
          </section>
        )}

        <Contacts
          heading={`Приём в ${ADDRESS.city}е`}
          intro={`${page.crumb} — одно из направлений приёма. Напишите в мессенджер, отвечу сам, или выберите время на ПроДокторов.`}
        />

        <section className="section svc-related">
          <div className="container">
            <Reveal className="section-head">
              <h2>Другие направления</h2>
            </Reveal>
            <ul className="related-list">
              {page.related.map((relatedSlug) => {
                const item = servicePageBySlug[relatedSlug];
                return (
                  <li key={relatedSlug}>
                    <Link href={`/${item.slug}`}>
                      {item.crumb}
                      <Icon name="arrowRight" width="16" height="16" />
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link href="/">
                  Проктолог в Пятигорске — главная
                  <Icon name="arrowRight" width="16" height="16" />
                </Link>
              </li>
            </ul>

            <p className="svc-disclaimer">
              Информация на странице носит справочный характер и не заменяет
              очную консультацию. Имеются противопоказания, необходима
              консультация специалиста.
            </p>
          </div>
        </section>
      </main>

      <Footer />
      <Fab />
    </>
  );
}

// Метаданные страницы услуги: уникальные title/description, канонический адрес
// на саму себя и OpenGraph.
export function serviceMetadata(slug) {
  const page = servicePageBySlug[slug];
  const url = `${SITE}/${page.slug}`;
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/${page.slug}` },
    robots: { index: true, follow: true },
    openGraph: {
      title: page.title,
      description: page.description,
      url,
      siteName: 'Доктор Маркарян',
      locale: 'ru_RU',
      type: 'article',
      images: [{ url: OG_IMAGE, width: 1024, height: 1536, alt: OG_IMAGE_ALT }],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.description,
      images: [OG_IMAGE],
    },
  };
}
