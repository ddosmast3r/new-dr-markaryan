import Image from 'next/image';
import Reveal from './Reveal';
import BookButton from './BookButton';
import { education } from '@/lib/content';

export default function About() {
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
          <h2>Коротко о себе</h2>
          <p>
            Я хирург-колопроктолог. Закончил ординатуру по колопроктологии в
            Сеченове, потом прошёл переподготовку по хирургии. В основном работаю
            с заболеваниями прямой кишки и анального канала.
          </p>
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

          <BookButton className="btn btn-primary">Записаться на приём</BookButton>
        </Reveal>
      </div>
    </section>
  );
}
