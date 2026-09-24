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
import Procedures from './Procedures';
import JsonLd from './JsonLd';
import TrackedLink from './TrackedLink';
import { GOALS } from '@/lib/metrika';
import { PHONE, PHONE_HREF, ADDRESS } from '@/lib/content';
import { servicePageBySlug, answeredFaq } from '@/lib/pages';
import { graph, physicianSchema, clinicSchema, breadcrumbSchema, faqSchema } from '@/lib/schema';
import { breadcrumbsFor } from './ServicePage';

const page = servicePageBySlug.kolonoskopiya;
const crumbs = breadcrumbsFor(page);
const procedureFaqs = [
  {
    q: 'Зачем делать колоноскопию, если ничего не болит?',
    a: 'Полипы и некоторые ранние изменения кишечника могут долго не давать симптомов. Срок профилактического исследования зависит от возраста, семейного анамнеза и других факторов риска — его лучше определить вместе с врачом.',
  },
  {
    q: 'Сколько длится исследование?',
    a: 'Сам осмотр обычно занимает около 15–30 минут. Время может увеличиться, если потребуется биопсия, удаление полипа или другая дополнительная манипуляция.',
  },
  {
    q: 'Можно ли пройти колоноскопию во сне?',
    a: 'Да, исследование возможно под седацией. Такой вариант согласовывается заранее: врач учитывает состояние здоровья, противопоказания и необходимость консультации анестезиолога.',
  },
  {
    q: 'Есть ли противопоказания?',
    a: 'Да. Возможность исследования оценивают индивидуально, особенно при тяжёлых заболеваниях сердца и лёгких, острых воспалительных состояниях и нарушениях свёртывания крови. О хронических заболеваниях и лекарствах нужно сообщить врачу заранее.',
  },
];

const faqItems = [...answeredFaq(page), ...procedureFaqs];

const benefits = [
  {
    icon: 'video',
    title: 'Изображение в HD',
    text: 'Врач осматривает всю толстую кишку и подробно оценивает слизистую.',
  },
  {
    icon: 'waves',
    title: 'При желании — во сне',
    text: 'Исследование можно провести под лёгкой седацией.',
  },
  {
    icon: 'flask',
    title: 'Полип — сразу на анализ',
    text: 'Если во время исследования обнаружен полип, его можно удалить и отправить на гистологию.',
  },
  {
    icon: 'shield',
    title: 'Контроль обработки',
    text: 'На странице можно посмотреть, как эндоскоп проходит обработку между пациентами.',
  },
];

const formats = [
  {
    label: 'Диагностика',
    title: 'Видеоколоноскопия',
    text: 'Осмотр всей толстой кишки в HD с заключением врача.',
    icon: 'scan',
  },
  {
    label: 'Комфорт',
    title: 'Колоноскопия под седацией',
    text: 'Вариант для тех, кто хочет пройти исследование во сне. Возможность седации обсуждается заранее.',
    icon: 'waves',
  },
  {
    label: 'По показаниям',
    title: 'Удаление полипа',
    text: 'Обнаруженное образование можно удалить во время исследования и направить на гистологию.',
    icon: 'flask',
  },
];

const findings = [
  'воспалительные изменения слизистой',
  'язвы и эрозии',
  'полипы и другие новообразования',
  'дивертикулы и сужения кишечника',
  'источник кишечного кровотечения',
  'анатомические особенности толстой кишки',
];

const indications = [
  'кровь или слизь в стуле, положительный анализ на скрытую кровь',
  'регулярные запоры или диарея, вздутие и боли в животе',
  'анемия или снижение веса без понятной причины',
  'контроль уже выявленного заболевания и результатов лечения',
  'полипы или опухоли толстой кишки у близких родственников',
  'профилактическое обследование с учётом возраста и факторов риска',
];

const examSteps = [
  {
    num: '01',
    title: 'Запись и уточнение деталей',
    text: 'До исследования уточняются организационные вопросы, показания и подходящий формат процедуры.',
  },
  {
    num: '02',
    title: 'Подготовка кишечника',
    text: 'Качественная подготовка нужна для точного осмотра. Конкретную схему и ограничения согласуйте с врачом.',
  },
  {
    num: '03',
    title: 'Осмотр толстой кишки',
    text: 'Пациент лежит на боку. Врач аккуратно проводит эндоскоп и последовательно осматривает слизистую на мониторе.',
  },
  {
    num: '04',
    title: 'Манипуляции по показаниям',
    text: 'При необходимости можно взять материал для гистологии, удалить подходящий полип или выполнить другую эндоскопическую манипуляцию.',
  },
  {
    num: '05',
    title: 'Заключение',
    text: 'После исследования врач оформляет результат, объясняет находки и говорит, нужны ли дальнейшие действия.',
  },
];

export default function ColonoscopyPage() {
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

      <main className="colono-page">
        <PageHero crumbs={crumbs} title={page.h1} lead={page.intro} media={page.media}>
          <div className="svc-actions">
            <BookButton className="btn btn-light btn-lg">
              Записаться на исследование
              <Icon name="arrowRight" width="20" height="20" />
            </BookButton>
            <TrackedLink goal={GOALS.PHONE} href={PHONE_HREF} className="btn btn-ghost btn-on-dark">
              <Icon name="phone" width="18" height="18" />
              {PHONE}
            </TrackedLink>
          </div>
        </PageHero>

        <nav className="colono-nav" aria-label="Разделы страницы">
          <div className="container colono-nav-track">
            <a href="#advantages">О процедуре</a>
            <a href="#indications">Показания</a>
            <a href="#formats">Варианты</a>
            <a href="#preparation">Подготовка</a>
            <a href="#exam-steps">Как проходит</a>
            <a href="#sterilization">Обработка</a>
            <a href="#results">Результат</a>
            <a href="#faq">Вопросы</a>
          </div>
        </nav>

        <section className="section svc-block" id="advantages">
          <div className="container">
            <Reveal className="colono-heading">
              <p className="eyebrow">О процедуре</p>
              <h2>Что такое видеоколоноскопия</h2>
              <p className="section-sub">
                Это эндоскопический осмотр слизистой толстой кишки. Камера на конце гибкого аппарата передаёт увеличенное изображение на монитор, а инструментальный канал позволяет при необходимости взять биопсию или удалить полип.
              </p>
            </Reveal>

            <div className="colono-benefits">
              {benefits.map((item, index) => (
                <Reveal as="article" className="colono-benefit" key={item.title} style={{ transitionDelay: `${index * 60}ms` }}>
                  <span className="colono-icon"><Icon name={item.icon} /></span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </Reveal>
              ))}
            </div>

            <Reveal className="colono-detect">
              <div>
                <p className="eyebrow">Возможности диагностики</p>
                <h3>Что помогает обнаружить исследование</h3>
              </div>
              <ul>
                {findings.map((item) => <li key={item}><Icon name="check" width="18" height="18" />{item}</li>)}
              </ul>
            </Reveal>
          </div>
        </section>

        <section className="section section-tint svc-block" id="indications">
          <div className="container colono-indications">
            <Reveal className="colono-indications-copy">
              <p className="eyebrow">Когда назначают</p>
              <h2>Показания к колоноскопии</h2>
              <p className="section-sub">
                Исследование назначают не только при выраженных симптомах. Оно помогает уточнить причину жалоб, проконтролировать лечение и выявить изменения до появления заметных проявлений.
              </p>
            </Reveal>
            <Reveal>
              <ul className="colono-checklist">
                {indications.map((item) => <li key={item}><Icon name="check" width="20" height="20" /><span>{item}</span></li>)}
              </ul>
              <p className="colono-med-note">Наличие одного симптома не означает конкретный диагноз. Нужен осмотр врача, который определит показания и срочность исследования.</p>
            </Reveal>
          </div>
        </section>

        <section className="section svc-block" id="formats">
          <div className="container">
            <Reveal className="section-head">
              <p className="eyebrow">Варианты исследования</p>
              <h2>Подходящий формат выбирается заранее</h2>
              <p className="section-sub">Без навязывания лишних процедур — только то, что нужно в вашей ситуации.</p>
            </Reveal>

            <div className="colono-formats">
              {formats.map((item) => (
                <Reveal as="article" className="colono-format" key={item.title}>
                  <div className="colono-format-top">
                    <span className="colono-icon"><Icon name={item.icon} /></span>
                    <span className="colono-label">{item.label}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <BookButton className="colono-card-action">
                    Уточнить возможность
                    <Icon name="arrowRight" width="17" height="17" />
                  </BookButton>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-tint svc-block" id="preparation">
          <div className="container colono-prep">
            <Reveal className="colono-prep-copy">
              <p className="eyebrow">Подготовка</p>
              <h2>От подготовки зависит точность осмотра</h2>
              <p className="section-sub">
                Универсальная памятка не учитывает лекарства и состояние здоровья. Поэтому точную схему очищения кишечника и ограничения лучше согласовать до исследования.
              </p>
              <div className="colono-notice">
                <Icon name="info" width="22" height="22" />
                <p>Не отменяйте назначенные препараты самостоятельно. Сообщите врачу, что принимаете постоянно, и планируется ли седация.</p>
              </div>
            </Reveal>

            <Reveal className="colono-prep-card">
              <span className="colono-prep-number">01</span>
              <h3>Получите персональную памятку</h3>
              <p>После уточнения деталей врач подскажет, как подготовиться именно к вашему варианту исследования.</p>
              <BookButton className="btn btn-primary">
                Запросить памятку
                <Icon name="arrowRight" width="18" height="18" />
              </BookButton>
            </Reveal>
          </div>
        </section>

        <section className="section svc-block" id="exam-steps">
          <div className="container">
            <Reveal className="section-head">
              <p className="eyebrow">Как проходит</p>
              <h2>Как проводится колоноскопия</h2>
              <p className="section-sub">Заранее понятно, что будет происходить до, во время и после исследования.</p>
            </Reveal>
            <ol className="colono-steps">
              {examSteps.map((step) => (
                <Reveal as="li" key={step.num}>
                  <span>{step.num}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {page.video && (
          <section className="section svc-block" id="sterilization">
            <div className="container">
              <Reveal className="section-head">
                <p className="eyebrow">Безопасность</p>
                <h2>{page.video.heading}</h2>
                <p className="section-sub">{page.video.lead}</p>
              </Reveal>
              <Procedures items={page.video.items} />
            </div>
          </section>
        )}

        <section className="section section-tint svc-block" id="results">
          <div className="container colono-results">
            <Reveal>
              <p className="eyebrow">После исследования</p>
              <h2>Что будет в результате</h2>
              <p className="section-sub">
                В заключении описывают состояние слизистой, расположение и особенности выявленных изменений, а также выполненные во время процедуры манипуляции.
              </p>
            </Reveal>
            <Reveal className="colono-result-list">
              <div><Icon name="doc" /><span>Заключение врача-эндоскописта</span></div>
              <div><Icon name="scan" /><span>Описание осмотренных отделов кишечника</span></div>
              <div><Icon name="image" /><span>Фотофиксация значимых находок — если она выполнялась</span></div>
              <div><Icon name="flask" /><span>Информация о биопсии или удалённых образованиях</span></div>
            </Reveal>
          </div>
        </section>

        <section className="section section-tint colono-price">
          <div className="container colono-price-inner">
            <Reveal>
              <p className="eyebrow">Стоимость</p>
              <h2>Сначала объём — потом точная цена</h2>
              <p>Стоимость зависит от седации и дополнительных манипуляций. Итоговую сумму называют до начала исследования, без скрытых доплат.</p>
            </Reveal>
            <Reveal className="colono-price-actions">
              <BookButton className="btn btn-primary btn-lg">Уточнить стоимость</BookButton>
              <TrackedLink goal={GOALS.PHONE} href={PHONE_HREF} className="btn btn-ghost btn-lg">Позвонить</TrackedLink>
            </Reveal>
          </div>
        </section>

        <DoctorCard tint={false} />

        {faqItems.length > 0 && (
          <section className="section section-tint" id="faq">
            <div className="container faq-grid">
              <Reveal className="faq-intro">
                <p className="eyebrow">Вопросы</p>
                <h2>Что обычно спрашивают перед колоноскопией</h2>
                <p className="section-sub">Организационные вопросы можно уточнить до записи.</p>
                <BookButton className="btn btn-ghost">Задать свой вопрос</BookButton>
              </Reveal>
              <Reveal><FaqList items={faqItems} /></Reveal>
            </div>
          </section>
        )}

        <Contacts
          heading={`Колоноскопия в ${ADDRESS.city}е`}
          intro="Напишите в мессенджер: уточним формат исследования и подберём время."
        />

        <section className="section svc-related">
          <div className="container">
            <Reveal className="section-head"><h2>Другие направления</h2></Reveal>
            <ul className="related-list">
              {page.related.map((slug) => {
                const item = servicePageBySlug[slug];
                return (
                  <li key={slug}>
                    <Link href={`/${item.slug}`}>{item.crumb}<Icon name="arrowRight" width="16" height="16" /></Link>
                  </li>
                );
              })}
            </ul>
            <p className="svc-disclaimer">
              Информация на странице носит справочный характер и не заменяет очную консультацию. Имеются противопоказания, необходима консультация специалиста.
            </p>
            <p className="colono-source">
              Материал о процедуре подготовлен на основе справочной информации{' '}
              <a href="https://www.smclinic.ru/diagnosis/endoskopiya/kolonoskopiya/" target="_blank" rel="noopener noreferrer nofollow">«СМ-Клиники»</a>
              {' '}и адаптирован для сайта врача.
            </p>
          </div>
        </section>
      </main>

      <Footer />
      <Fab />
    </>
  );
}
