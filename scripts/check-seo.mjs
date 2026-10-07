// Validate the actual HTTP responses and server-rendered HTML of a build.
// Host checks deliberately use node:http: fetch may override a custom Host.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import https from 'node:https';
import { chromium } from 'playwright';

const base = process.env.BASE_URL || 'http://127.0.0.1:3112';
const origin = 'https://dr-markaryan.ru';
const output = process.env.REVIEW_DIR || '/private/tmp/edjo-seo-fixes-2026-10-06';
const failures = [];
let checks = 0;
function check(condition, message, details) {
  checks++;
  if (!condition) failures.push({ message, details });
}
function request(path, host) {
  const url = new URL(path, base);
  return new Promise((resolve, reject) => {
    const client = url.protocol === 'https:' ? https : http;
    const req = client.get(url, { headers: host ? { host } : {} }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      res.on('error', reject);
    });
    req.setTimeout(15000, () => req.destroy(new Error(`Timeout: ${path}`)));
    req.on('error', reject);
  });
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ javaScriptEnabled: false });
  const parse = html => page.evaluate(html => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const all = selector => [...doc.querySelectorAll(selector)];
    return {
      title: doc.title,
      description: all('meta[name="description"]').map(el => el.content),
      canonical: all('link[rel="canonical"]').map(el => el.getAttribute('href')),
      robots: all('meta[name="robots"]').flatMap(el => el.content.split(/\s*,\s*/)),
      h1: all('h1').map(el => el.textContent.replace(/\s+/g, ' ').trim()),
      h2: all('h2').map(el => el.textContent.replace(/\s+/g, ' ').trim()),
      mainLength: doc.querySelector('main')?.textContent.trim().length || 0,
      nodes: all('script[type="application/ld+json"]').flatMap(el => {
        const data = JSON.parse(el.textContent);
        return data['@graph'] || [data];
      }),
    };
  }, html);

  const sitemap = await request('/sitemap.xml');
  check(sitemap.status === 200, 'sitemap responds 200');
  const urls = [...sitemap.body.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
  const routes = ['/'];
  for (const entry of await fs.readdir('app', { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    try { await fs.access(`app/${entry.name}/page.jsx`); routes.push(`/${entry.name}`); } catch { /* not a page */ }
  }
  check(urls.length === new Set(urls).size, 'sitemap has no duplicate URLs');
  check(routes.length === urls.length && routes.every(path => urls.includes(origin + path)), 'sitemap contains every public page exactly once');
  const documents = [];
  for (const url of urls) {
    const path = new URL(url).pathname;
    const response = await request(path);
    const data = await parse(response.body);
    documents.push({ path, ...data });
    check(response.status === 200, `${path}: HTTP 200`);
    check(!response.headers['x-robots-tag']?.includes('noindex') && !data.robots.includes('noindex'), `${path}: indexable`);
    check(data.title && data.description.length === 1 && data.description[0], `${path}: title and description`);
    check(data.canonical.length === 1 && new URL(data.canonical[0]).href === url, `${path}: self canonical`);
    check(data.h1.length === 1 && !data.h2.includes(data.h1[0]), `${path}: one H1, no duplicate section heading`);
    check(data.mainLength > 200, `${path}: main content in raw HTML`);
    if (data.nodes.length) {
      const physician = data.nodes.find(node => node['@id'] === `${origin}/#physician`);
      const clinic = data.nodes.find(node => node['@id'] === `${origin}/#clinic`);
      check(physician?.['@type'] === 'IndividualPhysician', `${path}: specific physician type`);
      check(physician?.practicesAt?.['@id'] === clinic?.['@id'] && clinic?.['@type'] === 'MedicalOrganization', `${path}: doctor is linked to an existing clinic`);
      check(!physician?.worksFor, `${path}: no Person-only worksFor on a medical organization type`);
      check(physician?.availableService?.every(service => service.name && service.description && ['MedicalTherapy','MedicalProcedure','MedicalTest'].includes(service['@type'])), `${path}: named medical services`);
      check(physician?.availableService?.filter(service => service['@type'] === 'MedicalTherapy').every(service => /^(Лечение|Удаление) /.test(service.name)), `${path}: treatment names rather than diseases as procedures`);
    }
  }
  check(new Set(documents.map(d => d.title)).size === documents.length, 'unique page titles');
  check(new Set(documents.map(d => d.description[0])).size === documents.length, 'unique page descriptions');

  for (const path of ['/seo-missing-20261006', '/diagnostika/seo-missing-20261006']) {
    const response = await request(path);
    const data = await parse(response.body);
    check(response.status === 404, `${path}: real 404`);
    check(data.robots.includes('noindex') && !data.robots.includes('index'), `${path}: unambiguous noindex`);
    check(data.canonical.length === 0, `${path}: no homepage canonical`);
    check(data.title !== documents[0].title && data.title.includes('не найдена'), `${path}: own error title`);
  }
  const redirects = [
    ['/about', '/o-vrache'], ['/services', '/lechenie'], ['/diagnostics', '/diagnostika'],
    ['/how', '/kak-prohodit'], ['/faq', '/voprosy'], ['/contacts', '/kontakty'],
  ];
  for (const [from, to] of redirects) {
    for (const host of [undefined, 'www.dr-markaryan.ru']) {
      const response = await request(`${from}?utm_source=seo&value=a%2Bb`, host);
      const destination = new URL(response.headers.location || '/', base);
      check([301,308].includes(response.status) && destination.pathname === to && destination.searchParams.get('value') === 'a+b', `${host || 'local'}${from}: permanent legacy redirect preserves query`);
      if (host) check(destination.origin === origin, `${from}: www legacy URL reaches primary host in one hop`);
    }
  }
  for (const path of ['/', '/diagnostika', '/gemorroy', '/seo-missing-20261006']) {
    const response = await request(`${path}?utm_source=seo`, 'www.dr-markaryan.ru');
    check([301,308].includes(response.status) && new URL(response.headers.location || '/', base).href === `${origin}${path}?utm_source=seo`, `${path}: www redirect preserves path and query`);
  }
  for (const host of ['dr-markaryan.ru', 'wwwXdr-markaryanYru']) {
    check((await request('/diagnostika', host)).status === 200, `${host}: no redirect loop or wildcard host match`);
  }
  const trailingSlash = await request('/diagnostika/');
  check(trailingSlash.status === 308 && trailingSlash.headers.location === '/diagnostika', 'trailing slash normalized');
  const query = await parse((await request('/diagnostika?utm_source=seo')).body);
  check(query.canonical[0] === `${origin}/diagnostika`, 'query parameters excluded from canonical');
  const robots = await request('/robots.txt');
  check(robots.status === 200 && robots.body.includes(`Sitemap: ${origin}/sitemap.xml`) && !/^Disallow:\s*\/$/m.test(robots.body), 'robots allows crawling and points to sitemap');

  await fs.mkdir(output, { recursive: true });
  const result = { base, checks, failures, documents };
  await fs.writeFile(`${output}/seo-results.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ base, checks, failures, report: `${output}/seo-results.json` }, null, 2));
  assert.equal(failures.length, 0, 'SEO checks failed');
} finally {
  await browser.close();
}
