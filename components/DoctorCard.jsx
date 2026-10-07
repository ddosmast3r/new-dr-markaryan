import Image from 'next/image';
import Link from 'next/link';
import Reveal from './Reveal';
import BookButton from './BookButton';
import { DOCTOR_NAME, ADDRESS } from '@/lib/content';
import { DOCTOR_ROLE, DOCTOR_ROLE_TITLE } from '@/lib/doctor';

// Блок врача для страниц услуг. Текст — тот же, что в разделе «О враче»
// на главной, ничего нового здесь не сочиняется.
export default function DoctorCard({ tint = true }) {
  return (
    <section className={`section doctor-summary${tint ? ' section-tint' : ''}`} id="doctor">
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
            {DOCTOR_ROLE_TITLE}. Приём взрослых пациентов
            в {ADDRESS.city}е, {ADDRESS.street}.
          </p>
          <p>
            Я {DOCTOR_ROLE}. Закончил ординатуру по колопроктологии в
            Сеченове, потом прошёл переподготовку по хирургии. В основном работаю
            с заболеваниями прямой кишки и анального канала.
          </p>

          <div className="doctor-actions">
            <BookButton className="btn btn-primary">Записаться на приём</BookButton>
            <Link href="/o-vrache" className="btn btn-ghost">Подробнее о враче</Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
