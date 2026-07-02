import Image from 'next/image';
import BookButton from './BookButton';
import Icon from './Icon';
import { conditions } from '@/lib/content';

export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="badge-row">
            <span className="pill"><span className="dot" />Ведёт приём на КМВ</span>
          </div>
          <h1>Деликатные проблемы можно<br />решить <em>спокойно</em></h1>
          <p className="lead">
            Без стыда и без лишней боли. Я хирург-колопроктолог. Принимаю
            пациентов с геморроем, трещинами, свищами и другими проблемами этой
            области. Стараюсь делать так, чтобы человек не уходил с приёма в стрессе.
          </p>

          <div className="hero-actions">
            <BookButton className="btn btn-primary btn-xl">
              Записаться на приём
              <Icon name="arrowRight" width="22" height="22" />
            </BookButton>
          </div>

          <ul className="hero-trust">
            <li><strong>4.9</strong><span>★ рейтинг<br />ПроДокторов</span></li>
            <li><strong>10+</strong><span>лет<br />опыта</span></li>
            <li><strong>500+</strong><span>успешных<br />операций</span></li>
          </ul>
        </div>

        <div className="hero-card">
          <div className="hero-photo">
            <Image
              src="/img/doctor.png"
              alt="Эдуард Жорикович Маркарян, хирург-колопроктолог"
              fill
              priority
              sizes="(max-width: 960px) 380px, 460px"
              style={{ objectFit: 'cover', objectPosition: 'center top' }}
            />
          </div>
          <div className="hero-card-meta">
            <div>
              <strong>Эдуард Жорикович</strong>
              <small>Сеченовский университет · колопроктология</small>
            </div>
            <Image src="/img/logo.png" className="hero-card-logo" alt="Логотип" width="48" height="35" />
          </div>

          <div className="hero-float float-rating">
            <span className="fr-num">4.9</span>
            <span className="fr-stars">★★★★★<small>ПроДокторов</small></span>
          </div>
        </div>
      </div>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {/* 6 копий = две одинаковые половины по 3, для бесшовного цикла на любой ширине */}
          {Array.from({ length: 6 }).flatMap(() => conditions).map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
