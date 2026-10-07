import Reveal from './Reveal';
import Icon from './Icon';
import { awards, reviewQuotes, RATING, PRODOCTOROV_REVIEWS } from '@/lib/content';

// Личные отзывы для сайта отделены от оценки и отзывов на ПроДокторов.
export default function Reviews({ showTestimonials = false }) {
  const emptySlots = Math.max(0, 3 - reviewQuotes.length);

  return (
    <section className="section" id="reviews" aria-labelledby="reviews-title">
      <div className="container">
        <Reveal className={`reviews-panel${showTestimonials ? ' reviews-panel--with-quotes' : ''}`}>
          <div className="reviews-intro">
            <div className="reviews-heading">
              <p className="eyebrow"><span aria-hidden="true" />Отзывы пациентов</p>
              <h2 id="reviews-title">О приёме{' '}<br /><span>из первых рук</span></h2>
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
          </div>

          {showTestimonials && (
            <div className="reviews-quotes">
              {reviewQuotes.map((review) => (
                <figure className="quote" key={review.id}>
                  <blockquote>
                    {review.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  </blockquote>
                  <figcaption>
                    <strong>{review.name}</strong>
                    <small>{review.source}</small>
                  </figcaption>
                </figure>
              ))}
              {Array.from({ length: emptySlots }, (_, index) => (
                <div className="quote quote--placeholder" key={`review-slot-${index}`}>
                  <span className="quote-slot-label">Отзыв {String(reviewQuotes.length + index + 1).padStart(2, '0')}</span>
                  <p>Здесь появится новая история пациента.</p>
                </div>
              ))}
            </div>
          )}

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
      </div>
    </section>
  );
}
