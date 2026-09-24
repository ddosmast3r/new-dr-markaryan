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
  const [started, setStarted] = useState(false);
  const [slots, setSlots] = useState([0, 1 % heroClips.length]);
  const [active, setActive] = useState(0);
  const els = useRef([]);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const decide = () =>
      setEnabled(!motion.matches && navigator.connection?.saveData !== true);

    decide();
    motion.addEventListener('change', decide);
    return () => motion.removeEventListener('change', decide);
  }, []);

  // Первый запуск. play() отклоняется, если автозапуск запрещён политикой
  // браузера, — это не ошибка, просто остаёмся на кадре.
  useEffect(() => {
    if (!enabled) {
      setStarted(false);
      return undefined;
    }
    els.current[active]?.play().catch(() => {});
    return undefined;
    // active намеренно не в зависимостях: это именно первый запуск,
    // дальше переключением занимается таймер ниже.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Смена ролика. Следующий стартуем ДО переключения: иначе кадр успел бы
  // проявиться пустым, пока видео буферизуется.
  useEffect(() => {
    if (!enabled || !started || heroClips.length < 2) return undefined;

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
      setActive(next);
    }, SLIDE_MS);

    return () => clearTimeout(id);
  }, [active, enabled, started]);

  // Переход закончился: останавливаем уехавший ролик и заряжаем в
  // освободившийся слот следующий по кругу.
  useEffect(() => {
    if (!enabled || !started || heroClips.length < 2) return undefined;

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
  }, [active, enabled, started]);

  return (
    <>
      <Image
        src={heroClips[0].poster}
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        style={{ objectFit: 'cover', objectPosition: 'center' }}
      />

      {enabled &&
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
              preload="auto"
              poster={clip.poster}
              aria-hidden="true"
              tabIndex={-1}
              onPlaying={() => setStarted(true)}
            >
              <source src={clip.src} type="video/mp4" />
            </video>
          );
        })}
    </>
  );
}
