# Аудит структурированных данных (schema.org / JSON-LD) — dr-markaryan.ru

Дата: 02.10.2026. Режим: только чтение, файлы проекта не менялись.

## Что и как проверялось

- Код: `lib/schema.js`, `components/JsonLd.jsx`, `components/PageShell.jsx`, `components/ServicePage.jsx`, `components/ColonoscopyPage.jsx`, `lib/pages.js`, `lib/content.js`, `lib/sections.js`, все `app/*/page.jsx`.
- Отрендеренный JSON-LD ветки `new-design`: локальный сервер `localhost:3111`, все 14 адресов.
- Прод `https://dr-markaryan.ru` (ветка master, старая версия). Там отдают 200 только главная, 5 страниц услуг, `/license` и `/privacy`. Разделов `/o-vrache`, `/lechenie`, `/diagnostika`, `/kak-prohodit`, `/video`, `/voprosy`, `/kontakty` на проде пока нет: они отдают 404.
- Валидатор `validator.schema.org` (POST с JSON-LD страницы `/gemorroy`).
- Актуальный статус поддержки разметки в Google и Яндексе (ссылки на источники в конце).

## Текущее состояние: что где выводится (ветка new-design)

| Страница | Типы в `@graph` | Объём JSON-LD |
|---|---|---|
| `/` | Physician, MedicalOrganization | 3,3 КБ |
| `/o-vrache`, `/lechenie`, `/diagnostika`, `/video`, `/kontakty` | Physician, MedicalOrganization, BreadcrumbList | ~3,5 КБ |
| `/kak-prohodit` | + FAQPage (6) | 5,7 КБ |
| `/voprosy` | + FAQPage (6) | 5,2 КБ |
| `/gemorroy`, `/analnaya-treshina`, `/kopchikovyj-hod` | + BreadcrumbList, FAQPage (6) | ~5,3 КБ |
| `/kolonoskopiya` | + BreadcrumbList, FAQPage (8) | 5,9 КБ |
| `/gastroskopiya` | + BreadcrumbList, FAQPage (4) | 4,7 КБ |
| `/license`, `/privacy` | нет JSON-LD | — |

На проде (master) главная пока отдаёт Physician + MedicalOrganization + FAQPage на 12 вопросов. После выкатки new-design FAQPage с главной уйдёт, и это правильно.

**Нигде нет:** WebSite, Person (врач как человек), MedicalWebPage, MedicalCondition, отдельной MedicalProcedure или MedicalTest для страницы, VideoObject, ProfilePage.

Что сделано хорошо:
- единый источник данных;
- стабильные `@id` (`/#physician`, `/#clinic`);
- FAQ только с показанными ответами (`answeredFaq` отсекает `todo`);
- рейтинги и отзывы осознанно не размечены;
- BreadcrumbList корректен.

---

## Ограничения поисковиков на октябрь 2026 (важно для приоритетов)

- **Google, FAQ rich results: функция полностью снята.** С августа 2023 года сниппет показывали только авторитетным государственным и медицинским сайтам. 7 мая 2026 года он перестал показываться совсем. В июне 2026 года документацию удалили, а поддержку убрали из Rich Results Test и Search Console. Сама разметка `FAQPage` остаётся валидным schema.org, Google использует её для понимания страницы. Удалять её не нужно, но **расширенного сниппета от неё больше не будет**. Её ценность теперь в понимании сущностей и в AI-ответах.
- **Google, HowTo:** снят в 2023 году. Не добавлять для блока «Как проходит приём» и шагов восстановления.
- **Google, Sitelinks search box:** снят в ноябре 2024 года. `SearchAction` в WebSite не нужен, к тому же поиска по сайту нет.
- **Google, звёзды отзывов:** для LocalBusiness и Organization «самохвальные» отзывы о себе на своём сайте не дают звёзд (с 2019 года). Агрегировать оценки с чужих площадок, например с ПроДокторов, правила запрещают. Текущее решение не размечать Review и AggregateRating верное.
- **Google, видео:** видео попадает в видеовыдачу, только если оно основной контент страницы (с декабря 2023 года). На страницах услуг ролики второстепенные, rich result там маловероятен. Шанс есть только у `/video`.
- **Google, названия сайтов (site names):** берутся из `WebSite` (`name` / `alternateName`) на главной. Это один из немногих rich-сигналов, который реально работает, а разметки WebSite сейчас нет.
- **Яндекс** официально использует schema.org для организаций и адресов, видео (Яндекс Видео), вопросов и ответов (только `QAPage` для пользовательских вопросов на мобильной выдаче), товаров, рецептов, ПО и фильмов. **`FAQPage` и медицинские типы (MedicalCondition, MedicalProcedure, MedicalWebPage) Яндекс для сниппетов не использует.** Для локальной выдачи у Яндекса важнее карточка в Яндекс Бизнесе, чем разметка. Для видео у Яндекса обязательны `url`, `name`, `description`, `duration`, `isFamilyFriendly`, `thumbnail`; `uploadDate` желателен.

Вывод: медицинские типы (MedicalCondition, MedicalProcedure, MedicalWebPage, Person с образованием) не дают видимых сниппетов ни в Google, ни в Яндексе. Но это основной способ передать поисковикам и LLM-ответам, кто автор и какая у него квалификация (E-E-A-T для YMYL-тематики), и связать страницы с сущностями. Видимый эффект в выдаче дадут WebSite (название сайта в Google), VideoObject (Яндекс Видео) и корректная организация (Яндекс и Google).

---

## Найденные ошибки

### E1. `worksFor` у Physician: невалидное свойство (P1, S)
`lib/schema.js`, `physicianSchema`. `worksFor` — свойство `Person`, а `Physician` — это Organization/LocalBusiness. Валидатор schema.org подтверждает: `UNKNOWN_FIELD ['worksFor', 'Physician']`. Ошибка повторяется на всех 13 страницах с разметкой.

`parentOrganization` формально валиден, но по смыслу неточен: практика врача не дочерняя структура ООО «ЛПУ-Гармония». Для связи «врач принимает в организации» в schema.org v24+ есть `IndividualPhysician.practicesAt`.

Исправление:
```js
export const physicianSchema = {
  '@type': 'IndividualPhysician',          // подтип Physician → MedicalBusiness → LocalBusiness
  '@id': PHYSICIAN_ID,
  // ...
  practicesAt: { '@id': CLINIC_ID },        // вместо worksFor + parentOrganization
  employee: { '@id': PERSON_ID },           // связь с Person, см. P1-2
};
```
Если валидатор Яндекса (webmaster.yandex.ru/tools/microtest/) не знает `IndividualPhysician`, оставить `Physician` и связку через `employee` / Person.`worksFor` (см. ниже). `practicesAt` тогда не использовать.

### E2. У MedicalOrganization (ООО «ЛПУ-Гармония») телефон врача (P1, S)
`clinicSchema.telephone = PHONE`, а это личный номер врача `+7 938 303-03-11`. Получаются две организации по одному адресу с одним телефоном. Для поисковиков это сигнал склейки или противоречия с карточкой клиники в справочниках (Яндекс Бизнес, 2ГИС). Нужно указать телефон клиники с её публичной карточки или убрать поле.

Там же: `identifier: '1232600013854'` голой строкой. Без пометки, что это ОГРН, значение теряет смысл. Нужен `PropertyValue` (пример в P2-4).

### E3. В `availableService` названия заболеваний размечены как процедуры (P2, S)
`availableService` собирается из `services` как `MedicalProcedure` с `name: "Геморрой"`, `"Анальные трещины"`, `"Острый парапроктит"`. Процедура с именем болезни — семантическая ошибка. Кроме того:
- нет `url` / `@id`: услуги не связаны с собственными страницами (`/gemorroy` и т. д.);
- «Первичный осмотр» размечен как `MedicalTest`, хотя это скорее `MedicalProcedure`;
- блок из 10 услуг (~2 КБ) повторяется на каждой странице. Это не ошибка, но раздувает каждый HTML.

Исправление: процедуры назвать «Лечение геморроя» и т. п. (такие формулировки уже есть в `anchor`); добавить `@id` и `url`. См. P2-1.

### E4. Одни и те же Q&A в FAQPage на 4–7 страницах (P2, S)
Замер по отрендеренным страницам:

| Вопрос | В FAQPage на страницах |
|---|---|
| «Это больно?» | 6: voprosy, gemorroy, analnaya-treshina, kopchikovyj-hod, kolonoskopiya, gastroskopiya |
| «Сколько стоит приём?» | 5: voprosy, gemorroy, kopchikovyj-hod, kolonoskopiya, gastroskopiya |
| «Мне очень стеснительно…» | 4: voprosy, analnaya-treshina, kolonoskopiya, gastroskopiya |
| «Обязательно ли будет операция?», «Как быстро я восстановлюсь?» | 4 |
| «Можно ли проконсультироваться дистанционно?» | 3 |

FAQPage на `/gastroskopiya` целиком состоит из этих общих дублей. Правило Google по FAQ: если один и тот же вопрос-ответ встречается на сайте несколько раз, размечается только один экземпляр. Rich result Google уже снял, но разметка по-прежнему читается как сигнал содержания. Дубли размывают, к какой странице относится ответ.

Исправление: общие вопросы (`q(...)` из `faqById`) размечать только на `/voprosy`. На страницах услуг показывать их как есть, но в `faqSchema` передавать только уникальные для страницы вопросы (`draft(...)`, `procedureFaqs`). На `/gastroskopiya` FAQPage не выводить, пока не появятся ответы на её собственные `todo`-вопросы.
```js
// lib/pages.js
export const schemaFaq = (page) => answeredFaq(page).filter((item) => !item.id); // у общих q() есть id, у draft — нет
// ServicePage.jsx / ColonoscopyPage.jsx
faqSchema([...schemaFaq(page), ...procedureFaqs])
```
Попутно: в JSON-LD попадают ответы с пометкой `draft` («ЧЕРНОВИК — вычитать врачу»). Это не ошибка разметки, но если добавлять `reviewedBy` / `lastReviewed` (P1-3), их нельзя ставить на страницу, пока черновики не вычитаны.

### E5. `JsonLd` не экранирует `<` (P3, S)
`components/JsonLd.jsx`: `JSON.stringify(data)` вставляется как есть. Сейчас все данные статичные, поэтому риск низкий. Но если в тексте появится `</script>`, разметка и страница сломаются. Next.js в своей документации рекомендует экранирование:
```jsx
__html: JSON.stringify(data).replace(/</g, '\\u003c')
```

### E6. Мелкие несоответствия (P3, S)
- `/license` и `/privacy` без JSON-LD. На `/license` уместна MedicalOrganization с лицензией (P2-4).
- `Physician.url` указывает на главную. Это допустимо, но для Person правильнее `url: /o-vrache`.
- `areaServed` задан строками. Лучше объектами `{"@type":"City","name":"Пятигорск"}` и `{"@type":"AdministrativeArea","name":"Кавказские Минеральные Воды"}`.

---

## Предложения (с примерами)

Общая схема графа. Каждой странице выдаётся один `@graph`. Сущности связаны через `@id`, полные описания Person, Physician, Clinic и WebSite лежат в `lib/schema.js`.

```
WebSite (#website) ──publisher──▶ IndividualPhysician (#physician) ──practicesAt──▶ MedicalOrganization (#clinic)
                                        │ employee
                                        ▼
                                   Person (#person) ──worksFor──▶ #clinic
MedicalWebPage (/gemorroy#webpage) ──about──▶ MedicalCondition (/gemorroy#condition)
        │ reviewedBy ▶ #person   │ breadcrumb ▶ /gemorroy#breadcrumb   │ isPartOf ▶ #website
```

### P1-1. WebSite на всех страницах (P1, S)
Файл: `lib/schema.js` (новый `websiteSchema`), подключить в `app/page.jsx`, `PageShell.jsx`, `ServicePage.jsx`, `ColonoscopyPage.jsx`. Даёт Google название сайта в выдаче («Доктор Маркарян» вместо домена) и корневой узел графа.
```json
{
  "@type": "WebSite",
  "@id": "https://dr-markaryan.ru/#website",
  "url": "https://dr-markaryan.ru/",
  "name": "Доктор Маркарян",
  "alternateName": ["Эдуард Маркарян — колопроктолог", "dr-markaryan.ru"],
  "inLanguage": "ru-RU",
  "publisher": { "@id": "https://dr-markaryan.ru/#physician" }
}
```
`name` должен совпадать с `og:site_name` (уже «Доктор Маркарян»).

### P1-2. Person: врач как человек, с образованием (P1, M)
Файл: `lib/schema.js` (новый `personSchema`, данные из `education` в `lib/content.js`). Подключить на всех страницах, а на `/o-vrache` сделать его `mainEntity` (см. P2-5). Свойства `alumniOf`, `hasCredential`, `jobTitle`, `award`, `memberOf` у Physician (Organization) невалидны. Им место только в Person.

Всё ниже уже показано на `/o-vrache` в хронологии образования:
```json
{
  "@type": "Person",
  "@id": "https://dr-markaryan.ru/#person",
  "name": "Эдуард Жорикович Маркарян",
  "givenName": "Эдуард",
  "additionalName": "Жорикович",
  "familyName": "Маркарян",
  "jobTitle": "Хирург-колопроктолог",
  "url": "https://dr-markaryan.ru/o-vrache",
  "image": "https://dr-markaryan.ru/img/doctor_2.png",
  "worksFor": { "@id": "https://dr-markaryan.ru/#clinic" },
  "knowsAbout": ["Колопроктология", "Проктология", "Эндоскопия", "Геморрой", "Анальная трещина", "Эпителиальный копчиковый ход"],
  "knowsLanguage": "ru",
  "alumniOf": [
    { "@type": "CollegeOrUniversity", "name": "Ивановская государственная медицинская академия" },
    { "@type": "CollegeOrUniversity", "name": "Первый МГМУ им. И. М. Сеченова" }
  ],
  "hasCredential": [
    { "@type": "EducationalOccupationalCredential", "credentialCategory": "Высшее образование", "name": "Лечебное дело", "dateCreated": "2018" },
    { "@type": "EducationalOccupationalCredential", "credentialCategory": "Ординатура", "name": "Ординатура по колопроктологии", "dateCreated": "2020",
      "recognizedBy": { "@type": "CollegeOrUniversity", "name": "Первый МГМУ им. И. М. Сеченова" } },
    { "@type": "EducationalOccupationalCredential", "credentialCategory": "Повышение квалификации", "name": "Эндоскопия: колоноскопия, ректороманоскопия", "dateCreated": "2021" },
    { "@type": "EducationalOccupationalCredential", "credentialCategory": "Профессиональная переподготовка", "name": "Хирургия; организация здравоохранения", "dateCreated": "2023" }
  ],
  "sameAs": ["https://prodoctorov.ru/pyatigorsk/vrach/846542-markaryan/"]
}
```
Чего не добавлять без подтверждения и без видимого текста на странице:
- `memberOf` (например, Ассоциация колопроктологов России);
- `hospitalAffiliation` / `practicesAt` больницы, где выполнены операции;
- `award` «Премия ПроДокторов»: DESIGN_REVIEW уже отмечает, что роль в наградах не подтверждена.

Разметка должна отражать видимый контент. Если врач подтвердит эти факты, их нужно сначала вывести на `/o-vrache`, а затем добавить в разметку.

`sameAs`: стоит добавить профили на Яндекс Картах, 2ГИС, НаПоправку, СберЗдоровье, если они есть. **Instagram в `sameAs` не добавлять:** Meta признана в РФ экстремистской, ссылка без оговорки создаёт юридический риск.

### P1-3. MedicalWebPage на медицинских страницах (P1 для услуг, M)
Файл: `lib/schema.js` (функция `medicalWebPage(page)`), подключить в `ServicePage.jsx`, `ColonoscopyPage.jsx`, а для `/lechenie`, `/diagnostika`, `/kak-prohodit`, `/voprosy` — через `PageShell`. Явно показывает, кто автор и кто проверил страницу (E-E-A-T в YMYL-тематике).
```json
{
  "@type": "MedicalWebPage",
  "@id": "https://dr-markaryan.ru/gemorroy#webpage",
  "url": "https://dr-markaryan.ru/gemorroy",
  "name": "Лечение геморроя в Пятигорске — проктолог Эдуард Маркарян",
  "description": "Приём проктолога и хирурга-колопроктолога…",
  "inLanguage": "ru-RU",
  "isPartOf": { "@id": "https://dr-markaryan.ru/#website" },
  "breadcrumb": { "@id": "https://dr-markaryan.ru/gemorroy#breadcrumb" },
  "about": { "@id": "https://dr-markaryan.ru/gemorroy#condition" },
  "mainEntity": { "@id": "https://dr-markaryan.ru/gemorroy#condition" },
  "medicalAudience": { "@type": "Patient" },
  "specialty": "https://schema.org/Surgical",
  "author": { "@id": "https://dr-markaryan.ru/#person" },
  "reviewedBy": { "@id": "https://dr-markaryan.ru/#person" },
  "lastReviewed": "2026-10-XX",
  "dateModified": "2026-10-XX",
  "primaryImageOfPage": "https://dr-markaryan.ru/img/doctor.png"
}
```
Условие: `reviewedBy` и `lastReviewed` ставить только после того, как врач вычитает черновики `guide` и `draft` в `lib/pages.js`. Удобно хранить дату в `page.reviewed` и не выводить эти поля, пока она пуста. Дату показывать и на странице («Проверено врачом: …»), чтобы разметка совпадала с видимым текстом.

Для `breadcrumb` нужно, чтобы `breadcrumbSchema` принимала `@id`:
```js
export function breadcrumbSchema(items, pageUrl) {
  return { '@type': 'BreadcrumbList', '@id': `${pageUrl}#breadcrumb`, itemListElement: /* как сейчас */ };
}
```

### P1-4. Physician: недостающие поля LocalBusiness (P1, S)
Файл: `lib/schema.js`. Google рекомендует для LocalBusiness `geo`, `url`, `telephone`, `openingHoursSpecification`, `priceRange`. Сейчас не хватает `geo`, `logo`, `hasMap`.
```json
{
  "logo": { "@type": "ImageObject", "url": "https://dr-markaryan.ru/img/logo.png", "width": 512, "height": 376 },
  "geo": { "@type": "GeoCoordinates", "latitude": 44.0XXXX, "longitude": 43.0XXXX },
  "hasMap": "https://yandex.ru/maps/?text=…",
  "isAcceptingNewPatients": true,
  "currenciesAccepted": "RUB",
  "areaServed": [{ "@type": "City", "name": "Пятигорск" }, { "@type": "AdministrativeArea", "name": "Кавказские Минеральные Воды" }]
}
```
Координаты взять из карточки на Яндекс Картах (пр-кт Калинина, 90А), не угадывать. `hasMap` = `MAP_URL` из `content.js`, а лучше прямая ссылка на организацию в Яндекс Картах. `priceRange` не выдумывать: цены на сайте не опубликованы.

Название, адрес и телефон должны символ в символ совпадать с карточкой в Яндекс Бизнесе и Google Business Profile. Для Яндекса это важнее самой разметки.

### P2-1. MedicalCondition на страницах заболеваний (P2, M)
Файлы:
- `lib/pages.js`: добавить в `gemorroy`, `analnaya-treshina`, `kopchikovyj-hod` поле `condition` с `code` / `alternateName`;
- `lib/schema.js`: функция `conditionSchema(page)`;
- `ServicePage.jsx`.

Чтобы разметка не расходилась с текстом, её стоит генерировать из `guide`:
- `checklist` → `signOrSymptom`;
- `cards` со стадиями → `stage`;
- `cards` с методами → `possibleTreatment`;
- `alert` → `possibleComplication`.

```js
export function conditionSchema(page) {
  const byId = (id) => page.guide?.find((s) => s.id === id);
  const symptoms = byId('simptomy');
  const methods = byId('metody');
  const stages = byId('stadii');
  return {
    '@type': 'MedicalCondition',
    '@id': `${SITE}/${page.slug}#condition`,
    name: page.condition.name,
    alternateName: page.condition.alternateName,
    code: page.condition.code,            // [{ '@type':'MedicalCode', codeValue:'K64', codingSystem:'ICD-10' }]
    description: symptoms?.lead,
    url: `${SITE}/${page.slug}`,
    relevantSpecialty: 'https://schema.org/Surgical',
    signOrSymptom: symptoms?.items.map((name) => ({ '@type': 'MedicalSymptom', name })),
    stage: stages?.items.map((s, i) => ({ '@type': 'MedicalConditionStage', stageAsNumber: i + 1, name: s.title, description: s.text })),
    possibleTreatment: methods?.items.map((m) => ({ '@type': 'MedicalTherapy', name: m.title, description: m.text })),
    typicalTest: [{ '@id': `${SITE}/#test-anoskopiya` }],
  };
}
```
Пример результата для `/gemorroy` (сокращён):
```json
{
  "@type": "MedicalCondition",
  "@id": "https://dr-markaryan.ru/gemorroy#condition",
  "name": "Геморрой",
  "code": { "@type": "MedicalCode", "codeValue": "K64", "codingSystem": "ICD-10" },
  "associatedAnatomy": { "@type": "AnatomicalStructure", "name": "Анальный канал" },
  "signOrSymptom": [
    { "@type": "MedicalSymptom", "name": "алая кровь на бумаге или в конце стула" },
    { "@type": "MedicalSymptom", "name": "зуд, жжение, мокнутие у заднего прохода" }
  ],
  "stage": [
    { "@type": "MedicalConditionStage", "stageAsNumber": 1, "name": "Узлы не выпадают" },
    { "@type": "MedicalConditionStage", "stageAsNumber": 4, "name": "Не вправляются" }
  ],
  "possibleTreatment": [
    { "@type": "MedicalTherapy", "name": "Консервативное лечение" },
    { "@type": "MedicalTherapy", "name": "Лазер и радиоволна" },
    { "@type": "MedicalTherapy", "name": "Операция" }
  ],
  "possibleComplication": "тромбоз узла, кровотечение",
  "typicalTest": [{ "@id": "https://dr-markaryan.ru/#test-anoskopiya" }, { "@id": "https://dr-markaryan.ru/kolonoskopiya#procedure" }]
}
```

Особенности по страницам:

| Страница | `code` (МКБ-10) | Что ещё разметить |
|---|---|---|
| `/analnaya-treshina` | K60.0 (острая), K60.1 (хроническая) | Острая и хроническая форма — через `description` или два `MedicalCode`. Стадий нет. `possibleTreatment` из `lechenie-bez-operacii` и `operaciya`. |
| `/kopchikovyj-hod` | L05.0 (с абсцессом), L05.9 (без абсцесса) | `alternateName: "Пилонидальная киста"` (есть в тексте). `riskFactor` из видимого текста раздела `prichiny`: `[{"@type":"MedicalRiskFactor","name":"густое оволосение"}, {"name":"глубокая межъягодичная складка"}, {"name":"лишний вес"}, {"name":"сидячая работа"}]`. `possibleTreatment`: «SiLaC — лазер», «Иссечение хода», «Вскрытие гнойника». |

Коды МКБ-10 сверить с действующими клиническими рекомендациями Минздрава РФ (Ассоциация колопроктологов России) и согласовать с врачом. В части справочников геморрой ещё числится под старым кодом I84. `possibleTreatment` по спецификации ожидает `MedicalTherapy` (не `SurgicalProcedure`), поэтому и операции размечены как `MedicalTherapy`.

### P2-2. MedicalTest / DiagnosticProcedure для колоноскопии и гастроскопии (P2, M)
Файлы: `components/ColonoscopyPage.jsx` (данные `formats`, `findings`, `examSteps` уже лежат в этом файле), `ServicePage.jsx` для `/gastroskopiya`, `lib/schema.js`.

Двойной тип даёт доступ к свойствам обоих: `usedToDiagnose` от MedicalTest и `preparation` / `howPerformed` / `bodyLocation` / `followup` от MedicalProcedure. Свойств `indication` / `contraindication` у процедуры в schema.org нет. Показания переданы через `usedToDiagnose` и `description`.

```json
{
  "@type": ["MedicalTest", "DiagnosticProcedure"],
  "@id": "https://dr-markaryan.ru/kolonoskopiya#procedure",
  "name": "Видеоколоноскопия",
  "alternateName": ["Колоноскопия", "Колоноскопия под седацией"],
  "url": "https://dr-markaryan.ru/kolonoskopiya",
  "description": "Смотрю всю толстую кишку в HD. Если хотите, делаю во сне, под лёгкой седацией…",
  "bodyLocation": "Толстая кишка",
  "preparation": "Качественная подготовка кишечника нужна для точного осмотра. Конкретную схему и ограничения согласуйте с врачом.",
  "howPerformed": "Пациент лежит на боку. Врач аккуратно проводит эндоскоп и последовательно осматривает слизистую на мониторе. При необходимости можно взять материал для гистологии, удалить подходящий полип…",
  "followup": "После исследования врач оформляет результат, объясняет находки и говорит, нужны ли дальнейшие действия.",
  "usedToDiagnose": [
    { "@type": "MedicalCondition", "name": "Полипы и другие новообразования толстой кишки" },
    { "@type": "MedicalCondition", "name": "Дивертикулы и сужения кишечника" },
    { "@type": "MedicalCondition", "name": "Язвы и эрозии" },
    { "@type": "MedicalCondition", "name": "Источник кишечного кровотечения" }
  ],
  "relevantSpecialty": "https://schema.org/Gastroenterologic",
  "provider": { "@id": "https://dr-markaryan.ru/#physician" }
}
```
Тексты взяты дословно из `examSteps` и `findings`. Когда врач заполнит `pending` («Подготовка к колоноскопии» и др.), `preparation` расширить.

`provider` у MedicalTest и MedicalProcedure по спецификации не определён. Если валидатор ругается, убрать: связь уже есть через `Physician.availableService` (P2-3).

Для `/gastroskopiya`:
- `name: "Гастроскопия (ФГДС)"`;
- `alternateName: ["ФГДС", "Эзофагогастродуоденоскопия"]`;
- `bodyLocation: "Пищевод, желудок, двенадцатиперстная кишка"`.

`preparation` и `howPerformed` для гастроскопии не выводить, пока разделы в статусе `todo`.

### P2-3. Переделать `availableService` (P2, S)
Файл: `lib/schema.js`, плюс поле `schemaName` в `services` и `diagnostics` в `lib/content.js`. Исправляет E3 и связывает услуги со страницами из P2-1 и P2-2 через общие `@id`:
```js
const availableService = [
  ...services.map((s) => ({
    '@type': 'TherapeuticProcedure',
    '@id': s.href ? `${SITE}${s.href}#treatment` : `${SITE}/lechenie#${s.id}`,
    name: s.schemaName,                       // «Лечение геморроя», «Вскрытие острого парапроктита», …
    url: `${SITE}${s.href ?? '/lechenie'}`,
    description: s.text,
  })),
  ...diagnostics.map((d) => ({
    '@type': d.title === 'Первичный осмотр' ? 'MedicalProcedure' : 'MedicalTest',
    '@id': d.href ? `${SITE}${d.href}#procedure` : `${SITE}/#test-${d.slug}`,
    name: d.title,
    url: `${SITE}${d.href ?? '/diagnostika'}`,
    description: d.text,
  })),
];
```
Чтобы сократить вес, на внутренних страницах можно выводить Physician без `availableService`, а полный вариант оставить на `/`, `/lechenie` и `/diagnostika`. Связи `@id` при этом сохраняются. Это P3.

### P2-4. MedicalOrganization: лицензия и реквизиты (P2, S)
Файл: `lib/schema.js` (`clinicSchema`), подключить и на `/license` (`app/license/page.jsx`, сейчас без JSON-LD). Данные уже видны на `/license`.
```json
{
  "@type": "MedicalOrganization",
  "@id": "https://dr-markaryan.ru/#clinic",
  "name": "ООО «ЛПУ-Гармония»",
  "legalName": "Общество с ограниченной ответственностью «ЛПУ-Гармония»",
  "taxID": "2632122769",
  "identifier": { "@type": "PropertyValue", "propertyID": "ОГРН", "value": "1232600013854" },
  "address": { "...": "как сейчас" },
  "telephone": "<телефон клиники, не врача — см. E2>",
  "hasCredential": {
    "@type": "EducationalOccupationalCredential",
    "credentialCategory": "Лицензия на осуществление медицинской деятельности",
    "identifier": "Л041-01197-26/01072904",
    "dateCreated": "2024-02-27",
    "recognizedBy": { "@type": "GovernmentOrganization", "name": "Министерство здравоохранения Ставропольского края" }
  },
  "isAcceptingNewPatients": true
}
```
Если у клиники есть публичное название или бренд и свой сайт, указать `name` (бренд), `legalName` (ООО), `url` (сайт клиники) и `sameAs` (карточка в Яндекс Бизнесе). Тип при этом можно сменить на `MedicalClinic`. Пока `url` ведёт на `/license`, это допустимо.

### P2-5. ProfilePage на /o-vrache (P2, S)
Файл: `app/o-vrache/page.jsx` через `extraSchema` в `PageShell`. Google поддерживает ProfilePage для страниц, посвящённых одному человеку.
```json
{
  "@type": "ProfilePage",
  "@id": "https://dr-markaryan.ru/o-vrache#webpage",
  "url": "https://dr-markaryan.ru/o-vrache",
  "name": "Врач-проктолог Эдуард Маркарян — образование и опыт",
  "isPartOf": { "@id": "https://dr-markaryan.ru/#website" },
  "breadcrumb": { "@id": "https://dr-markaryan.ru/o-vrache#breadcrumb" },
  "mainEntity": { "@id": "https://dr-markaryan.ru/#person" },
  "dateModified": "2026-10-XX"
}
```

### P2-6. VideoObject (P2 для /video, P3 для страниц услуг; M)
Файлы:
- `lib/content.js`: добавить `uploadDate` и `title` / `summary` для `reels` (сейчас только `alt`);
- `lib/schema.js`: функция `videoSchema(item, pageUrl)`;
- `app/video/page.jsx` через `extraSchema`; `ServicePage.jsx` для `page.video.items` и `page.reel`.

Набор полей покрывает требования Google (`name`, `thumbnailUrl`, `uploadDate`) и Яндекса (`url`, `name`, `description`, `duration`, `isFamilyFriendly`, `thumbnail`):
```json
{
  "@type": "VideoObject",
  "@id": "https://dr-markaryan.ru/video#endoscope-wash",
  "name": "Как моют эндоскоп",
  "description": "Ручная мойка каналов, промывка и загрузка в моечную машину. Что происходит с аппаратом между пациентами.",
  "thumbnailUrl": "https://dr-markaryan.ru/video/posters/endoscope-wash-2.webp",
  "thumbnail": { "@type": "ImageObject", "url": "https://dr-markaryan.ru/video/posters/endoscope-wash-2.webp", "width": 640, "height": 854 },
  "contentUrl": "https://dr-markaryan.ru/video/endoscope-wash-2.mp4",
  "url": "https://dr-markaryan.ru/video",
  "uploadDate": "2026-08-04T12:00:00+03:00",
  "duration": "PT29S",
  "width": 640,
  "height": 854,
  "isFamilyFriendly": true,
  "inLanguage": "ru",
  "creator": { "@id": "https://dr-markaryan.ru/#person" },
  "publisher": { "@id": "https://dr-markaryan.ru/#physician" }
}
```
- `duration` считать из `item.duration`: `PT${s}S`.
- Длительности reels (`ffprobe`): reel1 ≈ 18 с, reel2 ≈ 15 с, reel5 ≈ 21 с.
- `uploadDate` нужна реальная дата публикации. Дата файлов (04.08.2026) здесь только для примера.
- **`pilonidal-laser` (кадры операции, `sensitive`) не размечать.** Иначе кадр вмешательства может попасть в видеовыдачу без предупреждения, которое есть на сайте. Если всё же размечать, то обязательно с `isFamilyFriendly: false`.
- `Reel` «Проведение гастроскопии» на `/gastroskopiya` — проверить, нет ли в кадре узнаваемого пациента (см. комментарии в `content.js`).

Реалистичный эффект: Яндекс Видео. Для Google rich result возможен только на `/video`, на страницах услуг видео не основной контент.

### P3-1. Типы страниц-разделов (P3, S)
`PageShell`: добавить `@type: WebPage` и подтипы с `isPartOf` / `breadcrumb`:
- `/kontakty` → `ContactPage`;
- `/lechenie`, `/diagnostika` → `CollectionPage` с `mainEntity: ItemList` из `@id` услуг;
- `/voprosy`, `/kak-prohodit` → `FAQPage` (уже есть, нужно связать `@id` и `isPartOf`).

Видимого эффекта это не даёт, но замыкает граф.

### P3-2. Хлебные крошки для услуг (P3, S)
Сейчас «Главная → Лечение геморроя», хотя раздел-хаб `/lechenie` существует. «Главная → Лечение → Геморрой» и «Главная → Диагностика → Колоноскопия» точнее отражают структуру. Менять только вместе с видимыми крошками (`breadcrumbsFor` в `ServicePage.jsx`).

### P3-3. Контроль качества (P3, S)
Добавить в CI (husky уже есть) тест, который рендерит страницы, парсит `application/ld+json` и проверяет:
- JSON валиден;
- нет `worksFor` на Organization;
- нет повторяющихся `Question.name` между страницами;
- у VideoObject есть `uploadDate` / `duration`.

После выкатки прогнать вручную через validator.schema.org и webmaster.yandex.ru/tools/microtest/. Google Rich Results Test теперь полезен только для Breadcrumb, LocalBusiness, Video и ProfilePage: FAQ из него удалён.

---

## Чего не делать

- Не размечать `AggregateRating` / `Review` с данными ПроДокторов, даже когда заполнится `RATING`. Google запрещает агрегировать чужие отзывы, а самохвальные звёзды для LocalBusiness не показывает. Яндекс берёт рейтинг из своих карт.
- Не добавлять `HowTo` для шагов приёма и восстановления: функция снята.
- Не переносить в разметку цифры и регалии, которых нет на странице или которые не подтверждены: «5000+ операций», `award`, `memberOf`.
- Не ставить `reviewedBy` / `lastReviewed`, пока тексты с пометкой «ЧЕРНОВИК» не вычитаны врачом.
- Не добавлять Instagram в `sameAs`.
- Не размечать как VideoObject ролик с хирургическими кадрами.

---

## Сводка по приоритетам

| # | Что | Файл(ы) | Приоритет | Трудозатраты |
|---|---|---|---|---|
| E1 | Убрать `worksFor` / `parentOrganization` у Physician → `IndividualPhysician` + `practicesAt` + `employee` | lib/schema.js | P1 | S |
| E2 | Телефон и ОГРН у MedicalOrganization | lib/schema.js | P1 | S |
| P1-1 | WebSite (название сайта в Google) | lib/schema.js, app/page.jsx, PageShell, ServicePage, ColonoscopyPage | P1 | S |
| P1-2 | Person с `alumniOf` / `hasCredential` / `jobTitle` | lib/schema.js, lib/content.js | P1 | M |
| P1-3 | MedicalWebPage с `author` / `reviewedBy` / `lastReviewed` (после вычитки) | lib/schema.js, ServicePage, ColonoscopyPage, PageShell | P1 | M |
| P1-4 | Physician: `geo`, `logo`, `hasMap`, `isAcceptingNewPatients`, `areaServed` объектами | lib/schema.js, lib/content.js | P1 | S |
| E3/P2-3 | `availableService`: правильные имена, `@id`, `url` | lib/schema.js, lib/content.js | P2 | S |
| E4 | Убрать дубли FAQ: общие вопросы только на /voprosy | lib/pages.js, ServicePage, ColonoscopyPage | P2 | S |
| P2-1 | MedicalCondition (симптомы, стадии, лечение, МКБ-10) | lib/pages.js, lib/schema.js, ServicePage | P2 | M |
| P2-2 | MedicalTest + DiagnosticProcedure для колоноскопии и гастроскопии | ColonoscopyPage, ServicePage, lib/schema.js | P2 | M |
| P2-4 | Лицензия в MedicalOrganization, JSON-LD на /license | lib/schema.js, app/license/page.jsx | P2 | S |
| P2-5 | ProfilePage на /o-vrache | app/o-vrache/page.jsx | P2 | S |
| P2-6 | VideoObject (/video; без хирургического ролика) | lib/content.js, lib/schema.js, app/video, ServicePage | P2/P3 | M |
| E5 | Экранирование `<` в JsonLd | components/JsonLd.jsx | P3 | S |
| E6/P3-1 | Типы страниц-разделов, JSON-LD на /license, `url` у Person | PageShell, lib/sections.js | P3 | S |
| P3-2 | Иерархия крошек «Лечение → …» | ServicePage.jsx | P3 | S |
| P3-3 | Тест JSON-LD в CI + ручная валидация | новый тест | P3 | S |

Всё из P1 укладывается примерно в 1 рабочий день. P1 и P2 вместе — 2–3 дня, без учёта вычитки текстов врачом.

## Источники

- Google, FAQPage (снятие rich result: объявление 08.05.2026, удаление документации 15.06.2026): https://developers.google.com/search/docs/appearance/structured-data/faqpage
- Обзор снятия FAQ rich results: https://www.techwyse.com/news/ai-search/google-faq-rich-results-deprecated-2026
- schema.org Physician (иерархия, свойства): https://schema.org/Physician
- schema.org IndividualPhysician / practicesAt (v24.0, январь 2024): https://schema.org/IndividualPhysician, https://www.schemaapp.com/schema-app-news/schema-org-v24-0-release-changes-to-physician-schema-markup/
- schema.org MedicalCondition: https://schema.org/MedicalCondition ; DiagnosticProcedure: https://schema.org/DiagnosticProcedure ; MedicalWebPage: https://schema.org/MedicalWebPage ; hasCredential: https://schema.org/hasCredential
- Яндекс, поддерживаемые типы schema.org: https://yandex.ru/support/webmaster/ru/schema-org/what-is-schema-org
- Яндекс, вопросы и ответы (QAPage): https://yandex.ru/support/webmaster/supported-schemas/questions.html
- Яндекс Видео, разметка VideoObject: https://yandex.ru/support/video/partners/schema-org.html
