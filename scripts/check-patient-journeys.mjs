import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.BASE_URL || 'http://127.0.0.1:3111';
const output = process.env.REVIEW_DIR || '/private/tmp/edjo-patient-review';
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch();
const errors = [];
let checks = 0;
const check = (condition, description) => { assert.ok(condition, description); checks++; };
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
// Never send test page views or events to production analytics.
await context.route(/mc\.yandex\.ru|top-fwz1\.mail\.ru/, route => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
await context.addInitScript(() => {
  localStorage.setItem('cookie-consent', 'declined');
  window.__goals = [];
  window.ym = (...args) => window.__goals.push(args);
});
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
try {
  const routes = ['/', '/gastroskopiya', '/kolonoskopiya', '/gemorroy', '/analnaya-treshina', '/kopchikovyj-hod', '/o-vrache'];
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    for (const route of routes) {
      const response = await page.goto(base + route, { waitUntil: 'load' });
      await page.waitForTimeout(100);
      check(response.status() === 200, `${route} responds at ${width}px`);
      check(await page.locator('main h1').count() === 1, `${route} has one h1`);
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} fits ${width}px`);
      const missingAnchors = await page.locator('.colono-nav a').evaluateAll(links => links.filter(link => !document.getElementById(link.hash.slice(1))).map(link => link.hash));
      check(!missingAnchors.length, `${route} navigation targets exist`);
      if ([390, 1440].includes(width) && ['/', '/gastroskopiya', '/o-vrache'].includes(route)) {
        await page.addStyleTag({ content: 'body::before,body::after{display:none!important}' });
        await page.screenshot({ path: `${output}/${route === '/' ? 'home' : route.slice(1)}-${width}.png`, fullPage: true });
      }
    }
  }
  await page.goto(base + '/');
  check(await page.locator('.marquee').count() === 0, 'marquee removed');
  check((await page.locator('h1').innerText()).includes('в Пятигорске и Ессентуках'), 'hero geography unchanged');
  check(await page.locator('#first-visit details').count() === 3, 'first visit has three real answers');
  await page.locator('#first-visit summary').first().click();
  check(await page.locator('#first-visit details').first().getAttribute('open') !== null, 'first-visit accordion opens');
  const scenarios = [
    ['/gastroskopiya', '.svc-actions button', 'Гастроскопия', 'appointment'],
    ['/gastroskopiya', '#preparation button', 'Гастроскопия', 'preparation'],
    ['/kolonoskopiya', '#preparation button', 'Колоноскопия', 'preparation'],
    ['/kolonoskopiya', '.colono-price button', 'Колоноскопия', 'cost'],
    ['/gemorroy', '#faq button', 'Лечение геморроя', 'question'],
    ['/analnaya-treshina', '#visit-plan button', 'Анальная трещина', 'preparation'],
    ['/kopchikovyj-hod', '#visit-plan button', 'Копчиковый ход', 'preparation'],
  ];
  for (const [route, selector, subject, intent] of scenarios) {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(base + route, { waitUntil: 'load' });
    const trigger = page.locator(selector).first();
    await trigger.click();
    await page.locator('dialog[open]').waitFor();
    check(await page.locator('.booking-subject').innerText() === subject, `${route} keeps service context`);
    const primaryHref = await page.locator('.booking-primary').getAttribute('href');
    if (intent === 'appointment') check(primaryHref.includes('prodoctorov.ru'), 'appointment opens booking service');
    else {
      const text = new URL(primaryHref).searchParams.get('text');
      check(text.includes(subject.toLowerCase()), 'WhatsApp draft keeps subject');
      check(intent !== 'preparation' || text.includes('подготовиться'), 'preparation button asks for instructions');
      check(intent !== 'cost' || text.includes('стоимость'), 'cost button keeps intent');
    }
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'dialog fits narrow screen');
    check(await page.locator('.modal-card').evaluate(el => { const r = el.getBoundingClientRect(); return r.y >= 0 && r.bottom <= innerHeight + 1 && getComputedStyle(el).overflowY === 'auto'; }), 'dialog remains scrollable inside short viewport');
    check(!(await page.evaluate(() => window.__goals.some(args => args[1] === 'reachGoal'))), 'no analytics goals without consent');
    await page.locator('.booking-message summary').click();
    check((await page.locator('.booking-message p').innerText()).includes(subject.toLowerCase()), 'copyable message available for other channels');
    if (route === '/gastroskopiya' && intent === 'preparation') await page.screenshot({ path: `${output}/preparation-dialog-320.png` });
    await page.keyboard.press('Escape');
    check(await page.locator('dialog').count() === 0, 'Escape closes dialog');
    check(await trigger.evaluate(el => el === document.activeElement), 'focus returns to trigger');
  }
  // Clipboard permission can resolve after the booking dialog has been closed.
  await page.goto(base + '/gastroskopiya', { waitUntil: 'networkidle' });
  for (const mode of ['success', 'denied', 'unavailable', 'delayed-denial']) {
    await page.evaluate(mode => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: mode === 'unavailable' ? undefined : {
          writeText: text => {
            if (mode === 'success') { window.__copiedMessage = text; return Promise.resolve(); }
            if (mode === 'denied') return Promise.reject(new DOMException('Permission denied', 'NotAllowedError'));
            return new Promise((resolve, reject) => { window.__rejectCopy = reject; });
          },
        },
      });
    }, mode);
    await page.locator('.svc-actions button').first().click();
    await page.locator('.booking-message summary').click();
    const message = await page.locator('.booking-message p').innerText();
    await page.getByRole('button', { name: 'Скопировать сообщение', exact: true }).click();
    if (mode === 'delayed-denial') {
      const previousErrors = errors.length;
      await page.locator('.modal-close').click();
      await page.evaluate(() => window.__rejectCopy(new DOMException('Permission denied', 'NotAllowedError')));
      await page.waitForTimeout(100);
      check(errors.length === previousErrors, 'delayed clipboard denial after closing does not throw');
      await page.locator('.svc-actions button').first().click();
      check(await page.locator('.booking-message [role=status]').textContent() === '', 'reopened booking has no stale copy status');
    } else if (mode === 'success') {
      await page.getByRole('status').filter({ hasText: 'Сообщение скопировано' }).waitFor();
      check(await page.evaluate(() => window.__copiedMessage) === message, 'copy writes the complete prepared message');
    } else {
      await page.getByRole('status').filter({ hasText: 'Выделили сообщение' }).waitFor();
      check(await page.evaluate(() => window.getSelection().toString()) === message, `${mode}: message can be copied manually`);
    }
    await page.locator('.modal-close').click();
  }
  // Same app instance, changed route: the header must use the new service.
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + '/');
  await page.locator('.home-diagnostics-body a[href="/gastroskopiya"]').click();
  await page.waitForURL('**/gastroskopiya');
  await page.locator('.header-cta').click();
  check(await page.locator('.booking-subject').innerText() === 'Гастроскопия', 'client navigation updates header booking context');
  await page.keyboard.press('Escape');
  // Exercise the delayed analytics queue without contacting Yandex.
  await page.evaluate(() => localStorage.setItem('cookie-consent', 'accepted'));
  await page.locator('#preparation button').click();
  await page.evaluate(() => {
    const script = [...document.scripts].find(el => el.src.includes('/metrika/tag.js'));
    const id = new URL(script.src).searchParams.get('id');
    document.dispatchEvent(new Event(`yacounter${id}inited`));
  });
  const goal = await page.evaluate(() => window.__goals.find(args => args[1] === 'reachGoal' && args[2] === 'booking_open'));
  check(goal?.[3]?.intent === 'preparation' && goal[3].service === 'Гастроскопия' && goal[3].source === 'preparation', 'queued analytics preserves intent, service and placement');
  await page.keyboard.press('Escape');
  const mediaContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const mediaPage = await mediaContext.newPage();
  await mediaContext.addInitScript(() => localStorage.setItem('cookie-consent', 'declined'));
  mediaPage.on('pageerror', error => errors.push(error.message));
  await mediaPage.goto(base + '/');
  await mediaPage.waitForFunction(() => [...document.querySelectorAll('.hero-video')].some(v => !v.paused && v.currentTime > .1));
  await mediaPage.evaluate(() => scrollTo({ top: 1800, behavior: 'instant' }));
  await mediaPage.waitForFunction(() => [...document.querySelectorAll('.hero-video')].every(v => v.paused));
  check(true, 'background video pauses below hero');
  await mediaPage.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await mediaPage.waitForFunction(() => [...document.querySelectorAll('.hero-video')].some(v => !v.paused));
  check(true, 'background video resumes when hero returns');
  const mobilePage = await mediaContext.newPage();
  await mobilePage.setViewportSize({ width: 390, height: 844 });
  const videoRequests = [];
  mobilePage.on('request', r => { if (/\.mp4/.test(r.url())) videoRequests.push(r.url()); });
  await mobilePage.goto(base + '/');
  await mobilePage.waitForTimeout(500);
  check(await mobilePage.locator('.hero-video').count() === 0 && videoRequests.length === 0, 'mobile hero uses poster without video download');
  check(errors.length === 0, `no JavaScript errors: ${errors.join('; ')}`);
  await fs.writeFile(`${output}/checks.json`, JSON.stringify({ checks, errors, routes, widths: [320, 390, 768, 1024, 1440] }, null, 2));
  console.log(`${checks} checks passed. Screenshots: ${output}`);
} finally {
  await browser.close();
}
