/* ==========================================================================
   PARI Residence — шаблоны страниц.
   Все внутренние ссылки и пути к ассетам абсолютные: сайт живёт в корне домена.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');

const { site, blocks } = require('./content');
const flats = require('./flats');
const LOGO = require('./logo-parts.json');

/* ── размеры картинки прямо из файла ──
   Планировки разной высоты, и проставлять width/height вручную — верный способ
   рано или поздно соврать: браузер зарезервирует не ту площадь, страница
   дёрнется при загрузке. Читаем заголовок WebP: RIFF → VP8X / VP8L / VP8. */
const sizeCache = new Map();
function imgSize(rel) {
  if (sizeCache.has(rel)) { return sizeCache.get(rel); }
  let out = null;
  try {
    const b = fs.readFileSync(path.join(__dirname, '..', rel));
    const tag = b.toString('ascii', 12, 16);
    if (tag === 'VP8X') {
      out = { w: (b.readUIntLE(24, 3) & 0xffffff) + 1, h: (b.readUIntLE(27, 3) & 0xffffff) + 1 };
    } else if (tag === 'VP8L') {
      const n = b.readUInt32LE(21);
      out = { w: (n & 0x3fff) + 1, h: ((n >> 14) & 0x3fff) + 1 };
    } else if (tag === 'VP8 ') {
      out = { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    }
  } catch (e) { out = null; }
  sizeCache.set(rel, out);
  return out;
}

/* Стрелка кнопок и ссылок: одна на весь сайт, штрихом, наследует цвет. */
const ARROW = '<svg class="i-arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
/* Текстовая ссылка: первая линия уходит вправо, вторая (<i>) приходит слева. */
/* Стрелки и точки под лентой (телефон): motion.js включает их, только когда
   лента действительно прокручивается. */
const railNav = (t) => `  <div class="rail-nav" data-strip-nav aria-label="${esc(t.ui.railHint)}">
    <button class="rail-nav__btn" type="button" data-strip-prev aria-label="${esc(t.ui.railPrev)}">${ARROW}</button>
    <span class="rail-dots" data-strip-dots role="tablist"></span>
    <button class="rail-nav__btn rail-nav__btn--next" type="button" data-strip-next aria-label="${esc(t.ui.railNext)}">${ARROW}</button>
  </div>`;
const sLink = (href, label, extra) => `<a class="s-link${extra ? ' ' + extra : ''}" href="${href}">${esc(label)}<i></i>${ARROW}</a>`;

const esc = (s) => String(s).replace(/&(?!#?\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const url = (path) => site.origin.replace(/\/$/, '') + path;

/* путь страницы на другом языке */
/* Адрес той же страницы на другом языке. У 404 такой страницы нет: она одна
   на весь сайт и переключает язык скриптом, поэтому переключатель с неё ведёт
   на главные — иначе ссылка указывала бы на /uz/404.html, которого больше не
   собирается. */
const swap = (path) => (path === '/404.html' ? '/uz/' : path.startsWith('/uz/') ? path.slice(3) || '/' : path === '/' ? '/uz/' : '/uz' + path);


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

/* ── пункты меню ── */
/* ── разделы в меню ──
   Три списка, а не один. В шапке помещается семь пунктов: восьмой начинает
   переноситься на вторую строку и ломает ряд, поэтому «Вопросы» из неё убраны —
   в полном меню и в подвале они остались. В подвале лежат вообще все адреса,
   включая страницы по комнатности: так у каждой страницы есть входящая ссылка
   с любой другой, и роботу не приходится искать их через карту сайта. */
function navItems(t) {
  const p = t.lang === 'ru' ? '' : '/uz';
  return [
    [`${p}/project/`, t.nav.project],
    [`${p}/apartments/`, t.nav.apartments],
    /* Генплан снят: раздел в разработке. Вернуть — расскобить строку. */
    // [`${p}/genplan/`, t.nav.genplan],
    [`${p}/select/`, t.nav.select],
    [`${p}/installment/`, t.nav.instal],
    [`${p}/location/`, t.nav.location],
    [`${p}/contacts/`, t.nav.contacts],
  ];
}

function menuItems(t) {
  const p = t.lang === 'ru' ? '' : '/uz';
  const all = navItems(t);
  all.splice(all.length - 1, 0, [`${p}/faq/`, t.nav.faq]);
  return all;
}

function footerItems(t) {
  const p = t.lang === 'ru' ? '' : '/uz';
  return menuItems(t).concat(
    roomGroups().map((g) => [`${p}/apartments/${g.slug}/`, t.rooms.groups[g.key].short]),
  );
}

function header(t, path) {
  /* В строку шапки идут четыре пункта, а не все шесть: слева от логотипа
     половина ширины, и шесть пунктов в разрядку переносились на две строки
     уже на 1440. Полный список — в меню по кнопке и в подвале. */
  const inline = new Set(['/project/', '/apartments/', '/installment/', '/contacts/']);
  const items = navItems(t)
    .filter(([href]) => inline.has(href.replace(/^\/uz/, '')))
    .map(([href, label]) => `      <a href="${href}"${path.startsWith(href) ? ' class="is-current" aria-current="page"' : ''}>${esc(label)}</a>`).join(String.fromCharCode(10));
  /* Плотное состояние проставляем прямо в разметке всюду, кроме главной:
     там шапка выезжает после первого экрана, а на внутренних страницах она
     нужна с первого кадра. Раньше её показывал только скрипт — при
     неотработавшем JavaScript страница оставалась без логотипа, меню и
     телефона. */
  const inner = path !== '/' && path !== '/uz/';
  /* На главной шапка приходит последней в хореографии первого экрана
     (класс is-intro снимает motion.js); без скрипта она видна сразу. */
  return `<header class="bar${inner ? ' is-solid' : ''}" id="bar"${inner ? '' : ' data-bar-intro'}>
  <span class="bar__progress" aria-hidden="true"></span>
  <a class="bar__logo" href="${t.lang === 'ru' ? '/' : '/uz/'}" aria-label="${site.brand}">
    <!-- Лёгкая копия марки: полноразмерный PNG весил 53 КБ ради 96 px в шапке. -->
    <img src="/assets/img/pari-logo-400.webp" alt="${site.brand}" width="96" height="32">
  </a>

  <nav class="bar__nav" aria-label="${esc(t.ui.navLabel)}">
${items}
  </nav>
  ${langSwitch(t, path, 'bar__lang-phone')}

  <div class="bar__side">
    <button class="burger" id="burger" type="button" aria-expanded="false" aria-controls="menu" aria-label="${esc(t.ui.openMenu)}"><span></span><span></span></button>
    ${langSwitch(t, path)}
    <a class="btn btn--call" href="tel:${site.phone.tel}" data-track="phone_click" aria-label="${esc(t.ui.call)} ${site.phone.display}">
      <span class="btn__text">${esc(t.ui.call)}</span>
      <span class="btn__num">${site.phone.display}</span>
      <!-- На телефоне вместо номера — трубка: иначе правая группа шире
           половины экрана и логотип не встаёт по центру. -->
      <svg class="btn__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5c.5 0 .9.3 1.1.7l1.5 3.4c.2.4.1.9-.2 1.2L7.6 10.2a12.6 12.6 0 0 0 6.2 6.2l1.4-1.4c.3-.3.8-.4 1.2-.2l3.4 1.5c.4.2.7.6.7 1.1v2.4c0 .7-.6 1.3-1.3 1.2C10.4 20.3 3.7 13.6 3 4.8c-.1-.7.5-1.3 1.2-1.3h2.4Z" fill="currentColor"/></svg>
    </a>
  </div>
</header>`;
}

function mobileMenu(t, path) {
  const items = menuItems(t).map(([href, label], i) => `        <a class="menu__link" href="${href}" style="--i:${i}"${path === href ? ' aria-current="page"' : ''}>
          <i>${String(i + 1).padStart(2, '0')}</i><span>${esc(label)}</span>
        </a>`).join('\n');
  return `<div class="menu" id="menu" hidden>
  <div class="menu__inner">
    <nav class="menu__nav" aria-label="${esc(t.ui.navLabel)}">
${items}
    </nav>

    <div class="menu__foot">
      <a class="menu__call" href="tel:${site.phone.tel}" data-track="phone_click">
        <span>${esc(t.ui.call)}</span><b>${site.phone.display}</b>
      </a>
      <p class="menu__meta">${esc(t.lang === 'ru' ? site.hours.ru : site.hours.uz)}<br>${esc(addressLine(t))}</p>
      <p class="menu__social">
        <a href="${site.telegram}" target="_blank" rel="noopener noreferrer" data-track="telegram_click">Telegram</a>
        <a href="${site.instagram}" target="_blank" rel="noopener noreferrer">Instagram</a>
      </p>
      ${langSwitch(t, path, 'menu__lang')}
    </div>
  </div>
</div>`;
}


/* Рассрочка тянется до сдачи первой очереди, значит срок сокращается сам собой.
   Считаем его при сборке и ограничиваем максимумом, который назвал владелец. */
function instalmentMonths() {
  const stage = site.stages.find((x) => x.no === site.instalment.untilStage);
  const end = new Date(Date.UTC(stage.year, stage.quarter * 3, 0));
  const now = new Date();
  const months = (end.getUTCFullYear() - now.getUTCFullYear()) * 12
    + (end.getUTCMonth() - now.getUTCMonth());
  return Math.max(1, Math.min(site.instalment.maxMonths, months));
}

const romans = ['', 'I', 'II', 'III', 'IV'];

const addressLine = (t) => (t.lang === 'ru'
  ? `${site.address.city}, ${site.address.street}`
  : `${site.address.cityUz}, ${site.address.streetUz}`);

/* ── форма заявки: одна на весь сайт ── */
function leadForm(t, idSuffix) {
  const id = idSuffix ? `-${idSuffix}` : '';
  return `<form class="lead reveal" id="leadForm${id}" data-lead novalidate
      data-say-ok="${esc(t.form.ok)}" data-say-late="${esc(t.form.okLate)}"
      data-say-bad="${esc(t.form.bad)}" data-say-fail="${esc(t.form.fail)}"
      data-say-sending="${esc(t.form.sending)}">
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
      <fieldset class="rooms">
        <legend>${esc(t.form.rooms)}</legend>
        <div class="rooms__set">
${[t.form.roomsAny].concat(t.form.roomsList).map((r, i) => `          <label class="chip">
            <input type="radio" name="rooms" value="${i === 0 ? '' : esc(r)}"${i === 0 ? ' checked' : ''}>
            <span>${esc(r)}</span>
          </label>`).join('\n')}
        </div>
        <p class="rooms__hint">${esc(t.form.roomsHint)}</p>
      </fieldset>
      <div class="hp" aria-hidden="true">
        <label for="f-company${id}">${esc(t.form.company)}</label>
        <input id="f-company${id}" name="company" type="text" tabindex="-1" autocomplete="off">
      </div>
      <label class="consent">
        <input type="checkbox" name="consent" required>
        <span>${esc(t.form.consent)}</span>
      </label>
      <p class="lead__privacy">${esc(t.form.privacy)}</p>
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
        <img class="medallion__logo" src="/assets/img/pari-logo-400.webp" alt="${site.brand}" width="400" height="220" loading="lazy" decoding="async">
      </div>
      <p class="eyebrow reveal">${esc(o.eyebrow || t.home.finalEyebrow)}</p>
      <${o.h || 'h2'} class="display reveal">${o.title || t.home.finalTitle}</${o.h || 'h2'}>
      <p class="final__text reveal">${esc(o.text || t.home.finalText)}</p>
      <a class="final__tel reveal" href="tel:${site.phone.tel}" data-track="phone_click">${site.phone.display}</a>
      <p class="final__meta reveal">${esc(t.lang === 'ru' ? site.hours.ru : site.hours.uz)}<br>${esc(addressLine(t))}<br>${esc(site.developer.name)}</p>
      <p class="final__social reveal">
        <a href="${site.telegram}" target="_blank" rel="noopener noreferrer" data-track="telegram_click">Telegram</a>
        <a href="${site.instagram}" target="_blank" rel="noopener noreferrer">Instagram</a>
      </p>
    </div>

    ${leadForm(t, o.formId)}
  </div>
  <p class="final__legal">${esc(t.ui.legal)}</p>
</section>`;
}


/* ── подстановка фактов в тексты ──
   Ответы в разделе «Вопросы и ответы» написаны с плейсхолдерами вида {price}.
   Так цена, срок рассрочки и сроки очередей живут ровно в одном месте (site
   в content.js): поправили там — поменялось и в ответе, и в микроразметке.
   Возвращается чистый текст без разметки: его же отдаём в JSON-LD. */
function facts(t) {
  const ru = t.lang === 'ru';
  const stage = (n) => {
    const x = site.stages.find((v) => v.no === n);
    return ru
      ? `${romans[x.quarter]} квартал ${x.year} года`
      : `${x.year}-yil ${romans[x.quarter]} chorak`;
  };
  const months = instalmentMonths();
  return {
    price: `${site.price.from} ${ru ? site.price.unit : site.price.unitUz}`,
    months: ru ? `${months} ${plural(months, ['месяцев', 'месяц', 'месяца'])}` : `${months} oy`,
    developer: site.developer.name,
    bank: site.bank.name,
    architect: site.architect.name,
    apartments: String(site.facts.apartments),
    blocks: String(site.facts.blocks),
    areaFrom: String(site.facts.areaFrom),
    areaTo: String(site.facts.areaTo),
    plans: String(t.plans.items.length),
    plansWord: ru
      ? `${t.plans.items.length} ${plural(t.plans.items.length, ['планировок', 'планировка', 'планировки'])}`
      : `${t.plans.items.length} ta tarh`,
    street: ru ? site.address.street : site.address.streetUz,
    stage1: stage(1),
    stage2: stage(2),
    address: addressLine(t),
    phone: site.phone.intl,
    hours: (ru ? site.hours.ru : site.hours.uz).toLowerCase(),
    buildStage: ru ? site.build.stage : site.build.stageUz,
    buildAsOf: ru ? site.build.asOf : site.build.asOfUz,
  };
}

/* «36 месяцев», но «22 месяца» — иначе ответ читается как машинный перевод */
function plural(n, forms) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) { return forms[0]; }
  if (b > 1 && b < 5) { return forms[2]; }
  if (b === 1) { return forms[1]; }
  return forms[0];
}

const fill = (text, f) => String(text).replace(/\{(\w+)\}/g, (m, k) => (k in f ? f[k] : m));

/* Пары «вопрос — ответ» с уже подставленными фактами. Один источник и для
   разметки страницы, и для FAQPage: расхождение между тем, что видит человек,
   и тем, что читает поисковик, — прямое нарушение правил обеих систем. */
function faqPairs(t) {
  const f = facts(t);
  return t.faq.items.map((x) => ({ q: fill(x.q, f), a: fill(x.a, f) }));
}


/* ── группы по комнатности ──
   Порядок и адреса заданы здесь один раз: по ним строятся страницы, меню
   внутри раздела «Квартиры», карта сайта и хлебные крошки. Слаг латиницей
   и одинаков в обоих языках — так ссылку можно печатать и диктовать.
   Группа попадает на сайт, только если в шахматке есть хоть одна такая
   квартира: пустых страниц под запрос не делаем. */
const ROOM_GROUPS = [
  { key: 's', slug: 'studio' },
  { key: '1', slug: '1-room' },
  { key: '2', slug: '2-room' },
  { key: '3', slug: '3-room' },
  { key: '4', slug: '4-room' },
];

/* Сколько листов планировок печатаем на странице комнатности. */
const PLANS_SHOWN = 4;

let statsCache = null;
const roomStats = () => (statsCache || (statsCache = flats.stats()));

function roomGroups() {
  const st = roomStats();
  return ROOM_GROUPS.filter((g) => st[g.key] && st[g.key].count)
    .map((g) => Object.assign({}, g, st[g.key]));
}

/* Площадь в текст: в данных 41.69, на странице 41,69 — как на чертежах. */
const area = (n) => String(n.toFixed(2)).replace('.', ',');

/* Подстановки для страницы комнатности. */
function roomFacts(t, g) {
  const r = t.rooms;
  const ru = t.lang === 'ru';
  const n = g.entrances.length;
  const ents = fill(r.entIn[ru ? plIndex(n) : 0], { n: String(n) });
  return {
    title: r.groups[g.key].title,
    /* Та же подпись со строчной буквы: в узбекском заголовке она стоит после
       «Samarqandda», и «Samarqandda Toʻrt xonali» читается как опечатка. */
    titleLc: r.groups[g.key].title.charAt(0).toLowerCase() + r.groups[g.key].title.slice(1),
    short: r.groups[g.key].short,
    count: `${g.count} ${r.groups[g.key].forms[ru ? plIndex(g.count) : 0]}`,
    countN: String(g.count),
    areaFrom: area(g.areaFrom),
    areaTo: area(g.areaTo),
    /* У четырёхкомнатных площадь одна на все 71 квартиру — «от 89,11 до 89,11»
       выглядит как ошибка, поэтому диапазон схлопывается в одно число. */
    areaSpan: g.areaFrom === g.areaTo
      ? `${area(g.areaFrom)} ${t.ui.sqm}`
      : (ru ? `от ${area(g.areaFrom)} до ${area(g.areaTo)} ${t.ui.sqm}`
            : `${area(g.areaFrom)}–${area(g.areaTo)} ${t.ui.sqm}`),
    floorSpan: g.floorFrom === g.floorTo ? String(g.floorFrom)
      : (ru ? `с ${g.floorFrom}-го по ${g.floorTo}-й` : `${g.floorFrom}–${g.floorTo}`),
    floorFrom: String(g.floorFrom),
    floorTo: String(g.floorTo),
    entrances: ents,
    price: `${site.price.from} ${ru ? site.price.unit : site.price.unitUz}`,
    months: ru
      ? `${instalmentMonths()} ${plural(instalmentMonths(), ['месяцев', 'месяц', 'месяца'])}`
      : `${instalmentMonths()} oy`,
  };
}

/* Индекс формы во множественном числе: 0 — «подъездов», 1 — «подъезд», 2 — «подъезда» */
function plIndex(n) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) { return 0; }
  if (b > 1 && b < 5) { return 2; }
  if (b === 1) { return 1; }
  return 0;
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
function mapBlock(t, mod) {
  const q = `${site.geo.lon}%2C${site.geo.lat}`;
  const src = `https://yandex.uz/map-widget/v1/?ll=${q}&z=16&pt=${q},pm2rdm&lang=${t.lang}_UZ`;
  return `<div class="map${mod ? ' ' + mod : ''}" data-map data-src="${src}">
      <div class="map__card">
        <p class="map__addr">${esc(addressLine(t))}</p>
        <p class="map__hours">${esc(t.lang === 'ru' ? site.hours.ru : site.hours.uz)}</p>
        <button class="map__btn" type="button" data-track="map_click">${esc(t.ui.openMap)}</button>
        <p class="map__hint">${esc(t.ui.mapHint)}</p>
      </div>
    </div>`;
}

/* ── карточка планировки ──
   В карточке — только чертёж, крупно и целиком. По нажатию открывается страница
   буклета: там и размеры, и роза инсоляции, и расположение квартиры на этаже
   и в комплексе. Раньше в карточку попадал обрезанный кусок чертежа — заказчик
   справедливо это заметил. */
function planCard(t, x) {
  const p = t.plans;
  const size = imgSize(`assets/img/plans/${x.id}-800.webp`) || { w: 900, h: 1100 };
  const rooms = x.studio ? p.studioWord : p.roomWord[x.rooms];
  const blocks = `${p.blockWord[x.blocks.length > 1 ? 2 : 1]} ${x.blocks.join(', ')}`;
  const label = `${rooms} · ${x.area} ${t.ui.sqm} · ${blocks}`;
  return `      <article class="plan reveal" data-rooms="${x.rooms}" data-area="${x.area.replace(',', '.')}">
        <button class="plan__view" type="button"
                data-zoom="/assets/img/plans/${x.id}-1400.webp"
                data-zoom-label="${esc(label)}"
                aria-label="${esc(p.zoom)}: ${esc(label)}">
          <!-- Лист 1400 лежит рядом и раньше открывался только по клику, а в
               карточке всегда стоял 800: на плотном экране чертёж выходил
               мыльным. А чертёж — это ровно то, что человек и рассматривает. -->
          <img src="/assets/img/plans/${x.id}-800.webp"
               srcset="/assets/img/plans/${x.id}-800.webp 800w, /assets/img/plans/${x.id}-1400.webp 1400w"
               sizes="(min-width:640px) 44vw, 88vw"
               alt="${esc(rooms)} ${x.area} ${t.ui.sqm} — ${esc(t.ui.planWord)}"
               width="${size.w}" height="${size.h}" loading="lazy" decoding="async">
          <span class="plan__zoom">${esc(p.zoom)}</span>
        </button>
        <div class="plan__meta">
          <p class="plan__area">${x.area} <span>${t.ui.sqm}</span></p>
          <p class="plan__rooms">${esc(rooms)}</p>
          <p class="plan__blocks">${esc(blocks)}</p>
        </div>
      </article>`;
}

/* ── галерея входных групп ──
   Кадры вертикальные (2871×4105), поэтому не отдаём им широкие версии: в
   колонке они и так не шире шестисот точек. Порядок кадров — проход человека
   с улицы к лифтам, подписи идут под кадром, как в журнале. */
function lobbyGrid(items) {
  return items.map((g, i) => `      <figure class="lobby__shot reveal">
        <img src="/assets/img/${g.img}-760.webp"
             srcset="/assets/img/${g.img}-760.webp 760w, /assets/img/${g.img}-1180.webp 1180w"
             sizes="(min-width:1100px) 23vw, (min-width:620px) 46vw, 88vw"
             alt="${esc(g.cap)}" width="760" height="1087"
             loading="lazy" decoding="async">
        <figcaption><i>${String(i + 1).padStart(2, '0')}</i>${esc(g.cap)}</figcaption>
      </figure>`).join('\n');
}

/* ── ряд кадров: один крупный, остальные обычные ── */
function shotGrid(items, sizes) {
  return items.map((g) => `    <figure class="shot${g.big ? ' shot--big' : ''}${g.wide ? ' shot--wide' : ''} reveal">
      <img src="/assets/img/${g.img}-1280.webp"
           srcset="/assets/img/${g.img}-1280.webp 1280w, /assets/img/${g.img}-1920.webp 1920w, /assets/img/${g.img}-2560.webp 2560w"
           sizes="${sizes}" alt="${esc(g.cap)}"
           width="2560" height="1429" loading="lazy" decoding="async">
      <figcaption>${esc(g.cap)}</figcaption>
    </figure>`).join('\n');
}

/* ── галерея архитектуры в формате образца ──
   У stellarresidence.uz все кадры галереи одной пропорции 0,93 и одного
   размера — именно это заказчик и назвал «не тот формат». Наши кадры резались
   каждый по-своему, вплоть до панорамы 3,93. Файлы -sq- готовит
   tools/make-formats.py настоящим кадрированием из исходных рендеров. */
function squareGrid(items) {
  return items.map((g) => `      <figure class="tile reveal">
        <img src="/assets/img/${g.img}-sq-700.webp"
             srcset="/assets/img/${g.img}-sq-700.webp 700w, /assets/img/${g.img}-sq-1100.webp 1100w, /assets/img/${g.img}-sq-1400.webp 1400w"
             sizes="(min-width:900px) 34vw, 76vw" alt="${esc(g.cap)}"
             width="1400" height="1501" loading="lazy" decoding="async">
        <figcaption>${esc(g.cap)}</figcaption>
      </figure>`).join('\n');
}

/* ── мастер-план района с легендой ──
   Легенда набирается разметкой, а не берётся с картинки: так она читается на
   узбекском и не расплывается при увеличении. */
function masterplan(t) {
  const l = t.location;
  return `<figure class="master reveal">
      <button class="master__view" type="button"
              data-zoom="/assets/img/masterplan-2560.webp"
              data-zoom-label="${esc(l.masterTitle)}"
              aria-label="${esc(t.ui.zoomOpen)}: ${esc(l.masterTitle)}">
        <img src="/assets/img/masterplan-1600.webp"
             srcset="/assets/img/masterplan-1000.webp 1000w, /assets/img/masterplan-1600.webp 1600w, /assets/img/masterplan-2560.webp 2560w"
             sizes="(min-width:900px) 70vw, 100vw" alt="${esc(l.masterAlt)}"
             width="2560" height="1415" loading="lazy" decoding="async">
        <span class="master__zoom">${esc(t.ui.zoomOpen)}</span>
      </button>
      <figcaption class="master__legend">
        <b>${esc(t.ui.legend)}</b>
        <ul>
${l.masterLegend.map((x) => `          <li>${esc(x)}</li>`).join('\n')}
        </ul>
      </figcaption>
    </figure>`;
}

/* ── схема окружения ──
   Своя карта вместо чужого виджета: на нём офис продаж ничем не подписан,
   потому что карточка организации в Яндексе ещё не заведена, и заказчик
   справедливо сказал, что «не видно PARI». Здесь квартал — главная точка,
   а вокруг пронумерованы места, до которых чаще всего едут.

   Схема не рисуется на глаз: координаты точек лежат в site.places, здесь они
   переводятся в метры от квартала (равнопромежуточная проекция — на таких
   расстояниях искажение меньше метра) и укладываются в поле. Поэтому
   направления и расстояния на схеме настоящие: аэропорт действительно
   северо-восточнее, Регистан — юго-восточнее.

   Каждая точка — ссылка на карту с её координатами. */
function localMap(t, mod) {
  const R = 111320;                       /* метров в градусе широты */
  const kx = Math.cos(site.geo.lat * Math.PI / 180);
  const pts = site.places.map((p, i) => ({
    id: p.id,
    n: i + 1,
    lat: p.lat,
    lon: p.lon,
    x: (p.lon - site.geo.lon) * R * kx,
    y: -(p.lat - site.geo.lat) * R,       /* на экране вниз — юг */
  }));

  const xs = pts.map((p) => p.x).concat([0]);
  const ys = pts.map((p) => p.y).concat([0]);
  const minX = Math.min.apply(null, xs);
  const maxX = Math.max.apply(null, xs);
  const minY = Math.min.apply(null, ys);
  const maxY = Math.max.apply(null, ys);

  const W = 1000;
  const H = 1180;
  const pad = 118;                        /* поле под номера и подпись у края */
  const k = Math.min((W - pad * 2) / (maxX - minX), (H - pad * 2) / (maxY - minY));
  /* центр рисунка совмещаем с центром облака точек */
  const cx = W / 2 - (minX + maxX) / 2 * k;
  const cy = H / 2 - (minY + maxY) / 2 * k;
  const sx = (m) => (cx + m * k).toFixed(1);
  const sy = (m) => (cy + m * k).toFixed(1);

  /* кольца через каждый километр показывают масштаб без линейки */
  const rings = [1000, 3000, 5000].map((m) => `      <circle class="locmap__ring" cx="${sx(0)}" cy="${sy(0)}" r="${(m * k).toFixed(1)}"/>
      <text class="locmap__ringlab" x="${sx(0)}" y="${(+sy(0) - m * k - 8).toFixed(1)}">${m / 1000} ${esc(t.mapKm)}</text>`).join('\n');

  const spokes = pts.map((p) => `      <line class="locmap__spoke" x1="${sx(0)}" y1="${sy(0)}" x2="${sx(p.x)}" y2="${sy(p.y)}"/>`).join('\n');

  const dots = pts.map((p) => {
    const km = (Math.hypot(p.x, p.y) / 1000).toFixed(1).replace('.', ',');
    const name = t.placeNames[p.id];
    return `      <a class="locmap__pt" href="${mapLink(p.lon, p.lat)}" target="_blank" rel="noopener noreferrer"
         aria-label="${esc(name)} — ${km} ${esc(t.mapKm)}">
        <circle class="locmap__hit" cx="${sx(p.x)}" cy="${sy(p.y)}" r="34"/>
        <circle class="locmap__dot" cx="${sx(p.x)}" cy="${sy(p.y)}" r="19"/>
        <text class="locmap__num" x="${sx(p.x)}" y="${sy(p.y)}" dy=".36em">${p.n}</text>
      </a>`;
  }).join('\n');

  const legend = pts.map((p) => {
    const km = (Math.hypot(p.x, p.y) / 1000).toFixed(1).replace('.', ',');
    return `      <li>
        <a href="${mapLink(p.lon, p.lat)}" target="_blank" rel="noopener noreferrer">
          <i>${p.n}</i><span>${esc(t.placeNames[p.id])}</span><b>${km}&nbsp;${esc(t.mapKm)}</b>
        </a>
      </li>`;
  }).join('\n');

  return `<figure class="locmap${mod ? ' ' + mod : ''} reveal">
  <svg class="locmap__art" viewBox="0 0 ${W} ${H}" role="img"
       aria-label="${esc(t.mapSchemeTitle)}">
    <g>
${rings}
    </g>
    <g>
${spokes}
    </g>

    <!-- север: без него схема читается как абстракция -->
    <g class="locmap__north" transform="translate(${W - 62}, 62)">
      <line x1="0" y1="26" x2="0" y2="-14"/>
      <path d="M0 -22 L6 -8 L0 -12 L-6 -8 Z"/>
      <text y="44">N</text>
    </g>

${dots}

    <a class="locmap__here" href="${mapLink(site.geo.lon, site.geo.lat)}"
       target="_blank" rel="noopener noreferrer" aria-label="${esc(t.mapHere)}">
      <circle class="locmap__pulse" cx="${sx(0)}" cy="${sy(0)}" r="30"/>
      <path class="locmap__mark"
            d="M${sx(0)} ${(+sy(0) - 17).toFixed(1)} l13 17 l-13 17 l-13 -17 Z"/>
      <text class="locmap__label" x="${(+sx(0) + 32).toFixed(1)}" y="${(+sy(0) + 9).toFixed(1)}">PARI Residence</text>
    </a>
  </svg>

  <figcaption class="locmap__side">
    <p class="locmap__title">${esc(t.mapSchemeTitle)}</p>
    <ol class="locmap__legend">
${legend}
    </ol>
    <p class="locmap__note">${esc(t.mapSchemeNote)}</p>
  </figcaption>
</figure>`;
}

/* Ссылка на карту с координатами точки: и метка, и центр — одна и та же точка,
   поэтому по нажатию человек видит именно её, а не «примерно тот район». */
const mapLink = (lon, lat) =>
  `https://yandex.uz/maps/?ll=${lon}%2C${lat}&z=17&pt=${lon}%2C${lat},pm2rdm`;

/* ── список расстояний ── */
const distanceList = (t) => `<ul class="place__list">
${t.distances.map(([a, b]) => `      <li class="reveal"><span>${esc(a)}</span><b>${esc(b)}</b></li>`).join('\n')}
      </ul>
      <p class="place__note reveal">${esc(t.distancesNote)}</p>`;


/* ── логотип, который прорисовывается штрихом ──
   Контуры лежат в src/logo-parts.json (сняты с фирменного вектора). Каждому пути
   проставляем pathLength="1" и порядковый номер: дальше вся отрисовка — это две
   строки CSS, без вычисления длин в браузере. */
function inkPaths(svg, from) {
  let i = from;
  return svg.replace(/<path /g, () => `<path pathLength="1" style="--i:${i++}" `);
}


/* ── подбор квартиры: комнатность и площадь ──
   Без JavaScript видны все планировки — отбор только сужает выдачу. */
function picker(t, opts) {
  const o = opts || {};
  const p = t.plans;
  const h = t.home;
  const areas = p.items.map((x) => parseFloat(x.area.replace(',', '.')));
  const min = Math.floor(Math.min.apply(null, areas));
  const max = Math.ceil(Math.max.apply(null, areas));
  const roomsOn = [1, 2, 3, 4].filter((n) => p.items.some((x) => x.rooms === n));
  const chips = [['', p.filterAll]].concat(roomsOn.map((n) => [String(n), p.filterRooms[n]]))
    .map(([val, label], i) => `        <button class="pick${i === 0 ? ' is-on' : ''}" type="button"
                data-filter="${val}"${val && o.anchors ? ` id="rooms-${val}"` : ''} aria-pressed="${i === 0}">${esc(label)}</button>`).join('\n');

  return `<div class="picker" data-picker data-area-tpl="${esc(h.pickerArea)}">
      <div class="picker__rooms" role="group" aria-label="${esc(p.filterLabel)}">
${chips}
      </div>

      <label class="picker__area">
        <span class="picker__area-label" data-picker-area-label>${esc(h.pickerArea.replace('{n}', max))}</span>
        <input type="range" min="${min}" max="${max}" value="${max}" step="1"
               data-picker-area aria-label="${esc(h.pickerArea.replace('{n}', max))}">
        <span class="picker__scale"><i>${min} ${t.ui.sqm}</i><i>${max} ${t.ui.sqm}</i></span>
      </label>

      <p class="picker__found"><b data-picker-count>${p.items.length}</b> <span>${esc(h.pickerFound)}</span></p>
    </div>`;
}

const PHONE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.4 11.4 0 0 0 .57 3.6 1 1 0 0 1-.25 1z"/></svg>';

/* ── постоянная пара кнопок в правом нижнем углу ──
   На широком экране телефон и подбор всегда под рукой: до формы внизу
   страницы доходят не все. На узком эту роль играет нижняя панель. */
function dock(t, page) {
  const home = page.key === 'home';
  const p = t.lang === 'ru' ? '' : '/uz';
  const pick = home ? '#homes' : `${p}/apartments/`;
  return `<div class="dock" data-dock>
  <a class="dock__tel" href="tel:${site.phone.tel}" data-track="phone_click"
     aria-label="${esc(t.ui.call)} ${site.phone.intl}">${PHONE_ICON}</a>
  <a class="dock__pick" href="${pick}" data-track="pick_click">${esc(t.ui.pick)}</a>
</div>`;
}

/* ── навигация по разделам главной ──
   Точки справа: где человек сейчас и сколько ещё впереди. */
function rail(t) {
  const m = t.home.maison;
  const items = [
    ['#maison', m.house.ru],
    ['#architecture', m.arch.ru],
    ['#jardin', m.garden.ru],
    ['#boulevard', m.boulevard.ru],
    ['#appartements', m.homes.ru],
    ['#ville', m.city.ru],
    ['#call', m.yours.ru],
  ];
  return `<nav class="rail" data-rail aria-label="${esc(t.ui.sections)}">
${items.map(([href, label]) => `  <a href="${href}"><i aria-hidden="true"></i><span>${esc(label)}</span></a>`).join('\n')}
</nav>`;
}


/* ── счётчики ──
   Тег Google ставится в head, как требует Google. Если идентификатора нет,
   на страницу не попадает ничего: пустой сайт не должен тянуть чужой скрипт.
   Номера счётчиков лежат в site.analytics, дальше события шлёт script.js. */
function analytics() {
  const a = site.analytics || {};
  if (!a.ga4 && !a.metrika) { return ''; }
  let out = `<script>window.PARI_ANALYTICS=${JSON.stringify({ metrika: a.metrika || null })};</script>
`;

  if (a.ga4) {
    out += `<script async src="https://www.googletagmanager.com/gtag/js?id=${a.ga4}"></script>
<script>
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','${a.ga4}');
</script>
`;
  }

  /* Метрика: код в том виде, в каком его отдаёт сама Метрика. Проверка
     document.scripts нужна, чтобы счётчик не встал дважды. */
  if (a.metrika) {
    out += `<script>
(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
m[i].l=1*new Date();
for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=${a.metrika}','ym');
ym(${a.metrika},'init',{ssr:true,webvisor:true,clickmap:true,accurateTrackBounce:true,trackLinks:true});
</script>
<noscript><div><img src="https://mc.yandex.ru/watch/${a.metrika}" style="position:absolute;left:-9999px" alt=""></div></noscript>
`;
  }

  return out;
}

/* ══════════════ каркас страницы ══════════════ */
/* ── подвал ──
   Появился в v4: в образце контакты, режим работы и копирайт стоят внизу
   каждой страницы, а у нас их можно было найти только на отдельной. Карту
   в подвал не ставим — она уже есть на главной, локации и контактах, и
   второй виджет на странице означал бы лишние запросы к Яндексу. */
function footer(t) {
  const c = t.contacts;
  const f = t.footer;
  const hours = t.lang === 'ru' ? site.hours.ru : site.hours.uz;
  const route = `https://yandex.uz/maps/?pt=${site.geo.lon},${site.geo.lat}&z=17&l=map`;
  const items = footerItems(t)
    .map(([href, label]) => `      <a href="${href}">${esc(label)}</a>`).join('\n');

  return `<footer class="footer">
  <div class="footer__inner">
    <h2 class="display footer__title">${esc(t.nav.contacts)}</h2>

    <dl class="footer__grid">
      <div class="footer__item">
        <dt>${esc(c.phoneLabel)}</dt>
        <dd><a href="tel:${site.phone.tel}" data-track="phone_click">${site.phone.intl}</a></dd>
      </div>
      <div class="footer__item">
        <dt>${esc(c.addressLabel)}</dt>
        <dd>${esc(addressLine(t))}<br>
          <a class="footer__route" href="${route}" target="_blank" rel="noopener noreferrer">${esc(f.route)}</a>
        </dd>
      </div>
      <div class="footer__item">
        <dt>${esc(c.hoursLabel)}</dt>
        <dd>${esc(hours)}</dd>
      </div>
      <div class="footer__item">
        <dt>${esc(c.socialLabel)}</dt>
        <dd class="footer__social">
          <a href="${site.telegram}" target="_blank" rel="noopener noreferrer" data-track="telegram_click">Telegram</a>
          <a href="${site.instagram}" target="_blank" rel="noopener noreferrer">Instagram</a>
        </dd>
      </div>
    </dl>

    <nav class="footer__nav" aria-label="${esc(t.ui.navLabel)}">
${items}
    </nav>

    <p class="footer__legal">${esc(t.ui.legal)}</p>
    <p class="footer__copy">© ${new Date().getFullYear()} ${site.brand} · ${esc(f.developer)} — ${esc(site.developer.name)} · ${esc(f.copy)}</p>
  </div>
</footer>`;
}


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
<!-- Ставится до отрисовки, поэтому мигания нет: без этого класса блоки,
     которые появляются по прокрутке, не прячутся вовсе. -->
<script>document.documentElement.className+=' js'</script>
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
${page.noindex ? `<!-- Страница 404 не должна попадать в индекс. Раньше у неё стоял
     самоссылающийся canonical и полный набор hreflang, а Vercel на прямой
     запрос /404.html отдаёт 200 — то есть поисковик видел обычную
     индексируемую страницу и мог показать её в выдаче. -->
<meta name="robots" content="noindex, follow">` : `<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="ru" href="${ruUrl}">
<link rel="alternate" hreflang="uz" href="${uzUrl}">
<link rel="alternate" hreflang="x-default" href="${ruUrl}">`}
<meta name="theme-color" content="#FAFAFA">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${site.brand}">
<meta property="og:url" content="${canonical}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<!-- Картинка для соцсетей — тот же кадр, что человек видит первым на сайте,
     но в JPEG и ровно 1200×630. WebP здесь не годится: Telegram и ВКонтакте
     его в превью не разворачивают, а в Узбекистане ссылку чаще всего
     пересылают именно в Telegram — вместо кадра выходил пустой прямоугольник.
     Файл собирает tools/make-og.py из opening-shot. -->
<meta property="og:image" content="${url('/assets/img/og-cover.jpg')}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(page.title)}">
<meta property="og:locale" content="${t.locale}">
<meta property="og:locale:alternate" content="${t.altLocale}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(page.title)}">
<meta name="twitter:description" content="${esc(page.description)}">
<meta name="twitter:image" content="${url('/assets/img/og-cover.jpg')}">
<!-- Иконки собраны из настоящего логотипа (tools/make-icons.py). Раньше здесь
     стоял только инлайновый SVG с самодельной буквой: вкладка его показывала,
     а превью ссылок в мессенджерах и поиске — нет, там оставался серый глобус.
     ICO лежит в корне: за ним ходят по умолчанию, без разметки. -->
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" type="image/png" sizes="192x192" href="/assets/img/icon-192.png">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<!-- Шрифт основного текста. Без этой строки браузер узнаёт о нём только
     после разбора styles.css — лишний круг запроса ровно на том шрифте,
     которым набрана вся страница. Начертания заголовков не предзагружаем:
     они разбиты по unicode-range, и какой из наборов понадобится, заранее
     не известно. -->
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/cygre-regular.woff2" crossorigin>
${page.preload || ''}<link rel="stylesheet" href="/styles.css?v=${page.v}">
<!-- Класс движения ставится до первой отрисовки: иначе блоки, которые
     motion.js потом прячет и показывает, успевают мигнуть. При просьбе
     убрать анимации класса нет — страница статична и видна сразу. -->
<script>if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('has-motion')}</script>
<!-- Без JavaScript страница остаётся читаемой. Появление блоков по скроллу
     держится на классе, который ставит скрипт; до этого .reveal стоит
     opacity:0, и при отключённом или сломавшемся JS почти весь текст
     страницы невидим. Google исполняет скрипты, Яндекс — далеко не всегда,
     поэтому запасной путь нужен именно здесь, в разметке. -->
<noscript><style>.reveal{opacity:1!important;transform:none!important}
[data-lines] .line>span{opacity:1!important;transform:none!important}
.splash{display:none!important}</style></noscript>
${ld}
${analytics()}</head>
<body${page.bodyClass ? ` class="${page.bodyClass}"` : ''}>
<a class="skip-link" href="#main">${esc(t.ui.skip)}</a>
${page.splash ? splash() : ''}

${header(t, page.path)}

${mobileMenu(t, page.path)}

<main id="main" tabindex="-1">

${page.body}

</main>

${footer(t)}

<!-- телефон под рукой на всей длине страницы: на узких экранах панель
     показывается, как только первый экран уходит вверх (класс на body ставит скрипт) -->
${dock(t, page)}

<div class="callbar" aria-label="${esc(t.ui.call)}">
  <a class="callbar__tel" href="tel:${site.phone.tel}" data-track="phone_click">
    <span>${esc(t.ui.call)}</span><b>${site.phone.display}</b>
  </a>
  <a class="callbar__form" href="${site.telegram}" target="_blank" rel="noopener noreferrer"
     data-track="telegram_click">Telegram</a>
</div>

<div class="viewer" id="viewer" hidden>
  <button class="viewer__close" type="button" data-viewer-close aria-label="${esc(t.ui.closeViewer)}"></button>
  <p class="viewer__label" data-viewer-label></p>
  <div class="viewer__stage" data-viewer-stage>
    <img alt="" data-viewer-img width="1600" height="1200">
  </div>
  <p class="viewer__hint">${esc(t.ui.viewerHint)}</p>
  <div class="viewer__zoom" role="group" aria-label="${esc(t.ui.zoomLabel)}">
    <button type="button" data-zoom-out aria-label="${esc(t.ui.zoomOut)}">−</button>
    <button type="button" data-zoom-in aria-label="${esc(t.ui.zoomIn)}">+</button>
    <button type="button" data-fit>${esc(t.ui.zoomFit)}</button>
  </div>
</div>

<script src="/assets/js/lenis.min.js?v=${page.v}" defer></script>
<script src="/assets/js/gsap.min.js?v=${page.v}" defer></script>
<script src="/assets/js/ScrollTrigger.min.js?v=${page.v}" defer></script>
<script src="/assets/js/motion.js?v=${page.v}" defer></script>
<script src="/script.js?v=${page.v}" defer></script>
</body>
</html>
`;
}

/* ══════════════ главная ══════════════
   v4 (31.08.2026). Порядок разделов повторяет образец, который прислал
   заказчик — stellarresidence.uz: титул, о проекте с крупными цифрами,
   локация с картой, состав квартала лентой, тёмная полоса, архитектура,
   район, квартиры, двор, генплан, паркинг, застройщик, заявка, подвал.
   Цвет и шрифты при этом остаются по гайдбуку PARI: роль их бирюзы играет
   золото, заголовки набраны Tenor Sans (§4.1), текст — Cygre (§4.2). */
/* ══════════════ v6 · MAISON PARI ══════════════
   Главная подаётся как выпуск коллекции: главы с римскими номерами,
   короткая французская метка над русским названием, архитектурные листы
   как документы и каталог квартир строками, а не карточками. */

/* ══════════════ главная ══════════════
   Собрана по гайдбуку PARI, раздел 5: у каждого экрана один визуальный центр
   (§5.1), композиции двух типов — «фотографическая» (крупный кадр плюс
   компактный текстовый блок на спокойной области, §5.3) и «чистая
   типографическая» (светлое поле, крупный заголовок, короткий текст). Сетка
   двенадцатиколоночная: текст занимает 3–5 колонок, кадр — 7–9 или выходит
   за поле целиком (§5.2). Пропорция цвета — светлое поле, золото акцентом,
   чёрный только в наборе (§3.2). Шрифты только два, по §4: Tenor Sans в
   заголовках, Cygre в тексте — рукописного начертания в системе нет, и
   §9.2 прямо не советует «сложную декоративную типографику».

   Девять экранов вместо шестнадцати: первый экран → манифест → архитектура
   с материалами → двор → входная группа → квартиры → район → создатели →
   финал с заявкой. Всё, что не несло ни факта, ни кадра, снято. */

/* ── кадр во весь экран с текстовой панелью ──
   «Фотографическая композиция» гайдбука: кадр занимает экран, текст лежит
   на светлой панели в спокойном углу — панель и есть та «достаточно
   спокойная область для размещения информации», которой требует §5.3, и на
   любом кадре она гарантирована, а не зависит от того, где в рендере небо.
   На телефоне панель уходит под кадр: накладывать текст на кадр в 375 px
   значит прятать либо кадр, либо текст. */
function frame(o) {
  const widths = o.widths || [1280, 1920, 2560];
  const srcset = widths.map((w) => `/assets/img/${o.img}-${w}.webp ${w}w`).join(', ');
  const size = imgSize(`assets/img/${o.img}-${widths[widths.length - 1]}.webp`) || { w: 2560, h: 1429 };
  return `<section class="s-frame${o.side === 'right' ? ' s-frame--right' : ''}${o.tall ? ' s-frame--tall' : ''}${o.grow ? ' s-frame--grow' : ''}" id="${o.id}">
  <figure class="s-frame__media" data-drift${o.grow ? ' data-grow' : ''}>
    <img src="/assets/img/${o.img}-${widths[Math.min(1, widths.length - 1)]}.webp"
         srcset="${srcset}" sizes="100vw" alt="${esc(o.alt)}"
         width="${size.w}" height="${size.h}" loading="lazy" decoding="async">
  </figure>
  <div class="s-frame__panel">
    <p class="s-eyebrow reveal">${esc(o.eyebrow)}</p>
    <h2 class="s-display s-display--md" data-lines>${o.title}</h2>
    <p class="s-text reveal">${esc(o.text)}</p>
${o.extra || ''}
    ${o.href ? sLink(o.href, o.link, 'reveal') : ''}
  </div>
</section>`;
}

function home(t, page) {
  const h = t.home;
  const p = t.lang === 'ru' ? '' : '/uz';
  const heroSloganLines = h.heroSlogan
    .replace(/&nbsp;/g, ' ')
    .split(/<br\s*\/?\s*>/i)
    .map((line) => line.trim())
    .filter(Boolean);
  const apartmentsHref = `${p}/apartments/`;
  const locationHref = `${p}/location/`;
  const projectHref = `${p}/project/`;
  const contactsHref = `${p}/contacts/`;

  /* Четыре главных числа — с анимацией счёта; остальная спецификация —
     тихим списком, без повторов того, что уже стоит крупно. */
  const stats = h.stats.map((x) => `      <div class="s-stat reveal">
        <b><span data-count="${x.value}">${x.value}</span>${x.suffix ? `<i>${esc(x.suffix)}</i>` : ''}</b>
        <span>${esc(x.label)}</span>
      </div>`).join('\n');
  const bigLabels = new Set(['Блоков', 'Квартир', 'Двор-парк', 'Озеленение и благоустройство',
    'Bloklar', 'Xonadonlar', 'Hovli-bogʻ', 'Koʻkalamzorlashtirish va obodonlashtirish']);
  const spec = h.spec.filter(([k]) => !bigLabels.has(k)).map(([k, v]) => `        <div class="s-spec__row reveal">
          <dt>${esc(k)}</dt><dd>${esc(v)}</dd>
        </div>`).join('\n');

  /* Кадры «дня»: утро — аркада первого этажа, день — галерея у улицы,
     вечер — двор, ночь — вид с балкона. Подписи берутся из уже
     утверждённых alt-текстов галереи. */
  const gal = (img) => (h.gallery.find((g) => g.img === img) || {}).cap || '';
  const dayShots = [
    { img: 'gallery-corner', alt: h.cornerAlt, h: 1326 },
    { img: 'line-day', alt: h.lineDayAlt, h: 720 },
    { img: 'cine-yard-w16', alt: gal('cine-yard'), h: 800 },
    { img: 'cine-balcony-w16', alt: gal('cine-balcony'), h: 800 },
  ];

  /* Двор: перечень того, что в нём есть, двумя колонками, и цифра парковки. */
  const yardList = `    <ul class="s-list reveal">
${h.hectareList.map((x) => `      <li>${esc(x)}</li>`).join('\n')}
    </ul>
    <p class="s-figure reveal"><b>${esc(h.parkStat)}</b><span>${esc(h.parkStatLabel)}</span></p>`;

  /* Входная группа: два вертикальных рендера застройщика. Широкого кадра
     лобби в настоящих материалах нет — есть восемь вертикальных, и два из
     них рядом читаются как разворот буклета, а не как заплатка. */
  const lobby = ['lobby-03', 'lobby-07'].map((img, i) => {
    const cap = t.project.entryGallery.find((g) => g.img === img);
    return `      <figure class="s-duo__shot figure-mask">
        <img src="/assets/img/${img}-760.webp"
             srcset="/assets/img/${img}-760.webp 760w, /assets/img/${img}-1180.webp 1180w"
             sizes="(min-width:900px) 30vw, 46vw" alt="${esc(cap ? cap.cap : t.project.entryAlt)}"
             width="760" height="1087" loading="lazy" decoding="async">
      </figure>`;
  }).join('\n');

  /* Квартиры: четыре листа из тех, что отобраны для главной. */
  const plans = h.homesPreview
    .map((id) => t.plans.items.find((x) => x.id === id))
    .filter(Boolean).slice(0, 4)
    .map((x) => planCard(t, x)).join('\n');

  const makers = [
    [h.makerDev, site.developer.name],
    [h.makerArch, site.architect.name],
    [t.apartments.termsBankTitle, site.bank.name],
  ].map(([k, v]) => `      <div class="s-maker reveal">
        <span>${esc(k)}</span><b>${esc(v)}</b>
      </div>`).join('\n');

  page.body = `<!-- ══════════════ первый экран ══════════════
     Промо-петля во весь экран, текст в осветлённой левой трети — там, где
     кадр спокоен (§2.6: марку и текст не ставят на детализированный участок).
     Логотип здесь один — в шапке; второй на том же экране спорил бы с ним. -->
<section class="s-hero" id="pari" aria-label="${site.brand}">
  <figure class="s-hero__media" data-hero-media>
    <!-- Постер — первый кадр монтажа, поэтому подмена на ролик не видна.
         На телефоне и кадр, и ролик вертикальные: горизонтальный 2:1 в окне
         390×840 показывал бы среднюю треть. -->
    <picture>
      <source media="(max-width:700px)" srcset="/assets/img/pari-hero-poster-mobile.webp" width="720" height="1280">
      <img class="s-hero__shot" src="/assets/img/pari-hero-poster-1920.webp"
           srcset="/assets/img/pari-hero-poster-1280.webp 1280w, /assets/img/pari-hero-poster-1920.webp 1920w"
           sizes="100vw" alt="${esc(h.leadFrameAlt)}" width="1920" height="960"
           fetchpriority="high" decoding="async">
    </picture>
    <!-- Hero-монтаж из фирменного фильма: пять планов встык, 9,7 с, без
         звука, без людей и текста в кадре. Собирает tools/make-hero-edit.py.
         Ролик ложится ровно на постер и проявляется, только когда пошёл; при
         экономии трафика и на медленной сети остаётся постер. -->
    <video class="s-hero__video" muted loop playsinline preload="none"
           aria-hidden="true" tabindex="-1"
           data-widths="1280,1920"
           data-webm="/assets/video/pari-hero-{w}.webm?v=${page.v}"
           data-mp4="/assets/video/pari-hero-{w}.mp4?v=${page.v}"
           data-webm-portrait="/assets/video/pari-hero-mobile.webm?v=${page.v}"
           data-mp4-portrait="/assets/video/pari-hero-mobile.mp4?v=${page.v}"></video>
  </figure>
  <div class="s-hero__veil" aria-hidden="true"></div>

  <!-- Уход при прокрутке и глубина от курсора ведут всю обёртку, а не панель:
       у панели не должно быть transform — на телефоне кнопки позиционируются
       от обёртки по нижним углам. -->
  <div class="s-hero__inner" data-open-head data-hero-panel>
    <div class="s-hero__panel">
      <!-- Марка на панели, как просил владелец; логотип в шапке главной
           появляется, когда первый экран уходит вверх. -->
      <img class="s-hero__mark" src="/assets/img/pari-logo-vector.png" alt="${site.brand}" width="1872" height="1031" data-hero-step decoding="async">
      <p class="s-eyebrow s-eyebrow--hero" lang="uz" data-hero-step>${h.heroEyebrow}</p>
      <h1 class="s-hero__title">
        <span class="s-hero__name" data-hero-step>${esc(h.heroName)}</span>
        <!-- Слоган — настоящий текст в h1, строки выходят из-под маски
             (data-lines), а не рисуются штрихом семь секунд. -->
        <span class="s-hero__slogan" data-lines data-hero-lines>${h.heroSlogan.replace(/&nbsp;/g, ' ')}</span>
      </h1>
      <p class="s-hero__sub" lang="${t.lang === 'ru' ? 'uz' : 'ru'}" data-hero-step>${esc(h.heroSub)}</p>
      <div class="s-actions" data-hero-step>
        <a class="pill" href="${apartmentsHref}" data-track="cta_click" data-magnet>${esc(t.ui.pick)}${ARROW}</a>
        <a class="ghost" href="${projectHref}">${esc(h.heroSecond)}</a>
      </div>
    </div>
  </div>

  <a class="s-hero__scroll" href="#maison" data-hero-scroll><span aria-hidden="true"></span>${esc(h.leadScroll)}</a>
</section>

<!-- ══════════════ манифест ══════════════
     Чистая типографическая композиция: светлое поле, один крупный заголовок,
     короткий текст и четыре числа. -->
<section class="s-manifest" id="maison">
  <div class="s-wrap">
    <p class="s-eyebrow reveal">${esc(h.aboutEyebrow)}</p>
    <h2 class="s-display s-display--xl" data-lines>${h.houseLead}</h2>
    <div class="s-manifest__cols">
      <p class="s-lede reveal">${esc(h.aboutText)}</p>
      <p class="s-text reveal">${esc(h.aboutText2)}</p>
    </div>
    <div class="s-stats">
${stats}
    </div>
    <dl class="s-spec">
${spec}
    </dl>
    <p class="s-note reveal">${esc(h.specNote)}</p>
  </div>
</section>

<!-- ══════════════ концепция: Париж × Самарканд → PARI ══════════════
     Два мира по краям — камень и латунь Парижа, свет и город Самарканда, —
     по мере прокрутки сходятся к центру, где на светлой панели рождается
     PARI (motion.js, закреплённая сцена; на телефоне — три кадра подряд).
     Кадры — только свои: деталь балкона из рендеров и Самарканд на рассвете
     из фирменного фильма. -->
<section class="s-concept" id="idee" aria-labelledby="idee-h">
  <div class="s-concept__stage" data-concept>
    <figure class="s-concept__side s-concept__side--paris" data-concept-side="paris">
      <img src="/assets/img/arch-balcony-1280.webp"
           srcset="/assets/img/arch-balcony-1280.webp 1280w, /assets/img/arch-balcony-1920.webp 1920w"
           sizes="(min-width:900px) 50vw, 100vw" alt="${esc(h.arch[3].cap)}"
           width="1920" height="1071" loading="lazy" decoding="async">
      <figcaption class="s-concept__word">Paris<small>${esc(h.conceptParisWord || '')}</small></figcaption>
    </figure>
    <div class="s-concept__core" data-concept-core>
      <p class="s-eyebrow">${esc(h.conceptEyebrow)}</p>
      <h2 class="s-display" id="idee-h">${h.conceptTitle}</h2>
      <div class="s-concept__cols">
        <p class="s-text"><b>Paris</b>${esc(h.conceptLeft)}</p>
        <p class="s-text"><b>Samarqand</b>${esc(h.conceptRight)}</p>
      </div>
      <p class="s-concept__whisper">${esc(h.conceptWhisper)}</p>
    </div>
    <figure class="s-concept__side s-concept__side--samarkand" data-concept-side="samarkand">
      <!-- Самарканд — единственный кадр в материалах — открывающий план
           бренд-фильма: рассвет над Регистаном, стая птиц. Как стоп-кадр он
           мягкий (видео, дымка), поэтому играет коротким живым отрезком, а
           резкий кадр под ним — постер и запасной вариант. Отрезок грузится,
           когда разворот подходит к экрану (tools/make-concept-clip.py). -->
      <img src="/assets/img/samarkand-dawn-1920.webp"
           srcset="/assets/img/samarkand-dawn-1280.webp 1280w, /assets/img/samarkand-dawn-1920.webp 1920w, /assets/img/samarkand-dawn-2096.webp 2096w"
           sizes="(min-width:900px) 50vw, 100vw" alt="${esc(h.ideaCityAlt)}"
           width="2096" height="1048" loading="lazy" decoding="async">
      <video class="s-concept__video" muted loop playsinline preload="none" aria-hidden="true" tabindex="-1"
             data-lazy-loop data-widths="1280"
             data-webm="/assets/video/samarkand-dawn-{w}.webm?v=${page.v}"
             data-mp4="/assets/video/samarkand-dawn-{w}.mp4?v=${page.v}"></video>
      <figcaption class="s-concept__word">Samarqand<small>${esc(h.conceptSamarkandWord || '')}</small></figcaption>
    </figure>
  </div>
</section>

<!-- ══════════════ архитектура ══════════════ -->
${frame({
    id: 'architecture', img: 'arch-facade', alt: h.archWideAlt,
    eyebrow: h.archEyebrow, title: h.archTitle, text: h.archText,
    href: projectHref, link: h.archLink,
  })}
<!-- Материалы — асимметричный разворот: крупный кадр входной группы держит
     семь колонок, камень и латунь стоят лесенкой справа; каждый кадр выходит
     из-под маски в свою сторону. -->
<section class="s-matter" aria-label="${esc(h.materialsLabel)}">
  <div class="s-wrap">
    <p class="s-eyebrow reveal">${esc(h.materialsLabel)}</p>
    <div class="s-matter__grid">
      <figure class="s-matter__big" data-mask="up">
        <img src="/assets/img/arch-entrance-sq-1100.webp"
             srcset="/assets/img/arch-entrance-sq-700.webp 700w, /assets/img/arch-entrance-sq-1100.webp 1100w, /assets/img/arch-entrance-sq-1400.webp 1400w"
             sizes="(min-width:900px) 56vw, 100vw" alt="${esc(h.arch[1].cap)}"
             width="1400" height="1501" loading="lazy" decoding="async">
        <figcaption>${esc(h.arch[1].cap)}</figcaption>
      </figure>
      <div class="s-matter__small">
        <figure data-mask="left">
          <img src="/assets/img/arch-stone-1280.webp"
               srcset="/assets/img/arch-stone-1280.webp 1280w, /assets/img/arch-stone-1920.webp 1920w"
               sizes="(min-width:900px) 38vw, 50vw" alt="${esc(h.arch[2].cap)}"
               width="1920" height="1071" loading="lazy" decoding="async">
          <figcaption>${esc(h.arch[2].cap)}</figcaption>
        </figure>
        <figure data-mask="right">
          <img src="/assets/img/arch-balcony-sq-700.webp"
               srcset="/assets/img/arch-balcony-sq-700.webp 700w, /assets/img/arch-balcony-sq-1100.webp 1100w"
               sizes="(min-width:900px) 30vw, 50vw" alt="${esc(h.arch[3].cap)}"
               width="1100" height="1179" loading="lazy" decoding="async">
          <figcaption>${esc(h.arch[3].cap)}</figcaption>
        </figure>
      </div>
    </div>
    <ul class="s-matter__list" data-stagger>
${h.archMaterials.map((m) => `      <li>${esc(m)}</li>`).join('\n')}
    </ul>
  </div>
</section>

<!-- ══════════════ двор ══════════════
     Единственный кадр на сайте, который раскрывается из рамки в полный
     экран при прокрутке (data-grow, motion.js). -->
${frame({
    id: 'jardin', img: 'arch-yard', alt: h.yardAlt, side: 'right', grow: true,
    eyebrow: h.yardEyebrow, title: h.hectareTitle, text: h.hectareLead,
    extra: yardList,
  })}

<!-- ══════════════ день, рассказанный кварталом ══════════════
     Четыре ступени дня из утверждённого текста; кадр слева закреплён и
     меняется по мере подхода к ступени. Кадры — свои рендеры: аркада,
     галерея, двор, лобби. -->
<section class="s-day" id="vivre" aria-labelledby="vivre-h">
  <div class="s-wrap">
    <p class="s-eyebrow reveal">${esc(h.maison.life.fr)} · ${esc(h.maison.life.ru)}</p>
    <h2 class="s-display s-display--xl" id="vivre-h" data-lines>${h.lifeTitle}</h2>
    <div class="s-day__grid" data-day>
      <figure class="s-day__media" data-mask="up">
${dayShots.map((x, i) => `        <img src="/assets/img/${x.img}-1280.webp" alt="${esc(x.alt)}" width="1280" height="${x.h}" loading="lazy" decoding="async" data-day-img="${i}"${i === 0 ? ' class="is-on"' : ''}>`).join('\n')}
        <span class="s-day__index" data-day-index>01 / 0${h.life.length}</span>
      </figure>
      <div class="s-day__steps">
${h.life.map((x, i) => `        <div class="s-day__step${i === 0 ? ' is-on' : ''}" data-day-step="${i}">
          <figure class="s-day__shot"><img src="/assets/img/${dayShots[i].img}-1280.webp" alt="${esc(dayShots[i].alt)}" width="1280" height="${dayShots[i].h}" loading="lazy" decoding="async"></figure>
          <p class="s-day__time">${esc(x.time)}</p>
          <p class="s-text">${esc(x.text)}</p>
        </div>`).join('\n')}
      </div>
    </div>
  </div>
</section>

<!-- ══════════════ входная группа ══════════════
     Два вертикальных рендера и текст: кадры занимают семь колонок, текст —
     четыре, как в §5.2. -->
<section class="s-duo" id="entree">
  <div class="s-wrap s-duo__grid">
    <div class="s-duo__text">
      <p class="s-eyebrow reveal">${esc(t.nav.project)}</p>
      <h2 class="s-display s-display--md" data-lines>${esc(t.project.entryTitle)}</h2>
      <p class="s-text reveal">${esc(t.project.entryText)}</p>
      ${sLink(projectHref + '#entry', h.archLink, 'reveal')}
    </div>
    <div class="s-duo__shots">
${lobby}
    </div>
  </div>
</section>

<!-- ══════════════ квартиры ══════════════ -->
<section class="s-homes" id="appartements">
  <div class="s-wrap">
    <p class="s-eyebrow reveal">${esc(h.homesEyebrow)}</p>
    <h2 class="s-display s-display--xl" data-lines>${h.homesTitle}</h2>
    <p class="s-lede reveal">${esc(h.catalogLead)}</p>
    <nav class="rooms-nav reveal" aria-label="${esc(t.rooms.byRooms)}">
${roomsCatalogue(t, null)}
    </nav>
    <!-- На телефоне лента листается пальцем и стрелками: стрелка «дальше»
         подмигивает, пока ленту не тронули (motion.js, только узкие экраны). -->
    <div class="plans plans--few" data-strip>
${plans}
    </div>
${railNav(t)}
    <p class="s-note reveal">${esc(h.homesNote)}</p>
    <div class="s-actions reveal">
      <a class="pill" href="${apartmentsHref}" data-track="cta_click" data-magnet>${esc(h.catalogAll)}${ARROW}</a>
      <a class="ghost" href="${p}/select/">${esc(t.nav.select)}</a>
      <a class="ghost" href="${p}/installment/">${esc(t.nav.instal)}</a>
    </div>
  </div>
</section>

<!-- ══════════════ район ══════════════ -->
${frame({
    id: 'ville', img: 'complex-aerial', alt: h.sceneAlt,
    eyebrow: h.masterEyebrow, title: h.masterTitle, text: h.masterText,
    href: locationHref, link: h.masterLink,
  })}

<!-- ══════════════ создатели ══════════════ -->
<section class="s-makers" id="createurs">
  <div class="s-wrap s-makers__grid">
    <div>
      <p class="s-eyebrow reveal">${esc(h.makerEyebrow)}</p>
      <h2 class="s-display s-display--md" data-lines>${h.makerTitle}</h2>
      <p class="s-text reveal">${esc(h.makerText)}</p>
    </div>
    <div class="s-makers__list">
${makers}
    </div>
  </div>
</section>

<!-- ══════════════ финал ══════════════ -->
<section class="s-final" id="votre">
  <!-- Финал — первая линия на рассвете (рендер второй партии): светлый и
       спокойный кадр под спокойное завершение, вместо тёмной аэросъёмки. -->
  <figure class="s-final__media" data-drift>
    <img src="/assets/img/line-dawn-1920.webp"
         srcset="/assets/img/line-dawn-1280.webp 1280w, /assets/img/line-dawn-1920.webp 1920w, /assets/img/line-dawn-2560.webp 2560w"
         sizes="100vw" alt="${esc(h.finalAlt)}" width="2560" height="1440" loading="lazy" decoding="async">
  </figure>
  <!-- Текст на светлой панели, как на первом экране: аэросъёмка — самый
       детализированный кадр на сайте, и заголовок прямо на ней не читался
       ни на широком экране, ни на телефоне (§2.6). -->
  <div class="s-final__inner">
    <div class="s-final__panel">
      <p class="s-eyebrow reveal">${esc(h.finalEyebrow)}</p>
      <h2 class="s-display s-display--xl" data-lines>${h.finalLead}</h2>
      <div class="s-actions reveal">
        <a class="pill" href="${apartmentsHref}" data-track="cta_click" data-magnet>${esc(t.ui.pick)}${ARROW}</a>
        <a class="ghost" href="${contactsHref}" data-track="cta_click">${esc(h.finalVisit)}</a>
        <a class="ghost" href="${p}/faq/">${esc(t.nav.faq)}</a>
      </div>
    </div>
  </div>
</section>

${leadSection(t, {})}

${rail(t)}`;
  return page;
}

/* ── ряд «квартиры по комнатности» ──
   Один и тот же блок стоит на /apartments/, на страницах комнатности и на
   странице подбора. Цифры считает src/flats.js из тех же 1186 записей, что и
   фильтр, поэтому разойтись они не могут. Текущая группа остаётся в ряду без
   ссылки: ряд не должен менять длину от страницы к странице, иначе человек не
   понимает, где он и сколько всего вариантов. */
function roomsCatalogue(t, currentKey) {
  const p = t.lang === 'ru' ? '' : '/uz';
  return roomGroups().map((x) => {
    const span = x.areaFrom === x.areaTo
      ? area(x.areaFrom) : area(x.areaFrom) + '–' + area(x.areaTo);
    const inner = `<b>${esc(t.rooms.groups[x.key].short)}</b>
        <i>${x.count}</i>
        <span>${span} ${esc(t.ui.sqm)}</span>`;
    return x.key === currentKey
      ? `      <span class="rooms-nav__item is-current" aria-current="page">
        ${inner}
      </span>`
      : `      <a class="rooms-nav__item" href="${p}/apartments/${x.slug}/">
        ${inner}
      </a>`;
  }).join(String.fromCharCode(10));
}

/* ══════════════ выбор квартиры ══════════════
   Подъезд → этаж → план этажа с обведёнными квартирами. Контуры и список
   этажей лежат в assets/floors/p<N>.json — по файлу на подъезд, чтобы
   страница тянула только то, что открыли. Данные из архива застройщика:
   номер квартиры взят из его же схемы, ничего не досочинено. */
function floorsIndex() {
  const dir = path.join(__dirname, '..', 'assets', 'floors');
  const out = [];
  fs.readdirSync(dir).filter((f) => /^p\d+\.json$/.test(f)).forEach((f) => {
    const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const floors = Object.keys(j.floors).map(Number).sort((a, b) => a - b);
    out.push({ podil: j.podil, floors, flats: Object.values(j.floors).reduce((n, v) => n + v.flats.length, 0) });
  });
  return out.sort((a, b) => a.podil - b.podil);
}

function select(t, page) {
  const s = t.select;
  const list = floorsIndex();
  const total = list.reduce((n, x) => n + x.flats, 0);

  const tabs = list.map((x, i) => `        <button class="pick${i === 0 ? ' is-on' : ''}" type="button"
                data-entrance="${x.podil}" data-floors="${x.floors.join(',')}"
                aria-pressed="${i === 0}">${x.podil}</button>`).join('\n');

  /* Какие этажи вообще нарисованы: у полусотни квартир из выгрузки чертежа
     нет (см. src/flats.js), и предлагать «показать на плане» там нечестно. */
  /* Для каждого подъезда — этажи и номера квартир, которые есть на схеме.
     Кнопка «На плане» появляется только при точном совпадении номера:
     у подъездов 8–13 нумерация на схемах и в выгрузке расходится. */
  const drawn = {};
  fs.readdirSync(path.join(__dirname, '..', 'assets', 'floors'))
    .filter((f) => /^p\d+\.json$/.test(f))
    .forEach((f) => {
      const j = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'assets', 'floors', f), 'utf8'));
      drawn[j.podil] = {};
      Object.keys(j.floors).forEach((fl) => { drawn[j.podil][fl] = j.floors[fl].flats.map((x) => x.num); });
    });

  const rooms = [
    ['', s.filterAny],
    ['s', s.roomsStudio],
    ['1', s.roomsN[1]], ['2', s.roomsN[2]], ['3', s.roomsN[3]], ['4', s.roomsN[4]],
  ].map(([v, label], i) => `          <button class="pick${i === 0 ? ' is-on' : ''}" type="button"
                  data-rooms="${v}" aria-pressed="${i === 0}">${esc(label)}</button>`).join('\n');

  const ents = [['', s.entranceAny]].concat(list.map((x) => [String(x.podil), String(x.podil)]))
    .map(([v, label], i) => `          <button class="pick${i === 0 ? ' is-on' : ''}" type="button"
                  data-ent="${v}" aria-pressed="${i === 0}">${esc(label)}</button>`).join('\n');

  page.body = `<section class="page">
  <div class="page__inner">
    ${breadcrumbs(t, [[page.path, s.h1]])}
    <h1 class="display" data-lines>${esc(s.h1)}</h1>
    <p class="page__lead">${esc(s.filterLead)}</p>
  </div>

  <!-- ══════════════ подбор по реальному составу ══════════════
       Данные — выгрузка шахматки отдела продаж, 1186 квартир: подъезд, этаж,
       номер, комнатность, площадь. Статусов «продано / свободно» здесь нет
       намеренно: наличие меняется каждый день, а страница пересобирается
       только при выкладке. -->
  <div class="page__inner">
    <div class="fl" data-flats
         data-src="/assets/data/flats.json?v=${page.v}"
         data-drawn='${JSON.stringify(drawn)}'
         data-word-entrance="${esc(s.filterEntrance)}"
         data-word-floor="${esc(s.colFloor)}"
         data-word-sqm="${esc(t.ui.sqm)}"
         data-word-studio="${esc(s.roomsStudio)}"
         data-word-rooms="${esc(s.roomsN.join('|'))}"
         data-word-flat="${esc(s.flat)}"
         data-word-go="${esc(s.showOnPlan)}"
         data-word-floor-only="${esc(s.floorOnly)}"
         data-word-noplan="${esc(s.noPlan)}">

      <div class="fl__row">
        <p class="fl__label">${esc(s.filterRooms)}</p>
        <div class="fl__set" role="group" aria-label="${esc(s.filterRooms)}">
${rooms}
        </div>
      </div>

      <div class="fl__row">
        <p class="fl__label">${esc(s.filterEntrance)}</p>
        <div class="fl__set fl__set--num" role="group" aria-label="${esc(s.filterEntrance)}">
${ents}
        </div>
      </div>

      <div class="fl__pair">
        <div class="fl__row">
          <p class="fl__label">${esc(s.filterFloor)} <b data-out-floor></b></p>
          <div class="fl__range" data-range="floor">
            <input type="range" data-lo min="2" max="16" step="1" value="2" aria-label="${esc(s.filterFloor)}">
            <input type="range" data-hi min="2" max="16" step="1" value="16" aria-label="${esc(s.filterFloor)}">
            <span class="fl__track" aria-hidden="true"><i></i></span>
          </div>
        </div>

        <div class="fl__row">
          <p class="fl__label">${esc(s.filterArea)} <b data-out-area></b></p>
          <div class="fl__range" data-range="area">
            <input type="range" data-lo min="27" max="96" step="1" value="27" aria-label="${esc(s.filterArea)}">
            <input type="range" data-hi min="27" max="96" step="1" value="96" aria-label="${esc(s.filterArea)}">
            <span class="fl__track" aria-hidden="true"><i></i></span>
          </div>
        </div>
      </div>

      <div class="fl__foot">
        <p class="fl__found" aria-live="polite"><b data-found>—</b> <span>${esc(s.found)}</span></p>
        <button class="link-call" type="button" data-reset>${esc(s.reset)}</button>
      </div>
    </div>

    <p class="fl__empty" data-empty hidden>${esc(s.foundNone)}</p>
    <div class="fl__list" data-results></div>
    <div class="fl__more"><button class="pick" type="button" data-more hidden>${esc(s.more)}</button></div>

    <p class="plans__note">${esc(s.crmNote)}</p>

    <!-- Состав дома словами. Весь подбор приходит скриптом из flats.json, и в
         разметке страницы не было ни одной площади: робот видел форму, фильтр
         и два абзаца. Этот ряд — те же цифры из шахматки, что и в фильтре,
         плюс переходы на пять страниц по комнатности: до него внутри контента
         отсюда вела ровно одна ссылка, «Главная» в хлебных крошках. -->
    <h2 class="rf__h3">${esc(t.rooms.byRooms)}</h2>
    <nav class="rooms-nav" aria-label="${esc(t.rooms.byRooms)}">
${roomsCatalogue(t, null)}
    </nav>
  </div>

  <!-- ══════════════ подъезд и этаж ══════════════ -->
  <div class="page__inner" id="plan">
    <div class="chooser" data-chooser data-total="${total}"
         data-entrance-word="${esc(s.entrance)}" data-floor-word="${esc(s.floorShort)}"
         data-flat-word="${esc(s.flat)}" data-counted-word="${esc(s.counted)}"
         data-plan-num-word="${esc(s.planNum)}">
      <div class="chooser__row">
        <p class="chooser__label">${esc(s.entrance)}</p>
        <div class="chooser__set" role="group" aria-label="${esc(s.pickEntrance)}">
${tabs}
        </div>
      </div>

      <div class="chooser__row">
        <p class="chooser__label">${esc(s.floor)}</p>
        <div class="chooser__set" data-floor-set role="group" aria-label="${esc(s.pickFloor)}"></div>
      </div>
    </div>
  </div>

  <div class="page__inner">
    <figure class="floor" data-floor-stage>
      <!-- На телефоне план шире экрана и ездит вбок: в 333 px чертёж с мебелью
           не прочитать, а квартиры не нащупать пальцем. -->
      <div class="floor__scroll" data-floor-scroll>
        <span class="floor__hint" aria-hidden="true">${esc(s.swipe)}</span>
        <div class="floor__frame">
          <img class="floor__plan" alt="" data-tpl="${esc(s.planAlt)}" width="885" height="561" decoding="async">
          <svg class="floor__flats" viewBox="0 0 885 561" preserveAspectRatio="none" aria-hidden="true"></svg>
        </div>
      </div>
      <figcaption class="floor__cap" data-floor-cap>${esc(s.pickFlat)}</figcaption>
      <button class="floor__fit" type="button" data-floor-fit data-label-fit="${esc(s.fitAll)}" data-label-zoom="${esc(s.fitZoom)}" aria-pressed="false">${esc(s.fitAll)}</button>
    </figure>

    <aside class="floor__card" data-floor-card hidden aria-live="polite">
      <p class="eyebrow">${esc(s.flat)} <b data-flat-num></b></p>
      <p class="floor__area" data-flat-area hidden></p>
      <p class="floor__where"><span data-flat-where></span></p>
      <p class="floor__note floor__note--mismatch" data-flat-mismatch hidden>${esc(s.noMatch)}</p>
      <p class="floor__note">${esc(s.note)}</p>
      <a class="pill" href="tel:${site.phone.tel}" data-track="phone_click" data-magnet>${esc(s.ask)}${ARROW}</a>
    </aside>

    <p class="plans__note">${esc(s.source)}</p>
  </div>
</section>

${leadSection(t, { formId: 'select', title: t.cta.primary, text: t.contacts.visitText, eyebrow: t.nav.contacts })}`;
  return page;
}

/* ══════════════ генеральный план ══════════════
   Выбор корпуса прямо на чертеже: наведение подсвечивает пятно застройки,
   нажатие открывает карточку. Без JavaScript видны все зоны и карточка
   первого корпуса — страница остаётся читаемой. */
function genplan(t, page) {
  const g = t.genplan;
  const p = t.lang === 'ru' ? '' : '/uz';
  const size = imgSize('assets/img/genplan-line-2400.webp') || { w: 2400, h: 1297 };

  const zones = blocks.map((b, i) => `        <g class="gp__zone${i === 0 ? ' is-on' : ''}" data-block="${b.id}"
           role="button" tabindex="0" aria-pressed="${i === 0}"
           data-type="${esc(b.type)}" data-floors="${b.floors}" data-scheme="${esc(b.scheme)}">
          <title>${esc(g.typeWord)} ${esc(b.type)} — ${b.floors} ${esc(g.floorsWord)}</title>
          <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="0.4"/>
        </g>`).join('\n');

  const first = blocks[0];

  page.body = `<section class="page">
  <div class="page__inner">
    ${breadcrumbs(t, [[page.path, g.h1]])}
    <h1 class="display" data-lines>${esc(g.h1)}</h1>
    <p class="page__lead">${esc(g.lead)}</p>
  </div>

  <div class="gp__views" role="group" aria-label="${esc(g.hint)}">
    <button class="pick is-on" type="button" data-gp-view="plan" aria-pressed="true">${esc(g.viewPlan)}</button>
    <button class="pick" type="button" data-gp-view="aerial" aria-pressed="false">${esc(g.viewAerial)}</button>
  </div>

  <div class="gp">
    <figure class="gp__map" data-genplan>
      <!-- На телефоне чертёж шире экрана и прокручивается вбок: иначе корпуса
           выходят по 30 px, и попасть по ним пальцем невозможно. -->
      <div class="gp__frame">
      <img src="/assets/img/genplan-line-2400.webp"
           srcset="/assets/img/genplan-line-1600.webp 1600w, /assets/img/genplan-line-2400.webp 2400w"
           sizes="(min-width:1100px) 62vw, 100vw" alt="${esc(g.planAlt)}"
           width="${size.w}" height="${size.h}" decoding="async">

      <svg class="gp__zones" viewBox="0 0 100 100" preserveAspectRatio="none"
           role="group" aria-label="${esc(g.hint)}">
${zones}
      </svg>

      <!-- Подписи корпусов лежат разметкой, а не в SVG: слой зон растянут
           неравномерно (preserveAspectRatio="none"), и текст в нём поплыл бы.
           Тип и этажность — с листа «Генеральный план М1:500» из альбома. -->
      <div class="gp__tags" aria-hidden="true">
${blocks.map((b) => `        <span class="gp__tag" data-tag="${b.id}"
              style="left:${(b.x + b.w / 2).toFixed(2)}%;top:${(b.y + b.h / 2).toFixed(2)}%">
          <b>${esc(b.type)}</b><i>${b.floors}</i>
        </span>`).join('\n')}
      </div>
      </div>

      <!-- Вид с высоты — тот же квартал, только с натуры. Кликабельные корпуса
           оставлены на чертеже: на перспективном снимке ряды застройки
           перекрывают друг друга, и границы блоков пришлось бы угадывать. -->
      <img class="gp__aerial" src="/assets/img/hero-aerial-1920.webp"
           srcset="/assets/img/hero-aerial-960.webp 960w, /assets/img/hero-aerial-1280.webp 1280w, /assets/img/hero-aerial-1920.webp 1920w" sizes="(min-width:1100px) 60vw, 100vw"
           alt="${esc(g.aerialAlt)}" width="1920" height="1080" loading="lazy" decoding="async" hidden>

      <p class="gp__swipe" aria-hidden="true">${esc(g.swipe)}</p>
    </figure>

    <aside class="gp__card" data-genplan-card aria-live="polite">
      <p class="eyebrow">${esc(g.blockWord)}</p>
      <p class="gp__type"><span>${esc(g.typeWord)}</span> <b data-gp-type>${esc(first.type)}</b></p>
      <p class="gp__floors"><b data-gp-floors>${first.floors}</b> <span>${esc(g.floorsWord)}</span></p>
      <p class="gp__scheme"><span data-gp-scheme>${esc(first.scheme)}</span> — ${esc(g.schemeWord)}</p>
      <p class="gp__note">${esc(g.note)}</p>
      <!-- С генплана ведём в подбор: там реальный состав квартир и планы
           этажей. Соответствие «корпус на чертеже → подъезд» застройщиком
           пока не подтверждено, поэтому корпус фильтр не подставляет. -->
      <a class="pill" href="${p}/select/" data-track="cta_click">${esc(t.nav.select)}</a>
      <a class="link-call gp__more" href="${p}/apartments/">${esc(g.toPlans)}</a>
    </aside>
  </div>

  <div class="page__inner">
    <h2 class="page__h2">${esc(g.legendTitle)}</h2>
    <ul class="figures" data-stagger>
${g.legend.map(([v, l]) => `      <li class="figures__item"><b>${esc(v)}</b><span>${esc(l)}</span></li>`).join('\n')}
    </ul>
    <p class="plans__note">${esc(g.source)}</p>
  </div>
</section>

${leadSection(t, { formId: 'genplan', title: t.cta.primary, text: t.contacts.visitText, eyebrow: t.nav.contacts })}`;
  return page;
}

/* ══════════════ квартиры ══════════════ */
function apartments(t, page) {
  const BR = String.fromCharCode(10);
  const a = t.apartments;
  const p = t.plans;

  const cards = p.items.map((x) => planCard(t, x)).join('\n');

  page.body = `<section class="page">
  <div class="page__inner">
    ${breadcrumbs(t, [[page.path, t.nav.apartments]])}
    <h1 class="display" data-lines>${esc(a.h1)}</h1>
    <p class="page__lead">${esc(a.lead)}</p>
    <p class="page__price">${esc(a.priceLine)}<span>${esc(t.ui.priceNote)}</span></p>

    <!-- Разбор по комнатности. Каждая ссылка ведёт на страницу, где написано,
         сколько таких квартир, каких площадей и в каких подъездах — это и есть
         ответ на запрос «двухкомнатная в Самарканде». Отсюда же роботу видно
         все пять адресов. -->
    <nav class="rooms-nav" aria-label="${esc(t.rooms.byRooms)}">
${roomGroups().map((g) => `      <a class="rooms-nav__item" href="${t.lang === 'ru' ? '' : '/uz'}/apartments/${g.slug}/">
        <b>${esc(t.rooms.groups[g.key].short)}</b>
        <i>${g.count}</i>
        <span>${g.areaFrom === g.areaTo ? area(g.areaFrom) : area(g.areaFrom) + '–' + area(g.areaTo)} ${esc(t.ui.sqm)}</span>
      </a>`).join(BR)}
    </nav>
  </div>

  <div class="page__inner">
    <h2 class="page__h2" id="plans">${esc(p.title)}</h2>
    <p class="page__text">${esc(p.lead)}</p>
    ${picker(t, { anchors: true })}
  </div>

  <div class="plans" data-picker-grid>
${cards}
  </div>

  <div class="page__inner">
    <p class="picker__empty" data-picker-empty hidden>${esc(t.home.pickerEmpty)}</p>
    <p class="plans__note">${esc(p.note)}</p>

    <h2 class="page__h2">${esc(a.termsTitle)}</h2>
    <p class="page__text">${esc(a.termsLead)}</p>
    <ul class="terms">
      <li class="terms__item reveal">
        <b>${esc(a.termsNowTitle)}</b>
        <span>${esc(t.lang === 'ru' ? site.build.stage : site.build.stageUz)}</span>
        <em>${esc(t.lang === 'ru' ? site.build.asOf : site.build.asOfUz)}</em>
      </li>
${site.stages.map((st) => `      <li class="terms__item reveal">
        <b>${esc(a.termsStage.replace('{n}', st.no))}</b>
        <span>${romans[st.quarter]} ${esc(a.termsQuarter)} ${st.year}</span>
        <em>${st.blocks} ${esc(a.termsBlocks)}</em>
      </li>`).join('\n')}
      <li class="terms__item terms__item--gold reveal">
        <b>${esc(a.termsInstalmentTitle)}</b>
        <span>${esc(a.termsInstalmentText)}</span>
        <em>${instalmentMonths()} ${esc(a.termsMonths)}</em>
      </li>
      <li class="terms__item reveal">
        <b>${esc(a.termsDeveloperTitle)}</b>
        <span>${esc(site.developer.name)}</span>
      </li>
      <li class="terms__item reveal">
        <b>${esc(a.termsBankTitle)}</b>
        <span>${esc(site.bank.name)}</span>
      </li>
    </ul>
    <p class="plans__note">${esc(a.termsNote)}</p>

    <h2 class="page__h2">${esc(a.finishTitle)}</h2>
    <p class="page__text">${esc(a.finishText)}</p>
  </div>
</section>

<!-- ══════════════ интерьеры ══════════════
     Четыре вертикальных кадра из материалов PARI — пример возможной отделки.
     Квартиры передаются в white-box, и подпись говорит об этом прямо. -->
<section class="lobby" aria-labelledby="interiors-h">
  <div class="page__inner">
    <p class="eyebrow reveal">${esc(t.home.interiorsEyebrow)}</p>
    <h2 class="lobby__h" id="interiors-h">${esc(a.interiorsTitle)}</h2>
    <p class="page__text reveal">${esc(a.interiorsText)}</p>
  </div>
  <div class="lobby__grid" data-strip>
${a.interiors.map((g, i) => `    <figure class="lobby__shot" data-mask="${i % 2 ? 'right' : 'left'}">
      <img src="/assets/img/${g.img}-760.webp" srcset="/assets/img/${g.img}-760.webp 760w, /assets/img/${g.img}-960.webp 960w"
           sizes="(min-width:1100px) 24vw, (min-width:620px) 46vw, 100vw" alt="${esc(g.cap)}"
           width="960" height="1280" loading="lazy" decoding="async">
      <figcaption><i>0${i + 1}</i>${esc(g.cap)}</figcaption>
    </figure>`).join('\n')}
  </div>
  <div class="page__inner">
${railNav(t)}
    <p class="plans__note">${esc(a.interiorsNote)}</p>
  </div>
</section>

${leadSection(t, { formId: 'apartments', title: t.cta.primary, text: t.contacts.visitText, eyebrow: t.nav.contacts })}`;
  return page;
}

/* ══════════════ о проекте ══════════════
   Разделы и тексты повторяют буклет застройщика: о проекте, архитектурные
   решения, входные группы, благоустройство, паркинг. */
function project(t, page) {
  const j = t.project;
  const p = t.lang === 'ru' ? '' : '/uz';
  const marks = (items) => `<ul class="marks">
${items.map((x) => `      <li class="reveal">${esc(x)}</li>`).join('\n')}
    </ul>`;

  page.body = `<section class="page">
  <div class="page__inner">
    ${breadcrumbs(t, [[page.path, t.nav.project]])}
    <h1 class="display" data-lines>${esc(j.h1)}</h1>
    <p class="page__lead">${esc(j.lead)}</p>
    <p class="page__text">${esc(j.lead2)}</p>
    <ul class="figures">
${j.facts.map((f) => `      <li class="reveal"><b>${esc(f.value)}</b><span>${esc(f.label)}</span></li>`).join('\n')}
    </ul>
  </div>

  <figure class="wide-shot reveal">
    <img src="/assets/img/complex-aerial-1280.webp"
         srcset="/assets/img/complex-aerial-1280.webp 1280w, /assets/img/complex-aerial-1920.webp 1920w, /assets/img/complex-aerial-2560.webp 2560w"
         sizes="100vw" alt="${esc(j.aerialAlt)}"
         width="2560" height="1244" loading="lazy" decoding="async">
  </figure>

  <div class="page__inner">
    <h2 class="page__h2">${esc(j.aerialTitle)}</h2>
    <p class="page__text">${esc(j.aerialText)}</p>
    ${marks(j.aerialList)}
  </div>
</section>

<!-- ══════════════ АРХИТЕКТУРНЫЕ РЕШЕНИЯ ══════════════ -->
<section class="page" id="architecture">
  <div class="page__inner">
    <h2 class="page__h2"><i class="num">${j.archNum}</i>${esc(j.archTitle)}</h2>
    <p class="page__text">${esc(j.archText)}</p>
    <p class="page__text">${esc(j.archText2)}</p>
    ${marks(j.archList)}
  </div>
  <div class="gallery__grid" data-strip>
${shotGrid(j.archGallery, '(min-width:900px) 58vw, 100vw')}
  </div>
  <div class="page__inner">
${railNav(t)}
    <a class="link-call reveal" href="${p}/apartments/">${esc(j.plansLink)}</a>
  </div>
</section>

<!-- ══════════════ ВХОДНЫЕ ГРУППЫ ══════════════ -->
<section class="split split--flip" id="entry">
  <div class="split__media figure-mask">
    <img src="/assets/img/arch-entrance-1280.webp"
         srcset="/assets/img/arch-entrance-1280.webp 1280w, /assets/img/arch-entrance-1920.webp 1920w"
         sizes="(min-width:900px) 52vw, 100vw" alt="${esc(j.entryAlt)}"
         width="1920" height="1072" loading="lazy" decoding="async">
  </div>
  <div class="split__panel">
    <p class="eyebrow reveal"><span class="num">${j.entryNum}</span></p>
    <h2 class="display" data-lines>${esc(j.entryTitle)}</h2>
    <p class="split__text reveal">${esc(j.entryText)}</p>
  </div>
</section>

<!-- ══════════════ ЛОББИ ВБЛИЗИ ══════════════ -->
<section class="lobby" aria-labelledby="lobby-h">
  <div class="page__inner">
    <h3 class="lobby__h" id="lobby-h">${esc(j.entryTitle)}</h3>
  </div>
  <div class="lobby__grid" data-strip>
${lobbyGrid(j.entryGallery)}
  </div>
  <div class="page__inner">
${railNav(t)}
  </div>
</section>

<!-- ══════════════ БЛАГОУСТРОЙСТВО ══════════════ -->
<section class="page" id="landscape">
  <div class="page__inner">
    <h2 class="page__h2"><i class="num">${j.yardNum}</i>${esc(j.yardTitle)}</h2>
    <p class="page__text">${esc(j.yardText)}</p>
    <p class="page__text">${esc(j.yardText2)}</p>
    ${marks(j.yardList)}
  </div>
  <div class="gallery__grid" data-strip>
${shotGrid(j.yardGallery, '(min-width:900px) 58vw, 100vw')}
  </div>
  <div class="page__inner">
${railNav(t)}
  </div>
</section>

<!-- ══════════════ ПАРКИНГ И РАЙОН ══════════════ -->
<section class="page" id="parking">
  <div class="page__inner">
    <h2 class="page__h2"><i class="num">${j.parkingNum}</i>${esc(j.parkingTitle)}</h2>
    <p class="page__text">${esc(j.parkingText)}</p>
    ${marks(j.parkingList)}

    <h2 class="page__h2">${esc(j.districtTitle)}</h2>
    <p class="page__text">${esc(j.districtText)}</p>
    ${masterplan(t)}
    <a class="link-call reveal" href="${p}/location/">${esc(j.districtLink)}</a>
  </div>
</section>

${leadSection(t, { formId: 'project', title: t.cta.primary, text: t.contacts.visitText, eyebrow: t.nav.contacts })}`;
  return page;
}

/* ══════════════ локация ══════════════ */
function location(t, page) {
  const l = t.location;
  page.body = `<section class="page">
  <div class="page__inner">
    ${breadcrumbs(t, [[page.path, t.nav.location]])}
    <h1 class="display" data-lines>${esc(l.h1)}</h1>
    <p class="page__lead">${esc(l.lead)}</p>
  </div>

  <div class="page__inner page__grid">
    <div>
      ${distanceList(t)}
      <p class="place__addr">${esc(addressLine(t))}</p>
    </div>
    ${mapBlock(t, 'map--tall')}
  </div>

  <div class="page__inner">
    <h2 class="page__h2">${esc(l.districtTitle)}</h2>
    <p class="page__text">${esc(l.districtText)}</p>

    <h2 class="page__h2">${esc(l.masterTitle)}</h2>
    <p class="page__text">${esc(l.masterText)}</p>
    ${masterplan(t)}
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
    <h1 class="display" data-lines>${esc(c.h1)}</h1>
    <p class="page__lead">${esc(c.lead)}</p>

    <dl class="nap">
      <div><dt>${esc(c.phoneLabel)}</dt><dd><a class="nap__tel" href="tel:${site.phone.tel}" data-track="phone_click">${site.phone.display}</a></dd></div>
      <div><dt>${esc(c.hoursLabel)}</dt><dd>${esc(t.lang === 'ru' ? site.hours.ru : site.hours.uz)}</dd></div>
      <div><dt>${esc(c.addressLabel)}</dt><dd>${esc(addressLine(t))}</dd></div>
      <div><dt>${esc(c.socialLabel)}</dt><dd>
        <a href="${site.telegram}" target="_blank" rel="noopener noreferrer" data-track="telegram_click">Telegram</a>
        &nbsp;·&nbsp;
        <a href="${site.instagram}" target="_blank" rel="noopener noreferrer">Instagram</a>
      </dd></div>
    </dl>

    ${mapBlock(t)}
  </div>
</section>

${leadSection(t, { formId: 'contacts', h: 'h2', title: esc(c.visitTitle), text: c.visitText, eyebrow: t.nav.contacts })}`;
  return page;
}

/* ══════════════ вопросы и ответы ══════════════
   Разметка details/summary: раскрывается без единой строки скрипта, а текст
   ответа лежит в HTML целиком — и робот, и человек без JavaScript читают его
   одинаково. Первый вопрос открыт, чтобы раздел не выглядел пустым. */
function faq(t, page) {
  const f = t.faq;
  const pairs = faqPairs(t);
  const items = pairs.map((x, i) => `      <details class="faq__item reveal"${i === 0 ? ' open' : ''}>
        <summary class="faq__q"><h2>${esc(x.q)}</h2></summary>
        <div class="faq__a"><p>${esc(x.a)}</p></div>
      </details>`).join('\n');

  const p = t.lang === 'ru' ? '' : '/uz';
  page.body = `<section class="page">
  <div class="page__inner">
    ${breadcrumbs(t, [[page.path, t.nav.faq]])}
    <h1 class="display" data-lines>${esc(f.h1)}</h1>
    <p class="page__lead">${esc(f.lead)}</p>

    <div class="faq">
${items}
    </div>

    <p class="faq__more reveal">${esc(f.more)}
      <a href="${p}/apartments/">${esc(f.links.apartments)}</a>,
      <a href="${p}/select/">${esc(f.links.select)}</a>,
      <a href="${p}/location/">${esc(f.links.location)}</a>.
    </p>
  </div>
</section>

${leadSection(t, { formId: 'faq', h: 'h2', title: esc(f.ctaTitle), text: f.ctaText, eyebrow: t.nav.faq })}`;
  return page;
}

/* ══════════════ квартиры по комнатности ══════════════
   Настоящие цифры — сколько квартир, каких площадей, на каких этажах — лежат
   в разметке, а не только в flats.json: их читают и поисковик, и человек с
   выключенным JS. Но лежат сводкой, а не поштучно. Раньше здесь стояла
   таблица «Где в квартале» с разбивкой по всем тринадцати подъездам, и рядом
   печаталось, из какой выгрузки она взята. Заказчик это снял: покупателю не
   нужно видеть шахматку целиком и знать, откуда она, а тринадцать строк плюс
   два десятка чертежей превращали страницу в бесконечную ленту. */
function roomsPage(t, page) {
  const r = t.rooms;
  const g = page.group;
  const f = roomFacts(t, g);
  const p = t.lang === 'ru' ? '' : '/uz';

  /* Листы планировок этой комнатности. Студии в альбоме отдельной группой не
     идут — их чертежи лежат среди однокомнатных, поэтому здесь их не будет,
     и вместо пустого места печатается честная строка.

     Показываем не больше четырёх: двухкомнатных листов двадцать четыре, и
     страница из них не кончалась. Четыре — это ровно два ряда крупных
     карточек, дальше человек идёт в подбор или звонит. */
  const isStudio = g.key === 's';
  const plans = t.plans.items
    .filter((x) => (isStudio ? x.studio : !x.studio && String(x.rooms) === g.key))
    .slice(0, PLANS_SHOWN);
  const plansBlock = plans.length
    ? `<p class="page__text">${esc(r.plansLead)}</p>
    <div class="plans plans--few">
${plans.map((x) => planCard(t, x)).join('\n')}
    </div>`
    : `<p class="page__text">${esc(r.plansNone)}</p>`;

  const others = roomsCatalogue(t, g.key);

  page.body = `<section class="page">
  <div class="page__inner">
    ${breadcrumbs(t, [[`${p}/apartments/`, t.nav.apartments], [page.path, f.short]])}
    <h1 class="display" data-lines>${esc(fill(r.h1, f))}</h1>
    <p class="page__lead">${esc(fill(r.lead, f))}</p>
    <p class="page__text">${esc(fill(r.leadPrice, f))}</p>

    <dl class="rf">
      <div><dt>${esc(r.colCount)}</dt><dd>${f.countN}</dd></div>
      <div><dt>${esc(r.colArea)}</dt><dd>${g.areaFrom === g.areaTo ? f.areaFrom : f.areaFrom + '–' + f.areaTo}</dd></div>
      <div><dt>${esc(r.colFloors)}</dt><dd>${g.floorFrom === g.floorTo ? f.floorFrom : f.floorFrom + '–' + f.floorTo}</dd></div>
      <div><dt>${esc(r.colEntrance)}</dt><dd>${g.entrances.length}</dd></div>
    </dl>
  </div>

  <div class="page">
  <div class="page__inner">
    <h2 class="page__h2 reveal">${esc(r.plansTitle)}</h2>
    ${plansBlock}
  </div>
  </div>

  <div class="page">
  <div class="page__inner">
    <h3 class="rf__h3">${esc(r.pickTitle)}</h3>
    <p>${esc(r.pickText)}</p>
    <p class="rf__cta"><a class="pill" href="${p}/select/#plan" data-magnet>${esc(r.pickCta)}${ARROW}</a></p>

    <h3 class="rf__h3">${esc(r.byRooms)}</h3>
    <nav class="rooms-nav" aria-label="${esc(r.byRooms)}">
${others}
    </nav>
  </div>
  </div>
</section>

${leadSection(t, { formId: 'rooms-' + g.slug, h: 'h2', title: t.cta.primary,
  text: t.contacts.visitText, eyebrow: f.short })}`;
  return page;
}

/* ══════════════ рассрочка ══════════════
   Условия подтверждены владельцем: беспроцентно, до сдачи первой очереди,
   максимум 36 месяцев. Калькулятор считает по формуле «остаток делим на
   срок» — это ровно то, чем беспроцентная рассрочка и является; никакой
   аннуитет здесь не при чём. Рядом стоит оговорка, что это не оферта. */
function installment(t, page) {
  const n = t.instal;
  const p = t.lang === 'ru' ? '' : '/uz';
  const ru = t.lang === 'ru';
  const months = instalmentMonths();
  const st = site.stages.find((x) => x.no === site.instalment.untilStage);
  const f = {
    months: ru ? `${months} ${plural(months, ['месяцев', 'месяц', 'месяца'])}` : `${months} oy`,
    price: `${site.price.from} ${ru ? site.price.unit : site.price.unitUz}`,
    stage1: ru ? `${romans[st.quarter]} квартал ${st.year} года` : `${st.year}-yil ${romans[st.quarter]} chorak`,
    developer: site.developer.name,
    bank: site.bank.name,
  };

  const facts = n.facts.map((x) => `      <div class="rf__cell">
        <dt>${esc(x.k)}</dt>
        <dd>${esc(fill(x.v, f))}</dd>
        <p>${esc(x.note)}</p>
      </div>`).join('\n');

  const how = n.how.map((x) => `      <li>${esc(fill(x, f))}</li>`).join('\n');

  page.body = `<section class="page">
  <div class="page__inner">
    ${breadcrumbs(t, [[page.path, t.nav.instal]])}
    <h1 class="display" data-lines>${esc(n.h1)}</h1>
    <p class="page__lead">${esc(n.lead)}</p>

    <h2 class="rf__h3">${esc(n.factsTitle)}</h2>
    <dl class="rf rf--wide">
${facts}
    </dl>
  </div>

  <div class="page">
  <div class="page__inner">
    <h2 class="page__h2 reveal">${esc(n.howTitle)}</h2>
    <ol class="rf__how">
${how}
    </ol>
  </div>
  </div>

  <!-- ══════════════ калькулятор ══════════════
       Значения по умолчанию — настоящие: средняя двухкомнатная и цена,
       подтверждённая владельцем. Поэтому в первом кадре виден осмысленный
       расчёт, а не нули; и он же остаётся, если скрипт не отработает. -->
  <div class="page">
  <div class="page__inner">
    <h2 class="page__h2 reveal">${esc(n.calcTitle)}</h2>
    <p class="page__text">${esc(n.calcLead)}</p>

    <div class="calc" data-calc data-mln="${esc(n.mln)}" data-max="${site.instalment.maxMonths}"
         data-now="${months}">
      <div class="calc__in">
        <label class="calc__f">
          <span>${esc(n.calcArea)}</span>
          <input type="number" data-calc-area value="67" min="27" max="96" step="0.01" inputmode="decimal">
        </label>
        <label class="calc__f">
          <span>${esc(n.calcPrice)}</span>
          <input type="number" data-calc-rate value="${site.price.from}" min="1" max="99" step="0.1" inputmode="decimal">
        </label>
        <label class="calc__f">
          <span>${esc(n.calcDown)} <b data-calc-down-out>30%</b></span>
          <input type="range" data-calc-down min="0" max="90" step="5" value="30">
        </label>
        <label class="calc__f">
          <span>${esc(n.calcTerm)} <b data-calc-term-out>${months}</b></span>
          <input type="range" data-calc-term min="1" max="${months}" step="1" value="${months}">
        </label>
      </div>

      <dl class="calc__out">
        <div><dt>${esc(n.calcOutCost)}</dt><dd data-calc-cost>670 ${esc(n.mln)}</dd></div>
        <div><dt>${esc(n.calcOutDown)}</dt><dd data-calc-downsum>201 ${esc(n.mln)}</dd></div>
        <div><dt>${esc(n.calcOutRest)}</dt><dd data-calc-rest>469 ${esc(n.mln)}</dd></div>
        <div class="calc__hero"><dt>${esc(n.calcOutMonth)}</dt><dd data-calc-month>13 ${esc(n.mln)}</dd></div>
      </dl>
    </div>
    <p class="plans__note">${esc(n.calcNote)}</p>

    <h3 class="rf__h3">${esc(n.pickTitle)}</h3>
    <p>${esc(n.pickText)}</p>
    <p class="rf__cta"><a class="pill" href="${p}/select/#plan" data-magnet>${esc(t.rooms.pickCta)}${ARROW}</a></p>
  </div>
  </div>
</section>

${leadSection(t, { formId: 'instal', h: 'h2', title: t.cta.primary,
  text: t.contacts.visitText, eyebrow: t.nav.instal })}`;
  return page;
}

/* ══════════════ 404 ══════════════ */
function notFound(t, page, alt) {
  const n = t.notFound;
  const p = t.lang === 'ru' ? '' : '/uz';
  const a = alt || null;                       /* словарь второго языка, если он передан */
  const uz = (key, value) => (a ? ` data-alt="${esc(value)}"` : '');
  page.body = `<section class="page page--404">
  <div class="page__inner">
    <img class="page__mark" src="/assets/img/brand-frame.png" alt="" width="640" height="616">
    <h1 class="display" data-lines${a ? ` data-alt="${esc(a.notFound.h1)}"` : ''}>${esc(n.h1)}</h1>
    <p class="page__lead"${a ? ` data-alt="${esc(a.notFound.text)}"` : ''}>${esc(n.text)}</p>
    <ul class="page__links">
      <li><a href="${p || '/'}${p ? '/' : ''}"${a ? ` data-alt="${esc(a.ui.home)}" data-alt-href="/uz/"` : ''}>${esc(t.ui.home)}</a></li>
      <li><a href="${p}/apartments/"${a ? ` data-alt="${esc(a.nav.apartments)}" data-alt-href="/uz/apartments/"` : ''}>${esc(t.nav.apartments)}</a></li>
      <li><a href="${p}/contacts/"${a ? ` data-alt="${esc(a.nav.contacts)}" data-alt-href="/uz/contacts/"` : ''}>${esc(t.nav.contacts)}</a></li>
      <li><a href="tel:${site.phone.tel}" data-track="phone_click">${site.phone.display}</a></li>
    </ul>
  </div>
</section>${a ? `
<script>
/* Хостинг отдаёт эту страницу на любой ненайденный адрес. Для адресов /uz/…
   переключаем тексты на узбекский, не меняя код ответа. */
if (location.pathname.indexOf('/uz/') === 0) {
  document.documentElement.lang = 'uz';
  document.title = ${JSON.stringify(a.meta.notFound.title)};
  document.querySelectorAll('[data-alt]').forEach(function (el) {
    el.textContent = el.getAttribute('data-alt');
    if (el.hasAttribute('data-alt-href')) { el.setAttribute('href', el.getAttribute('data-alt-href')); }
  });
}
</script>` : ''}`;
  return page;
}

module.exports = { shell, home, project, apartments, genplan, select, location, faq, contacts,
  roomsPage, installment, roomGroups, roomFacts, notFound, faqPairs, facts, swap, url, esc };
