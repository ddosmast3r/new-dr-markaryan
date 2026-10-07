// Read-only audit of public HTML, links, redirects and metadata.
// Run from the repository root: node seo-audit/check-live-2026-10-06.mjs
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';

const base = 'https://dr-markaryan.ru';
const output = '/private/tmp/edjo-seo-2026-10-06';
await fs.mkdir(output, { recursive: true });
async function request(url, method = 'GET') {
  const start = Date.now();
  try {
    const response = await fetch(url, { method, redirect: 'manual', signal: AbortSignal.timeout(20000) });
    return { url, status: response.status, headers: Object.fromEntries(response.headers), ms: Date.now() - start,
      body: method === 'HEAD' ? '' : await response.text() };
  } catch (error) { return { url, error: error.message }; }
}
const sitemap = await request(`${base}/sitemap.xml`);
const urls = [...sitemap.body.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
const browser = await chromium.launch();
const context = await browser.newContext({ javaScriptEnabled: false });
const page = await context.newPage();
async function parse(html) {
  return page.evaluate(html => {
    const document = new DOMParser().parseFromString(html, 'text/html');
    const all = selector => [...document.querySelectorAll(selector)];
    const normalize = text => text.replace(/\s+/g, ' ').trim();
    const jsonld = all('script[type="application/ld+json"]').map(el => {
      try { return JSON.parse(el.textContent); } catch (error) { return { parseError: error.message }; }
    });
    all('script, style').forEach(el => el.remove());
    return {
      title: document.title,
      description: all('meta[name="description"]').map(el => el.content),
      canonical: all('link[rel="canonical"]').map(el => el.getAttribute('href')),
      robots: all('meta[name="robots"]').map(el => el.content),
      h: all('h1,h2,h3,h4,h5,h6').map(el => ({ level: Number(el.tagName[1]), text: normalize(el.textContent) })),
      links: all('a[href]').map(el => ({ href: el.getAttribute('href'), text: normalize(el.textContent), inMain: !!el.closest('main') })),
      ids: all('[id]').map(el => el.id),
      images: all('img').map(el => ({ src: el.getAttribute('src'), alt: el.getAttribute('alt'), loading: el.loading })),
      assets: all('link[rel="stylesheet"],link[as="font"],video source').map(el => el.getAttribute('href') || el.getAttribute('src')),
      jsonld, main: normalize(document.querySelector('main')?.textContent || ''),
      lang: document.documentElement.lang,
    };
  }, html);
}
const pages = [];
for (const url of urls) {
  const { body, ...http } = await request(url);
  if (!body) { pages.push(http); continue; }
  const data = await parse(body);
  data.mainHash = createHash('sha256').update(data.main).digest('hex');
  data.mainLength = data.main.length;
  await fs.writeFile(`${output}/${new URL(url).pathname.replaceAll('/', '_') || 'home'}.html`, body);
  pages.push({ ...http, ...data });
  console.log(JSON.stringify({ url, status: http.status, title: data.title, descriptionLength: data.description[0]?.length,
    h1: data.h.filter(h => h.level === 1).map(h => h.text), canonical: data.canonical, mainLength: data.mainLength }));
}
const special = [];
for (const url of [
  'http://dr-markaryan.ru/', 'http://www.dr-markaryan.ru/', 'https://www.dr-markaryan.ru/',
  'https://www.dr-markaryan.ru/diagnostika',
  ...['/about','/services','/diagnostics','/how','/faq','/contacts','/diagnostika/',
    '/seo-audit-missing-20261006','/diagnostika/seo-audit-missing-20261006','/Diagnostika','/index.html',
    '/?utm_source=seo-audit','/diagnostika?utm_source=seo-audit','/yandex_63534fc45c02693e.html'].map(p => base + p),
]) {
  const { body, ...http } = await request(url);
  special.push({ ...http, ...(body && http.headers['content-type']?.includes('text/html') ? await parse(body) : {}) });
  console.log(JSON.stringify({ special: url, status: http.status, location: http.headers?.location }));
}

const pageMap = new Map(pages.map(p => [p.url, p]));
const internal = new Set();
const external = new Set();
const assets = new Set();
const anchors = [];
const incoming = Object.fromEntries(urls.map(url => [url, []]));
for (const p of pages) {
  for (const link of p.links || []) {
    let url;
    try { url = new URL(link.href, p.url); } catch { continue; }
    if (!['http:', 'https:'].includes(url.protocol)) continue;
    if (url.origin !== base) { external.add(url.href); continue; }
    const hash = decodeURIComponent(url.hash.slice(1));
    url.hash = '';
    internal.add(url.href);
    if (incoming[url.href] && url.href !== p.url) incoming[url.href].push({ from: p.url, text: link.text, inMain: link.inMain });
    if (hash) anchors.push({ from: p.url, to: url.href, hash, exists: pageMap.get(url.href)?.ids?.includes(hash) ?? null });
  }
  for (const value of [...(p.images || []).map(i => i.src), ...(p.assets || [])]) {
    if (value) assets.add(new URL(value, p.url).href);
  }
}
const linkResponses = [];
for (const url of [...internal].filter(url => !pageMap.has(url))) {
  const { body, ...response } = await request(url);
  linkResponses.push(response);
}
const assetResponses = [];
const assetUrls = [...assets];
for (let index = 0; index < assetUrls.length; index += 3) {
  assetResponses.push(...await Promise.all(assetUrls.slice(index, index + 3).map(url => request(url, 'HEAD'))));
}
const externalResponses = [];
for (const url of external) {
  // Follow only the public redirect chain; no forms or third-party messages.
  const chain = [];
  let next = url;
  for (let step = 0; step < 5; step++) {
    const { body, ...response } = await request(next);
    chain.push(response);
    if (![301,302,303,307,308].includes(response.status) || !response.headers.location) break;
    next = new URL(response.headers.location, next).href;
  }
  externalResponses.push({ url, chain });
}
const duplicates = field => pages.filter(p => p[field]).flatMap((p, i) => pages.slice(i + 1)
  .filter(q => JSON.stringify(p[field]) === JSON.stringify(q[field])).map(q => [p.url, q.url]));
const summary = {
  pages: pages.length,
  non200: pages.filter(p => p.status !== 200).map(p => p.url),
  wrongCanonical: pages.filter(p => p.canonical?.length !== 1 || new URL(p.canonical[0]).href !== new URL(p.url).href).map(p => p.url),
  duplicateTitles: duplicates('title'), duplicateDescriptions: duplicates('description'), duplicateMain: duplicates('mainHash'),
  h1Issues: pages.filter(p => p.h?.filter(h => h.level === 1).length !== 1).map(p => p.url),
  headingRepeats: pages.flatMap(p => p.h.filter((h, i) => p.h.slice(0, i).some(q => q.text === h.text)).map(h => ({ url: p.url, ...h }))),
  headingSkips: pages.flatMap(p => p.h.filter((h, i) => i && h.level > p.h[i-1].level + 1).map(h => ({ url: p.url, ...h }))),
  missingAlt: pages.flatMap(p => p.images.filter(i => i.alt === null).map(i => ({ url: p.url, ...i }))),
  emptyAlt: pages.flatMap(p => p.images.filter(i => i.alt === '').map(i => ({ url: p.url, ...i }))),
  images: pages.reduce((n, p) => n + p.images.length, 0),
  orphanPages: Object.entries(incoming).filter(([, links]) => links.length === 0).map(([url]) => url),
  brokenAnchors: anchors.filter(a => a.exists === false),
  brokenInternal: linkResponses.filter(p => p.status >= 400 || p.error),
  brokenAssets: assetResponses.filter(p => p.status >= 400 || p.error),
  externalFailures: externalResponses.filter(r => r.chain.at(-1).status >= 400 || r.chain.at(-1).error),
};
const results = { date: new Date().toISOString(), base, sitemap, robots: await request(`${base}/robots.txt`),
  summary, pages, special, incoming, anchors, internal: [...internal], linkResponses, assetResponses, externalResponses };
await fs.writeFile(`${output}/crawl.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(summary, null, 2));
await browser.close();
