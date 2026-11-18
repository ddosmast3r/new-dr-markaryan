'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Icon from './Icon';

const places = { 1: 'I', 2: 'II', 3: 'III' };

function certificateAlt(award) {
  return `Грамота «${award.title}» ${award.year} года: Маркарян Эдуард Жорикович, ${award.place}-е место`;
}

function AwardViewer({ items, initialIndex, trigger, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const dialogRef = useRef(null);
  const award = items[index];

  useEffect(() => {
    const dialog = dialogRef.current;
    const wasLocked = document.body.classList.contains('modal-open');
    dialog.showModal();
    document.body.classList.add('modal-open');
    // Disabling the last navigation button can move focus to the document.
    // Keep arrow navigation available for the whole lifetime of the modal.
    const onKeyDown = event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        setIndex(current => Math.max(0, Math.min(items.length - 1, current + (event.key === 'ArrowRight' ? 1 : -1))));
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      dialog.close();
      if (!wasLocked) document.body.classList.remove('modal-open');
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [trigger, items.length]);

  return (
    <dialog
      ref={dialogRef}
      className="award-viewer"
      aria-labelledby="award-viewer-title"
      onCancel={event => { event.preventDefault(); onClose(); }}
    >
      <div className="award-viewer-toolbar">
        <h2 id="award-viewer-title">Награды ПроДокторов</h2>
        <button type="button" onClick={onClose} aria-label="Закрыть грамоту" autoFocus><Icon name="close" width="22" height="22" /></button>
      </div>
      <div className="award-viewer-stage" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
        <div className="award-viewer-image">
          <Image key={award.year} src={award.image} alt={certificateAlt(award)} fill sizes="(min-width: 1800px) 1800px, 100vw" loading="eager" style={{ objectFit: 'contain' }} />
        </div>
      </div>
      <div className="award-viewer-footer">
        <button type="button" aria-label="Предыдущая грамота" disabled={index === 0} onClick={() => setIndex(current => current - 1)}><Icon name="chevronRight" className="hero-awards-prev" width="20" height="20" /></button>
        <div className="award-viewer-caption" aria-live="polite" aria-atomic="true">
          <p><strong>{award.year}</strong> · {places[award.place]} место <span>({index + 1} из {items.length})</span></p>
          <a href={award.image.src} target="_blank" rel="noopener noreferrer">Открыть оригинал<Icon name="arrowRight" width="14" height="14" /></a>
        </div>
        <button type="button" aria-label="Следующая грамота" disabled={index === items.length - 1} onClick={() => setIndex(current => current + 1)}><Icon name="chevronRight" width="20" height="20" /></button>
      </div>
    </dialog>
  );
}

export default function HeroAwards({ items, profileHref }) {
  const trackRef = useRef(null);
  const triggerRef = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const [active, setActive] = useState(null);

  useEffect(() => {
    const track = trackRef.current;
    const update = () => setEdges({
      start: track.scrollLeft <= 1,
      end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 1,
    });
    const observer = new ResizeObserver(update);
    observer.observe(track);
    track.addEventListener('scroll', update, { passive: true });
    update();
    return () => {
      observer.disconnect();
      track.removeEventListener('scroll', update);
    };
  }, []);

  function move(direction) {
    const track = trackRef.current;
    const card = track.firstElementChild;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({
      left: direction * (card.getBoundingClientRect().width + gap),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }

  return (
    <section className="hero-awards" aria-labelledby="hero-awards-title">
      <div className="hero-awards-heading">
        <h2 id="hero-awards-title"><Icon name="trophy" width="16" height="16" />Награды ПроДокторов</h2>
        <div className="hero-awards-controls" aria-label="Пролистывание наград">
          <button type="button" aria-label="Предыдущая награда" aria-controls="hero-awards-track" disabled={edges.start} onClick={() => move(-1)}>
            <Icon name="chevronRight" className="hero-awards-prev" width="16" height="16" />
          </button>
          <button type="button" aria-label="Следующая награда" aria-controls="hero-awards-track" disabled={edges.end} onClick={() => move(1)}>
            <Icon name="chevronRight" width="16" height="16" />
          </button>
        </div>
      </div>
      <ul ref={trackRef} className="hero-awards-track" id="hero-awards-track" tabIndex={0} aria-label="Награды по годам. Листайте влево или вправо">
        {items.map((award, index) => (
          <li className="hero-award" key={award.year} aria-label={`${award.year} год, ${award.place}-е место, ${award.title}`}>
            <button type="button" className="hero-award-button" aria-label={`Открыть грамоту за ${award.year} год, ${award.place}-е место`} aria-haspopup="dialog" onClick={event => {
              event.currentTarget.focus({ preventScroll: true });
              triggerRef.current = event.currentTarget;
              setActive(index);
            }}>
              <span className="hero-award-thumbnail">
                <Image src={award.image} alt={certificateAlt(award)} fill sizes="(max-width: 560px) 45vw, 120px" loading="lazy" style={{ objectFit: 'contain' }} />
              </span>
              <span className="hero-award-meta"><span className="hero-award-year">{award.year}</span><strong>{places[award.place]} <span>место</span></strong></span>
            </button>
          </li>
        ))}
      </ul>
      <a className="hero-awards-source" href={profileHref} target="_blank" rel="noopener noreferrer">
        Профиль на ПроДокторов<Icon name="arrowRight" width="13" height="13" />
      </a>
      {active !== null && <AwardViewer items={items} initialIndex={active} trigger={triggerRef.current} onClose={() => setActive(null)} />}
    </section>
  );
}
