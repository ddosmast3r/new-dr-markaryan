import Reveal from './Reveal';
import Icon from './Icon';
import Medal from './Medal';
import { awards, reviewQuotes, RATING, PRODOCTOROV_REVIEWS } from '@/lib/content';

// Оценка и цитаты берутся только с ПроДокторов (lib/content.js).
// Пока их там нет, секция показывает премии — как и раньше.
export default function Reviews() {
  const hasQuotes = reviewQuotes.length > 0;

  return (
    <section className="section" id="reviews">
      <div className="container">
        <Reveal className="reviews-panel">
          <div className="reviews-copy">
            <p className="eyebrow">Независимая площадка</p>
            <h2>Отзывы на ПроДокторов</h2>
            <p>
              Актуальные оценки и отзывы пациентов собраны в профиле врача
              на независимой площадке.
            </p>

            {RATING && (
              <div className="rating-block">
                <strong className="rating-num">{RATING.value}</strong>
                <span className="rating-meta">
                  <span className="rating-stars" aria-hidden="true">★★★★★</span>
                  <small>по {RATING.count} отзывам на ПроДокторов</small>
                </span>
              </div>
            )}

            <a href={PRODOCTOROV_REVIEWS} className="btn btn-primary" target="_blank" rel="noopener">
              {hasQuotes ? 'Читать все отзывы' : 'Открыть отзывы'}
              <Icon name="arrowRight" width="18" height="18" />
            </a>
          </div>

          {/* С появлением оценки премии уходят на второй план: строкой под ней */}
          <div
            className={`reviews-awards${RATING ? ' reviews-awards--compact' : ''}`}
            aria-label="Награды ПроДокторов"
          >
            <span>Премия ПроДокторов</span>
            <p className="awards-note">
              {awards.length} года подряд, {awards[0].year}–{awards[awards.length - 1].year}
            </p>
            <div className="awards-medals">
              {awards.map((award) => (
                <Medal key={award.year} year={award.year} />
              ))}
            </div>
          </div>
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
