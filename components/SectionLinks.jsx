import Link from 'next/link';
import Image from 'next/image';
import Reveal from './Reveal';
import Icon from './Icon';
import { services } from '@/lib/content';

// Анонс направлений на главной. Полные описания живут на /lechenie и на
// страницах услуг — здесь только названия и ссылки, чтобы один и тот же
// текст не стоял на двух адресах.
export default function SectionLinks() {
  return (
    <section className="section section-tint" id="services">
      <div className="container">
        <Reveal className="section-head">
          <p className="eyebrow">Лечение</p>
          <h2>С чем обращаются</h2>
          <p className="section-sub">
            Если что-то из этого про вас, не тяните. На ранней стадии почти всё
            решается проще.
          </p>
        </Reveal>

        <Reveal>
          <ul className="section-links">
            {services.map((s) => (
              <li key={s.title}>
                {/* У направления есть своя страница — ведём на неё;
                    у остальных ссылка на общий раздел лечения. */}
                <Link href={s.href || `/lechenie#${s.id}`}>
                  <span className="ico"><Icon name={s.icon} /></span>
                  <span className="section-link-title">{s.title}</span>
                  <Icon name="arrowRight" width="18" height="18" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="section-more">
            <Link className="btn btn-primary" href="/lechenie">
              Все направления приёма
              <Icon name="arrowRight" width="18" height="18" />
            </Link>
          </div>
        </Reveal>

        <Reveal className="home-diagnostics" id="home-diagnostics">
          <div className="home-diagnostics-photo">
            <Image src="/img/diagnoses.png" alt="Эдуард Маркарян проводит эндоскопическое исследование" fill sizes="(max-width: 760px) 100vw, 40vw" style={{ objectFit: 'cover' }} />
            <span><Icon name="video" width="18" height="18" />Эндоскопическая диагностика</span>
          </div>
          <div className="home-diagnostics-body">
            <p className="eyebrow">Исследования</p>
            <h3>Понять причину.<br />Выбрать следующий шаг.</h3>
            <p>Узнайте, как проходит исследование, что обсудить с врачом заранее и как подготовиться.</p>
            <Link href="/kolonoskopiya"><span><strong>Колоноскопия</strong><small>Исследование толстой кишки</small></span><Icon name="arrowRight" width="22" height="22" /></Link>
            <Link href="/gastroskopiya"><span><strong>Гастроскопия</strong><small>Пищевод, желудок и двенадцатиперстная кишка</small></span><Icon name="arrowRight" width="22" height="22" /></Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
