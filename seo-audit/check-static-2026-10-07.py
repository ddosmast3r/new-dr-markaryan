"""Inspect production HTML and local references without HTTP or a browser.

Usage: python3 seo-audit/check-static-2026-10-07.py <Next build directory>
This does not verify runtime behavior, HTTP responses or visual layout.
"""
import json
import re
import sys
import xml.etree.ElementTree as ET
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, unquote, urljoin, urlsplit

ROOT = Path(__file__).resolve().parents[1]
DIST = (ROOT / sys.argv[1]).resolve()
ORIGIN = 'https://dr-markaryan.ru'
VOID = set('area base br col embed hr img input link meta param source track wbr'.split())


class Node:
    def __init__(self, tag, attrs=()):
        self.tag, self.attrs, self.children = tag, dict(attrs), []

    def text(self, scripts=False):
        if not scripts and self.tag in ('script', 'style'):
            return ''
        return ''.join(c if isinstance(c, str) else c.text(scripts) for c in self.children)

    def nodes(self):
        yield self
        for child in self.children:
            if isinstance(child, Node):
                yield from child.nodes()


class Parser(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.root = Node('document')
        self.stack = [self.root]
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                self.stack = self.stack[:i]
                break

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def clean(value):
    return re.sub(r'\s+', ' ', value).strip()


def query(doc, tag=None, **attrs):
    return [n for n in doc.nodes() if (tag is None or n.tag == tag)
            and all(n.attrs.get(k) == v for k, v in attrs.items())]


def normalized_url(url):
    parsed = urlsplit(url)
    return parsed.scheme, parsed.netloc, parsed.path or '/', parsed.query, parsed.fragment


def asset_file(url):
    parsed = urlsplit(urljoin(ORIGIN + '/', url))
    if parsed.netloc != 'dr-markaryan.ru':
        return None
    path = unquote(parsed.path)
    if path == '/_next/image':
        return asset_file(parse_qs(parsed.query).get('url', [''])[0])
    if path.startswith('/_next/'):
        return DIST / path.removeprefix('/_next/')
    public = ROOT / 'public' / path.lstrip('/')
    return public if public.exists() else DIST / 'server/app' / (path.lstrip('/') + '.body')


checks, summaries, links, assets, anchors = [], [], set(), set(), set()


def check(ok, name, details=None):
    entry = {'ok': bool(ok), 'name': name}
    if not ok and details is not None:
        entry['details'] = details
    checks.append(entry)


files = {'/': DIST / 'server/app/index.html'}
files.update({f'/{p.parent.name}': DIST / f'server/app/{p.parent.name}.html'
              for p in (ROOT / 'app').glob('*/page.jsx')})
docs = {route: Parser(path.read_text()).root for route, path in files.items()}
for route, doc in docs.items():
    titles = query(doc, 'title')
    descriptions = query(doc, 'meta', name='description')
    canonicals = query(doc, 'link', rel='canonical')
    title = clean(titles[0].text()) if titles else ''
    description = descriptions[0].attrs.get('content', '') if descriptions else ''
    check(len(titles) == 1 and title, f'{route}: one nonempty Title')
    check(len(descriptions) == 1 and description, f'{route}: one nonempty Description')
    check(len(canonicals) == 1 and normalized_url(canonicals[0].attrs.get('href', ''))
          == normalized_url(ORIGIN + route), f'{route}: canonical')
    check(not any('noindex' in n.attrs.get('content', '').lower()
                  for n in query(doc, 'meta', name='robots')), f'{route}: no noindex in page HTML')
    h1, h2, main = query(doc, 'h1'), query(doc, 'h2'), query(doc, 'main')
    check(len(h1) == 1, f'{route}: one H1')
    check(bool(h1) and clean(h1[0].text()) not in [clean(n.text()) for n in h2],
          f'{route}: H1 not repeated in H2')
    check(len(main) == 1 and len(clean(main[0].text())) > 200, f'{route}: server-rendered main content')
    levels = [int(n.tag[1]) for n in (main[0].nodes() if main else []) if re.fullmatch('h[1-6]', n.tag)]
    check(all(b <= a + 1 for a, b in zip(levels, levels[1:])), f'{route}: heading levels do not skip', levels)
    ids = [n.attrs['id'] for n in doc.nodes() if n.attrs.get('id')]
    check(len(ids) == len(set(ids)), f'{route}: unique element IDs',
          [key for key, count in Counter(ids).items() if count > 1])
    check(all('alt' in n.attrs for n in query(doc, 'img')), f'{route}: every image has alt')
    attributes = ' '.join(n.attrs.get(key, '') for n in doc.nodes()
                          for key in ('alt', 'title', 'aria-label', 'content'))
    check(not re.search('[—–]', doc.text() + attributes), f'{route}: no long dashes in text or metadata')
    check('хирург-колопроктолог' not in (doc.text() + attributes).lower(), f'{route}: previous role removed')
    for script in query(doc, 'script', type='application/ld+json'):
        try:
            data = json.loads(script.text(True))
            nodes = data.get('@graph', [data])
            check(True, f'{route}: JSON-LD parses')
            physician = next((n for n in nodes if n.get('@id') == ORIGIN + '/#physician'), None)
            if physician:
                check(physician.get('@type') == 'IndividualPhysician' and 'worksFor' not in physician,
                      f'{route}: physician schema type')
                check(any(n.get('@id') == physician.get('practicesAt', {}).get('@id')
                          and n.get('@type') == 'MedicalOrganization' for n in nodes),
                      f'{route}: linked clinic exists')
            check(not re.search('[—–]', json.dumps(data, ensure_ascii=False)), f'{route}: no long dashes in JSON-LD')
        except (ValueError, TypeError) as error:
            check(False, f'{route}: JSON-LD parses', str(error))
    for node in doc.nodes():
        href = node.attrs.get('href') if node.tag == 'a' else None
        if href and urlsplit(urljoin(ORIGIN + route, href)).netloc == 'dr-markaryan.ru':
            links.add((route, href))
        for attribute in ('src', 'poster'):
            if node.attrs.get(attribute):
                assets.add(node.attrs[attribute])
        if node.tag == 'link' and node.attrs.get('rel') in ('stylesheet', 'preload', 'icon', 'modulepreload'):
            if node.attrs.get('href'):
                assets.add(node.attrs['href'])
    summaries.append({'route': route, 'title': title, 'description': description,
                      'h1': clean(h1[0].text()) if h1 else None, 'images': len(query(doc, 'img'))})

for key in ('title', 'description'):
    check(len({page[key] for page in summaries}) == len(summaries), f'unique {key} across pages')
for url in sorted(assets):
    path = asset_file(url)
    if path is not None:
        check(path.is_file(), 'local asset exists: ' + url)
for css in (DIST / 'static/css').glob('*.css'):
    for raw in re.findall(r'url\(([^)]+)\)', css.read_text()):
        url = raw.strip(' "\'')
        if url.startswith('/') and asset_file(url) is not None:
            check(asset_file(url).is_file(), 'CSS resource exists: ' + url)
for source, href in sorted(links):
    url = urlsplit(urljoin(ORIGIN + source, href))
    route = url.path.rstrip('/') or '/'
    if route in docs:
        check(True, f'{source}: internal route exists: {href}')
        if url.fragment:
            anchors.add((route, unquote(url.fragment)))
            check(any(n.attrs.get('id') == unquote(url.fragment) for n in docs[route].nodes()),
                  f'{source}: anchor exists: {href}')
    else:
        path = asset_file(href)
        check(path is not None and path.is_file(), f'{source}: linked local resource exists: {href}')
sitemap = (DIST / 'server/app/sitemap.xml.body').read_text()
urls = [n.text for n in ET.fromstring(sitemap).iter() if n.tag.endswith('}loc')]
check(set(urls) == {ORIGIN + route for route in docs} and len(urls) == len(docs), 'sitemap matches all pages exactly once')
check('<lastmod>' not in sitemap, 'no synthetic lastmod')
robots = (DIST / 'server/app/robots.txt.body').read_text()
check('Sitemap: ' + ORIGIN + '/sitemap.xml' in robots and not re.search(r'^Disallow:\s*/$', robots, re.M),
      'robots allows crawling and references sitemap')
not_found = Parser((DIST / 'server/app/_not-found.html').read_text()).root
check(not query(not_found, 'link', rel='canonical'), '404 does not inherit homepage canonical')
robot_values = ','.join(n.attrs.get('content', '') for n in query(not_found, 'meta', name='robots')).split(',')
robot_values = [value.strip() for value in robot_values]
check('noindex' in robot_values and 'index' not in robot_values, '404 has unambiguous noindex')
check('не найдена' in clean(query(not_found, 'title')[0].text()), '404 has its own title')
check(not re.search('[—–]', not_found.text()), '404 text has no long dashes')
quotes = [n for n in docs['/'].nodes() if 'quote' in n.attrs.get('class', '').split()]
check(len(quotes) == 3, 'home has exactly three review slots')
check(sum(n.tag == 'figure' for n in quotes) == 1
      and sum('quote--placeholder' in n.attrs.get('class', '') for n in quotes) == 2,
      'one actual review and two explicit placeholders')
check(any('Одиссей П.' in n.text() and 'Отзыв для сайта' in n.text() for n in quotes), 'review author and source are present')
check(not any('quote' in n.attrs.get('class', '').split() for n in docs['/kontakty'].nodes()), 'contacts has no extra testimonial slots')
for route in ('/', '/kontakty'):
    groups = [n for n in docs[route].nodes() if 'reviews-award-years' in n.attrs.get('class', '').split()]
    check(len(groups) == 1 and [clean(n.text()) for n in query(groups[0], 'li')] == ['2022', '2023', '2024', '2025'],
          f'{route}: all four award years retained')
result = {'date': '2026-10-07', 'scope': __doc__.strip(), 'build': str(DIST.relative_to(ROOT)),
          'pages': summaries, 'checks': len(checks), 'failures': [c for c in checks if not c['ok']],
          'internal_link_instances': len(links), 'unique_anchors': len(anchors), 'asset_urls': len(assets),
          'assertions': checks}
report = ROOT / 'seo-audit/13-static-check-2026-10-07.json'
report.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({key: value for key, value in result.items() if key not in ('pages', 'assertions')}, ensure_ascii=False, indent=2))
print('Report:', report)
raise SystemExit(bool(result['failures']))
