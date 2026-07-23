import Reveal from './Reveal';
import Icon from './Icon';
import { awards, PRODOCTOROV_REVIEWS } from '@/lib/content';

export default function Reviews() {
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
            <a href={PRODOCTOROV_REVIEWS} className="btn btn-primary" target="_blank" rel="noopener">
              Открыть отзывы
              <Icon name="arrowRight" width="18" height="18" />
            </a>
          </div>

          <div className="reviews-awards" aria-label="Награды ПроДокторов">
            <span>Премия ПроДокторов</span>
            <div>
              {awards.map((award) => (
                <strong key={award.year}>{award.year}</strong>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
