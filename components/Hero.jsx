import Image from 'next/image';
import BookButton from './BookButton';
import Icon from './Icon';
import { conditions, heroStats, awards, RATING } from '@/lib/content';

export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="badge-row">
            <span className="pill"><span className="dot" />Приём проктолога в Пятигорске</span>
          </div>
          {/* Обычный дефис намеренно: на узком экране строка может перенестись
              после него, слово не вылезет за пределы контейнера. */}
          {/* Пробел перед <br /> обязателен: без него в textContent слова
              склеиваются («колопроктологв»), и это видят парсеры и соцсети. */}
          <h1>Проктолог и хирург-колопроктолог{' '}<br />в Пятигорске</h1>
          <p className="hero-tagline">Без лишних операций и <em>лишних анализов</em></p>
          <p className="lead">
            Меня зовут Эдуард Жорикович Маркарян, я&nbsp;врач&#8209;проктолог,
            хирург&#8209;колопроктолог. Веду приём взрослых пациентов в Пятигорске
            с геморроем, анальными трещинами, свищами и другими заболеваниями
            этой области. Без стыда и с вниманием к вашему комфорту.
          </p>

          <div className="hero-actions">
            <BookButton className="btn btn-primary btn-xl">
              Записаться на приём
              <Icon name="arrowRight" width="22" height="22" />
            </BookButton>
          </div>

          {/* Цифры под кнопкой: только подтверждённые данные, см. heroStats */}
          <ul className="hero-trust">
            {heroStats.map((stat) => (
              <li key={stat.value}>
                <strong>{stat.value}</strong>
                <span>
                  {stat.label.split('\n').map((line, i) => (
                    <span key={i} className="ht-line">{line}</span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="hero-card">
          {/* Плашка на фотокарточке. Пока с ПроДокторов не взята оценка
              (RATING === null), показываем премию — её годы у нас есть. */}
          {RATING ? (
            <div className="hero-float float-rating">
              <span className="fr-num">{RATING.value}</span>
              <span className="fr-stars">
                ★★★★★
                <small>{RATING.count} отзывов</small>
              </span>
            </div>
          ) : (
            <div className="hero-float float-award">
              <span className="fa-ico"><Icon name="trophy" width="20" height="20" /></span>
              <span className="fa-text">
                Премия ПроДокторов
                <small>{awards[0].year}–{awards[awards.length - 1].year}</small>
              </span>
            </div>
          )}

          <div className="hero-photo">
            <Image
              src="/img/doctor.png"
              alt="Эдуард Жорикович Маркарян, врач-проктолог и хирург-колопроктолог"
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
            <Image src="/img/logo.png" className="hero-card-logo" alt="Логотип Эдуарда Маркаряна" width="48" height="35" />
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
