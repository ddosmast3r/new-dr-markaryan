const YM_ID_RAW = process.env.NEXT_PUBLIC_YM_ID;
const YM_ID = Number(YM_ID_RAW);

export const COOKIE_CONSENT_KEY = 'cookie-consent';

// Идентификаторы целей для Яндекс Метрики / Директа.
// В Метрике создаются как цели типа «JavaScript-событие» с этими же именами.
export const GOALS = {
  BOOKING_OPEN: 'booking_open',
  MAX: 'click_max',
  TELEGRAM: 'click_telegram',
  WHATSAPP: 'click_whatsapp',
  PHONE: 'click_phone',
  PRODOCTOROV: 'click_prodoctorov',
};

let isInitialized = false;
let isInitListenerBound = false;
const queuedGoals = [];

function hasWindow() {
  return typeof window !== 'undefined';
}

function hasConsent() {
  if (!hasWindow()) return false;
  try {
    return window.localStorage.getItem(COOKIE_CONSENT_KEY) === 'accepted';
  } catch {
    return false;
  }
}

function flushQueuedGoals() {
  if (!YM_ID || !hasWindow() || typeof window.ym !== 'function') return;
  while (queuedGoals.length > 0) {
    window.ym(YM_ID, 'reachGoal', queuedGoals.shift());
  }
}

function bindInitListener() {
  if (!YM_ID || !hasWindow() || isInitListenerBound) return;
  isInitListenerBound = true;
  document.addEventListener(`yacounter${YM_ID}inited`, () => {
    isInitialized = true;
    flushQueuedGoals();
  });
}

export function initMetrika() {
  if (!YM_ID || !hasWindow()) return false;

  bindInitListener();

  if (window.ym && isInitialized) {
    flushQueuedGoals();
    return true;
  }

  window.ym =
    window.ym ||
    function () {
      (window.ym.a = window.ym.a || []).push(arguments);
    };
  window.ym.l = window.ym.l || Date.now();

  const src = `https://mc.yandex.ru/metrika/tag.js?id=${YM_ID}`;
  if (![...document.scripts].some((el) => el.src === src)) {
    const script = document.createElement('script');
    script.async = true;
    script.src = src;
    document.head.appendChild(script);
  }

  if (!isInitialized) {
    window.ym(YM_ID, 'init', {
      ssr: true,
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true,
      ecommerce: 'dataLayer',
      triggerEvent: true,
    });
  }

  return true;
}

// Если счётчик ещё догружается, не теряем цель, а отправляем после инициализации.
export function reachGoal(goal) {
  if (!YM_ID || !hasWindow() || !hasConsent()) return;

  initMetrika();

  if (isInitialized && typeof window.ym === 'function') {
    window.ym(YM_ID, 'reachGoal', goal);
    return;
  }

  queuedGoals.push(goal);
}
