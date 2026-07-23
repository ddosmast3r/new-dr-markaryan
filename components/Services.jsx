import Image from 'next/image';
import Reveal from './Reveal';
import Icon from './Icon';
import BookButton from './BookButton';
import { services } from '@/lib/content';

export default function Services() {
  return (
    <section className="section section-tint" id="services">
      <div className="container">
        <Reveal className="section-head">
          <p className="eyebrow">Лечение</p>
          <h2>С чем обращаются</h2>
          <p className="section-sub">Если что-то из этого про вас, не тяните. На ранней стадии почти всё решается проще.</p>
        </Reveal>

        <div className="services-layout">
          <Reveal className="services-feature">
            <div className="feat-img">
              <Image
                src="/img/doctor_3.png"
                alt="Доктор Маркарян в операционной"
                fill
                sizes="(max-width: 960px) 100vw, 380px"
                style={{ objectFit: 'cover', objectPosition: 'center 18%' }}
              />
              <span className="feat-chip"><span className="dot" />Оперирую лично</span>
              <div className="feat-cap">
                <strong>Современная операционная</strong>
                <span>Малоинвазивная хирургия с коротким восстановлением</span>
              </div>
            </div>
          </Reveal>

          <div className="cards">
            {services.map((s, i) => (
              <Reveal as="article" className="card" key={s.title} style={{ transitionDelay: `${(i % 2) * 70}ms` }}>
                <span className="card-ico"><Icon name={s.icon} /></span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal className="services-cta">
          <div className="services-cta-body">
            <strong>Не знаете, к кому идти?</strong>
            <span>Напишите, чтобы уточнить, с какими жалобами ведётся приём, и записаться.</span>
            <BookButton className="btn btn-light">Уточнить и записаться</BookButton>
          </div>
          <div className="services-cta-media">
            <Image
              src="/img/uslugi.png"
              alt="Операционная бригада за работой"
              fill
              sizes="(max-width: 960px) 100vw, 480px"
              style={{ objectFit: 'cover' }}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
