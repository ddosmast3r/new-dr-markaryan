import { hasAnalyticsConsent } from '@/lib/metrika';

// Пиксель VK Рекламы работает через счётчик Top.Mail.Ru.
export const VK_ADS_ID = '3789429';

const SCRIPT_ID = 'tmr-code';
const SCRIPT_SRC = 'https://top-fwz1.mail.ru/js/code.js';

// Последний учтённый путь. Живёт на уровне модуля, поэтому переживает
// повторные монтирования компонента (в т.ч. двойной эффект в Strict Mode)
// и не даёт отправить два pageView на один и тот же переход.
let lastTrackedPath = null;

function hasWindow() {
  return typeof window !== 'undefined';
}

function loadScript() {
  if (document.getElementById(SCRIPT_ID)) return;
  const script = document.createElement('script');
  script.async = true;
  script.id = SCRIPT_ID;
  script.src = SCRIPT_SRC;
  document.head.appendChild(script);
}

// Один просмотр страницы. Событие кладём в очередь _tmr до загрузки code.js,
// поэтому оно не теряется на первом вызове.
export function trackVkAdsPageView(path) {
  if (!hasWindow() || !hasAnalyticsConsent()) return false;

  // Учитываем только смену пути: изменение query-параметров новым просмотром не считается.
  const nextPath = path || window.location.pathname;
  if (lastTrackedPath === nextPath) return false;
  lastTrackedPath = nextPath;

  window._tmr = window._tmr || [];
  window._tmr.push({ id: VK_ADS_ID, type: 'pageView', start: Date.now() });

  loadScript();
  return true;
}

// Запуск пикселя сразу после нажатия «Принять» — до этого момента
// компонент VkAdsPixel ничего не отправляет и скрипт не грузит.
export function initVkAds() {
  return trackVkAdsPageView();
}
