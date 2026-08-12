import Reveal from './Reveal';
import BookButton from './BookButton';
import FaqList from './FaqList';
import { faq } from '@/lib/content';

export default function Faq() {
  return (
    <section className="section" id="faq">
      <div className="container faq-grid">
        <Reveal className="faq-intro">
          <p className="eyebrow">Вопросы</p>
          <h2>То, о чём неловко спросить вслух</h2>
          <p className="section-sub">Честные ответы на самые частые тревоги пациентов.</p>
          <BookButton className="btn btn-ghost">Задать свой вопрос</BookButton>
        </Reveal>

        <Reveal>
          <FaqList items={faq} />
        </Reveal>
      </div>
    </section>
  );
}
