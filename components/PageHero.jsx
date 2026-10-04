import Image from 'next/image';
import HeroMedia from './HeroMedia';
import Breadcrumbs from './Breadcrumbs';

// Первый экран внутренней страницы. Устроен как на главной: размытый
// кадр во всю ширину, тёмная виньетка, светлый текст поверх и стеклянная
// шапка, лежащая сверху. Ниже начинается светлая часть страницы.
//
// Заголовок H1 живёт здесь, а не в секции: поэтому секции ниже
// рендерятся со своими обычными H2 и иерархия остаётся правильной.
// Надзаголовка тут нет намеренно — раздел уже назван в хлебных крошках,
// и второй раз он дублировался бы с надзаголовком секции ниже.
//
// media — кадр самой страницы (у страниц услуг он свой на каждой).
// Без него в подложку идёт та же видеокарусель, что на главной.
// Размытие задаётся правилом .hero-bg img, поэтому оба варианта
// выглядят одинаково.
export default function PageHero({ crumbs, title, lead, media, children }) {
  return (
    <section className="hero page-hero">
      <div className="hero-stage">
        <div className="hero-bg">
          {media ? (
            <Image
              src={media.src}
              alt=""
              aria-hidden="true"
              fill
              priority
              sizes="100vw"
              style={{ objectFit: 'cover', objectPosition: media.position }}
            />
          ) : (
            <HeroMedia />
          )}
        </div>

        <div className="hero-content">
          <Breadcrumbs items={crumbs} />
          <div className="hero-text">
            <h1>{title}</h1>
            {lead && <p className="hero-sub">{lead}</p>}
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
