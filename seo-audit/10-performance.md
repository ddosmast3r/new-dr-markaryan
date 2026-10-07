# Производительность dr-markaryan.ru (ветка new-design) — 2 октября 2026

Файлы проекта не менялись. Сборка — `npm run check:build` (в `.next-check`), затем `next start -p 3471`. Сервер остановлен.

**Не повторяю** то, что уже есть в отчётах:
- `SITE_REVIEW_RU.md`: вес фоновых роликов, PNG-исходники, сырьё в `public/inst`;
- `01-tech-seo.md`: HTTP/1.1, нет HSTS, `minimumCacheTTL` 60 с, нет AVIF, preload моноширинного шрифта, `sizes="100vw"` у размытого фона в `PageHero`.

Ниже эти пункты либо уточнены замерами, либо не упоминаются.

## Как мерил

- **PageSpeed API** вернул 429 (дневная квота исчерпана), повторять не стал. Полевых данных CrUX нет.
- **Lighthouse 13.5** локально (`npx lighthouse`, Chrome 149, headless): mobile — Slow 4G (150 мс RTT, 1,6 Мбит/с), CPU ×4; desktop — пресет `desktop`. Сервер локальный, TTFB около 10 мс. На проде TTFB около 220 мс (из них TLS около 110 мс), и всё идёт по HTTP/1.1, поэтому реальные цифры будут хуже лабораторных.
- **Эксперименты:**
  - Lighthouse с `--blocked-url-patterns`;
  - прокси, переписывающий HTML (`fetchpriority`, маленький фон, без preload mono);
  - Playwright: трафик видео, сторонние скрипты с согласием (их «маяки» блокировались, в счётчики ничего не ушло).
- **Прод:** `curl` (GET и HEAD, разные `Accept`/`Accept-Encoding`).
- Сырые результаты: `scratchpad/perf/*.json`, `scratchpad/lh/prod-home-m.json` (прогон старого прода из предыдущего аудита).

## Замеры

### Lighthouse, ветка new-design (локальная прод-сборка)

| Страница | Score | FCP | LCP | TBT | CLS | Байт | LCP-элемент |
|---|---|---|---|---|---|---|---|
| `/` mobile | 0,90–0,91 | 1,06 с | **3,5–3,6 с** | 10 мс | 0 | 450 KB | портрет `div.hero-portrait > img` (doctor.png 640–1080w) |
| `/gemorroy` mobile | 0,93 | 1,06 с | **3,2–3,3 с** | 0 | 0 | 394 KB | **размытый фон** `.hero-bg > img` (doctor.png 750w) |
| `/kolonoskopiya` mobile | 0,93 | 1,06 с | **3,3 с** | 0 | 0 | 423 KB | размытый фон (diagnoses.png 750w, 57 KB) |
| `/` desktop | 0,98 | 0,29 с | 1,06 с | 60 мс | 0 | **6 497 KB** | размытый кадр `reel5.jpg` |
| старый прод `/` mobile (master) | 0,87 | 1,9 с | 3,3 с | 20 мс | 0,012 | 344 KB | текст `p.lead`, задержка отрисовки 2,3 с |

**Выводы:**
- На телефоне LCP **в зоне «требует улучшения»** (2,5–4 с) на всех типах страниц. CLS и TBT в норме.
- На десктопе 6,2 MB из 6,5 MB — фоновые ролики.

### Эксперименты по LCP (mobile, симуляция Lighthouse)

| Вариант | `/` LCP | `/gemorroy` LCP |
|---|---|---|
| Как есть | 3 450–3 630 | 3 220–3 300 |
| + `fetchpriority="high"` на LCP-картинке | 3 595 | 3 302 |
| + фон 256w q50 (6 KB вместо 29 KB) + без preload mono | 3 451 | 3 229 |
| Без preload JetBrains Mono (2 файла, 40 KB) | 3 385 | 3 071 |
| Без mono + без кадра `reel5.jpg` | 3 296 | — |
| **Без JS вообще (блок `/_next/static/chunks/*`)** | — | **2 487** |

**Вывод:**
- `fetchpriority` и уменьшение самой картинки в симуляции почти ничего не дают.
- LCP упирается в **общий объём байт, запрошенных до отрисовки**: около 150 KB шрифтов (6 preload, High), около 135 KB JS, 2 CSS (19 KB gz) и картинки на канале 1,6 Мбит/с.
- Нижняя граница без JS — 2,5 с. Значит, рычаги такие: меньше шрифтов в preload и меньше JS в первой загрузке. На реальном канале `fetchpriority` всё равно полезен (см. п. 5): Lighthouse зафиксировал, что LCP-картинка `/gemorroy` шла с приоритетом **Low**.

### JS по страницам (gzip, из `app-build-manifest.json`)

| Чанк | gzip | Что внутри |
|---|---|---|
| `4bd1b696…` + `255…` + webpack/main | 102,7 KB | React 19 + рантайм Next (общий, не трогаем) |
| `850…` | 8,0 KB | `next/image`, `next/link` |
| `355…` | 7,2 KB | layout: BookingProvider/BookingModal, CookieConsent, Метрика/VK-лоадеры, контакты |
| **`387…`** | **14,2 KB** (49,5 KB raw) | Header, HeroMedia, Reveal, Reels… **и 30 KB кириллического текста** |
| page-чанк | 0,2–1,7 KB | — |
| **Итого First Load** | **132–133 KB** (`/license`, `/privacy` — 111 KB) | |

**Находка:** `components/Header.jsx:8` импортирует `nav` из `lib/nav.js`, а тот тянет `servicePages` из `lib/pages.js` (35 KB) и `patient-guides`. В итоге **тексты всех страниц услуг** (FAQ, источники, todo/pending, подписи медиа) уходят в клиентский бандл каждой страницы.
- Если вырезать кириллические строки, чанк `387` уменьшается с 14,1 до **4,6 KB gz** (−9,5 KB gz, −67% этого чанка).
- Для сравнения: весь собственный JS страниц сверх React — около 30 KB gz.

### Шрифты

`next/font/google`, `display: swap`, subsets `latin`+`cyrillic`. Все три гарнитуры вариативные, поэтому массив `weight` размер не уменьшает (один файл на сабсет). Preload — **6 файлов, 150 KB, приоритет High** на каждой странице:

| Гарнитура | latin | cyrillic | Итого | Где используется |
|---|---|---|---|---|
| Golos Text | 22 KB | 38 KB | 60 KB | весь текст |
| Rubik | 15 KB | 35 KB | 50 KB | h1–h3 |
| JetBrains Mono | 31 KB | 9 KB | 40 KB | надзаголовки, микро-подписи |

Latin-сабсет нужен и для русского текста: пробелы, цифры и пунктуация лежат в U+0000–00FF. Поэтому latin убирать нельзя, можно только не делать ему preload.

### Изображения (замер ответов `/_next/image`, webp)

| Запрос | Байт |
|---|---|
| `doctor.png` 750w q75 (фон `/gemorroy`, LCP) | 29 304 |
| `doctor.png` 1920w q75 (тот же фон на десктопе; исходник 1024 px, апскейла нет) | 41 742 |
| `doctor.png` **256w q50** — визуально неотличим под `blur(17px)` | **5 996** |
| `diagnoses.png` 750w (фон `/kolonoskopiya`) / 256w q50 | 57 314 / 7 754 |
| `reel5.jpg` 750w (кадр главной) / 256w q50 | 20 184 / 5 298 |

- **AVIF не отдаётся:** при `Accept: image/avif` приходит webp, `formats` не задан.
- **Прод, холодный кеш оптимизатора:** `X-Nextjs-Cache: MISS` — TTFB **844 мс** против 215 мс при STALE. 630 мс уходят на sharp на сервере с 1 GB RAM, и это прямо на пути LCP первого посетителя после деплоя или вытеснения кеша.
- **Параметр `q` на проде не ограничен** (`q=74` создал новую запись кеша). `images.qualities` не задан, любой может заставить сервер пережимать картинки с произвольным качеством. Это нагрузка на CPU и рост `.next/cache/images`.
- **`<video poster>`** в `HeroMedia.jsx:146` дублирует уже загруженный через `next/image` кадр. На десктопе дополнительно грузятся сырые `/inst/reel5.jpg` (31 KB) и `/video/posters/endoscope-wash-2.webp` (33 KB), оба с приоритетом High, хотя ролики невидимы (`opacity:0`) до начала воспроизведения.

### Видео (Playwright, главная)

| Viewport | Медиа за первые 12 с | Ролики |
|---|---|---|
| 1440×900 (десктоп) | **6,18 MB** | reel5 + endoscope-wash-2, затем пошёл reel2 (3,8 MB) |
| 820×1180 (iPad портрет) | **6,18 MB** | то же |
| 844×390 (телефон горизонтально) | **6,18 MB** | то же |
| 390×844 (телефон) | 0 | видео выключено (`max-width:560px`) |

- Пауза вне экрана и при скрытой вкладке **уже работает** (после прокрутки оба `paused: true`). Замечание из `SITE_REVIEW_RU.md` в этой части закрыто.
- Ролики **вертикальные 720×1280 с AAC-дорожкой** (55–97 кбит/с звука, который никогда не играет), 0,75–2,0 Мбит/с. Показываются под `blur(17px) brightness(.46)` в горизонтальном кадре, то есть видна только центральная полоса.
- **Пробное перекодирование** (в scratchpad): 10 с, кроп 16:9, 480×270, 24 fps, без звука, H.264 CRF 30:
  - `reel5.mp4`: 3 479 KB → **169 KB** (−95%);
  - `endoscope-wash-2.mp4`: 2 700 KB → **232 KB**.
  - VP9-webm на 3–5% меньше, второй формат не нужен.
- `faststart` (moov в начале) у исходников уже есть.
- Второй слот грузится с `preload="auto"` сразу, хотя показан будет только через 9 с.

### Сторонние скрипты (после согласия)

Подключаются только после «Принять» (opt-in), это правильно. Замер (DoH, т. к. локальный DNS их режет):

| Скрипт | br / gzip / raw | Подгружает дальше |
|---|---|---|
| `mc.yandex.ru/metrika/tag.js` | **96 / 112 / 293 KB** | `watch`, `advert.gif`, с `webvisor:true` — запись DOM |
| `top-fwz1.mail.ru/js/code.js` (VK) | 20 / 20 / 49 KB | `privacy-cs.mail.ru/static/sync-loader.js`, `dyn-goal-config.js`, 2 пикселя |

- **Метрика одна весит почти столько же, сколько весь JS сайта** (133 KB gz).
- У вернувшегося посетителя с согласием `initMetrika()` вызывается в `useEffect` сразу после гидратации (`CookieConsent.jsx:38`), то есть в окне LCP/TBT. VK-пиксель — в `VkAdsPixel` на маунте.
- Playwright (390×844, CPU ×4) показал +1–2 long task по 57–71 мс. Сервер Метрики был заблокирован, поэтому вебвизор фактически не включался и реальная нагрузка выше.

### Прод: заголовки и сжатие (дополнение к `01-tech-seo.md`)

| Ресурс | Cache-Control | Сжатие |
|---|---|---|
| HTML `/` | `s-maxage=31536000` (`max-age` нет) | gzip, 28,5 KB; **brotli нет** |
| `/_next/static/*` js/css | `public, max-age=31536000, immutable` | gzip (46 335 B на 173 KB) |
| RSC `?_rsc=` | `s-maxage=31536000` | gzip, 16 KB |
| **`/inst/*.mp4`, `/inst/*.jpg`, `/video/*`, `/img/*`** | **`public, max-age=0`** | — (Range есть) |
| `/_next/image` | `max-age=60, must-revalidate`, STALE/MISS | — |
| `/sitemap.xml` | — | **не сжат** (`gzip_types` без xml) |

- `public/` отдаётся Next с `max-age=0`. Каждый повторный визит перепроверяет постеры Reels/Procedures (загружаются как `<img src="/inst/reel*.jpg">` мимо оптимизатора) и ролики.
- `x-powered-by: Next.js` — мелочь, `poweredByHeader: false`.

### Прочее

- **Render-blocking CSS:** 2 файла, 41 + 58 KB raw (7,7 + 11 KB gz), все 6 таблиц стилей на каждой странице, включая `service.css`/`patient.css` на главной и `/privacy`. Lighthouse оценивает экономию в 150–260 мс на mobile.
- **Prefetch:** на десктопе главная после загрузки делает **12 RSC-prefetch (122 KB)** и подтягивает JS этих маршрутов: 20 скриптов против 9 на mobile. При HTTP/1.1 это конкурирует с роликами.
- **Бесконечные анимации, которые не идут на композиторе** (Lighthouse `non-composited-animations`, 4–5 элементов):
  - `logo-glow` — `filter` на двух логотипах, `layout.css:54`;
  - `hero-treatment-glow` — `text-shadow`, `layout.css:249`;
  - `pulse` — `box-shadow` у FAB, `layout.css:621`;
  - `bounce-bg` — `background-color` на `body`, привязан к `scroll()`, `base.css:131`. Перерисовка корневого фона на каждом кадре прокрутки.
  - Плюс `cta-glow`: `opacity` поверх `filter:blur(18px)`, `base.css:198`.
  - Всё это — постоянная работа отрисовки на главном потоке у телефона.
- **Header:** `getBoundingClientRect()` двух элементов + `setState` на каждом событии `scroll` (`Header.jsx:39–47`).
- **Legacy JS:** 12 KB полифиллов (`Array.prototype.at/flat`, `Object.fromEntries`) в чанке `255` — это рантайм Next. Влиять можно только через `browserslist`, выигрыш мал.
- **bfcache:** проходит. **CLS:** 0. Блокирующих сторонних скриптов нет.

---

## Рекомендации

Трудозатраты: S — до 2 ч, M — полдня–день, L — больше дня.

### P1

**1. Перекодировать фоновые ролики и грузить следующий только перед сменой** — M
- **Где:** `public/inst/*.mp4`, `public/video/endoscope-wash-2.mp4` → новые файлы вида `public/video/bg/*.mp4`; `lib/content.js:337` (`heroClips`); `components/HeroMedia.jsx:145`.
- **Что:**
  - Отдельные фоновые версии: `ffmpeg -t 10 -an -vf "crop=iw:iw*9/16,scale=480:-2,fps=24" -c:v libx264 -crf 30 -preset slow -movflags +faststart`. Замер: 3,5 MB → 0,17 MB на ролик. Под `blur(17px)` разница в разрешении не видна.
  - Оригиналы оставить для Reels.
  - Второму слоту поставить `preload="none"` и переключать на `auto` за 2–3 с до смены. Или вообще не монтировать следующий `<video>` до `SLIDE_MS - 3000`.
- **Эффект:** главная и 7 разделов на десктопе — с 6,2 MB за 12 с до примерно 0,4 MB; за минуту — с 12 MB до 0,8 MB.

**2. Видео выключать не только по `max-width:560px`** — S
- **Где:** `components/HeroMedia.jsx:36`.
- **Почему:** планшеты и телефоны в горизонтальной ориентации (820, 844 px) сейчас качают 6 MB по мобильной сети.
- **Что:** условие `(max-width: 1024px), (pointer: coarse)` плюс `navigator.connection?.effectiveType` не `4g` → только кадр. Старт роликов отложить до `load` + `requestIdleCallback`, чтобы не конкурировать с LCP на десктопе.

**3. Убрать тексты страниц услуг из клиентского бандла** — S/M
- **Где:** `components/Header.jsx:8`, `lib/nav.js:5-6`.
- **Что:** вычислять `nav` на сервере и передавать в Header пропом (`<Header nav={nav} />` из серверного `PageShell`/`page.jsx`). Или разделить: серверная разметка навигации + маленький клиентский `HeaderControls` (бургер, состояние прокрутки). Минимальный вариант: в `lib/nav.js` держать статический массив `{href,label}` без импорта `pages.js`.
- **Эффект:** −9,5 KB gzip JS (−67% чанка `387`) на каждой странице, меньше парсинга на слабых телефонах.

**4. Сократить preload шрифтов** — S
- **Где:** `app/layout.jsx:22-40`.
- **Что:**
  - `JetBrains_Mono({ …, preload: false })` (−40 KB High-приоритета). В эксперименте LCP `/gemorroy` 3,22 → 3,07 с, главная 3,45 → 3,39 с.
  - Рассмотреть то же для Rubik (−50 KB): заголовки на 100–300 мс покажутся системным шрифтом, `adjustFontFallback` (по умолчанию включён) держит CLS около 0. Это дизайнерское решение, показать в dev на Slow 4G.
  - Массив `weight` у вариативных гарнитур можно убрать: файл тот же, CSS короче.
- **Эффект:** −40…90 KB на критическом пути каждой страницы.

**5. LCP-картинка: явный `fetchPriority="high"` и одна приоритетная картинка на экран** — S
- **Где:** `components/Hero.jsx:73-79`, `components/PageHero.jsx:24-32`, `components/HeroMedia.jsx:118-126`.
- **Почему:**
  - В Next 15.5 `priority` даёт preload и `loading=eager`, но без `fetchpriority`. Lighthouse: `priorityHinted: false`, на `/gemorroy` LCP-картинка шла с приоритетом **Low**.
  - На главной две `priority`-картинки (кадр `reel5.jpg` на 100vw и портрет) делят полосу. На mobile LCP — портрет, на desktop — кадр.
- **Что:**
  - Портрету добавить `fetchPriority="high"`.
  - Кадру фона на главной оставить `priority` без high, сделать его маленьким (п. 6).
  - В `PageHero` добавить `fetchPriority="high"` к фону: на страницах услуг он и есть LCP.

### P2

**6. Размытый фон — микро-картинка** — S
- **Где:** `components/PageHero.jsx:24-32`, `components/HeroMedia.jsx:118-126`, `next.config.mjs`.
- **Что:** `sizes="256px"` (или `quality={40}`) — 6 KB вместо 29–57 KB (до 42 KB на десктопе). Для страниц услуг это LCP-ресурс. Для `/kolonoskopiya` экономия 57 → 8 KB.
- **Дополнительно:** заранее сгенерировать маленькие webp/jpg (например, `public/img/bg/*.webp`, 320 px) и отдавать с `unoptimized`. Тогда LCP не зависит от холодного кеша оптимизатора (844 мс на MISS).
- Уточняет п. 18 из `01-tech-seo.md`: там предложено `sizes="640px"`, замер показывает, что 256w достаточно.

**7. `images` в `next.config.mjs`: ограничить качества и размеры** — S
- **Что:**
  - `qualities: [50, 75]` закрывает произвольное `q`.
  - `deviceSizes: [640, 828, 1080, 1280, 1920]` убирает 2048/3840 из srcset: исходники не шире 1672 px, такие запросы только плодят записи кеша.
  - Про `minimumCacheTTL` и формат см. `01-tech-seo.md`. Уточнение по AVIF: кодирование AVIF в 3–5 раз дороже webp по CPU. На 1 GB RAM включать **только вместе** с длинным `minimumCacheTTL` и прогревом кеша после деплоя (curl по srcset ключевых картинок в шаге GH Actions).

**8. Отложить Метрику и VK-пиксель у вернувшихся посетителей; пересмотреть вебвизор** — S
- **Где:** `components/CookieConsent.jsx:38`, `components/VkAdsPixel.jsx`, `lib/metrika.js:98`.
- **Что:**
  - Инициализацию по сохранённому согласию запускать после `load` через `requestIdleCallback` (с fallback `setTimeout(…, 2000)`). Цели и так ставятся в очередь (`queuedGoals`).
  - `webvisor: true` — самая тяжёлая часть: сериализация DOM и запись взаимодействий, влияет на INP на телефонах. Если записи сессий никто не смотрит, выключить. Если смотрят — оставить, но с учётом цены.
  - Учесть баг двойного `init` из `SITE_REVIEW_RU.md`.
- **Эффект:** −110 KB gz стороннего JS и 1–2 long task из окна загрузки.

**9. Кеш для `public/` (видео, постеры, фото)** — S
- **Где:** `next.config.mjs` → `headers()` для `/inst/:path*`, `/video/:path*`, `/img/:path*`, либо `location` в nginx.
- **Что:** `Cache-Control: public, max-age=2592000` (30 дней). При замене файла — новое имя. Сейчас `max-age=0`: постеры Reels/Procedures и ролики перепроверяются на каждом визите.

**10. Убрать атрибут `poster` у фоновых `<video>`** — S
- **Где:** `components/HeroMedia.jsx:146`.
- **Почему:** кадр уже лежит слоем ниже через `next/image`, а ролик невидим до `onPlaying`. Сейчас на десктопе это +64 KB сырых jpg/webp с приоритетом High.

**11. Render-blocking CSS** — M
- **Где:** `app/layout.jsx:7-12`, `next.config.mjs`.
- **Что, на выбор:**
  - (а) перенести `service.css` и `patient.css` в импорты соответствующих страниц/компонентов (`ServicePage`, `ColonoscopyPage`, `FirstVisit`…). Next разобьёт CSS по маршрутам, главная и `/privacy` перестанут грузить чужие стили;
  - (б) `experimental: { inlineCss: true }` (Next ≥ 15.2) — CSS встраивается в HTML (+19 KB gz к каждому документу, зато ноль блокирующих запросов). При HTTP/1.1 на проде это особенно заметно. Проверить в dev и на Slow 4G; кеширование CSS между страницами теряется.
- **Эффект по Lighthouse:** 150–260 мс FCP/LCP на mobile.

**12. Brotli и `gzip_types` в nginx** — S (сервер)
- **Что:** `apt install libnginx-mod-http-brotli-filter libnginx-mod-http-brotli-static`; `brotli on; brotli_types text/css application/javascript text/x-component application/xml image/svg+xml application/json;`. Минимум — добавить `application/xml`/`text/xml` в `gzip_types` (sitemap).
- **Эффект:** brotli на JS/CSS/HTML примерно на 15–20% меньше gzip: Метрика 96 против 112 KB, свой JS около −20 KB. Делать вместе с HTTP/2 из `01-tech-seo.md`.

### P3

**13. Бесконечные анимации, которые не идут на композиторе** — S
- **Где:** `styles/layout.css:54` (logo-glow), `:249` (hero-treatment-glow), `:621` (pulse), `styles/base.css:126-133` (bounce-bg по scroll-timeline), `:198` (cta-glow).
- **Что:**
  - Свечение перенести в псевдоэлемент с заранее отрисованной тенью и анимировать `opacity`/`transform`.
  - Логотип в футере не анимировать.
  - `bounce-bg` заменить статичным решением (цвет `html` = фон шапки, `body::after` = футер — псевдоэлементы уже есть) либо ограничить `@media (hover:none) and (max-width:…)` по реальной необходимости.
  - Анимации останавливать вне экрана (`animation-play-state` через тот же IntersectionObserver).

**14. Header: без чтения layout на каждом scroll** — S
- **Где:** `components/Header.jsx:37-49`.
- **Что:** IntersectionObserver на нижнюю границу `.hero-stage` с `rootMargin` = высота шапки. Заодно закрывается баг из `SITE_REVIEW_RU.md` (неверный ориентир).

**15. Prefetch навигации на десктопе** — S
- **Где:** `components/Header.jsx`, `components/Footer.jsx` (`<Link>`).
- **Что:** 12 RSC-prefetch (122 KB) + JS маршрутов сразу после загрузки — много для сайта, куда приходят из рекламы на одну страницу. Для футера и подменю — `prefetch={false}`, в шапке оставить. Next 15 и так подгрузит маршрут при наведении.

**16. Мелкие клиентские компоненты** — S
- `FaqList.jsx`: эксклюзивный аккордеон можно сделать нативно — `<details name="faq">` (Chrome 120+, Safari 17.2+, Firefox 130+) — и убрать `'use client'`.
- `HashRedirect.jsx`: импортирует весь `lib/sections.js` ради карты из 7 якорей. Вынести карту `{hash: slug}` в отдельный маленький модуль.
- `Reveal.jsx`: на каждый экземпляр свой IntersectionObserver (157 использований в коде). Один общий observer на модуль.
- Логотип в шапке (`Header.jsx:13`) — `loading="lazy"` выше сгиба; `priority` не нужен, но `loading="eager"` уберёт задержку.

**17. `poweredByHeader: false`** — S, `next.config.mjs`.

## Ожидаемый итог

Порядок величин по замерам выше:
- **Mobile (лаборатория):** п. 3–5 + п. 11 — LCP с 3,2–3,6 до около 2,6–2,9 с. Нижняя граница без JS — 2,5 с.
- **Desktop:** п. 1–2 — главная и 7 разделов с 6,5 MB до около 0,7 MB.
- **Повторные визиты с согласием:** п. 8 — −110 KB стороннего JS из окна загрузки.

После выкатки на прод: повторить PageSpeed (квота сбрасывается в полночь по Тихоокеанскому времени) и через 28 дней посмотреть CrUX/«Скорость загрузки» в Метрике. Вёрстку проверять в `next dev`.
