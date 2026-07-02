const YM_ID = Number(process.env.NEXT_PUBLIC_YM_ID);

// Идентификаторы целей для Яндекс Метрики / Директа.
// В Метрике создаются как цели типа «JavaScript-событие» с этими же именами.
export const GOALS = {
  BOOKING_OPEN: 'booking_open', // клик по любой кнопке «Записаться» (открытие модалки)
  MAX: 'click_max',
  TELEGRAM: 'click_telegram',
  WHATSAPP: 'click_whatsapp',
  PHONE: 'click_phone',
  PRODOCTOROV: 'click_prodoctorov',
};

// Безопасная отправка цели: молчит, если посетитель отклонил cookie
// (счётчик не загружен) или ID не задан.
export function reachGoal(goal) {
  if (!YM_ID || typeof window === 'undefined' || typeof window.ym !== 'function') return;
  window.ym(YM_ID, 'reachGoal', goal);
}
