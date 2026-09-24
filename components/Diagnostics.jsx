import Image from 'next/image';
import Link from 'next/link';
import Reveal from './Reveal';
import Icon from './Icon';
import BookButton from './BookButton';
import { diagnostics } from '@/lib/content';

// level=1 — секция открывает отдельную страницу и её заголовок
// должен быть H1; по умолчанию это обычная секция главной.
export default function Diagnostics({ level = 2, heading = 'Сначала точный диагноз, потом лечение' }) {
  const H = level === 1 ? 'h1' : 'h2';

  return (
    <section className="section" id="diagnostics">
      <div className="container">
        <Reveal className="section-head section-head--center">
          <p className="eyebrow">Диагностика</p>
          <H>{heading}</H>
          <p className="section-sub">
            Сначала разбираюсь, в чём дело, потом лечу. Операцию вслепую не
            назначаю. Все исследования делаю аккуратно, при необходимости с
            обезболиванием.
          </p>
        </Reveal>

        <Reveal className="diag-banner">
          <Image
            src="/img/diagnoses.png"
            alt="Доктор Маркарян проводит эндоскопическое исследование"
            fill
            sizes="(max-width: 1240px) 100vw, 1200px"
            style={{ objectFit: 'cover', objectPosition: 'center' }}
          />
          <span className="diag-photo-chip"><span className="dot" />Эндоскопия в HD</span>
        </Reveal>

        <div className="probe-grid">
          {diagnostics.map((d, i) => (
            <Reveal
              as="article"
              className={`probe${d.href ? ' card-linked' : ''}`}
              key={d.title}
              style={{ transitionDelay: `${(i % 4) * 70}ms` }}
            >
              <div className="probe-frame">
                <span className="probe-glow" aria-hidden="true" />
                <span className="probe-ico"><Icon name={d.icon} /></span>
              </div>
              <p className="probe-label">{d.title}</p>
              <span className="probe-rule" aria-hidden="true" />
              <p className="probe-text">{d.text}</p>
              {d.href && (
                <Link className="card-link" href={d.href}>
                  {d.anchor}
                  <Icon name="arrowRight" width="16" height="16" />
                </Link>
              )}
            </Reveal>
          ))}
        </div>

        <Reveal className="diag-cta">
          <p>Что именно нужно, решим на первом приёме. Лишнего не назначаю.</p>
          <BookButton className="btn btn-primary">Записаться на диагностику</BookButton>
        </Reveal>
      </div>
    </section>
  );
}
