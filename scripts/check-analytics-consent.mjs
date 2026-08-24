// Проверка согласия на аналитику: до выбора в cookie-баннере, после «Отклонить»
// и после «Принять» — для Яндекс Метрики и пикселя VK Рекламы одновременно.
// Запуск: node scripts/check-analytics-consent.mjs [url]
//   node scripts/check-analytics-consent.mjs http://127.0.0.1:3000
//   node scripts/check-analytics-consent.mjs https://dr-markaryan.ru
//
// Все фазы идут в одном браузерном контексте с общим HTTP-кэшем: боевой сервер
// ограничивает число запросов с одного адреса, а отдельные контексты качали бы
// статику заново. «Чистый посетитель» между фазами достигается очисткой cookie
// и localStorage с последующей полной перезагрузкой.
import { chromium } from 'playwright';

const BASE = (process.argv[2] || process.env.CHECK_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const VK_ID = '3789429';

const ok = [];
const fail = [];
const check = (cond, label) => (cond ? ok : fail).push(label);

// Перехват window._tmr: настоящий code.js разбирает очередь, поэтому её длина
// не годится для подсчёта. Ловим сами вызовы push, не создавая _tmr заранее.
const TMR_SPY = () => {
  window.__vkPushes = [];
  let queue;
  Object.defineProperty(window, '_tmr', {
    configurable: true,
    get: () => queue,
    set(value) {
      queue = value;
      if (value && typeof value.push === 'function' && !value.__spied) {
        const original = value.push.bind(value);
        value.push = (...args) => {
          window.__vkPushes.push(...args);
          return original(...args);
        };
        value.__spied = true;
      }
    },
  });
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(TMR_SPY);
// Видео, картинки и шрифты для проверки согласия не нужны, а лишние
// параллельные запросы упираются в лимиты боевого сервера.
await ctx.route('**/*', (route) =>
  ['media', 'image', 'font'].includes(route.request().resourceType()) ? route.abort() : route.continue()
);

// Запросы к обоим аналитическим сервисам за текущую фазу.
const hits = { ym: [], vk: [] };
ctx.on('request', (r) => {
  const url = r.url();
  if (url.includes('mc.yandex.ru')) hits.ym.push(url);
  if (url.includes('top-fwz1.mail.ru')) hits.vk.push(url);
});
const resetHits = () => {
  hits.ym.length = 0;
  hits.vk.length = 0;
};

const page = await ctx.newPage();

const tagJs = () => hits.ym.filter((u) => u.includes('/metrika/tag.js')).length;
const codeJs = () => hits.vk.filter((u) => u.includes('/js/code.js')).length;

const vkPageViews = () =>
  page.evaluate(
    (id) => (window.__vkPushes || []).filter((e) => e && e.id === id && e.type === 'pageView').length,
    VK_ID
  );
const scriptCounts = () =>
  page.evaluate(() => ({
    ym: [...document.scripts].filter((s) => s.src.includes('mc.yandex.ru')).length,
    vk: document.querySelectorAll('#tmr-code').length,
  }));

// Боевой сервер иногда обрывает первую попытку — повторяем навигацию.
async function open(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      return;
    } catch (error) {
      if (attempt >= 3) throw error;
      await page.waitForTimeout(5000);
    }
  }
}

// Новый посетитель: без cookie, без сохранённого выбора, со свежим JS-контекстом.
async function freshVisit(path = '/') {
  await ctx.clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  resetHits();
  await open(`${BASE}${path}`);
  await page.waitForTimeout(1500);
}

await open(BASE); // первая загрузка, чтобы появился origin для очистки хранилища

// --- Фаза 1: до выбора в баннере ---
{
  await freshVisit();

  check(await page.locator('.cookie-banner').isVisible(), 'до выбора: баннер показан');
  check(hits.ym.length === 0, `до выбора: нет запросов к mc.yandex.ru (${hits.ym.length})`);
  check(hits.vk.length === 0, `до выбора: нет запросов к top-fwz1.mail.ru (${hits.vk.length})`);

  const state = await page.evaluate(() => ({
    ym: typeof window.ym,
    tmr: typeof window._tmr,
  }));
  check(state.ym === 'undefined', `до выбора: window.ym не создан (${state.ym})`);
  check(state.tmr === 'undefined', `до выбора: window._tmr не создан (${state.tmr})`);

  // Переход по сайту без выбора тоже ничего не должен отправлять.
  await page.click('a[href="/gemorroy"]');
  await page.waitForURL('**/gemorroy');
  await page.waitForTimeout(1000);
  check(
    hits.ym.length === 0 && hits.vk.length === 0,
    `до выбора: переход по сайту не шлёт аналитику (ym=${hits.ym.length}, vk=${hits.vk.length})`
  );
}

// --- Фаза 2: «Отклонить» ---
{
  await freshVisit();
  await page.click('.cookie-actions button:has-text("Отклонить")');
  await page.waitForTimeout(1500);

  check(!(await page.locator('.cookie-banner').isVisible()), 'после отказа: баннер скрыт');
  check(hits.ym.length === 0, `после отказа: нет запросов к mc.yandex.ru (${hits.ym.length})`);
  check(hits.vk.length === 0, `после отказа: нет запросов к top-fwz1.mail.ru (${hits.vk.length})`);

  // Клик по кнопке с целью тоже не должен поднимать Метрику.
  const bookBtn = page.locator('button:has-text("Записаться")').first();
  await bookBtn.click({ force: true, timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(800);
  check(hits.ym.length === 0, `после отказа: цель не поднимает Метрику (${hits.ym.length})`);
  // Закрываем модалку записи, иначе она перехватывает клики по ссылкам.
  await page.keyboard.press('Escape');
  await page.locator('#booking.open').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

  // Переход между страницами и полная перезагрузка.
  await page.click('a[href="/kolonoskopiya"]');
  await page.waitForURL('**/kolonoskopiya');
  await page.waitForTimeout(800);
  await open(`${BASE}/kolonoskopiya`);
  await page.waitForTimeout(1200);
  check(
    hits.ym.length === 0 && hits.vk.length === 0,
    `после отказа: молчат и на других страницах, и после перезагрузки (ym=${hits.ym.length}, vk=${hits.vk.length})`
  );
  check(
    !(await page.locator('.cookie-banner').isVisible()),
    'после отказа: баннер не возвращается при перезагрузке'
  );
}

// --- Фаза 3: «Принять» ---
{
  await freshVisit();
  await page.click('.cookie-actions button:has-text("Принять")');
  await page.waitForTimeout(2500);

  check(tagJs() === 1, `после согласия: tag.js Метрики загружен один раз (${tagJs()})`);
  check(codeJs() === 1, `после согласия: code.js VK загружен один раз (${codeJs()})`);
  check((await vkPageViews()) === 1, `после согласия: один pageView VK (${await vkPageViews()})`);
  check(
    await page.evaluate((id) => (window.__vkPushes || []).some((e) => e && e.id === id), VK_ID),
    `после согласия: в очередь window._tmr ушло событие с ID ${VK_ID}`
  );
  check(
    await page.evaluate(() => typeof window.ym === 'function'),
    'после согласия: window.ym инициализирован'
  );
  // Проверяем факт и адрес запроса: если внешние домены недоступны из среды
  // запуска, счётчики не исполнятся, но сам запрос всё равно виден.
  check(
    hits.ym.some((u) => /tag\.js\?id=\d+$/.test(u)),
    `после согласия: tag.js запрошен с ID счётчика (${hits.ym[0] || '—'})`
  );
  let tags = await scriptCounts();
  check(tags.ym === 1 && tags.vk === 1, `после согласия: по одному тегу в DOM (ym=${tags.ym}, vk=${tags.vk})`);
  check(
    !(await page.evaluate(() => document.body.innerHTML.includes('top-fwz1.mail.ru/counter'))),
    'после согласия: noscript-картинка VK не добавлена'
  );

  // Маркер для контроля отсутствия полной перезагрузки.
  await page.evaluate(() => {
    window.__spa = true;
  });

  // --- Клиентские переходы ---
  let expected = 1;
  for (const href of ['/gemorroy', '/kolonoskopiya', '/privacy', '/']) {
    await page.click(`a[href="${href}"]`);
    await page.waitForURL(`**${href}`);
    await page.waitForTimeout(800);
    expected += 1;
    check(await page.evaluate(() => window.__spa === true), `переход на ${href} без полной перезагрузки`);
    const count = await vkPageViews();
    check(count === expected, `переход на ${href}: pageView VK = ${count}, ожидалось ${expected}`);
  }

  check(codeJs() === 1, `переходы: code.js не перезагружается (${codeJs()})`);
  check(tagJs() === 1, `переходы: tag.js не перезагружается (${tagJs()})`);
  tags = await scriptCounts();
  check(tags.ym === 1 && tags.vk === 1, `переходы: теги не дублируются (ym=${tags.ym}, vk=${tags.vk})`);

  // Смена только query-параметров не считается новым просмотром.
  const before = await vkPageViews();
  await page.evaluate(() => window.history.pushState({}, '', '/?utm_source=test'));
  await page.waitForTimeout(600);
  const after = await vkPageViews();
  check(after === before, `смена только query не даёт новый pageView (${before} -> ${after})`);
}

// --- Фаза 4: повторный визит с сохранённым согласием ---
{
  resetHits();
  await open(`${BASE}/gemorroy`);
  await page.waitForTimeout(2500);

  check(!(await page.locator('.cookie-banner').isVisible()), 'повторный визит: баннер не показывается');
  check(tagJs() === 1, `повторный визит: tag.js загружен один раз (${tagJs()})`);
  check(codeJs() === 1, `повторный визит: code.js загружен один раз (${codeJs()})`);
  check((await vkPageViews()) === 1, `повторный визит: один pageView VK (${await vkPageViews()})`);
  const tags = await scriptCounts();
  check(tags.ym === 1 && tags.vk === 1, `повторный визит: по одному тегу (ym=${tags.ym}, vk=${tags.vk})`);
}

// --- Фаза 5: баннер на мобильной и десктопной ширине ---
{
  await freshVisit();
  for (const [label, size] of [
    ['мобильный 390x844', { width: 390, height: 844 }],
    ['десктоп 1440x900', { width: 1440, height: 900 }],
  ]) {
    await page.setViewportSize(size);
    await page.waitForTimeout(500);
    const banner = page.locator('.cookie-banner');
    await banner.waitFor();
    const box = await banner.boundingBox();
    const text = (await page.locator('.cookie-text').innerText()).replace(/\s+/g, ' ');
    const btns = await page.locator('.cookie-actions button').allInnerTexts();
    const link = await page.locator('.cookie-banner a[href="/privacy"]').count();
    const acceptBox = await page.locator('.cookie-actions button').first().boundingBox();

    check(
      box.x >= 0 && box.x + box.width <= size.width,
      `${label}: баннер помещается в экран (x=${Math.round(box.x)}, w=${Math.round(box.width)})`
    );
    check(
      text.includes('Яндекс Метрика') && text.includes('VK Реклама'),
      `${label}: текст упоминает оба сервиса`
    );
    check(btns.join('|') === 'Принять|Отклонить', `${label}: кнопки «Принять» и «Отклонить»`);
    check(link === 1, `${label}: ссылка на политику конфиденциальности`);
    check(acceptBox.height >= 36, `${label}: кнопки нажимаемого размера (${Math.round(acceptBox.height)}px)`);
  }
}

await browser.close();

console.log(`\nПроверка: ${BASE}`);
console.log('\n=== PASS ===');
ok.forEach((l) => console.log('  ✓', l));
if (fail.length) {
  console.log('\n=== FAIL ===');
  fail.forEach((l) => console.log('  ✗', l));
}
console.log(`\n${ok.length} passed, ${fail.length} failed`);
process.exit(fail.length ? 1 : 0);
