import Link from 'next/link';
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
                <Link href={s.href || '/lechenie'}>
                  <span className="ico"><Icon name={s.icon} /></span>
                  {s.title}
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
      </div>
    </section>
  );
}
