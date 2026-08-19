/* ==========================================================================
   PARI Residence — шаблоны страниц.
   Все внутренние ссылки и пути к ассетам абсолютные: сайт живёт в корне домена.
   ========================================================================== */

'use strict';

const { site } = require('./content');

const esc = (s) => String(s).replace(/&(?!#?\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const url = (path) => site.origin.replace(/\/$/, '') + path;

/* путь страницы на другом языке */
const swap = (path) => (path.startsWith('/uz/') ? path.slice(3) || '/' : path === '/' ? '/uz/' : '/uz' + path);

/* ── бабочка: один силуэт, используется четырежды ── */
const WING = '<path class="w" d="M60 46C52 21 38 7 24 8 10 9 5 22 11 33 18 45 39 51 60 46Z"/>'
  + '<path class="w" d="M60 50C48 50 32 56 27 66 22 77 31 87 41 82 52 76 58 63 60 50Z"/>'
  + '<path class="spot" d="M24 14C16 16 12 23 14 29 20 25 22 19 24 14Z"/>'
  + '<path class="spot" d="M33 71C29 74 28 79 31 81 34 79 34 74 33 71Z"/>'
  + '<g class="vein"><path d="M57 45C46 38 34 27 26 14"/><path d="M57 46C46 42 34 38 14 31"/>'
  + '<path d="M58 52C48 58 39 66 34 78"/></g>';

const BUTTERFLY = '<svg viewBox="0 0 120 100">'
  + `<g class="wing wing--l">${WING}</g>`
  + `<g transform="translate(120,0) scale(-1,1)"><g class="wing wing--r">${WING}</g></g>`
  + '<ellipse class="body" cx="60" cy="54" rx="2.6" ry="15"/><circle class="body" cx="60" cy="37" r="3.1"/>'
  + '<path class="feeler" d="M58 35C55 27 50 21 44 17"/><circle class="club" cx="43.4" cy="16.4" r="1.5"/>'
  + '<path class="feeler" d="M62 35c3-8 8-14 14-18"/><circle class="club" cx="76.6" cy="16.4" r="1.5"/>'
  + '</svg>';

const fly = (mod, id) =>
  `<div class="fly fly--${mod}"${id ? ` id="${id}"` : ''} aria-hidden="true">`
  + `<div class="fly__bob">${BUTTERFLY}</div></div>`;

/* ── переключатель языка ── */
function langSwitch(t, path, extraClass) {
  const other = swap(path);
  const ruHref = t.lang === 'ru' ? path : other;
  const uzHref = t.lang === 'ru' ? other : path;
  const on = (code) => (t.lang === code ? ' is-on' : '');
  const cur = (code) => (t.lang === code ? ' aria-current="true"' : '');
  return `<nav class="lang${extraClass ? ' ' + extraClass : ''}" aria-label="${esc(t.ui.langLabel)}">
      <a class="lang__item${on('ru')}" href="${ruHref}" hreflang="ru" lang="ru"${cur('ru')}>RU</a>
      <a class="lang__item${on('uz')}" href="${uzHref}" hreflang="uz" lang="uz"${cur('uz')}>UZ</a>
    </nav>`;
}

/* ── пункты меню: на главной концепция ведёт к якорю ── */
function navItems(t) {
  const p = t.lang === 'ru' ? '' : '/uz';
  return [
    [`${p || '/'}${p ? '/' : ''}#concept`, t.nav.concept],
    [`${p}/apartments/`, t.nav.apartments],
    [`${p}/location/`, t.nav.location],
    [`${p}/contacts/`, t.nav.contacts],
  ];
}

function header(t, path) {
  const items = navItems(t).map(([href, label]) => `      <a href="${href}">${esc(label)}</a>`).join('\n');
  return `<header class="bar" id="bar">
  <a class="bar__logo" href="${t.lang === 'ru' ? '/' : '/uz/'}" aria-label="${site.brand}">
    <img src="/assets/img/pari-logo-vector.png" alt="${site.brand}" width="96" height="32">
  </a>

  <nav class="bar__nav" aria-label="${esc(t.ui.navLabel)}">
${items}
  </nav>

  <div class="bar__side">
    <button class="burger" id="burger" type="button" aria-expanded="false" aria-controls="menu" aria-label="${esc(t.ui.openMenu)}"><span></span><span></span></button>
    ${langSwitch(t, path)}
    <a class="btn btn--call" href="tel:${site.phone.tel}" data-track="phone_click">
      <span class="btn__text">${esc(t.ui.call)}</span>
      <span class="btn__num">${site.phone.display}</span>
    </a>
  </div>
</header>`;
}

function mobileMenu(t, path) {
  const items = navItems(t).map(([href, label]) => `        <a href="${href}">${esc(label)}</a>`).join('\n');
  return `<div class="menu" id="menu" hidden>
  <img class="menu__mark" src="/assets/img/brand-frame.png" alt="" width="640" height="616" aria-hidden="true">
  <div class="menu__inner">
    <nav class="menu__nav" aria-label="${esc(t.ui.menu)}">
${items}
    </nav>

    <div class="menu__foot">
      <a class="menu__tel" href="tel:${site.phone.tel}" data-track="phone_click">${site.phone.display}</a>
      <p class="menu__meta">${esc(t.lang === 'ru' ? site.hours.ru : site.hours.uz)}<br>${esc(addressLine(t))}</p>
      ${langSwitch(t, path, 'menu__lang')}
    </div>
  </div>
</div>`;
}

const addressLine = (t) => (t.lang === 'ru'
  ? `${site.address.city}, ${site.address.street}`
  : `${site.address.cityUz}, ${site.address.streetUz}`);

/* ── форма заявки: одна на весь сайт ── */
function leadForm(t, idSuffix) {
  const id = idSuffix ? `-${idSuffix}` : '';
  return `<form class="lead reveal" id="leadForm${id}" data-lead novalidate>
      <div class="field">
        <label for="f-name${id}">${esc(t.form.name)}</label>
        <input id="f-name${id}" name="name" type="text" placeholder="${esc(t.form.namePlaceholder)}" autocomplete="name" required>
        <span class="field__err">${esc(t.form.nameError)}</span>
      </div>
      <div class="field">
        <label for="f-phone${id}">${esc(t.form.phone)}</label>
        <input id="f-phone${id}" name="phone" type="tel" placeholder="+998 __ ___ __ __"
               autocomplete="tel" inputmode="tel" required>
        <span class="field__err">${esc(t.form.phoneError)}</span>
      </div>
      <div class="hp" aria-hidden="true">
        <label for="f-company${id}">${esc(t.form.company)}</label>
        <input id="f-company${id}" name="company" type="text" tabindex="-1" autocomplete="off">
      </div>
      <label class="consent">
        <input type="checkbox" name="consent" required>
        <span>${esc(t.form.consent)}</span>
      </label>
      <button class="btn-gold" type="submit" data-submit>${esc(t.form.submit)}</button>
      <p class="lead__status" data-status role="status" aria-live="polite"></p>
    </form>`;
}

/* ── блок «отдел продаж» с формой: финал главной и низ подстраниц ── */
function leadSection(t, opts) {
  const o = opts || {};
  return `<section class="final" id="call">
  <div class="final__inner">
    <div class="final__left">
      <div class="medallion reveal">
        <img class="medallion__frame" src="/assets/img/brand-frame.png" alt="" width="640" height="616" loading="lazy" decoding="async">
        <img class="medallion__logo" src="/assets/img/pari-logo-vector.png" alt="${site.brand}" width="1872" height="1031" loading="lazy" decoding="async">
      </div>
      <p class="eyebrow reveal">${esc(o.eyebrow || t.home.finalEyebrow)}</p>
      <${o.h || 'h2'} class="display reveal">${o.title || t.home.finalTitle}</${o.h || 'h2'}>
      <p class="final__text reveal">${esc(o.text || t.home.finalText)}</p>
      <a class="final__tel reveal" href="tel:${site.phone.tel}" data-track="phone_click">${site.phone.display}</a>
      <p class="final__meta reveal">${esc(t.lang === 'ru' ? site.hours.ru : site.hours.uz)}<br>${esc(addressLine(t))}</p>
      <a class="final__ig reveal" href="${site.instagram}" target="_blank" rel="noopener noreferrer">Instagram</a>
    </div>

    ${leadForm(t, o.formId)}
  </div>
  <p class="final__legal">${esc(t.ui.legal)}</p>
</section>`;
}

/* ── хлебные крошки ── */
function breadcrumbs(t, items) {
  const home = t.lang === 'ru' ? '/' : '/uz/';
  const links = [[home, t.ui.home]].concat(items);
  const html = links.map(([href, label], i) => (i === links.length - 1
    ? `<span aria-current="page">${esc(label)}</span>`
    : `<a href="${href}">${esc(label)}</a>`)).join('<i aria-hidden="true">·</i>');
  return `<nav class="crumbs" aria-label="${esc(t.ui.breadcrumbs)}">${html}</nav>`;
}

/* ── карта: грузится только по клику, чтобы не тянуть сторонний скрипт ── */
function mapBlock(t) {
  const q = `${site.geo.lon}%2C${site.geo.lat}`;
  const src = `https://yandex.uz/map-widget/v1/?ll=${q}&z=16&pt=${q},pm2rdm&lang=${t.lang}_UZ`;
  return `<div class="map reveal" data-map data-src="${src}">
      <button class="map__btn" type="button" data-track="map_click">${esc(t.ui.openMap)}</button>
      <p class="map__hint">${esc(t.ui.mapHint)}</p>
    </div>`;
}

/* ── список расстояний ── */
const distanceList = (t) => `<ul class="place__list">
${t.distances.map(([a, b]) => `      <li class="reveal"><span>${esc(a)}</span><b>${esc(b)}</b></li>`).join('\n')}
      </ul>`;

/* ══════════════ каркас страницы ══════════════ */
function shell(t, page) {
  const canonical = url(page.path);
  const alt = url(swap(page.path));
  const ruUrl = t.lang === 'ru' ? canonical : alt;
  const uzUrl = t.lang === 'ru' ? alt : canonical;
  const ld = (page.jsonld || []).map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n');

  return `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="ru" href="${ruUrl}">
<link rel="alternate" hreflang="uz" href="${uzUrl}">
<link rel="alternate" hreflang="x-default" href="${ruUrl}">
<meta name="theme-color" content="#FAFAFA">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${site.brand}">
<meta property="og:url" content="${canonical}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:image" content="${url('/assets/img/hero-poster-1600.webp')}">
<meta property="og:locale" content="${t.locale}">
<meta property="og:locale:alternate" content="${t.altLocale}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23B3832B'/%3E%3Cpath d='M9 24V13a7 7 0 0 1 14 0v3a4 4 0 0 1-4 4h-6' fill='none' stroke='%23FAFAFA' stroke-width='1.8'/%3E%3C/svg%3E">
${page.preload || ''}<link rel="stylesheet" href="/styles.css?v=${page.v}">
${ld}
</head>
<body${page.bodyClass ? ` class="${page.bodyClass}"` : ''}>
<a class="skip-link" href="#main">${esc(t.ui.skip)}</a>

${header(t, page.path)}

${mobileMenu(t, page.path)}

<main id="main" tabindex="-1">

${page.body}

</main>

<script src="/script.js?v=${page.v}" defer></script>
</body>
</html>
`;
}

/* ══════════════ главная ══════════════ */
function home(t, page) {
  const h = t.home;
  const cine = h.cine.map((c) => `  <figure class="frame">
    <img src="/assets/img/${c.img}-1920.webp"
         srcset="/assets/img/${c.img}-1080.webp 1080w, /assets/img/${c.img}-1920.webp 1920w"
         sizes="100vw" alt="${esc(c.cap)}" width="1920" height="960" loading="lazy" decoding="async">
    <figcaption class="frame__cap reveal">${esc(c.cap)}</figcaption>
  </figure>`).join('\n');

  const stats = h.stats.map((s) => `      <li><b data-count="${s.value}"${s.suffix ? ` data-suffix="${s.suffix}"` : ''}>${s.value}${s.suffix || ''}</b><span>${esc(s.label)}</span></li>`).join('\n');
  const tiles = h.homesTiles.map((x) => `      <li class="reveal"><b>${esc(x.value)}</b><span>${esc(x.label)}</span></li>`).join('\n');
  const apartmentsHref = t.lang === 'ru' ? '/apartments/' : '/uz/apartments/';

  page.body = `<!-- ══════════════ 1 · ТИТУЛ ══════════════ -->
<section class="hero" aria-label="${site.brand}">

  <picture>
    <source media="(max-width:700px)" srcset="/assets/img/hero-mobile-1080.webp">
    <img class="hero__media hero__media--still" src="/assets/img/hero-poster-1600.webp"
         srcset="/assets/img/hero-poster-1024.webp 1024w, /assets/img/hero-poster-1600.webp 1600w"
         sizes="100vw" alt="${esc(h.heroAlt)}" fetchpriority="high" width="1920" height="960">
  </picture>

  <!-- петля из имиджевого ролика: src подставляет скрипт (только десктоп) -->
  <video class="hero__media hero__media--video" id="heroVideo" muted loop playsinline
         preload="none" aria-hidden="true" tabindex="-1"
         poster="/assets/img/hero-poster-1600.webp"
         data-webm="/assets/video/hero-loop-{w}.webm"
         data-mp4="/assets/video/hero-loop-{w}.mp4"></video>

  <div class="hero__veil" aria-hidden="true"></div>

  ${langSwitch(t, page.path, 'hero__lang')}

  ${fly('near')}
  ${fly('mid')}
  ${fly('far')}
  ${fly('visit', 'flyVisit')}

  <div class="hero__inner">
    <div class="hero__top">
      <p class="eyebrow eyebrow--light">${h.heroEyebrow}</p>
      <img class="hero__logo" src="/assets/img/pari-logo-vector.png" alt="${site.brand}" width="360" height="120">
      <h1 class="hero__slogan" lang="uz">${h.heroSlogan}</h1>
    </div>

    <div class="hero__bottom">
      <p class="hero__sub">${esc(h.heroSub)}</p>
      <div class="cta-wrap">
        <a class="cta" href="tel:${site.phone.tel}" data-track="phone_click">
          <span class="cta__label">${esc(t.ui.call)}</span>
          <span class="cta__num">${site.phone.display}</span>
        </a>
      </div>
    </div>
  </div>

  <a class="scroll-hint" href="#concept" aria-label="${esc(t.ui.scrollNext)}"><img class="scroll-hint__mark" src="/assets/img/brand-frame.png" alt="" width="640" height="616"></a>
</section>

<!-- ══════════════ 2 · КОНЦЕПЦИЯ ══════════════ -->
<section class="concept" id="concept">
  <div class="concept__inner">
    <p class="eyebrow reveal"><span class="num">${h.conceptNum}</span> ${esc(h.conceptEyebrow)}</p>
    <h2 class="display reveal">${h.conceptTitle}</h2>

    <div class="concept__cols">
      <p class="reveal">${esc(h.conceptLeft)}</p>
      <p class="reveal">${esc(h.conceptRight)}</p>
    </div>
  </div>

  <figure class="relief reveal">
    <img src="/assets/img/relief-two-worlds.webp" alt="${esc(h.conceptReliefAlt)}"
         width="1347" height="941" loading="lazy" decoding="async">
  </figure>

  <p class="whisper reveal">${esc(h.conceptWhisper)}</p>
</section>

<!-- ══════════════ 3 · КИНОЛЕНТА ══════════════ -->
<section class="cine" id="film">
  <div class="cine__rail" aria-hidden="true"><i></i></div>
${cine}
</section>

<!-- ══════════════ 4 · ДВОР-ПАРК ══════════════ -->
<section class="split" id="yard">
  <div class="split__media">
    <img src="/assets/img/yard-1920.webp"
         srcset="/assets/img/yard-1080.webp 1080w, /assets/img/yard-1920.webp 1920w"
         sizes="(min-width:900px) 52vw, 100vw" alt="${esc(h.yardAlt)}"
         width="1920" height="1071" loading="lazy" decoding="async">
  </div>
  <div class="split__panel">
    <p class="eyebrow reveal"><span class="num">${h.yardNum}</span> ${esc(h.yardEyebrow)}</p>
    <h2 class="display reveal">${h.yardTitle}</h2>
    <p class="split__text reveal">${esc(h.yardText)}</p>
    <ul class="stats reveal">
${stats}
    </ul>
  </div>
</section>

<!-- ══════════════ 5 · ЛОКАЦИЯ ══════════════ -->
<section class="place" id="place">
  <div class="place__inner">
    <div>
      <p class="eyebrow reveal"><span class="num">${h.placeNum}</span> ${esc(h.placeEyebrow)}</p>
      <h2 class="display reveal">${h.placeTitle}</h2>
      ${distanceList(t)}
      <p class="place__addr reveal">${esc(addressLine(t))}</p>
      <a class="link-call reveal" href="${t.lang === 'ru' ? '/location/' : '/uz/location/'}">${esc(t.nav.location)}</a>
    </div>
    <img class="place__relief reveal" src="/assets/img/relief-bicycle.webp"
         alt="${esc(h.placeReliefAlt)}" width="926" height="1076" loading="lazy" decoding="async">
  </div>
</section>

<!-- ══════════════ 6 · КВАРТИРЫ ══════════════ -->
<section class="homes" id="homes">
  <div class="homes__inner">
    <p class="eyebrow reveal"><span class="num">${h.homesNum}</span> ${esc(h.homesEyebrow)}</p>
    <h2 class="display reveal">${h.homesTitle}</h2>
    <ul class="homes__tiles">
${tiles}
    </ul>
    <p class="homes__note reveal">${esc(h.homesNote)}</p>
    <a class="link-call reveal" href="${apartmentsHref}">${esc(h.homesLink)}</a>
  </div>
  <img class="homes__photo" src="/assets/img/lobby-1920.webp"
       srcset="/assets/img/lobby-1080.webp 1080w, /assets/img/lobby-1920.webp 1920w"
       sizes="100vw" alt="${esc(h.homesAlt)}" width="1672" height="941" loading="lazy" decoding="async">
</section>

${leadSection(t, {})}`;
  return page;
}

/* ══════════════ квартиры ══════════════ */
function apartments(t, page) {
  const a = t.apartments;
  const cards = a.types.map((x) => `    <article class="type reveal">
      <img src="/assets/img/${x.img}-1080.webp" alt="${esc(x.alt)}" width="1080" height="540" loading="lazy" decoding="async">
      <div class="type__body">
        <h3 class="type__title">${esc(x.title)}</h3>
        <p class="type__area">${esc(x.area)}</p>
        <p class="type__text">${esc(x.text)}</p>
        <a class="link-call" href="#call">${esc(t.cta.availability)}</a>
      </div>
    </article>`).join('\n');

  page.body = `<section class="page">
  <div class="page__inner">
    ${breadcrumbs(t, [[page.path, t.nav.apartments]])}
    <h1 class="display">${esc(a.h1)}</h1>
    <p class="page__lead">${esc(a.lead)}</p>
    <p class="page__price">${esc(a.priceLine)}<span>${esc(t.ui.priceNote)}</span></p>
  </div>

  <div class="types">
${cards}
  </div>

  <div class="page__inner">
    <h2 class="page__h2">${esc(a.finishTitle)}</h2>
    <p class="page__text">${esc(a.finishText)}</p>
  </div>
</section>

${leadSection(t, { formId: 'apartments', title: t.cta.primary, text: t.contacts.visitText, eyebrow: t.nav.contacts })}`;
  return page;
}

/* ══════════════ локация ══════════════ */
function location(t, page) {
  const l = t.location;
  page.body = `<section class="page">
  <div class="page__inner">
    ${breadcrumbs(t, [[page.path, t.nav.location]])}
    <h1 class="display">${esc(l.h1)}</h1>
    <p class="page__lead">${esc(l.lead)}</p>
  </div>

  <div class="page__inner page__grid">
    <div>
      ${distanceList(t)}
      <p class="place__addr">${esc(addressLine(t))}</p>
    </div>
    <img class="place__relief" src="/assets/img/relief-bicycle.webp"
         alt="${esc(t.home.placeReliefAlt)}" width="926" height="1076" loading="lazy" decoding="async">
  </div>

  <div class="page__inner">
    <h2 class="page__h2">${esc(l.districtTitle)}</h2>
    <p class="page__text">${esc(l.districtText)}</p>
    <h2 class="page__h2">${esc(l.mapTitle)}</h2>
    ${mapBlock(t)}
  </div>
</section>

${leadSection(t, { formId: 'location', title: t.cta.primary, text: t.contacts.visitText, eyebrow: t.nav.contacts })}`;
  return page;
}

/* ══════════════ контакты ══════════════ */
function contacts(t, page) {
  const c = t.contacts;
  page.body = `<section class="page">
  <div class="page__inner">
    ${breadcrumbs(t, [[page.path, t.nav.contacts]])}
    <h1 class="display">${esc(c.h1)}</h1>
    <p class="page__lead">${esc(c.lead)}</p>

    <dl class="nap">
      <div><dt>${esc(c.phoneLabel)}</dt><dd><a class="nap__tel" href="tel:${site.phone.tel}" data-track="phone_click">${site.phone.display}</a></dd></div>
      <div><dt>${esc(c.hoursLabel)}</dt><dd>${esc(t.lang === 'ru' ? site.hours.ru : site.hours.uz)}</dd></div>
      <div><dt>${esc(c.addressLabel)}</dt><dd>${esc(addressLine(t))}</dd></div>
      <div><dt>${esc(c.socialLabel)}</dt><dd><a href="${site.instagram}" target="_blank" rel="noopener noreferrer">Instagram</a></dd></div>
    </dl>

    ${mapBlock(t)}
  </div>
</section>

${leadSection(t, { formId: 'contacts', h: 'h2', title: esc(c.visitTitle), text: c.visitText, eyebrow: t.nav.contacts })}`;
  return page;
}

/* ══════════════ 404 ══════════════ */
function notFound(t, page) {
  const n = t.notFound;
  const p = t.lang === 'ru' ? '' : '/uz';
  page.body = `<section class="page page--404">
  <div class="page__inner">
    <img class="page__mark" src="/assets/img/brand-frame.png" alt="" width="640" height="616">
    <h1 class="display">${esc(n.h1)}</h1>
    <p class="page__lead">${esc(n.text)}</p>
    <ul class="page__links">
      <li><a href="${p || '/'}${p ? '/' : ''}">${esc(t.ui.home)}</a></li>
      <li><a href="${p}/apartments/">${esc(t.nav.apartments)}</a></li>
      <li><a href="${p}/contacts/">${esc(t.nav.contacts)}</a></li>
      <li><a href="tel:${site.phone.tel}" data-track="phone_click">${site.phone.display}</a></li>
    </ul>
  </div>
</section>`;
  return page;
}

module.exports = { shell, home, apartments, location, contacts, notFound, swap, url, esc };
