import Image from 'next/image';
import Link from 'next/link';
import Reveal from './Reveal';
import Icon from './Icon';
import BookButton from './BookButton';
import { education } from '@/lib/content';

// level=1 — секция открывает отдельную страницу и её заголовок должен быть H1.
// teaser — короткая версия для главной: первый абзац и ссылка на /o-vrache,
// без биографии и хронологии. Полный текст живёт на одном адресе, чтобы
// не плодить одинаковые блоки на двух страницах.
export default function About({ level = 2, heading = 'Коротко о себе', teaser = false }) {
  const H = level === 1 ? 'h1' : 'h2';

  return (
    <section className="section" id="about">
      <div className="container about-grid">
        <Reveal className="about-photo">
          <div className="photo-block">
            <Image
              src="/img/doctor_2.png"
              alt="Доктор Маркарян на приёме"
              fill
              sizes="(max-width: 960px) 100vw, 420px"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
          </div>
          <div className="dynasty-note">
            <strong>Медицинская династия</strong>
            Дед тоже был колопроктологом. В семье всегда считали, что лучше обойтись без операции, если можно.
          </div>
        </Reveal>

        <Reveal className="about-copy">
          <p className="eyebrow">О враче</p>
          <H>{heading}</H>
          <p>
            Я хирург-колопроктолог. Закончил ординатуру по колопроктологии в
            Сеченове, потом прошёл переподготовку по хирургии. В основном работаю
            с заболеваниями прямой кишки и анального канала.
          </p>
          {!teaser && (
            <>
              <p>
                На приёме стараюсь не затягивать и не усложнять. Объясняю, что
                происходит, и предлагаю варианты. Пациент сам решает, как ему удобнее.
              </p>

              <ul className="timeline">
                {education.map((e) => (
                  <li key={e.year}>
                    <span className="year">{e.year}</span>
                    <div>
                      <strong>{e.title}</strong>
                      <small>{e.sub}</small>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {teaser ? (
            <Link className="btn btn-ghost" href="/o-vrache">
              Подробнее о враче
              <Icon name="arrowRight" width="18" height="18" />
            </Link>
          ) : (
            <BookButton className="btn btn-primary">Записаться на приём</BookButton>
          )}
        </Reveal>
      </div>
    </section>
  );
}
