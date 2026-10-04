// Keep the client vocabulary independent from the full medical page data.
const services = {
  '/gemorroy': 'Лечение геморроя',
  '/analnaya-treshina': 'Анальная трещина',
  '/kopchikovyj-hod': 'Копчиковый ход',
  '/kolonoskopiya': 'Колоноскопия',
  '/gastroskopiya': 'Гастроскопия',
  '/diagnostika': 'Диагностика',
};

export function bookingDetails({ intent = 'appointment', service, pathname = '/' } = {}) {
  const subject = service || services[pathname.replace(/\/$/, '')] || 'Первичный приём';
  const copy = {
    appointment: {
      eyebrow: 'Запись на приём', title: 'Выберите удобный способ записи',
      message: `Здравствуйте! Хочу записаться к Эдуарду Маркаряну. Интересует: ${subject.toLowerCase()}. Подскажите, пожалуйста, доступное время.`,
    },
    question: {
      eyebrow: 'Вопрос перед записью', title: 'Уточните детали у врача',
      message: `Здравствуйте! Хочу задать вопрос перед записью. Интересует: ${subject.toLowerCase()}.`,
    },
    preparation: {
      eyebrow: 'Подготовка к посещению', title: 'Получите инструкции у врача',
      message: `Здравствуйте! Подскажите, пожалуйста, как подготовиться. Планирую: ${subject.toLowerCase()}.`,
    },
    cost: {
      eyebrow: 'Вопрос о стоимости', title: 'Уточните состав и стоимость',
      message: `Здравствуйте! Подскажите, пожалуйста, стоимость и что входит в услугу: ${subject.toLowerCase()}.`,
    },
  };
  const resolvedIntent = Object.hasOwn(copy, intent) ? intent : 'appointment';
  return { ...copy[resolvedIntent], service: subject, intent: resolvedIntent, pathname };
}
