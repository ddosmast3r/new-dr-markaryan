import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from 'playwright';

const base = process.env.BASE_URL || 'http://127.0.0.1:3111';
const engine = process.env.BROWSER || 'chromium';
const output = process.env.REVIEW_DIR || `/private/tmp/edjo-full-review-${engine}`;
const widths = [320, 390, 768, 1024, 1440];
const routes = ['/'];
for (const entry of await fs.readdir('app', { withFileTypes: true })) {
  if (entry.isDirectory()) {
    try { await fs.access(`app/${entry.name}/page.jsx`); routes.push(`/${entry.name}`); } catch {}
  }
}
await fs.mkdir(output, { recursive: true });
const browser = await ({ chromium, webkit }[engine]).launch();
const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 } });
await context.route(/mc\.yandex\.ru|top-fwz1\.mail\.ru/, route => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
await context.addInitScript(() => localStorage.setItem('cookie-consent', 'declined'));
const page = await context.newPage();
async function visit(url) {
  // Let prefetches finish before hard navigation; WebKit reports cancelled
  // prefetches as access-control errors when the test tears down a document.
  await page.waitForLoadState('networkidle');
  return page.goto(url, { waitUntil: 'domcontentloaded' });
}
const failures = [];
const errors = [];
const responses = [];
const accessibility = [];
const documents = {};
const externalLinks = new Set();
const assets = new Set();
let checks = 0;
function check(ok, message, details) { checks++; if (!ok) failures.push({ message, details }); }
page.on('pageerror', error => errors.push({ page: page.url(), message: error.message }));
page.on('response', response => { if (response.status() >= 400) responses.push({ url: response.url(), status: response.status() }); });
try {
  for (const route of routes) {
    const response = await visit(base + route);
    await page.evaluate(async () => {
      document.querySelectorAll('img').forEach(img => { img.loading = 'eager'; });
      await document.fonts.ready;
      await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
    });
    check(response.status() === 200, `${route}: HTTP 200`);
    const document = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
      const jsonLd = [...document.querySelectorAll('script[type="application/ld+json"]')].map(el => JSON.parse(el.textContent));
      return {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content,
        canonical: document.querySelector('link[rel="canonical"]')?.href,
        h1: [...document.querySelectorAll('main h1')].map(el => el.textContent),
        lang: document.documentElement.lang,
        duplicateIds: ids.filter((id, i) => ids.indexOf(id) !== i), ids, jsonLd,
        links: [...document.querySelectorAll('a[href]')].map(el => el.href),
        assets: [...document.querySelectorAll('img,video,source')].flatMap(el => [el.getAttribute('src'), el.getAttribute('poster')]).filter(Boolean),
        brokenImages: [...document.images].filter(img => !img.complete || !img.naturalWidth).map(img => img.src),
        emptyButtons: [...document.querySelectorAll('button')].filter(el => !el.textContent.trim() && !el.getAttribute('aria-label')).map(el => el.outerHTML),
        missingAlt: [...document.querySelectorAll('img:not([alt])')].map(el => el.src),
      };
    });
    documents[route] = document;
    check(document.h1.length === 1, `${route}: one main heading`, document.h1);
    check(document.lang === 'ru', `${route}: Russian document language`);
    check(Boolean(document.title && document.description), `${route}: title and description`);
    check(document.canonical?.replace(/\/$/, '') === `https://dr-markaryan.ru${route}`.replace(/\/$/, ''), `${route}: correct canonical`, document.canonical);
    check(!document.duplicateIds.length, `${route}: unique IDs`, document.duplicateIds);
    check(!document.brokenImages.length, `${route}: images loaded`, document.brokenImages);
    check(!document.emptyButtons.length, `${route}: named buttons`, document.emptyButtons);
    check(!document.missingAlt.length, `${route}: image alternatives`, document.missingAlt);
    document.assets.forEach(src => {
      const url = new URL(src, base);
      // The optimizer accepts GET, while static source files support HEAD.
      assets.add(url.pathname === '/_next/image' ? new URL(url.searchParams.get('url'), base).href : url.href);
    });
    document.links.filter(href => /^https?:/.test(href) && !href.startsWith(base) && !href.startsWith('https://dr-markaryan.ru')).forEach(href => externalLinks.add(href));
    for (const width of widths) {
      await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route}: fits ${width}px`);
    }
    await page.addScriptTag({ path: fileURLToPath(import.meta.resolve('axe-core/axe.min.js')) });
    const axe = await page.evaluate(async () => {
      const { violations } = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } });
      return violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }));
    });
    if (axe.length) accessibility.push({ route, violations: axe });
    if (process.env.SCREENSHOTS === '1') {
      await page.addStyleTag({ content: 'body::before,body::after{display:none!important}.site-header,.fab{visibility:hidden!important}' });
      for (const width of [390,1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.screenshot({ path: `${output}/${route === '/' ? 'home' : route.slice(1)}-${width}.png`, fullPage: true });
      }
    }
    console.log(`${route}: checked`);
  }
  for (const [route, document] of Object.entries(documents)) {
    for (const href of new Set(document.links)) {
      const url = new URL(href);
      if (![new URL(base).origin, 'https://dr-markaryan.ru'].includes(url.origin)) continue;
      const path = url.pathname.replace(/\/$/, '') || '/';
      check(Boolean(documents[path]), `${route}: internal destination ${path}`);
      if (url.hash && documents[path]) check(documents[path].ids.includes(decodeURIComponent(url.hash.slice(1))), `${route}: anchor ${path}${url.hash}`);
    }
  }
  check(new Set(Object.values(documents).map(d => d.title)).size === routes.length, 'unique page titles');
  for (const url of assets) {
    const response = await context.request.head(url);
    check(response.ok(), `asset responds: ${url}`, response.status());
  }
  const sitemap = await context.request.get(`${base}/sitemap.xml`);
  const sitemapText = await sitemap.text();
  for (const route of routes) check(sitemapText.includes(`<loc>https://dr-markaryan.ru${route}</loc>`), `${route}: present in sitemap`);
  const robots = await context.request.get(`${base}/robots.txt`);
  check((await robots.text()).includes('Sitemap: https://dr-markaryan.ru/sitemap.xml'), 'robots links sitemap');
  const missing = await context.request.get(`${base}/missing-audit-page`);
  check(missing.status() === 404, 'missing page responds 404');
  await visit(`${base}/missing-audit-page`);
  check((await page.locator('h1').textContent()).includes('Такой страницы нет'), 'Russian 404 page');
  check(await page.locator('main a[href="/"]').count() > 0, '404 page offers return home');
  for (const [from, to] of [['about','o-vrache'],['services','lechenie'],['diagnostics','diagnostika'],['how','kak-prohodit'],['faq','voprosy'],['contacts','kontakty']]) {
    const response = await context.request.get(`${base}/${from}`, { maxRedirects: 0 });
    check(response.status() === 308 && response.headers().location === `/${to}`, `legacy redirect /${from}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await visit(base);
  await page.locator('.burger').click();
  check(await page.locator('.main-nav').evaluate(el => el.contains(document.activeElement)), 'opened mobile menu receives keyboard focus');
  await page.keyboard.press('Escape');
  check(await page.locator('.burger').evaluate(el => el === document.activeElement && el.getAttribute('aria-expanded') === 'false'), 'Escape closes mobile menu and restores focus');
  await page.locator('.burger').click();
  await page.locator('.main-nav a[href="/video"]').click();
  await page.waitForURL('**/video');
  check(await page.locator('.burger').getAttribute('aria-expanded') === 'false', 'menu closes after navigation');
  for (const size of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(size);
    const trigger = page.locator('.post').first();
    await trigger.click();
    await page.locator('.reel-modal[open]').waitFor();
    await page.waitForFunction(() => document.querySelector('.reel-video')?.readyState >= 1);
    check(await page.locator('.reel-video').evaluate(v => v.videoWidth > 0 && !v.error), 'video media loads');
    check(await page.locator('.reel-close').evaluate(el => { const r = el.getBoundingClientRect(); return r.y >= 0 && r.bottom <= innerHeight && r.right <= innerWidth; }), 'video close control fits viewport');
    await page.keyboard.press('Escape');
    check(await page.locator('.reel-modal').count() === 0, 'Escape closes video');
    check(await trigger.evaluate(el => el === document.activeElement), 'video restores focus');
  }
  await visit(`${base}/voprosy`);
  const question = page.locator('.faq-list summary').first();
  await question.focus();
  await page.keyboard.press('Enter');
  check(await page.locator('.faq-list details').first().getAttribute('open') !== null, 'FAQ opens from keyboard');
  await page.keyboard.press('Enter');
  check(await page.locator('.faq-list details').first().getAttribute('open') === null, 'FAQ closes from keyboard');
  await page.setViewportSize({ width: 320, height: 568 });
  for (const [route, selector, subject] of [
    ['/gastroskopiya', '#preparation button', 'Гастроскопия'],
    ['/kolonoskopiya', '.svc-actions button', 'Колоноскопия'],
    ['/gemorroy', '#faq button', 'Лечение геморроя'],
  ]) {
    await visit(base + route);
    const trigger = page.locator(selector).first();
    await trigger.click();
    await page.locator('dialog[open]').waitFor();
    check(await page.locator('.booking-subject').innerText() === subject, `${route}: booking context in ${engine}`);
    check(await page.locator('.modal-card').evaluate(el => { const r = el.getBoundingClientRect(); return r.y >= 0 && r.bottom <= innerHeight + 1; }), `${route}: booking fits short viewport`);
    await page.keyboard.press('Escape');
    check(await page.locator('dialog').count() === 0 && await trigger.evaluate(el => el === document.activeElement), `${route}: booking restores focus in ${engine}`);
  }
  check(!errors.length, 'no browser JavaScript errors', errors);
  const unexpectedResponses = responses.filter(r => !r.url.includes('/missing-audit-page'));
  check(!unexpectedResponses.length, 'no failed page resources', unexpectedResponses);
  const report = { engine, checks, routes, widths, failures, errors, responses: unexpectedResponses, accessibility, externalLinks: [...externalLinks] };
  await fs.writeFile(`${output}/site-checks.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ checks, failures, accessibility: accessibility.map(p => ({ route: p.route, rules: p.violations.map(v => v.id) })), output }, null, 2));
  if (failures.length || accessibility.some(p => p.violations.some(v => ['critical', 'serious'].includes(v.impact)))) process.exitCode = 1;
} finally { await browser.close(); }
