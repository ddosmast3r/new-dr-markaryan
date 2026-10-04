import Reveal from './Reveal';
import Icon from './Icon';
import { awards, reviewQuotes, RATING, PRODOCTOROV_REVIEWS } from '@/lib/content';

// Оценка и цитаты берутся только с ПроДокторов (lib/content.js).
// Если оценка и цитаты не заполнены, ведём к оригинальным отзывам.
export default function Reviews() {
  const hasQuotes = reviewQuotes.length > 0;

  return (
    <section className="section" id="reviews" aria-labelledby="reviews-title">
      <div className="container">
        <Reveal className="reviews-panel">
          <div className="reviews-heading">
            <p className="eyebrow"><span aria-hidden="true" />Отзывы пациентов</p>
            <h2 id="reviews-title">О приёме —<br /><span>из первых рук</span></h2>
          </div>

          <div className="reviews-copy">
            <p>Выбрать врача бывает непросто. Опыт других пациентов поможет лучше представить, как проходит приём.</p>
            {RATING && (
              <div className="rating-block">
                <strong className="rating-num">{RATING.value}</strong>
                <span className="rating-meta">
                  <span className="rating-stars" aria-hidden="true">★★★★★</span>
                  <small>по {RATING.count} отзывам на ПроДокторов</small>
                </span>
              </div>
            )}

            <a href={PRODOCTOROV_REVIEWS} className="btn btn-primary reviews-link" target="_blank" rel="noopener">
              <span>Читать отзывы на ПроДокторов</span>
              <Icon name="arrowRight" width="20" height="20" />
            </a>
          </div>

          {awards.length > 0 && (
            <div className="reviews-awards" aria-label="Награды ПроДокторов">
              <div className="reviews-awards-heading">
                <span className="reviews-award-icon"><Icon name="trophy" width="25" height="25" /></span>
                <span>Премия <strong>ПроДокторов</strong></span>
              </div>
              <ul className="reviews-award-years" aria-label="Годы получения премии">
                {awards.map((award) => <li key={award.year}>{award.year}</li>)}
              </ul>
            </div>
          )}
        </Reveal>

        {hasQuotes && (
          <div className="reviews-quotes">
            {reviewQuotes.map((review) => (
              <Reveal as="figure" className="quote" key={`${review.name}-${review.date}`}>
                <blockquote>{review.text}</blockquote>
                <figcaption>
                  <strong>{review.name}</strong>
                  <small>{review.date}</small>
                </figcaption>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
