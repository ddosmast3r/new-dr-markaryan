import Reveal from './Reveal';
import Medal from './Medal';
import Icon from './Icon';
import { reviews, awards, PRODOCTOROV_REVIEWS } from '@/lib/content';

export default function Reviews() {
  return (
    <section className="section" id="reviews">
      <div className="container">
        <Reveal className="section-head">
          <p className="eyebrow">Отзывы</p>
          <h2>Рейтинг 4.9 из 5.0</h2>
          <p className="section-sub">По данным независимых площадок: ПроДокторов, Яндекс.Здоровье, НаПоправку.</p>
        </Reveal>

        <div className="reviews-grid">
          {reviews.map((r, i) => (
            <Reveal as="figure" className="review" key={i} style={{ transitionDelay: `${(i % 3) * 70}ms` }}>
              <div className="review-top">
                <div className="stars">★★★★★</div>
                {r.verified && (
                  <span className="review-verified">
                    <Icon name="shield" width="15" height="15" />
                    Отзыв проверен
                  </span>
                )}
              </div>
              <blockquote>{r.text}</blockquote>
              <figcaption>
                {r.author}
                {r.date && <time className="review-date">{r.date}</time>}
              </figcaption>
            </Reveal>
          ))}
        </div>

        <Reveal className="reviews-more">
          <a href={PRODOCTOROV_REVIEWS} className="btn btn-ghost" target="_blank" rel="noopener">
            Посмотреть больше отзывов
            <Icon name="arrowRight" width="18" height="18" />
          </a>
        </Reveal>

        <Reveal className="awards">
          {awards.map((a) => (
            <Medal key={a.year} year={a.year} title={a.title} />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
