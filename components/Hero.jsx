import Image from "next/image";
import HeroMedia from "./HeroMedia";
import BookButton from "./BookButton";
import Icon from "./Icon";
import { heroStats } from "@/lib/content";

export default function Hero() {
  return (
    <section className="hero hero--home">
      <div className="hero-stage">
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
              Хирург-колопроктолог{" "}
              <span className="hero-where">в Пятигорске и Ессентуках</span>
            </h1>
            {/* Полное имя — на карточке врача справа; здесь дублировало его. */}
            <p className="hero-tagline">
              Помогаю разобраться в проблеме и подобрать{" "}
              <em>подходящее лечение</em>
            </p>

            <ul className="hero-assurances" aria-label="Возможности лечения">
              <li>
                <Icon name="check" width="16" height="16" />
                Диагностика на приёме
              </li>
              <li>
                <Icon name="check" width="16" height="16" />
                Индивидуальный план лечения
              </li>
              <li>
                <Icon name="check" width="16" height="16" />
                Проведение операций
              </li>
            </ul>

            <div className="hero-actions">
              <BookButton source="home-hero" className="btn btn-light btn-xl btn-glow hero-cta">
                <span className="hero-cta-copy">
                  <strong>Записаться к врачу</strong>
                  <small>Выбрать удобный способ связи</small>
                </span>
                <span className="hero-cta-arrow" aria-hidden="true">
                  <Icon name="arrowRight" width="22" height="22" />
                </span>
              </BookButton>
            </div>

            {/* Методы — одна строка тегов под кнопкой, а не отдельная панель:
                панель была шестым слоем колонки и спорила с кнопкой записи. */}
            <ul className="hero-methods" aria-label="Методы лечения, подбираются по показаниям">
              <li>Лазерные</li>
              <li>Радиоволновые</li>
              <li>Малоинвазивные</li>
              <li>Консервативные</li>
            </ul>
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
            </div>
            <p className="hero-doctor-name">Маркарян Эдуард Жорикович</p>

            {/* Достижения идут после портрета и подписи, не перекрывая врача. */}
            <div className="hero-proof">
              <div className="hero-proof-main">
                <strong>{heroStats[0].value}</strong>
                <span>{heroStats[0].label}</span>
              </div>
              <ul>
                {heroStats.slice(1).map((stat) => (
                  <li key={stat.label}>
                    <span className="hero-proof-check" aria-hidden="true">
                      <Icon name="check" width="12" height="12" />
                    </span>
                    {stat.href ? <a href={stat.href}>{stat.label}</a> : <span>{stat.label}</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>


      </div>
    </section>
  );
}
