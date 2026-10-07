import Link from 'next/link';
import Header from './Header';
import PageHero from './PageHero';
import Footer from './Footer';
import Fab from './Fab';
import Reveal from './Reveal';
import Icon from './Icon';
import BookButton from './BookButton';
import Contacts from './Contacts';
import DoctorCard from './DoctorCard';
import FaqList from './FaqList';
import TreatmentJourney from './TreatmentJourney';
import { treatmentJourneys } from '@/lib/patient-guides';
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

// Смысловой раздел страницы услуги (симптомы, стадии, лечение…).
// Вёрстка та же, что у расширенной страницы колоноскопии.
function GuideSection({ section, tint }) {
  const cls = `section svc-block${tint ? ' section-tint' : ''}`;
  const head = (
    <>
      {section.eyebrow && <p className="eyebrow">{section.eyebrow}</p>}
      <h2>{section.heading}</h2>
      {section.lead && <p className="section-sub">{section.lead}</p>}
    </>
  );

  if (section.type === 'checklist') {
    return (
      <section className={cls} id={section.id}>
        <div className="container colono-indications">
          <Reveal className="colono-indications-copy">{head}</Reveal>
          <Reveal>
            <ul className="colono-checklist">
              {section.items.map((item) => (
                <li key={item}><Icon name="check" width="20" height="20" /><span>{item}</span></li>
              ))}
            </ul>
            {section.note && <p className="colono-med-note">{section.note}</p>}
          </Reveal>
        </div>
      </section>
    );
  }

  if (section.type === 'preparation') {
    return (
      <section className={cls} id={section.id}>
        <div className="container colono-prep">
          <Reveal className="colono-prep-copy">
            {head}
            <ul className="preparation-list">{section.items.map(item => <li key={item}><Icon name="check" width="18" height="18" /><span>{item}</span></li>)}</ul>
          </Reveal>
          <Reveal className="colono-prep-card">
            <Icon name="doc" width="34" height="34" />
            <h3>Уточните подготовку к вашему исследованию</h3>
            <p>Обсудите время посещения, лекарства и обезболивание. Это поможет получить подходящие инструкции заранее.</p>
            <BookButton intent="preparation" source="preparation" className="btn btn-primary">Уточнить подготовку<Icon name="arrowRight" width="18" height="18" /></BookButton>
          </Reveal>
        </div>
      </section>
    );
  }

  if (section.type === 'alert') {
    return (
      <section className={cls} id={section.id}>
        <div className="container">
          <Reveal className="colono-detect">
            <div>
              {section.eyebrow && <p className="eyebrow">{section.eyebrow}</p>}
              <h3>{section.heading}</h3>
            </div>
            <ul>
              {section.items.map((item) => (
                <li key={item}><Icon name="info" width="18" height="18" />{item}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
    );
  }

  if (section.type === 'steps') {
    return (
      <section className={cls} id={section.id}>
        <div className="container">
          <Reveal className="section-head">{head}</Reveal>
          <ol className="colono-steps">
            {section.items.map((step, i) => (
              <Reveal as="li" key={step.title}>
                <span>{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  // cards
  return (
    <section className={cls} id={section.id}>
      <div className="container">
        <Reveal className="section-head">{head}</Reveal>
        <div className={`colono-formats svc-guide-cards${section.items.length === 4 ? ' is-4' : ''}`}>
          {section.items.map((item) => (
            <Reveal as="article" className="colono-format" key={item.title}>
              <div className="colono-format-top">
                {item.icon && <span className="colono-icon"><Icon name={item.icon} /></span>}
                <span className="colono-label">{item.label}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ServicePage({ slug }) {
  const page = servicePageBySlug[slug];
  const crumbs = breadcrumbsFor(page);
  const faqItems = answeredFaq(page);
  const guide = page.guide || [];
  const navItems = guide.filter((section) => section.nav);
  const journey = treatmentJourneys[slug];
  const mainBlocks = page.blocks.filter(block => !block.related);
  const relatedCards = page.blocks.filter(block => block.related).flatMap(block => block.cards);
  const relatedLinks = new Map(page.related.map(relatedSlug => {
    const related = servicePageBySlug[relatedSlug];
    return [`/${related.slug}`, related.crumb];
  }));
  relatedCards.forEach(card => {
    const href = card.href || `/lechenie#${card.id}`;
    if (!relatedLinks.has(href)) relatedLinks.set(href, card.title);
  });

  const jsonLd = graph([
    physicianSchema,
    clinicSchema,
    breadcrumbSchema(crumbs),
    faqSchema(faqItems),
  ]);

  return (
    <>
      <JsonLd data={jsonLd} />
      <Header transparent />

      <main className="svc-page">
        <PageHero
          crumbs={crumbs}
          title={page.h1}
          lead={page.intro}
          media={page.media}
        >
          {page.note && <p className="svc-note">{page.note}</p>}

          <div className="svc-actions">
            <BookButton source="service-hero" className="btn btn-light btn-lg">
              {page.eyebrow === 'Диагностика' ? 'Записаться на исследование' : 'Записаться на приём'}
              <Icon name="arrowRight" width="20" height="20" />
            </BookButton>
            <TrackedLink goal={GOALS.PHONE} href={PHONE_HREF} className="btn btn-ghost btn-on-dark">
              <Icon name="phone" width="18" height="18" />
              {PHONE}
            </TrackedLink>
          </div>
        </PageHero>

        {/* Реквизиты приёма — уже на светлой части страницы */}
        <section className="section svc-block svc-facts-block">
          <div className="container">
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

        {navItems.length > 0 && (
          <nav className="colono-nav" aria-label="Разделы страницы">
            <div className="container colono-nav-track">
              {navItems.map((section) => (
                <a href={`#${section.id}`} key={section.id}>{section.nav}</a>
              ))}
              {journey && <a href="#visit-plan">Ваше посещение</a>}
              {faqItems.length > 0 && <a href="#faq">Вопросы</a>}
            </div>
          </nav>
        )}

        {/* Секции чередуют фон (бежевый / белый) — как на главной */}
        {guide.slice(0, 2).map((section, i) => (
          <GuideSection section={section} tint={i % 2 === 0} key={section.id} />
        ))}

        {mainBlocks.map((block, i) => (
          <section className={`section svc-block${(guide.length + i) % 2 === 0 ? ' section-tint' : ''}`} key={block.heading}>
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

        {guide.slice(2).map((section, i) => (
          <GuideSection section={section} tint={(i + mainBlocks.length) % 2 === 0} key={section.id} />
        ))}

        {page.video && (
          <section className={`section${(guide.length + page.blocks.length) % 2 === 0 ? ' section-tint' : ''}`}>
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

        {journey && <TreatmentJourney journey={journey} />}

        <DoctorCard tint={false} />

        {faqItems.length > 0 && (
          <section className="section section-tint" id="faq">
            <div className="container faq-grid">
              <Reveal className="faq-intro">
                <p className="eyebrow">Вопросы</p>
                <h2>Частые вопросы</h2>
                <p className="section-sub">
                  Если не нашли свой вопрос, напишите в мессенджер, отвечу сам.
                </p>
                <BookButton intent="question" source="service-faq" className="btn btn-ghost">Задать свой вопрос</BookButton>
              </Reveal>
              <Reveal>
                <FaqList items={faqItems} />
              </Reveal>
            </div>
          </section>
        )}

        <Contacts
          heading={`Приём в ${ADDRESS.city}е`}
          intro={`Направление приёма: ${page.crumb}. Напишите в мессенджер, отвечу сам, или выберите время на ПроДокторов.`}
        />

        <section className="section svc-related">
          <div className="container">
            <Reveal className="section-head">
              <h2>Другие направления</h2>
            </Reveal>
            <ul className="related-list">
              {[...relatedLinks].map(([href, label]) => {
                return (
                  <li key={href}>
                    <Link href={href}>
                      {label}
                      <Icon name="arrowRight" width="16" height="16" />
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link href="/">
                  Проктолог в Пятигорске: главная
                  <Icon name="arrowRight" width="16" height="16" />
                </Link>
              </li>
            </ul>

            <p className="svc-disclaimer">
              Информация на странице носит справочный характер и не заменяет
              очную консультацию. Имеются противопоказания, необходима
              консультация специалиста.
            </p>
            {page.sources && <details className="medical-sources"><summary>Источники информации об исследовании</summary><ul>{page.sources.map(source => <li key={source.href}><a href={source.href} target="_blank" rel="noopener">{source.label}</a></li>)}</ul></details>}
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
