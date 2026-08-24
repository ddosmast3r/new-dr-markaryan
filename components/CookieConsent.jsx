'use client';

import { useEffect, useRef, useState } from 'react';
import { COOKIE_CONSENT_KEY, initMetrika, clearMetrikaCookies } from '@/lib/metrika';
import { initVkAds } from '@/lib/vk-ads';

// Баннер об аналитических cookie (п. 4 политики конфиденциальности).
// Модель — opt-in: Яндекс Метрика и пиксель VK Рекламы стартуют только
// после «Принять». Выбор хранится в localStorage и переживает перезагрузку.
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
    // Согласие из прошлого визита: поднимаем Метрику, VK-пиксель стартует
    // сам в VkAdsPixel. Оба модуля повторно скрипты не грузят.
    if (stored === 'accepted') initMetrika();
    if (stored !== 'accepted' && stored !== 'declined') setVisible(true);
  }, []);

  const choose = (value) => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, value);
    } catch {}
    setVisible(false);
    // Оба сервиса уже смонтированы и сами не перезапустятся (путь не меняется),
    // поэтому запускаем их здесь — сразу после согласия, по одному разу.
    if (value === 'accepted') {
      initMetrika();
      initVkAds();
    }
    // До согласия счётчики не стартуют, но cookie могли остаться
    // от прошлого визита с очищенным localStorage — убираем их.
    if (value === 'declined') clearMetrikaCookies();
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
