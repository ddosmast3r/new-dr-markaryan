import Reveal from './Reveal';
import Icon from './Icon';
import { visitPrep } from '@/lib/patient-guides';

// «Что взять и о чём вспомнить перед приёмом»: чек-лист врача.
// Отдельный блок, а не пункт FAQ: это то, что пациент делает до визита,
// и по нему удобно пройтись глазами, не раскрывая аккордеон.
export default function VisitPrep() {
  return (
    <section className="section" id="prep">
      <div className="container">
        <Reveal className="section-head">
          <p className="eyebrow">{visitPrep.eyebrow}</p>
          <h2>{visitPrep.heading}</h2>
          <p className="section-sub">{visitPrep.lead}</p>
        </Reveal>

        <ul className="prep-grid">
          {visitPrep.items.map((item, i) => (
            <Reveal
              as="li"
              className="prep-item"
              key={item.title}
              style={{ transitionDelay: `${(i % 3) * 70}ms` }}
            >
              <span className="prep-ico"><Icon name={item.icon} /></span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </Reveal>
          ))}
        </ul>

        <Reveal as="p" className="prep-note">
          <Icon name="info" width="20" height="20" />
          <span>{visitPrep.note}</span>
        </Reveal>
      </div>
    </section>
  );
}
