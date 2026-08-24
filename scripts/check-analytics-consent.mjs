// Проверка согласия на аналитику: до выбора в cookie-баннере, после «Отклонить»
// и после «Принять» — для Яндекс Метрики и пикселя VK Рекламы одновременно.
// Запуск: node scripts/check-analytics-consent.mjs [url]
//   node scripts/check-analytics-consent.mjs http://127.0.0.1:3000
//   node scripts/check-analytics-consent.mjs https://dr-markaryan.ru
import { chromium } from 'playwright';

const BASE = (process.argv[2] || process.env.CHECK_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const ok = [];
const fail = [];
const check = (cond, label) => (cond ? ok : fail).push(label);

const browser = await chromium.launch();

// Счётчик сетевых запросов к обоим аналитическим сервисам.
function watch(target) {
  const hits = { ym: [], vk: [] };
  target.on('request', (r) => {
    const url = r.url();
    if (url.includes('mc.yandex.ru')) hits.ym.push(url);
    if (url.includes('top-fwz1.mail.ru')) hits.vk.push(url);
  });
  return hits;
}

const tagJs = (hits) => hits.ym.filter((u) => u.includes('/metrika/tag.js')).length;
const codeJs = (hits) => hits.vk.filter((u) => u.includes('/js/code.js')).length;

const vkPageViews = (page) =>
  page.evaluate(() =>
    (window._tmr || []).filter((e) => e && e.id === '3789429' && e.type === 'pageView').length
  );
const scriptCounts = (page) =>
  page.evaluate(() => ({
    ym: [...document.scripts].filter((s) => s.src.includes('mc.yandex.ru')).length,
    vk: document.querySelectorAll('#tmr-code').length,
  }));

// --- Фаза 1: до выбора в баннере ---
{
  const ctx = await browser.newContext();
  const hits = watch(ctx);
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  check(await page.locator('.cookie-banner').isVisible(), 'до выбора: баннер показан');
  check(hits.ym.length === 0, `до выбора: нет запросов к mc.yandex.ru (${hits.ym.length})`);
  check(hits.vk.length === 0, `до выбора: нет запросов к top-fwz1.mail.ru (${hits.vk.length})`);

  const state = await page.evaluate(() => ({
    ym: typeof window.ym,
    tmr: window._tmr ? window._tmr.length : 'undefined',
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
  await ctx.close();
}

// --- Фаза 2: «Отклонить» ---
{
  const ctx = await browser.newContext();
  const hits = watch(ctx);
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
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
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  check(
    hits.ym.length === 0 && hits.vk.length === 0,
    `после отказа: молчат и на других страницах, и после перезагрузки (ym=${hits.ym.length}, vk=${hits.vk.length})`
  );
  check(
    !(await page.locator('.cookie-banner').isVisible()),
    'после отказа: баннер не возвращается при перезагрузке'
  );
  await ctx.close();
}

// --- Фаза 3: «Принять» ---
{
  const ctx = await browser.newContext();
  const hits = watch(ctx);
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.click('.cookie-actions button:has-text("Принять")');
  await page.waitForTimeout(2500);

  check(tagJs(hits) === 1, `после согласия: tag.js Метрики загружен один раз (${tagJs(hits)})`);
  check(codeJs(hits) === 1, `после согласия: code.js VK загружен один раз (${codeJs(hits)})`);
  check((await vkPageViews(page)) === 1, `после согласия: один pageView VK (${await vkPageViews(page)})`);
  check(
    await page.evaluate(() => (window._tmr || []).some((e) => e && e.id === '3789429')),
    'после согласия: в window._tmr есть событие с ID 3789429'
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
  let tags = await scriptCounts(page);
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
    const count = await vkPageViews(page);
    check(count === expected, `переход на ${href}: pageView VK = ${count}, ожидалось ${expected}`);
  }

  check(codeJs(hits) === 1, `переходы: code.js не перезагружается (${codeJs(hits)})`);
  check(tagJs(hits) === 1, `переходы: tag.js не перезагружается (${tagJs(hits)})`);
  tags = await scriptCounts(page);
  check(tags.ym === 1 && tags.vk === 1, `переходы: теги не дублируются (ym=${tags.ym}, vk=${tags.vk})`);

  // Смена только query-параметров не считается новым просмотром.
  const before = await vkPageViews(page);
  await page.evaluate(() => window.history.pushState({}, '', '/?utm_source=test'));
  await page.waitForTimeout(600);
  const after = await vkPageViews(page);
  check(after === before, `смена только query не даёт новый pageView (${before} -> ${after})`);

  // --- Фаза 4: повторный визит с сохранённым согласием ---
  const returning = await ctx.newPage();
  const before2 = { ym: tagJs(hits), vk: codeJs(hits) };
  await returning.goto(`${BASE}/gemorroy`, { waitUntil: 'networkidle' });
  await returning.waitForTimeout(2000);
  check(
    !(await returning.locator('.cookie-banner').isVisible()),
    'повторный визит: баннер не показывается'
  );
  check(tagJs(hits) === before2.ym + 1, `повторный визит: tag.js загружен один раз (${tagJs(hits) - before2.ym})`);
  check(codeJs(hits) === before2.vk + 1, `повторный визит: code.js загружен один раз (${codeJs(hits) - before2.vk})`);
  check((await vkPageViews(returning)) === 1, `повторный визит: один pageView VK (${await vkPageViews(returning)})`);
  const tags2 = await scriptCounts(returning);
  check(tags2.ym === 1 && tags2.vk === 1, `повторный визит: по одному тегу (ym=${tags2.ym}, vk=${tags2.vk})`);

  await ctx.close();
}

// --- Фаза 5: баннер на мобильном и десктопе ---
for (const [label, opts] of [
  ['мобильный 390x844', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
  ['десктоп 1440x900', { viewport: { width: 1440, height: 900 } }],
]) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const banner = page.locator('.cookie-banner');
  await banner.waitFor();
  const box = await banner.boundingBox();
  const text = (await page.locator('.cookie-text').innerText()).replace(/\s+/g, ' ');
  const btns = await page.locator('.cookie-actions button').allInnerTexts();
  const link = await page.locator('.cookie-banner a[href="/privacy"]').count();
  const acceptBox = await page.locator('.cookie-actions button').first().boundingBox();

  check(
    box.x >= 0 && box.x + box.width <= opts.viewport.width,
    `${label}: баннер помещается в экран (x=${Math.round(box.x)}, w=${Math.round(box.width)})`
  );
  check(
    text.includes('Яндекс Метрика') && text.includes('VK Реклама'),
    `${label}: текст упоминает оба сервиса`
  );
  check(btns.join('|') === 'Принять|Отклонить', `${label}: кнопки «Принять» и «Отклонить»`);
  check(link === 1, `${label}: ссылка на политику конфиденциальности`);
  check(acceptBox.height >= 36, `${label}: кнопки нажимаемого размера (${Math.round(acceptBox.height)}px)`);
  await ctx.close();
}

await browser.close();

console.log('\n=== PASS ===');
ok.forEach((l) => console.log('  ✓', l));
if (fail.length) {
  console.log('\n=== FAIL ===');
  fail.forEach((l) => console.log('  ✗', l));
}
console.log(`\n${ok.length} passed, ${fail.length} failed`);
process.exit(fail.length ? 1 : 0);
