'use client';

import { useState, useEffect, useRef } from 'react';
import Reveal from './Reveal';
import Icon from './Icon';

// Grid of poster tiles. The actual video is mounted (and therefore downloaded)
// only when a tile is clicked — nothing heavy loads on initial page render.
export default function Reels({ items }) {
  const [active, setActive] = useState(null);
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (active === null) return;
    const dialog = dialogRef.current;
    const trigger = triggerRef.current;
    dialog.showModal();
    document.body.classList.add('modal-open');
    return () => {
      dialog.close();
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
      document.body.classList.remove('modal-open');
    };
  }, [active]);

  return (
    <>
      {/* Модификатор по количеству плиток: одиночный ролик не должен
          прижиматься к левому краю, ряд просто центрируется. */}
      <div className={`posts-grid posts-grid--${Math.min(items.length, 3)}`}>
        {items.map((it, i) => (
          <Reveal
            as="button"
            type="button"
            className="post"
            key={i}
            onClick={(event) => { triggerRef.current = event.currentTarget; setActive(i); }}
            aria-label={`Смотреть видео: ${it.alt}`}
            style={{ transitionDelay: `${(i % 3) * 70}ms` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.poster} alt="" width={it.width} height={it.height} loading="lazy" decoding="async" />
            <span className="post-play"><Icon name="play" /></span>
            <span className="post-caption">{it.alt}</span>
          </Reveal>
        ))}
      </div>

      {active !== null && (
        <dialog
          ref={dialogRef}
          className="reel-modal"
          aria-label={items[active].alt}
          onCancel={(event) => { event.preventDefault(); setActive(null); }}
          onClick={(event) => { if (event.target === event.currentTarget) setActive(null); }}
        >
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
        </dialog>
      )}
    </>
  );
}
