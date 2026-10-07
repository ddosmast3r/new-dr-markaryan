'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { heroClips } from '@/lib/content';

const SLIDE_MS = 9000;  // сколько держится один ролик
const FADE_MS = 1100;   // длительность перехода, совпадает с CSS

// Фон первого экрана: размытые ролики, сменяющие друг друга.
//
// Кадр первого ролика рисуется картинкой и остаётся LCP-элементом —
// первый экран не ждёт видео. Ролики подключаются вторым слоем и
// проявляются, только когда реально пошло воспроизведение: при
// заблокированном автозапуске остаётся кадр, чёрный прямоугольник
// не мигает.
//
// Слотов ровно два: пока один показывается, второй подгружает следующий
// ролик. Держать в сети все четыре — это лишние мегабайты на первом экране.
//
// Ничего не подключается вовсе, если система просит меньше движения
// или браузер сообщает про экономию трафика.
export default function HeroMedia() {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [slots, setSlots] = useState([0, 1 % heroClips.length]);
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const containerRef = useRef(null);
  const els = useRef([]);
  const canPlay = enabled && ready && inView && tabVisible;

  // Keep the poster immediately visible; start video only after the page's
  // critical resources have loaded and the browser has an idle opportunity.
  useEffect(() => {
    let idle;
    let timer;
    const schedule = () => {
      if ('requestIdleCallback' in window) {
        idle = window.requestIdleCallback(() => setReady(true), { timeout: 1500 });
      } else {
        timer = window.setTimeout(() => setReady(true), 0);
      }
    };
    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });
    return () => {
      window.removeEventListener('load', schedule);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 560px)');
    const decide = () =>
      setEnabled(!motion.matches && !mobile.matches && navigator.connection?.saveData !== true);

    decide();
    motion.addEventListener('change', decide);
    mobile.addEventListener('change', decide);
    navigator.connection?.addEventListener('change', decide);
    return () => {
      motion.removeEventListener('change', decide);
      mobile.removeEventListener('change', decide);
      navigator.connection?.removeEventListener('change', decide);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(containerRef.current);
    const onVisibility = () => setTabVisible(!document.hidden);
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Первый запуск. play() отклоняется, если автозапуск запрещён политикой
  // браузера, — это не ошибка, просто остаёмся на кадре.
  useEffect(() => {
    if (!canPlay) {
      els.current.forEach((el) => el?.pause());
      return undefined;
    }
    els.current[active]?.play().catch(() => {});
    return undefined;
  }, [canPlay, active]);

  // Смена ролика. Следующий стартуем ДО переключения: иначе кадр успел бы
  // проявиться пустым, пока видео буферизуется.
  useEffect(() => {
    if (!canPlay || !started || heroClips.length < 2) return undefined;
    let cancelled = false;

    const id = setTimeout(async () => {
      const next = 1 - active;
      const el = els.current[next];
      if (el) {
        try {
          el.currentTime = 0;
          await el.play();
        } catch {
          // не удалось — всё равно переключаемся, под низом кадр
        }
      }
      if (cancelled) { el?.pause(); return; }
      setActive(next);
    }, SLIDE_MS);

    return () => { cancelled = true; clearTimeout(id); };
  }, [active, canPlay, started]);

  // Переход закончился: останавливаем уехавший ролик и заряжаем в
  // освободившийся слот следующий по кругу.
  useEffect(() => {
    if (!canPlay || !started || heroClips.length < 2) return undefined;

    const id = setTimeout(() => {
      const free = 1 - active;
      els.current[free]?.pause();
      setSlots((prev) => {
        const nextSlots = [...prev];
        nextSlots[free] = (prev[active] + 1) % heroClips.length;
        return nextSlots;
      });
    }, FADE_MS);

    return () => clearTimeout(id);
  }, [active, canPlay, started]);

  return (
    <div ref={containerRef} className="hero-media" aria-hidden="true">
      <Image
        src={heroClips[0].poster}
        alt=""
        aria-hidden="true"
        fill
        priority
        fetchPriority="low"
        quality={50}
        sizes="(max-width: 560px) 50vw, 640px"
        style={{ objectFit: 'cover', objectPosition: 'center' }}
      />

      {enabled && ready &&
        slots.map((clipIndex, slot) => {
          const clip = heroClips[clipIndex];
          return (
            <video
              // key по адресу ролика: смена клипа в слоте должна
              // пересоздавать элемент, иначе остаётся старый буфер
              key={`${slot}-${clip.src}`}
              ref={(el) => {
                els.current[slot] = el;
              }}
              className={`hero-video${slot === active && started ? ' is-active' : ''}`}
              // Без muted + playsInline автозапуск не разрешит ни один
              // мобильный браузер. Звук фону не нужен.
              muted
              loop
              playsInline
              // play() loads the selected clip. The inactive slot downloads
              // nothing until the next transition; the Image stays underneath.
              preload="none"
              aria-hidden="true"
              tabIndex={-1}
              onPlaying={(event) => {
                if (canPlay) setStarted(true);
                else event.currentTarget.pause();
              }}
            >
              <source src={clip.src} type="video/mp4" />
            </video>
          );
        })}
    </div>
  );
}
