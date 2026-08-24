'use client';

import { useEffect, useRef, useState } from 'react';
import { COOKIE_CONSENT_KEY, initMetrika, clearMetrikaCookies } from '@/lib/metrika';
import { initVkAds } from '@/lib/vk-ads';

// Баннер об аналитических cookie (п. 4 политики конфиденциальности).
// Метрика — opt-out: подключается сразу, «Отклонить» её выключает.
// Пиксель VK Рекламы — opt-in: стартует только после «Принять».
// Выбор хранится в localStorage и переживает перезагрузку.
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
    if (stored !== 'declined') initMetrika();
    if (stored !== 'accepted' && stored !== 'declined') setVisible(true);
  }, []);

  const choose = (value) => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, value);
    } catch {}
    setVisible(false);
    // VkAdsPixel уже смонтирован и сам не перезапустится: путь не меняется,
    // поэтому пиксель запускаем здесь — сразу после согласия.
    if (value === 'accepted') initVkAds();
    // Выгрузить уже подключённый tag.js нельзя, поэтому при отказе чистим
    // его cookie и перезагружаем страницу — после неё счётчик не стартует.
    if (value === 'declined') {
      clearMetrikaCookies();
      window.location.reload();
    }
  };

  if (!visible) return null;

  return (
    <div ref={bannerRef} className="cookie-banner" role="dialog" aria-live="polite" aria-label="Согласие на использование cookie">
      <p className="cookie-text">
        <span>
          Мы используем cookie и сервисы аналитики Яндекс Метрика и VK Реклама, чтобы оценивать посещаемость сайта и
          эффективность рекламы.
        </span>{' '}
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
