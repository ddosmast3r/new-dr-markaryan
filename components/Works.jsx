import Reveal from './Reveal';
import Icon from './Icon';
import Reels from './Reels';
import { reels, INSTAGRAM } from '@/lib/content';

export default function Works() {
  return (
    <section className="section section-tint" id="instagram">
      <div className="container">
        <Reveal className="section-head">
          <p className="eyebrow">Соцсети</p>
          <h2>Загляните в профиль</h2>
          <p className="section-sub">
            Операции и обследования, ответы на частые вопросы и будни клиники.
            Подписывайтесь, чтобы видеть, как всё проходит на самом деле.
          </p>
        </Reveal>

        <Reels items={reels} />

        <Reveal className="works-cta">
          <a href={INSTAGRAM} className="btn btn-primary btn-lg" target="_blank" rel="noopener">
            <Icon name="instagram" width="20" height="20" />
            Открыть Instagram*
          </a>
          <p className="works-note">
            * Instagram принадлежит компании Meta, признанной в РФ экстремистской
            организацией и запрещённой на территории России.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
