import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, webkit, devices } from 'playwright';

const base = process.env.BASE_URL || 'http://127.0.0.1:3111';
const output = process.env.REVIEW_DIR || path.resolve('artifacts/mobile/manual');
const routes = ['/'];
for (const entry of await fs.readdir('app', { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  try { await fs.access(`app/${entry.name}/page.jsx`); routes.push(`/${entry.name}`); } catch {}
}
await fs.mkdir(output, { recursive: true });
const failures = [];
let checks = 0;
function check(ok, message, details) {
  checks++;
  if (!ok) failures.push({ message, details });
}

// Real mobile contexts: touch input, mobile layout, device pixel ratio and motion.
// Resizing a desktop viewport with reduced motion missed these regressions.
for (const [engine, browserType, device] of [
  ['webkit', webkit, devices['iPhone 13']],
  ['chromium', chromium, devices['Pixel 7']],
]) {
  const browser = await browserType.launch();
  try {
    const context = await browser.newContext({ ...device, reducedMotion: 'no-preference' });
    await context.route(/mc\.yandex\.ru|top-fwz1\.mail\.ru/, route => route.fulfill({ body: '' }));
    const page = await context.newPage();
    page.on('pageerror', error => failures.push({ message: `${engine}: JavaScript`, details: error.message }));
    page.on('response', response => {
      if (response.status() >= 400) failures.push({ message: `${engine}: HTTP ${response.status()}`, details: response.url() });
    });

    async function visit(route) {
      await page.waitForLoadState('networkidle');
      const response = await page.goto(base + route, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      return response;
    }
    async function screenshot(name) {
      // Viewport shots retain sticky layers and animations; no CSS is hidden.
      await page.screenshot({ path: `${output}/${engine}-${name}.png`, scale: 'css' });
    }
    async function scroll(top) {
      await page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), top);
      await page.waitForTimeout(750);
    }

    await visit('/');
    await page.locator('.cookie-banner').waitFor();
    await screenshot('first-visit');
    check(await page.locator('.cookie-banner').evaluate(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight;
    }), `${engine}: cookie choices fit the viewport`);
    await page.getByRole('button', { name: 'Отклонить', exact: true }).tap();

    for (const route of routes) {
      const response = await visit(route);
      check(response.status() === 200, `${engine} ${route}: page loads`);
      // Keep viewport screenshots of every page, including the smallest phone.
      // These are for human review of typography and composition, not only tests.
      for (const width of [320, device.viewport.width]) {
        await page.setViewportSize({ width, height: width === 320 ? 568 : device.viewport.height });
        await page.waitForTimeout(200);
        check(await page.locator('main h1').evaluate(el => el.scrollWidth <= el.clientWidth), `${engine} ${route}: heading fits ${width}px`);
        check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${engine} ${route}: page fits ${width}px`);
        await screenshot(`${route === '/' ? 'home' : route.slice(1)}-${width}-top`);
      }
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${engine} ${route}: no horizontal overflow`);
      if (await page.locator('.site-header').count()) {
        await scroll(250);
        check(await page.locator('.site-header').evaluate(el => {
          const background = getComputedStyle(el).backgroundColor;
          return el.classList.contains('is-solid') && background === 'rgb(228, 231, 226)';
        }), `${engine} ${route}: scrolling content cannot show through the header`);
      }
      // Traverse with normal motion so scroll-triggered content is exercised.
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      const step = await page.evaluate(() => Math.round(innerHeight * 0.65));
      for (let y = step; y < height; y += step) {
        await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), y);
        await page.waitForTimeout(90);
      }
      await page.waitForTimeout(800);
      const hidden = await page.locator('.reveal:not(.in)').evaluateAll(els => els
        .filter(el => el.getBoundingClientRect().height > 0)
        .map(el => el.textContent.trim().slice(0, 80)));
      check(!hidden.length, `${engine} ${route}: content appears during scrolling`, hidden);
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${engine} ${route}: no overflow after scrolling`);
      console.log(`${engine}: ${route}`);
    }

    for (const [name, viewport] of [
      ['phone', device.viewport],
      ['small', { width: 320, height: 568 }],
      ['landscape', { width: 844, height: 390 }],
    ]) {
      await page.setViewportSize(viewport);
      await visit('/');
      await page.locator('.burger').tap();
      await page.waitForTimeout(350);
      check(await page.locator('.main-nav').evaluate(el => {
        const r = el.getBoundingClientRect();
        return r.top >= 0 && r.bottom <= innerHeight && el.scrollWidth <= el.clientWidth;
      }), `${engine} ${name}: menu stays inside the screen`);
      await screenshot(`${name}-menu`);
      // The last entry must remain reachable even when the menu scrolls.
      await page.locator('.main-nav a[href="/kontakty"]').tap();
      await page.waitForURL('**/kontakty');
      check(await page.locator('.burger').getAttribute('aria-expanded') === 'false', `${engine} ${name}: touching a menu link closes it`);

      await visit('/');
      await page.locator('.hero-actions button').first().tap();
      await page.locator('dialog[open]').waitFor();
      await page.waitForTimeout(400);
      await page.locator('.booking-message summary').tap();
      await page.locator('.modal-card').evaluate(el => { el.scrollTop = el.scrollHeight; });
      await screenshot(`${name}-booking-scrolled`);
      check(await page.locator('.modal-close').evaluate(el => {
        const r = el.getBoundingClientRect();
        const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return r.top >= 0 && r.bottom <= innerHeight && r.width >= 44 && r.height >= 44 && el.contains(top);
      }), `${engine} ${name}: close button remains reachable after scrolling the dialog`);
      check(await page.locator('.modal-card').evaluate(el => {
        const card = el.getBoundingClientRect();
        const bar = document.querySelector('.modal-topline').getBoundingClientRect();
        return card.top >= bar.bottom - 1 && card.bottom <= innerHeight && el.scrollWidth <= el.clientWidth;
      }), `${engine} ${name}: dialog content fits below its controls`);
      const position = await page.evaluate(() => scrollY);
      await page.locator('.modal-close').tap();
      check(await page.locator('dialog').count() === 0, `${engine} ${name}: touch closes the scrolled dialog`);
      check(await page.evaluate(() => scrollY) === position, `${engine} ${name}: closing keeps the page position`);
      await scroll(650);
      await screenshot(`${name}-scrolled`);
      await scroll(0);
      check(await page.locator('.site-header').evaluate(el => el.classList.contains('is-light')), `${engine} ${name}: hero header returns when scrolling to the top`);

      await visit('/gastroskopiya');
      await page.locator('.colono-nav a[href="#preparation"]').tap();
      await page.waitForTimeout(1000);
      check(await page.evaluate(() => {
        const nav = document.querySelector('.colono-nav');
        const target = document.querySelector('#preparation');
        return getComputedStyle(nav).backgroundColor === 'rgb(228, 231, 226)' &&
          target.getBoundingClientRect().top >= nav.getBoundingClientRect().bottom - 1;
      }), `${engine} ${name}: section navigation does not cover the destination`);
      await screenshot(`${name}-preparation`);
    }
    await context.close();
  } finally {
    await browser.close();
  }
}
await fs.writeFile(`${output}/results.json`, JSON.stringify({ checks, failures }, null, 2));
console.log(JSON.stringify({ checks, failures, screenshots: output }, null, 2));
if (failures.length) process.exitCode = 1;
