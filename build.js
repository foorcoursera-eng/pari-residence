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
  sameAs: [site.instagram],
  address: {
    '@type': 'PostalAddress',
    streetAddress: t.lang === 'ru' ? site.address.street : site.address.streetUz,
    addressLocality: t.lang === 'ru' ? site.address.city : site.address.cityUz,
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
  image: T.url('/assets/img/hero-aerial-1920.webp'),
  description: t.meta.home.description,
  numberOfAccommodationUnits: site.facts.apartments,
  telephone: site.phone.intl,
  address: orgLd(t).address,
  geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lon },
  amenityFeature: [
    { '@type': 'LocationFeatureSpecification', name: t.home.yardEyebrow, value: true },
  ],
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
    parentOrganization: { '@id': T.url('/#organization') },
  };
  if (site.hours.confirmed && site.hours.schema) { o.openingHours = site.hours.schema; }
  return o;
};

const crumbsLd = (t, items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [{ name: t.ui.home, path: t.lang === 'ru' ? '/' : '/uz/' }].concat(items)
    .map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.name, item: T.url(x.path) })),
});

/* ---------- описание страниц ---------- */
function pagesFor(t) {
  const p = t.lang === 'ru' ? '' : '/uz';
  const home = `${p}/` || '/';
  /* Предзагружаем ровно тот кадр, который человек видит первым, — чертёж
     первого экрана. Раньше здесь стоял аэро-рендер: его убрали с экрана,
     а предзагрузка осталась, и браузер тянул с высоким приоритетом картинку,
     которую никто не показывает. */
  const preloadHome = '<link rel="preload" as="image" href="/assets/img/opening-line-1600.webp"'
    + ' imagesrcset="/assets/img/opening-line-1600.webp 1600w, /assets/img/opening-line-2400.webp 2400w"'
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

  const v = hash(path.join(root, 'styles.css')) + '-' + hash(path.join(root, 'script.js'));
  const written = [];
  const urls = [];

  [ru, uz].forEach((t) => {
    pagesFor(t).forEach((page) => {
      page.v = v;
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
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <xhtml:link rel="alternate" hreflang="${u.lang === 'ru' ? 'uz' : 'ru'}" href="${u.alt}"/>
    <xhtml:link rel="alternate" hreflang="${u.lang}" href="${u.loc}"/>
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

  write('robots.txt', `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${T.url('/sitemap.xml')}
`);

  /* статические файлы */
  copyDir(path.join(root, 'assets'), path.join(dist, 'assets'));
  ['styles.css', 'script.js'].forEach((f) => fs.copyFileSync(path.join(root, f), path.join(dist, f)));

  console.log('Собрано страниц:', written.length);
  written.forEach((w) => console.log('  ', w));
  console.log('Версия ассетов:', v);
  console.log('Адрес сайта:', site.origin);
}

build();
