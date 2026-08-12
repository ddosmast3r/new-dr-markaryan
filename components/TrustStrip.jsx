import Reveal from './Reveal';
import Icon from './Icon';
import { trust } from '@/lib/content';

export default function TrustStrip() {
  return (
    <section className="trust-strip">
      <div className="container trust-grid">
        {trust.map((item, i) => (
          <Reveal key={item.title} style={{ transitionDelay: `${(i % 4) * 70}ms` }}>
            <span className="ico"><Icon name={item.icon} /></span>
            {/* h2, а не h3: блок идёт сразу после H1, до первого H2 страницы —
                иначе уровни заголовков идут не по порядку */}
            <h2>{item.title}</h2>
            <p>{item.text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
