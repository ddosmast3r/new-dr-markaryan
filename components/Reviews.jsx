import Reveal from './Reveal';
import Medal from './Medal';
import { reviews, awards } from '@/lib/content';

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
              <div className="stars">★★★★★</div>
              <blockquote>{r.text}</blockquote>
              <figcaption>{r.author}</figcaption>
            </Reveal>
          ))}
        </div>

        <Reveal className="awards">
          {awards.map((a) => (
            <Medal key={a.year} year={a.year} title={a.title} />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
