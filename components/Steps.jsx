import Reveal from './Reveal';
import Icon from './Icon';
import { steps } from '@/lib/content';

// level=1 — секция открывает отдельную страницу и её заголовок
// должен быть H1; по умолчанию это обычная секция главной.
export default function Steps({ level = 2, heading = 'Всего четыре шага' }) {
  const H = level === 1 ? 'h1' : 'h2';

  return (
    <section className="section" id="how">
      <div className="container">
        <Reveal className="section-head">
          <p className="eyebrow">Как проходит</p>
          <H>{heading}</H>
          <p className="section-sub">Без сюрпризов. Заранее понятно, что будет на каждом.</p>
        </Reveal>

        {/* Пунктир между карточками рисует сам список (.steps::before):
            карточки непрозрачные, поэтому линия видна только в промежутках. */}
        <ol className="steps">
          {steps.map((s, i) => (
            <Reveal as="li" key={s.num} style={{ transitionDelay: `${(i % 4) * 70}ms` }}>
              <div className="step-head">
                <span className="step-ico"><Icon name={s.icon} /></span>
                <span className="step-num">{s.num}</span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
