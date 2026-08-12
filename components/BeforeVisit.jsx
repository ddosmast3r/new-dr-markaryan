import Reveal from './Reveal';
import BookButton from './BookButton';
import FaqList from './FaqList';
import { beforeVisit } from '@/lib/content';

// «Перед первым приёмом»: что будет на приёме, нужна ли подготовка,
// обязательна ли операция. Текст врача, публикуется как есть.
export default function BeforeVisit() {
  return (
    <section className="section section-tint" id="before">
      <div className="container faq-grid">
        <Reveal className="faq-intro">
          <p className="eyebrow">Первый приём</p>
          <h2>Перед первым приёмом</h2>
          <p className="section-sub">
            Коротко о том, как проходит приём у колопроктолога, нужна ли
            подготовка и чего ожидать после осмотра.
          </p>
          <BookButton className="btn btn-ghost">Задать вопрос врачу</BookButton>
        </Reveal>

        <Reveal>
          <FaqList items={beforeVisit} />
        </Reveal>
      </div>
    </section>
  );
}
