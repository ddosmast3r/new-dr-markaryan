'use client';

import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'cookie-consent';
const YM_ID = process.env.NEXT_PUBLIC_YM_ID;

// Загружает счетчик Яндекс Метрики. Вызывается только после согласия посетителя.
function loadMetrika() {
  if (!YM_ID || typeof window === 'undefined' || window.ym) return;
  window.ym =
    window.ym ||
    function () {
      (window.ym.a = window.ym.a || []).push(arguments);
    };
  window.ym.l = Date.now();
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://mc.yandex.ru/metrika/tag.js';
  document.head.appendChild(s);
  window.ym(Number(YM_ID), 'init', {
    ssr: true,
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
    ecommerce: 'dataLayer',
  });
}

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
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      return;
    }
    if (stored === 'accepted') loadMetrika();
    else if (stored !== 'declined') setVisible(true);
  }, []);

  const choose = (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {}
    setVisible(false);
    if (value === 'accepted') loadMetrika();
  };

  if (!visible) return null;

  return (
    <div ref={bannerRef} className="cookie-banner" role="dialog" aria-live="polite" aria-label="Согласие на использование cookie">
      <p className="cookie-text">
        Мы используем cookie и Яндекс Метрику для анализа посещаемости. Подробнее — в{' '}
        <a href="/privacy">политике конфиденциальности</a>.
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
