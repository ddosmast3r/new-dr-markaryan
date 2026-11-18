'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Icon from './Icon';
import Reveal from './Reveal';

const cardPlural = new Intl.PluralRules('ru-RU');
const cardWords = { one: 'карточка', few: 'карточки', many: 'карточек', other: 'карточки' };

const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

function PostViewer({ post, trigger, onClose }) {
  const [index, setIndex] = useState(0);
  const dialogRef = useRef(null);
  const media = post.media[index];

  useEffect(() => {
    const dialog = dialogRef.current;
    const wasLocked = document.body.classList.contains('modal-open');
    dialog.showModal();
    document.body.classList.add('modal-open');
    const onKeyDown = event => {
      if (event.target.closest('video')) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        setIndex(current => Math.max(0, Math.min(post.media.length - 1, current + (event.key === 'ArrowRight' ? 1 : -1))));
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      dialog.close();
      if (!wasLocked) document.body.classList.remove('modal-open');
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [post.media.length, trigger]);

  return (
    <dialog ref={dialogRef} className="feed-viewer" aria-labelledby="feed-viewer-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="feed-viewer-panel">
        <div className="feed-viewer-toolbar">
          <h2 id="feed-viewer-title">{post.title}</h2>
          <button type="button" aria-label="Закрыть публикацию" onClick={onClose} autoFocus><Icon name="close" width="22" height="22" /></button>
        </div>
        <div className="feed-viewer-stage">
          {media.type === 'video' ? (
            <video key={media.src} src={media.src} poster={media.poster} controls autoPlay playsInline preload="metadata" aria-label={post.title} />
          ) : (
            <Image loading="eager" src={media.src} alt={`${post.title}: карточка ${index + 1} из ${post.media.length}`} fill sizes="(max-width: 700px) 100vw, 650px" quality={90} style={{ objectFit: 'contain' }} />
          )}
        </div>
        <div className="feed-viewer-footer">
          {post.media.length > 1 && <div className="feed-viewer-navigation" aria-label="Карточки публикации">
            <button type="button" aria-label="Предыдущая карточка" disabled={index === 0} onClick={() => setIndex(current => current - 1)}><Icon name="chevronRight" className="feed-prev" width="20" height="20" /></button>
            <span aria-live="polite" aria-atomic="true">{index + 1} / {post.media.length}</span>
            <button type="button" aria-label="Следующая карточка" disabled={index === post.media.length - 1} onClick={() => setIndex(current => current + 1)}><Icon name="chevronRight" width="20" height="20" /></button>
          </div>}
          <a href={post.url} target="_blank" rel="noopener noreferrer">Оригинал в Instagram<Icon name="arrowRight" width="16" height="16" /></a>
        </div>
      </div>
    </dialog>
  );
}

export default function InstagramFeed({ items, id = 'video', heading = 'Видео и заметки врача', lead = 'О приёме, подготовке и вопросах, которые задают пациенты.', eyebrow = 'Из практики', variant = 'feed' }) {
  const [active, setActive] = useState(null);
  const triggerRef = useRef(null);
  const headingId = id === 'video' ? 'instagram-feed-title' : `${id}-title`;
  if (!items.length) return null;
  return (
    <section className={`section section-tint instagram-feed${variant === 'context' ? ' instagram-feed--context' : ''}`} id={id} aria-labelledby={headingId}>
      <div className="container">
        <Reveal className="section-head">
          <p className="eyebrow">{eyebrow}</p>
          <h2 id={headingId}>{heading}</h2>
          <p className="section-sub">{lead}</p>
        </Reveal>
        <div className="feed-grid">
          {items.map(post => (
            <Reveal as="article" className="feed-card" key={post.id}>
              <button type="button" className="feed-card-open" aria-label={`${post.media[0].type === 'video' ? 'Смотреть видео' : 'Открыть карточки'}: ${post.title}`} aria-haspopup="dialog" onClick={event => { triggerRef.current = event.currentTarget; setActive(post); }}>
                <span className="feed-card-media">
                  <Image src={post.media[0].poster} alt="" fill sizes={variant === 'context' ? '(max-width: 560px) 100vw, 240px' : '(max-width: 560px) 100vw, (max-width: 1100px) 50vw, 300px'} style={{ objectFit: 'cover' }} />
                  <span className="feed-card-format"><Icon name={post.media[0].type === 'video' ? 'video' : 'image'} width="15" height="15" />{post.media.length > 1 ? `${post.media.length} ${cardWords[cardPlural.select(post.media.length)]}` : 'Видео'}</span>
                  <span className="feed-card-play"><Icon name={post.media[0].type === 'video' ? 'play' : 'image'} width="24" height="24" /></span>
                </span>
                <span className="feed-card-copy">
                  <time dateTime={post.date}>{dateFormat.format(new Date(`${post.date}T12:00:00Z`))}</time>
                  <span className="feed-card-title">{post.title}</span>
                  <span className="feed-card-summary">{post.summary}</span>
                  <span className="feed-card-action">{post.media[0].type === 'video' ? 'Смотреть видео' : 'Листать карточки'}<Icon name="arrowRight" width="17" height="17" /></span>
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
      {active && <PostViewer key={active.id} post={active} trigger={triggerRef.current} onClose={() => setActive(null)} />}
    </section>
  );
}
