import Image from 'next/image';
import Reveal from './Reveal';
import Icon from './Icon';
import BookButton from './BookButton';
import { diagnostics } from '@/lib/content';

export default function Diagnostics() {
  return (
    <section className="section" id="diagnostics">
      <div className="container">
        <div className="diag-head">
          <Reveal className="diag-intro">
            <p className="eyebrow">Диагностика</p>
            <h2>Сначала точный диагноз,<br />потом лечение</h2>
            <p className="diag-lead">
              Сначала разбираюсь, в чём дело, потом лечу. Операцию вслепую не
              назначаю. Все исследования делаю аккуратно, при необходимости с
              обезболиванием.
            </p>
          </Reveal>

          <Reveal className="diag-photo">
            <Image
              src="/img/diagnoses.png"
              alt="Доктор Маркарян проводит эндоскопическое исследование"
              fill
              sizes="(max-width: 960px) 100vw, 420px"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
            <span className="diag-photo-chip"><span className="dot" />Эндоскопия в HD</span>
          </Reveal>
        </div>

        <div className="diag-grid">
          {diagnostics.map((d, i) => (
            <Reveal as="article" className="diag" key={d.title} style={{ transitionDelay: `${(i % 2) * 70}ms` }}>
              <span className="diag-ico"><Icon name={d.icon} /></span>
              <div>
                <h3>{d.title}</h3>
                <p>{d.text}</p>
              </div>
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
