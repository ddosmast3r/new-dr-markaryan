import Reveal from './Reveal';
import Reels from './Reels';
import Procedures from './Procedures';
import { reels, procedures } from '@/lib/content';

// level=1 — секция открывает отдельную страницу и её заголовок
// должен быть H1; по умолчанию это обычная секция главной.
export default function Works({ level = 2, heading = 'Рабочие моменты и полезные материалы' }) {
  const H = level === 1 ? 'h1' : 'h2';

  return (
    <section className="section section-tint" id="video">
      <div className="container">
        <Reveal className="section-head">
          <p className="eyebrow">Видео</p>
          <H>{heading}</H>
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
