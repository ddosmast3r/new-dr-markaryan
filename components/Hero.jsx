import Image from "next/image";
import HeroMedia from "./HeroMedia";
import BookButton from "./BookButton";
import Icon from "./Icon";
import { conditions, heroStats } from "@/lib/content";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-stage">
        <svg className="liquid-glass-filters" width="0" height="0" aria-hidden="true" focusable="false">
          <defs>
            <filter
              id="liquid-glass-distortion"
              x="-20%"
              y="-60%"
              width="140%"
              height="220%"
              colorInterpolationFilters="sRGB"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.009 0.045"
                numOctaves="2"
                seed="8"
                result="noise"
              />
              <feGaussianBlur in="noise" stdDeviation="1.4" result="softNoise" />
              <feDisplacementMap
                in="SourceGraphic"
                in2="softNoise"
                scale="16"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>

        {/* Фон на всю ширину — размытое видео, см. components/HeroMedia.jsx.
            Декоративный слой: alt пустой, из дерева доступности исключён. */}
        <div className="hero-bg">
          <HeroMedia />
        </div>

        <div className="hero-content">
          <div className="hero-text">
            {/* Обычный дефис намеренно: на узком экране строка может перенестись
                после него, слово не вылезет за пределы контейнера. */}
            {/* {' '} перед span обязателен: JSX съедает перевод строки перед
                вложенным элементом, и в textContent слова склеились бы
                («колопроктологв») — это видят парсеры и соцсети. */}
            <h1>
              Хирург-колопроктолог{' '}
              <span className="hero-where">в Пятигорске и Ессентуках</span>
            </h1>
            <p className="hero-tagline">
              Без лишних операций и <em>лишних анализов</em>
            </p>

            <div className="hero-actions">
              <BookButton className="btn btn-light btn-xl btn-glow hero-cta">
                <span>Записаться на приём</span>
                <span className="hero-cta-icon" aria-hidden="true">
                  <Icon name="arrowRight" width="22" height="22" />
                </span>
              </BookButton>
            </div>
          </div>

          <div className="hero-doctor">
            <div className="hero-portrait">
              <Image
                src="/img/doctor.png"
                alt="Эдуард Маркарян, хирург-колопроктолог"
                fill
                priority
                sizes="(max-width: 960px) 88vw, 34vw"
                style={{ objectFit: "cover", objectPosition: "center 18%" }}
              />
              <div className="hero-method">
                <span className="hero-method-dot" aria-hidden="true" />
                <span>
                  <strong>Лазерные методики</strong>
                  <small>по показаниям</small>
                </span>
              </div>
            </div>

            {/* Цифры: только подтверждённые данные, см. heroStats */}
            <ul className="hero-stats">
              {heroStats.map((stat) => (
                <li key={stat.value}>
                  <strong>{stat.value}</strong>
                  <span>
                    {stat.label.split("\n").map((line, i) => (
                      <span key={i} className="ht-line">
                        {line}
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="marquee" id="conditions" aria-hidden="true">
          <div className="marquee-track">
            {/* Две идентичные группы дают точный бесшовный цикл. Вторая группа
                скрыта от дерева доступности вместе со всей декоративной строкой. */}
            {[0, 1].map((copy) => (
              <div className="marquee-group" key={copy}>
                {conditions.map((condition) => (
                  <span key={`${copy}-${condition}`}>{condition}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
