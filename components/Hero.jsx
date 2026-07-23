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
            <span className="pill"><span className="dot" />Приём проктолога в Пятигорске</span>
          </div>
          <h1>Проктолог в Пятигорске —<br />деликатно и <em>спокойно</em></h1>
          <p className="lead">
            Я&nbsp;врач&#8209;проктолог, хирург&#8209;колопроктолог. Веду приём взрослых
            пациентов в Пятигорске с геморроем, анальными трещинами, свищами и
            другими заболеваниями этой области — без стыда и с вниманием к
            вашему комфорту.
          </p>

          <div className="hero-actions">
            <BookButton className="btn btn-primary btn-xl">
              Записаться на приём
              <Icon name="arrowRight" width="22" height="22" />
            </BookButton>
          </div>

        </div>

        <div className="hero-card">
          <div className="hero-photo">
            <Image
              src="/img/doctor.png"
              alt="Проктолог в Пятигорске Эдуард Жорикович Маркарян"
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
