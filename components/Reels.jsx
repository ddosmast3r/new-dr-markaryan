'use client';

import { useState, useEffect } from 'react';
import Reveal from './Reveal';
import Icon from './Icon';

// Grid of poster tiles. The actual video is mounted (and therefore downloaded)
// only when a tile is clicked — nothing heavy loads on initial page render.
export default function Reels({ items }) {
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (active === null) return;
    document.body.classList.add('modal-open');
    const onKey = (e) => e.key === 'Escape' && setActive(null);
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('modal-open');
      document.removeEventListener('keydown', onKey);
    };
  }, [active]);

  return (
    <>
      <div className="posts-grid">
        {items.map((it, i) => (
          <Reveal
            as="button"
            type="button"
            className="post"
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Смотреть видео: ${it.alt}`}
            style={{ transitionDelay: `${(i % 3) * 70}ms` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.poster} alt={it.alt} loading="lazy" />
            <span className="post-play"><Icon name="play" /></span>
          </Reveal>
        ))}
      </div>

      {active !== null && (
        <div className="reel-modal" onClick={() => setActive(null)}>
          <button type="button" className="reel-close" aria-label="Закрыть" onClick={() => setActive(null)}>
            <Icon name="close" />
          </button>
          <video
            className="reel-video"
            src={items[active].src}
            poster={items[active].poster}
            controls
            autoPlay
            playsInline
            preload="auto"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
