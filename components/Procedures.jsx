'use client';

import { useEffect, useRef, useState } from 'react';
import Reveal from './Reveal';
import Icon from './Icon';

// «Как проходит процедура»: сетка карточек с видео.
//
// Видео не монтируется, пока по карточке не кликнули, поэтому на первой отрисовке
// не скачивается ни байта самих роликов — только лёгкие webp-постеры.
//
// У роликов с пометкой sensitive плитка закрыта предупреждением: постер заблюрен
// заранее (на этапе генерации), а <video> появляется в DOM только после явного
// согласия. Согласие живёт в состоянии компонента и намеренно нигде не
// сохраняется: после перезагрузки страницы предупреждение показывается снова.

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function ProcedureCard({ item, index }) {
  const [active, setActive] = useState(false);
  const videoRef = useRef(null);

  // Запуск только после клика пользователя: это не автоплей, а реакция на жест,
  // поэтому браузеры пускают воспроизведение со звуком.
  useEffect(() => {
    if (!active) return;
    const video = videoRef.current;
    if (!video) return;
    video.focus({ preventScroll: true });
    const promise = video.play();
    if (promise?.catch) promise.catch(() => {});
  }, [active]);

  const durationLabel = formatDuration(item.duration);
  const mediaLabel = item.sensitive
    ? `Показать видео «${item.title}». ${item.warning}. Длительность ${durationLabel}`
    : `Смотреть видео «${item.title}». Длительность ${durationLabel}`;

  return (
    <Reveal
      as="article"
      className="proc-card"
      style={{ transitionDelay: `${(index % 3) * 70}ms` }}
    >
      <div className="proc-media">
        {active ? (
          <video
            ref={videoRef}
            className="proc-video"
            src={item.src}
            poster={item.poster}
            controls
            playsInline
            preload="none"
            aria-label={`Видео: ${item.title}`}
          />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="proc-poster"
              src={item.poster}
              alt=""
              width={item.width}
              height={item.height}
              loading="lazy"
              decoding="async"
            />

            {item.sensitive ? (
              <div className="proc-gate">
                <span className="proc-gate-icon" aria-hidden="true">
                  <Icon name="eye" />
                </span>
                <p className="proc-gate-text">{item.warning}</p>
                <button
                  type="button"
                  className="proc-gate-btn"
                  onClick={() => setActive(true)}
                  aria-label={mediaLabel}
                >
                  Показать
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="proc-play"
                onClick={() => setActive(true)}
                aria-label={mediaLabel}
              >
                <span className="proc-play-dot" aria-hidden="true">
                  <Icon name="play" />
                </span>
              </button>
            )}

            <span className="proc-duration" aria-hidden="true">
              {durationLabel}
            </span>
          </>
        )}
      </div>

      <div className="proc-body">
        <h3 className="proc-title">{item.title}</h3>
        {item.summary && <p className="proc-sub">{item.summary}</p>}
      </div>
    </Reveal>
  );
}

export default function Procedures({ items }) {
  if (!items?.length) return null;

  // Модификатор по количеству карточек: при двух-трёх роликах ширина плитки
  // остаётся одинаковой, ряд просто центрируется, а не растягивается на всю сетку.
  return (
    <div className={`proc-grid proc-grid--${Math.min(items.length, 3)}`}>
      {items.map((item, i) => (
        <ProcedureCard key={item.src} item={item} index={i} />
      ))}
    </div>
  );
}
