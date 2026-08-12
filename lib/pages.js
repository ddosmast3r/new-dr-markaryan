// Данные отдельных страниц услуг (/gemorroy, /analnaya-treshina, ...).
//
// ПРАВИЛО КОНТЕНТА: на этих страницах используется только уже согласованный
// текст сайта — он собирается из lib/content.js (services, diagnostics, steps,
// faq, procedures, reels). Новый медицинский текст здесь не выдумывается.
//
// Там, где для полноценной страницы нужен новый медицинский текст, стоит
// заглушка с todo: true и пометкой NEEDS_DOCTOR. Такие блоки НЕ выводятся
// пользователю (и не попадают в JSON-LD) до тех пор, пока врач не согласует
// формулировку: достаточно вписать ответ/текст и убрать флаг todo.

import {
  services,
  diagnostics,
  faqById,
  procedures,
  reels,
} from './content';

export const NEEDS_DOCTOR = '[НУЖНО СОГЛАСОВАТЬ С ВРАЧОМ]';

// Кадр в шапке страницы. Берутся только уже отснятые фотографии сайта;
// на одной странице кадр не повторяется (ниже идут блок врача с doctor_2
// и контакты с ed_med). caption — подпись поверх кадра, chip — метка сверху.
const media = {
  cabinet: {
    src: '/img/doctor.png',
    alt: 'Эдуард Маркарян, врач-проктолог и хирург-колопроктолог',
    position: 'center top',
    caption: 'Приём веду сам',
    chip: 'Пятигорск, пр-кт Калинина',
  },
  operating: {
    src: '/img/doctor_3.png',
    alt: 'Эдуард Маркарян в операционной',
    position: 'center 18%',
    caption: 'Оперирую лично',
    chip: 'Малоинвазивные методики',
  },
  endoscopy: {
    src: '/img/diagnoses.png',
    alt: 'Эндоскопическое исследование на приёме',
    position: 'center',
    caption: 'Эндоскопия в HD',
    chip: 'При желании — под седацией',
  },
  gastro: {
    src: '/inst/reel2.jpg',
    alt: 'Проведение гастроскопии',
    position: 'center 30%',
    caption: 'Гастроскопия на приёме',
    chip: 'Пищевод, желудок, ДПК',
  },
};

const byTitle = (list, title) => list.find((item) => item.title === title);

const gemorroy = byTitle(services, 'Геморрой');
const treshina = byTitle(services, 'Анальные трещины');
const kopchik = byTitle(services, 'Копчиковый ход');
const polipy = byTitle(services, 'Полипы толстой кишки');
const svischi = byTitle(services, 'Свищи прямой кишки');
const paraproktit = byTitle(services, 'Острый парапроктит');

const osmotr = byTitle(diagnostics, 'Первичный осмотр');
const anoskopiya = byTitle(diagnostics, 'Аноскопия');
const fgds = byTitle(diagnostics, 'Гастроскопия (ФГДС)');
const kolono = byTitle(diagnostics, 'Видеоколоноскопия');

const endoscopeWash = procedures.find((p) => p.src.includes('endoscope-wash'));
const pilonidalLaser = procedures.find((p) => p.src.includes('pilonidal-laser'));
const gastroReel = reels.find((r) => r.src.includes('reel2'));

// Ответ из уже согласованного FAQ главной страницы.
const q = (id) => faqById[id];

// Заготовка вопроса, ответ на который врач ещё не давал.
const todo = (question) => ({ q: question, a: NEEDS_DOCTOR, todo: true });

export const servicePages = [
  {
    slug: 'gemorroy',
    media: media.cabinet,
    eyebrow: 'Лечение',
    h1: 'Лечение геморроя в Пятигорске',
    title: 'Лечение геморроя в Пятигорске — проктолог Эдуард Маркарян',
    description:
      'Приём проктолога и хирурга-колопроктолога Эдуарда Маркаряна в Пятигорске: диагностика и лечение геморроя. Пр-кт Калинина, зд. 90А. Запись на приём.',
    crumb: 'Лечение геморроя',
    intro: gemorroy.text,
    // Блоки страницы: только согласованные тексты из lib/content.js.
    blocks: [
      {
        heading: 'Диагностика перед лечением',
        lead: 'Сначала разбираюсь, в чём дело, потом лечу. Операцию вслепую не назначаю.',
        cards: [osmotr, anoskopiya, kolono],
      },
      {
        heading: 'Смежные состояния, с которыми обращаются',
        cards: [treshina, svischi, paraproktit],
      },
    ],
    // Разделы, для которых нужен новый медицинский текст.
    pending: [
      { heading: 'Симптомы и стадии геморроя', todo: true },
      { heading: 'Методы лечения: лазер, радиоволна, операция', todo: true },
      { heading: 'Восстановление после лечения', todo: true },
    ],
    faq: [
      q('pain'),
      q('surgery'),
      q('recovery'),
      q('price'),
      todo('На какой стадии геморроя можно обойтись без операции?'),
      todo('Чем лазерное лечение геморроя отличается от радиоволнового?'),
    ],
    related: ['analnaya-treshina', 'kopchikovyj-hod', 'kolonoskopiya'],
  },

  {
    slug: 'analnaya-treshina',
    media: media.cabinet,
    eyebrow: 'Лечение',
    h1: 'Лечение анальной трещины в Пятигорске',
    title: 'Анальная трещина: лечение в Пятигорске — доктор Маркарян',
    description:
      'Лечение анальной трещины в Пятигорске у хирурга-колопроктолога Эдуарда Маркаряна. Осмотр, аноскопия, консервативное и хирургическое лечение. Запись на приём.',
    crumb: 'Анальная трещина',
    intro: treshina.text,
    blocks: [
      {
        heading: 'Диагностика перед лечением',
        lead: 'Все исследования делаю аккуратно, при необходимости с обезболиванием.',
        cards: [osmotr, anoskopiya],
      },
      {
        heading: 'Смежные состояния, с которыми обращаются',
        cards: [gemorroy, svischi, paraproktit],
      },
    ],
    pending: [
      { heading: 'Острая и хроническая анальная трещина', todo: true },
      { heading: 'Как проходит консервативное лечение', todo: true },
    ],
    faq: [
      q('pain'),
      q('surgery'),
      q('recovery'),
      q('shy'),
      todo('Чем острая анальная трещина отличается от хронической?'),
      todo('Сколько времени обычно занимает заживление анальной трещины?'),
    ],
    related: ['gemorroy', 'kopchikovyj-hod', 'kolonoskopiya'],
  },

  {
    slug: 'kopchikovyj-hod',
    media: media.operating,
    eyebrow: 'Лечение',
    h1: 'Лечение эпителиального копчикового хода в Пятигорске',
    title: 'Эпителиальный копчиковый ход в Пятигорске — доктор Маркарян',
    description:
      'Эпителиальный копчиковый ход: приём и лечение в Пятигорске у хирурга-колопроктолога Эдуарда Маркаряна. Пр-кт Калинина, зд. 90А. Запись на приём.',
    crumb: 'Эпителиальный копчиковый ход',
    intro: kopchik.text,
    // Полная формулировка запроса должна встречаться в тексте страницы
    // естественно — она есть в H1, во вводном абзаце и здесь.
    note:
      'Эпителиальный копчиковый ход — одно из направлений приёма в Пятигорске. Приём взрослых пациентов, пр-кт Калинина, зд. 90А.',
    blocks: [
      {
        heading: 'Диагностика перед лечением',
        lead: 'Сначала осмотр, потом решение о вмешательстве.',
        cards: [osmotr],
      },
      {
        heading: 'Смежные состояния, с которыми обращаются',
        cards: [paraproktit, svischi],
      },
    ],
    video: {
      heading: 'Как проходит вмешательство',
      lead: 'Ролик не запускается сам: видео загружается только после вашего согласия.',
      items: [pilonidalLaser],
    },
    pending: [
      { heading: 'Почему появляется эпителиальный копчиковый ход', todo: true },
      { heading: 'Методика SiLaC и классическая операция', todo: true },
      { heading: 'Восстановление после удаления', todo: true },
    ],
    faq: [
      q('pain'),
      q('surgery'),
      q('recovery'),
      q('price'),
      todo('Что такое эпителиальный копчиковый ход и почему он появляется?'),
      todo('Чем лазерная методика SiLaC отличается от классической операции?'),
    ],
    related: ['gemorroy', 'analnaya-treshina', 'kolonoskopiya'],
  },

  {
    slug: 'kolonoskopiya',
    media: media.endoscopy,
    eyebrow: 'Диагностика',
    h1: 'Видеоколоноскопия в Пятигорске',
    title: 'Колоноскопия в Пятигорске — видеоколоноскопия, доктор Маркарян',
    description:
      'Видеоколоноскопия в Пятигорске у врача-проктолога Эдуарда Маркаряна: осмотр толстой кишки в HD, при необходимости — под лёгкой седацией. Запись на приём.',
    crumb: 'Колоноскопия',
    intro: kolono.text,
    blocks: [
      {
        heading: 'Что можно сделать во время исследования',
        cards: [polipy],
      },
      {
        heading: 'Другие исследования на приёме',
        cards: [osmotr, anoskopiya, fgds],
      },
    ],
    video: {
      heading: 'Как обрабатывают эндоскоп',
      lead: 'Что происходит с аппаратом между пациентами.',
      items: [endoscopeWash],
    },
    pending: [
      { heading: 'Подготовка к колоноскопии', todo: true },
      { heading: 'Как проходит исследование и седация', todo: true },
      { heading: 'Когда рекомендуется профилактическая колоноскопия', todo: true },
    ],
    faq: [
      q('pain'),
      q('shy'),
      q('price'),
      q('remote'),
      todo('Как правильно подготовиться к колоноскопии?'),
      todo('Сколько длится колоноскопия и когда можно есть после неё?'),
      todo('С какого возраста стоит делать профилактическую колоноскопию?'),
    ],
    related: ['gastroskopiya', 'gemorroy', 'kopchikovyj-hod'],
  },

  {
    slug: 'gastroskopiya',
    media: media.gastro,
    eyebrow: 'Диагностика',
    h1: 'Гастроскопия (ФГДС) в Пятигорске',
    title: 'Гастроскопия (ФГДС) в Пятигорске — доктор Маркарян',
    description:
      'Гастроскопия (ФГДС) в Пятигорске: осмотр пищевода, желудка и двенадцатиперстной кишки на приёме у Эдуарда Маркаряна. Пр-кт Калинина, зд. 90А. Запись на приём.',
    crumb: 'Гастроскопия',
    intro: fgds.text,
    blocks: [
      {
        heading: 'Другие исследования на приёме',
        cards: [kolono, osmotr, anoskopiya],
      },
    ],
    video: {
      heading: 'Как обрабатывают эндоскоп',
      lead: 'Что происходит с аппаратом между пациентами.',
      items: [endoscopeWash],
    },
    reel: gastroReel,
    pending: [
      { heading: 'Подготовка к гастроскопии', todo: true },
      { heading: 'Как проходит исследование', todo: true },
    ],
    faq: [
      q('pain'),
      q('shy'),
      q('price'),
      q('remote'),
      todo('Как подготовиться к гастроскопии?'),
      todo('Можно ли сделать гастроскопию под седацией?'),
    ],
    related: ['kolonoskopiya', 'gemorroy', 'analnaya-treshina'],
  },
];

export const servicePageBySlug = Object.fromEntries(
  servicePages.map((page) => [page.slug, page])
);

export const servicePageSlugs = servicePages.map((page) => page.slug);

// Вопросы, на которые есть согласованный ответ. Только они показываются
// пользователю и только они попадают в FAQPage JSON-LD.
export const answeredFaq = (page) => page.faq.filter((item) => !item.todo);
