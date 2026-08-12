'use client';

import { useEffect, useState } from 'react';
import BookButton from './BookButton';

// Плавающая кнопка «Записаться» на мобильном (видимость — в CSS).
// Пока на экране есть своя кнопка записи (первый экран, блок контактов),
// кнопка прячется: иначе она висит поверх ссылок в карточках услуг.
const ANCHORS = '.hero-actions, .svc-actions, #contacts, .diag-cta';

export default function Fab() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const targets = document.querySelectorAll(ANCHORS);
    if (!targets.length) return undefined;

    const visible = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        });
        setHidden(visible.size > 0);
      },
      { rootMargin: '-10% 0px -10% 0px' }
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return (
    <BookButton
      className={`fab${hidden ? ' fab-hidden' : ''}`}
      aria-label="Записаться на приём"
      aria-hidden={hidden}
      tabIndex={hidden ? -1 : undefined}
    >
      <span>Записаться</span>
    </BookButton>
  );
}
