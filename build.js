#!/usr/bin/env node
/* ==========================================================================
   PARI Residence — сборка статики.
   Из src/content.js и src/templates.js собирает восемь страниц (RU + UZ),
   404, sitemap.xml и robots.txt, копирует ассеты в dist/.
   Запуск: node build.js
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { site, ru, uz } = require('./src/content');
const T = require('./src/templates');
const flats = require('./src/flats');

const root = __dirname;
const dist = path.join(root, 'dist');

/* ---------- утилиты ---------- */
const rmrf = (p) => fs.rmSync(p, { recursive: true, force: true });
const write = (rel, data) => {
  const file = path.join(dist, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data, 'utf8');
  return file;
};
const copyDir = (from, to) => fs.cpSync(from, to, { recursive: true });
const hash = (file) => crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex').slice(0, 8);

/* ---------- микроразметка ---------- */
const orgLd = (t) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': T.url('/#organization'),
  name: site.brand,
  url: T.url('/'),
  logo: T.url('/assets/img/pari-logo-vector.png'),
  telephone: site.phone.intl,
  /* sameAs — это подтверждение, что за маркой стоит один и тот же субъект.
     Пропущенный Telegram здесь заметен: в Узбекистане именно он основной
     канал связи проекта, и без ссылки поисковик не связывает канал с сайтом. */
  sameAs: [site.instagram, site.telegram].concat(site.maps2gis ? [site.maps2gis] : []),
  address: {
    '@type': 'PostalAddress',
    streetAddress: t.lang === 'ru' ? site.address.street : site.address.streetUz,
    addressLocality: t.lang === 'ru' ? site.address.city : site.address.cityUz,
    addressRegion: t.lang === 'ru' ? 'Самаркандская область' : 'Samarqand viloyati',
    addressCountry: site.address.country,
  },
});

const siteLd = (t) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': T.url('/#website'),
  name: site.brand,
  url: T.url(t.lang === 'ru' ? '/' : '/uz/'),
  inLanguage: t.lang,
  publisher: { '@id': T.url('/#organization') },
});

const complexLd = (t) => ({
  '@context': 'https://schema.org',
  '@type': 'ApartmentComplex',
  name: site.brand,
  url: T.url(t.lang === 'ru' ? '/' : '/uz/'),
  image: T.url('/assets/img/opening-shot-1920.webp'),
  description: t.meta.home.description,
  numberOfAccommodationUnits: site.facts.apartments,
  telephone: site.phone.intl,
  address: orgLd(t).address,
  geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lon },
  numberOfBedrooms: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 4 },
  floorSize: {
    '@type': 'QuantitativeValue',
    minValue: site.facts.areaFrom, maxValue: site.facts.areaTo, unitCode: 'MTK',
  },
  amenityFeature: [
    { '@type': 'LocationFeatureSpecification', name: t.home.yardEyebrow, value: true },
  ],
  /* Цена подтверждена владельцем: 10 млн сум за квадратный метр, без скидок.
     Отдаём её как цену за единицу площади (unitCode MTK — квадратный метр),
     а не как стоимость квартиры: второе было бы неправдой. */
  ...(site.price.confirmed && site.price.perSqm ? {
    makesOffer: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      seller: { '@id': T.url('/#organization') },
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: site.price.from * 1000000,
        priceCurrency: 'UZS',
        unitCode: 'MTK',
        valueAddedTaxIncluded: true,
      },
    },
  } : {}),
});

/* Контакты: LocalBusiness-подтип. Часы работы попадают в разметку только
   когда владелец их подтвердил (см. site.hours.confirmed). */
const agentLd = (t) => {
  const o = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: `${site.brand} — ${t.contacts.h1}`,
    url: T.url(t.lang === 'ru' ? '/contacts/' : '/uz/contacts/'),
    image: T.url('/assets/img/lobby-1920.webp'),
    telephone: site.phone.intl,
    address: orgLd(t).address,
    geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lon },
    /* Ссылка на ту же точку в Яндекс Картах, что открывается на странице.
       Для локального поиска это связка «сайт ↔ карточка на карте»: без неё
       обе сущности живут порознь. */
    hasMap: `https://yandex.uz/maps/?pt=${site.geo.lon},${site.geo.lat}&z=17&l=map`,
    areaServed: {
      '@type': 'City',
      name: t.lang === 'ru' ? site.address.city : site.address.cityUz,
    },
    parentOrganization: { '@id': T.url('/#organization') },
  };
  if (site.hours.confirmed && site.hours.schema) { o.openingHours = site.hours.schema; }
  /* priceRange у LocalBusiness — не число, а разряд цены. Ставим его только
     из подтверждённой цены и в валюте страны. */
  if (site.price.confirmed) {
    const isRu = t.lang === 'ru';
    o.priceRange = `${isRu ? 'от ' : ''}${site.price.from} ${isRu ? site.price.unit : site.price.unitUz}/м²`;
    o.currenciesAccepted = 'UZS';
  }
  return o;
};


/* Вопросы и ответы. Берём ровно те пары, что напечатаны на странице
   (T.faqPairs), — расхождение видимого текста и разметки запрещено правилами
   и Google, и Яндекса. */
const faqLd = (t) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': T.url((t.lang === 'ru' ? '' : '/uz') + '/faq/#faq'),
  inLanguage: t.lang,
  mainEntity: T.faqPairs(t).map((x) => ({
    '@type': 'Question',
    name: x.q,
    acceptedAnswer: { '@type': 'Answer', text: x.a },
  })),
});

/* Одна страница — одна сущность. Без этого узла у страницы нет ни языка,
   ни принадлежности к сайту, ни описания: разметка описывала только сайт
   целиком и организацию. AI-поиск и Яндекс собирают ответ именно отсюда. */
const pageLd = (t, page) => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': T.url(page.path) + '#webpage',
  url: T.url(page.path),
  name: page.title,
  description: page.description,
  inLanguage: t.lang,
  isPartOf: { '@id': T.url('/#website') },
  about: { '@id': T.url('/#organization') },
  primaryImageOfPage: T.url('/assets/img/og-cover.jpg'),
});

/* Квартиры группы. Отдаём именно то, что подтверждено шахматкой: комнатность,
   диапазон площадей и число квартир. Цена идёт за квадратный метр — стоимость
   конкретной квартиры зависит от этажа и площади, и выдавать её за фиксированную
   было бы неправдой. Отзывов и рейтингов здесь нет: их у проекта не существует. */
const roomsLd = (t, page) => {
  const g = page.group;
  const f = T.roomFacts(t, g);
  const o = {
    '@context': 'https://schema.org',
    '@type': 'Apartment',
    '@id': T.url(page.path) + '#apartment',
    name: f.title,
    url: T.url(page.path),
    description: page.description,
    numberOfRooms: g.studio ? 1 : g.rooms,
    floorSize: {
      '@type': 'QuantitativeValue',
      minValue: g.areaFrom, maxValue: g.areaTo, unitCode: 'MTK',
    },
    floorLevel: `${g.floorFrom}-${g.floorTo}`,
    containedInPlace: { '@id': T.url('/#organization') },
    address: orgLd(t).address,
    geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lon },
  };
  if (site.price.confirmed && site.price.perSqm) {
    o.offers = {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      seller: { '@id': T.url('/#organization') },
      eligibleQuantity: { '@type': 'QuantitativeValue', value: g.count, unitText: 'apartments' },
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: site.price.from * 1000000,
        priceCurrency: 'UZS',
        unitCode: 'MTK',
        valueAddedTaxIncluded: true,
      },
    };
  }
  return o;
};

const crumbsLd = (t, items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [{ name: t.ui.home, path: t.lang === 'ru' ? '/' : '/uz/' }].concat(items)
    .map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.name, item: T.url(x.path) })),
});

/* ---------- описание страниц ---------- */
/* Страницы по комнатности. Строятся из настоящего состава дома: группа
   попадает на сайт, только если такие квартиры в шахматке есть. Заголовок и
   описание собираются из тех же цифр, что и текст страницы. */
function roomPagesFor(t) {
  const p = t.lang === 'ru' ? '' : '/uz';
  return T.roomGroups().map((g) => {
    const f = T.roomFacts(t, g);
    const page = {
      key: 'rooms-' + g.slug,
      group: g,
      path: `${p}/apartments/${g.slug}/`,
      render: T.roomsPage,
      title: T.esc(fillMeta(t.meta.rooms.title, f)),
      description: T.esc(fillMeta(t.meta.rooms.description, f)),
      sitemap: { priority: '0.8', changefreq: 'monthly' },
    };
    /* esc() выше нужен только для длины — в разметку title попадает
       через shell(), который экранирует сам. Возвращаем чистый текст. */
    page.title = fillMeta(t.meta.rooms.title, f);
    page.description = fillMeta(t.meta.rooms.description, f);
    page.jsonld = [
      crumbsLd(t, [
        { name: t.nav.apartments, path: `${p}/apartments/` },
        { name: f.short, path: page.path },
      ]),
      roomsLd(t, page),
    ];
    return page;
  });
}

const fillMeta = (text, f) => String(text).replace(/\{(\w+)\}/g, (m, k) => (k in f ? f[k] : m));

function pagesFor(t) {
  const p = t.lang === 'ru' ? '' : '/uz';
  const home = `${p}/` || '/';
  /* Предзагружаем ровно тот кадр, который человек видит первым. С v5 это
     рендер квартала: он занимает правые две трети экрана и почти всегда
     оказывается самым крупным элементом первой отрисовки (LCP). Чертёж
     ушёл в подложку левого поля и грузится обычным порядком. */
  const preloadHome = '<link rel="preload" as="image" href="/assets/img/opening-shot-1920.webp"'
    + ' imagesrcset="/assets/img/opening-shot-1280.webp 1280w, /assets/img/opening-shot-1920.webp 1920w,'
    + ' /assets/img/opening-shot-2560.webp 2560w"'
    + ' imagesizes="100vw" fetchpriority="high">';

  return [
    {
      key: 'home', path: home, render: T.home,
      title: t.meta.home.title, description: t.meta.home.description,
      preload: preloadHome,
      splash: site.splash,
      jsonld: [orgLd(t), siteLd(t), complexLd(t)],
      sitemap: { priority: '1.0', changefreq: 'weekly' },
    },
    {
      key: 'project', path: `${p}/project/`, render: T.project,
      title: t.meta.project.title, description: t.meta.project.description,
      jsonld: [crumbsLd(t, [{ name: t.nav.project, path: `${p}/project/` }])],
      sitemap: { priority: '0.9', changefreq: 'monthly' },
    },
    {
      key: 'apartments', path: `${p}/apartments/`, render: T.apartments,
      title: t.meta.apartments.title, description: t.meta.apartments.description,
      jsonld: [crumbsLd(t, [{ name: t.nav.apartments, path: `${p}/apartments/` }])],
      sitemap: { priority: '0.9', changefreq: 'monthly' },
    },
    {
      key: 'select', path: `${p}/select/`, render: T.select,
      title: t.meta.select.title, description: t.meta.select.description,
      jsonld: [crumbsLd(t, [{ name: t.nav.select, path: `${p}/select/` }])],
      sitemap: { priority: '0.9', changefreq: 'monthly' },
    },
    {
      key: 'instal', path: `${p}/installment/`, render: T.installment,
      title: t.meta.instal.title, description: t.meta.instal.description,
      jsonld: [crumbsLd(t, [{ name: t.nav.instal, path: `${p}/installment/` }])],
      sitemap: { priority: '0.9', changefreq: 'monthly' },
    },
    {
      key: 'genplan', path: `${p}/genplan/`, render: T.genplan,
      title: t.meta.genplan.title, description: t.meta.genplan.description,
      jsonld: [crumbsLd(t, [{ name: t.nav.genplan, path: `${p}/genplan/` }])],
      sitemap: { priority: '0.8', changefreq: 'monthly' },
    },
    {
      key: 'location', path: `${p}/location/`, render: T.location,
      title: t.meta.location.title, description: t.meta.location.description,
      jsonld: [crumbsLd(t, [{ name: t.nav.location, path: `${p}/location/` }])],
      sitemap: { priority: '0.8', changefreq: 'monthly' },
    },
    {
      key: 'faq', path: `${p}/faq/`, render: T.faq,
      title: t.meta.faq.title, description: t.meta.faq.description,
      jsonld: [crumbsLd(t, [{ name: t.nav.faq, path: `${p}/faq/` }]), faqLd(t)],
      sitemap: { priority: '0.7', changefreq: 'monthly' },
    },
    {
      key: 'contacts', path: `${p}/contacts/`, render: T.contacts,
      title: t.meta.contacts.title, description: t.meta.contacts.description,
      jsonld: [crumbsLd(t, [{ name: t.nav.contacts, path: `${p}/contacts/` }]), agentLd(t)],
      sitemap: { priority: '0.8', changefreq: 'monthly' },
    },
  ];
}

/* ---------- сборка ---------- */
function build() {
  rmrf(dist);
  fs.mkdirSync(dist, { recursive: true });

  /* Версия ассетов. Считаем её по всем нашим файлам, включая motion.js:
     раньше он в подсчёт не входил, а Vercel отдаёт /assets/* с кэшем на год —
     правка анимаций просто не доезжала до вернувшегося посетителя.

     Петля первого экрана считается здесь же по той же причине: имя файла у
     неё постоянное, а содержимое меняется при каждой перенарезке, и без
     этого вернувшийся посетитель смотрел бы старый монтаж. Читать ради
     версии полсотни мегабайт не жалко — сборка идёт раз в деплой. */
  const v = [
    'styles.css', 'script.js', path.join('assets', 'js', 'motion.js'),
    path.join('assets', 'video', 'promo-hero-1920.webm'),
  ].map((f) => hash(path.join(root, f))).join('-');
  const written = [];
  const urls = [];

  [ru, uz].forEach((t) => {
    /* Подстановки в title и description работали только на страницах по
       комнатности, и {price} в описании рассрочки уезжал в разметку как есть —
       поиск показывал «цена от {price} за м²». Теперь через fillMeta проходят
       заголовки всех страниц, а факты берутся оттуда же, откуда их берут
       тексты, так что цене неоткуда разойтись. */
    const common = T.facts(t);
    pagesFor(t).concat(roomPagesFor(t)).forEach((page) => {
      page.title = fillMeta(page.title, common);
      page.description = fillMeta(page.description, common);
      page.v = v;
      page.jsonld = [pageLd(t, page)].concat(page.jsonld || []);
      const filled = page.render(t, page);
      const html = T.shell(t, filled);
      const rel = page.path === '/' ? 'index.html' : page.path.replace(/^\//, '') + 'index.html';
      write(rel, html);
      written.push(rel);
      urls.push({ loc: T.url(page.path), alt: T.url(T.swap(page.path)), lang: t.lang, ...page.sitemap });
    });

    /* 404 — по одной на язык, отдаём русскую как общую */
    const nf = { path: t.lang === 'ru' ? '/404.html' : '/uz/404.html', v, render: T.notFound,
      title: t.meta.notFound.title, description: t.meta.notFound.description, jsonld: [] };
    const html404 = T.shell(t, T.notFound(t, nf, t.lang === 'ru' ? uz : null));
    write(nf.path.replace(/^\//, ''), html404);
    written.push(nf.path);
  });

  /* карта сайта: только канонические индексируемые адреса */
  /* Дата последнего изменения. Яндекс опирается на неё при выборе, что
     переобходить в первую очередь, и без неё считает карту неинформативной.
     Берём дату сборки: страницы генерируются целиком при каждом деплое,
     более точной величины у статики просто нет. */
  const lastmod = new Date().toISOString().slice(0, 10);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <xhtml:link rel="alternate" hreflang="ru" href="${u.lang === 'ru' ? u.loc : u.alt}"/>
    <xhtml:link rel="alternate" hreflang="uz" href="${u.lang === 'uz' ? u.loc : u.alt}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${u.lang === 'ru' ? u.loc : u.alt}"/>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
  write('sitemap.xml', sitemap);

  /* Файл подтверждения прав для Яндекс Вебмастера: должен лежать ровно в корне
     и отдаваться как HTML. Имя и содержимое задаёт Яндекс, менять их нельзя. */
  if (site.verify && site.verify.yandex) {
    write(`yandex_${site.verify.yandex}.html`, `<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    </head>
    <body>Verification: ${site.verify.yandex}</body>
</html>
`);
  }

  /* Иконка в корне и манифест: за favicon.ico браузеры и превью ссылок ходят
     по умолчанию, без разметки — именно поэтому в мессенджерах вместо марки
     показывался серый глобус. */
  fs.copyFileSync(path.join(root, 'assets', 'img', 'favicon.ico'), path.join(dist, 'favicon.ico'));
  write('site.webmanifest', JSON.stringify({
    name: site.brand,
    short_name: 'PARI',
    lang: 'ru',
    start_url: '/',
    background_color: '#FAFAFA',
    theme_color: '#B3832B',
    icons: [
      { src: '/assets/img/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/assets/img/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }, null, 2));

  /* robots.txt.
     Отдельный блок для Яндекса нужен не ради «Allow» — его смысл в Clean-param:
     без этой директивы каждая ссылка с utm-метками из рассылки или рекламы
     заводится как отдельная страница, и обе версии конкурируют друг с другом.
     Google то же самое решает через canonical, Яндекс — только так.
     CSS, скрипты и картинки не закрыты сознательно: закрытые ассеты не дают
     ни одному из роботов отрисовать страницу и оценить её мобильную версию. */
  const cleanParams = 'utm_source&utm_medium&utm_campaign&utm_term&utm_content'
    + '&yclid&gclid&fbclid&from&_openstat';
  write('robots.txt', `User-agent: *
Allow: /
Disallow: /api/

User-agent: Yandex
Allow: /
Disallow: /api/
Clean-param: ${cleanParams} /

Sitemap: ${T.url('/sitemap.xml')}
`);

  /* Иконка в корне и манифест: за favicon.ico браузеры и превью ссылок ходят
     по умолчанию, без разметки. Инлайнового SVG им мало — data-URI такие
     сборщики превью не читают, и в карточке остаётся серый глобус. */
  fs.copyFileSync(path.join(root, 'assets', 'img', 'favicon.ico'), path.join(dist, 'favicon.ico'));
  /* Часть сборщиков превью и iOS стучатся за /apple-touch-icon.png в корень,
     не читая разметку. Без файла там был 404 и подстановка чужой заглушки. */
  fs.copyFileSync(path.join(root, 'assets', 'img', 'apple-touch-icon.png'),
    path.join(dist, 'apple-touch-icon.png'));
  write('site.webmanifest', JSON.stringify({
    name: 'PARI Residence',
    short_name: 'PARI',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAFAFA',
    theme_color: '#B3832B',
    icons: [
      { src: '/assets/img/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/assets/img/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }, null, 2) + '\n');

  /* статические файлы */
  copyDir(path.join(root, 'assets'), path.join(dist, 'assets'));

  /* Контуры букв для письма пером: в исходнике лежат пять фраз, а на страницах
     используется только та, что помечена data-write. Лишние съедали 97 КБ из
     128 на каждом открытии главной — в сборку кладём ровно нужные. */
  const penUsed = new Set();
  written.filter((w) => w.endsWith('.html')).forEach((w) => {
    const html = fs.readFileSync(path.join(dist, w.replace(/^\//, '')), 'utf8');
    (html.match(/data-write="([^"]+)"/g) || []).forEach((m) => penUsed.add(m.slice(12, -1)));
  });
  ['ru', 'uz'].forEach((lang) => {
    const file = path.join(dist, 'assets', 'pen', lang + '.json');
    if (!fs.existsSync(file)) { return; }
    const all = JSON.parse(fs.readFileSync(file, 'utf8'));
    const keep = {};
    Object.keys(all).forEach((k) => { if (penUsed.has(k)) { keep[k] = all[k]; } });
    const before = fs.statSync(file).size;
    fs.writeFileSync(file, JSON.stringify(keep));
    console.log('  перо ' + lang + ': ' + Math.round(before / 1024) + ' -> '
      + Math.round(fs.statSync(file).size / 1024) + ' КБ, фраз ' + Object.keys(keep).length);
  });

  /* Реальный состав квартир для подбора. Пишем после копирования ассетов,
     иначе файл затрётся. Отдаём массивом массивов: имена полей у 1186 записей
     весили бы втрое больше, а читает их только один скрипт. */
  const list = flats.expand();
  const areas = list.map((f) => f.area);
  const floors = list.map((f) => f.floor);
  /* Откуда взята выгрузка, в файл не пишем: flats.json открыт всем, а имя
     CRM и номер дома в ней — внутренняя кухня застройщика. */
  write(path.join('assets', 'data', 'flats.json'), JSON.stringify({
    total: list.length,
    areaFrom: Math.min.apply(null, areas),
    areaTo: Math.max.apply(null, areas),
    floorFrom: Math.min.apply(null, floors),
    floorTo: Math.max.apply(null, floors),
    /* [подъезд, этаж, номер, комнат, площадь, студия] */
    items: list.map((f) => [f.ent, f.floor, f.num, f.rooms, f.area, f.studio ? 1 : 0]),
  }));
  console.log('Квартир в подборе:', list.length);
  ['styles.css', 'script.js'].forEach((f) => fs.copyFileSync(path.join(root, f), path.join(dist, f)));

  console.log('Собрано страниц:', written.length);
  written.forEach((w) => console.log('  ', w));
  console.log('Версия ассетов:', v);
  console.log('Адрес сайта:', site.origin);
}

build();
