import Reveal from './Reveal';
import Icon from './Icon';
import { steps } from '@/lib/content';

export default function Steps() {
  return (
    <section className="section" id="how">
      <div className="container">
        <Reveal className="section-head">
          <p className="eyebrow">Как проходит</p>
          <h2>Всего четыре шага</h2>
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
