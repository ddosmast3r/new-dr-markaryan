import Reveal from './Reveal';
import Reels from './Reels';
import Procedures from './Procedures';
import { reels, procedures } from '@/lib/content';

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

        <Reveal className="section-head works-subhead">
          <h3>Как проходит процедура</h3>
          <p className="section-sub">
            Что происходит до, во время и после вмешательства. Ролики можно
            посмотреть прямо здесь, они не запускаются сами.
          </p>
        </Reveal>

        <Procedures items={procedures} />
      </div>
    </section>
  );
}
