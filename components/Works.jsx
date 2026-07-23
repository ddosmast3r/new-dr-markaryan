import Reveal from './Reveal';
import Reels from './Reels';
import { reels } from '@/lib/content';

export default function Works() {
  return (
    <section className="section section-tint" id="video">
      <div className="container">
        <Reveal className="section-head">
          <p className="eyebrow">Видео</p>
          <h2>Рабочие моменты и полезные материалы</h2>
          <p className="section-sub">
            Обследования, ответы на частые вопросы и будни клиники.
          </p>
        </Reveal>

        <Reels items={reels} />
      </div>
    </section>
  );
}
