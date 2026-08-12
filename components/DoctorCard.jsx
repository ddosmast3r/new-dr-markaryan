import Image from 'next/image';
import Link from 'next/link';
import Reveal from './Reveal';
import BookButton from './BookButton';
import { education, DOCTOR_NAME, ADDRESS } from '@/lib/content';

// Блок врача для страниц услуг. Текст — тот же, что в разделе «О враче»
// на главной, ничего нового здесь не сочиняется.
export default function DoctorCard({ tint = true }) {
  return (
    <section className={`section${tint ? ' section-tint' : ''}`} id="doctor">
      <div className="container doctor-card">
        <Reveal className="doctor-photo">
          <div className="photo-block">
            <Image
              src="/img/doctor_2.png"
              alt="Эдуард Маркарян на приёме"
              fill
              sizes="(max-width: 960px) 100vw, 360px"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
          </div>
        </Reveal>

        <Reveal className="doctor-body">
          <p className="eyebrow">Врач</p>
          <h2>{DOCTOR_NAME}</h2>
          <p className="doctor-role">
            Врач-проктолог, хирург-колопроктолог. Приём взрослых пациентов
            в {ADDRESS.city}е, {ADDRESS.street}.
          </p>
          <p>
            Я хирург-колопроктолог. Закончил ординатуру по колопроктологии в
            Сеченове, потом прошёл переподготовку по хирургии. В основном работаю
            с заболеваниями прямой кишки и анального канала.
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

          <div className="doctor-actions">
            <BookButton className="btn btn-primary">Записаться на приём</BookButton>
            <Link href="/#about" className="btn btn-ghost">Подробнее о враче</Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
