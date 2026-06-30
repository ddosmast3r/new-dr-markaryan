import Reveal from './Reveal';
import Icon from './Icon';
import { posts, INSTAGRAM, INSTAGRAM_FEED } from '@/lib/content';

// Tries to pull the latest posts from a Behold.so JSON feed.
// Returns null on any problem, so the UI falls back to placeholder tiles.
async function getLivePosts() {
  if (!INSTAGRAM_FEED) return null;
  try {
    const res = await fetch(INSTAGRAM_FEED, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    const list = Array.isArray(data) ? data : data.posts || [];
    return list
      .slice(0, 6)
      .map((p) => ({
        img: p?.sizes?.medium?.mediaUrl || p?.thumbnailUrl || p?.mediaUrl || '',
        permalink: p?.permalink || INSTAGRAM,
        isVideo: p?.mediaType === 'VIDEO',
        alt: p?.prunedCaption || p?.caption || 'Пост из Instagram',
      }))
      .filter((p) => p.img);
  } catch {
    return null;
  }
}

export default async function Works() {
  const live = await getLivePosts();
  const tiles = live && live.length ? live : posts;

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

        <div className="posts-grid">
          {tiles.map((p, i) => (
            <Reveal
              as="a"
              className="post"
              key={i}
              href={p.permalink || INSTAGRAM}
              target="_blank"
              rel="noopener"
              aria-label="Открыть в Instagram"
              style={{ transitionDelay: `${(i % 3) * 70}ms` }}
            >
              {p.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.img} alt={p.alt} loading="lazy" />
              ) : (
                <span className="post-ph"><Icon name="instagram" /></span>
              )}
              {p.isVideo && <span className="post-play"><Icon name="play" /></span>}
            </Reveal>
          ))}
        </div>

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
