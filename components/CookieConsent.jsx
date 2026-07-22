'use client';

import { useEffect, useRef, useState } from 'react';
import { COOKIE_CONSENT_KEY, initMetrika } from '@/lib/metrika';

// Баннер согласия на аналитические cookie (п. 4 политики конфиденциальности).
// Выбор хранится в localStorage; Метрика подключается только после «Принять».
export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const bannerRef = useRef(null);

  // Пока баннер виден, публикуем его высоту в --cookie-offset,
  // чтобы плавающая кнопка «Записаться» поднималась выше баннера.
  useEffect(() => {
    if (!visible || !bannerRef.current) return;
    const root = document.documentElement;
    const ro = new ResizeObserver(([entry]) => {
      root.style.setProperty('--cookie-offset', `${Math.ceil(entry.contentRect.height) + 12}px`);
    });
    ro.observe(bannerRef.current);
    return () => {
      ro.disconnect();
      root.style.removeProperty('--cookie-offset');
    };
  }, [visible]);

  useEffect(() => {
    let stored = null;
    try {
      stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    } catch {
      return;
    }
    if (stored === 'accepted') initMetrika();
    else if (stored !== 'declined') setVisible(true);
  }, []);

  const choose = (value) => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, value);
    } catch {}
    setVisible(false);
    if (value === 'accepted') initMetrika();
  };

  if (!visible) return null;

  return (
    <div ref={bannerRef} className="cookie-banner" role="dialog" aria-live="polite" aria-label="Согласие на использование cookie">
      <p className="cookie-text">
        <span>Мы используем cookie и Яндекс Метрику для анализа посещаемости.</span>{' '}
        <span>
          Подробнее — в <a href="/privacy">политике конфиденциальности</a>.
        </span>
      </p>
      <div className="cookie-actions">
        <button type="button" className="btn btn-primary cookie-btn" onClick={() => choose('accepted')}>
          Принять
        </button>
        <button type="button" className="btn btn-ghost cookie-btn" onClick={() => choose('declined')}>
          Отклонить
        </button>
      </div>
    </div>
  );
}
