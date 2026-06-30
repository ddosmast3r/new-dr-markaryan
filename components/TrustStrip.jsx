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
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
