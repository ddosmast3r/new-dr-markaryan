import Reveal from './Reveal';
import BookButton from './BookButton';
import FaqList from './FaqList';
import { faq } from '@/lib/content';

// level=1 — секция открывает отдельную страницу и её заголовок
// должен быть H1; по умолчанию это обычная секция главной.
export default function Faq({ level = 2, heading = 'То, о чём неловко спросить вслух' }) {
  const H = level === 1 ? 'h1' : 'h2';

  return (
    <section className="section" id="faq">
      <div className="container faq-grid">
        <Reveal className="faq-intro">
          <p className="eyebrow">Вопросы</p>
          <H>{heading}</H>
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
