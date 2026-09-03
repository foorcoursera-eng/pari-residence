/* ==========================================================================
   PARI Residence — шаблоны страниц.
   Все внутренние ссылки и пути к ассетам абсолютные: сайт живёт в корне домена.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');

const { site, blocks } = require('./content');
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

/* ── заставка первого захода: медальон, уезжающий вверх ── */
function splash() {
  return `<div class="splash" id="splash" aria-hidden="true">
  <div class="splash__mark">
    <img src="/assets/img/brand-frame.png" alt="" width="640" height="616">
    <img class="splash__logo" src="/assets/img/pari-logo-vector.png" alt="" width="1872" height="1031">
  </div>
</div>
`;
}

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
function navItems(t) {
  const p = t.lang === 'ru' ? '' : '/uz';
  return [
    [`${p}/project/`, t.nav.project],
    [`${p}/apartments/`, t.nav.apartments],
    [`${p}/genplan/`, t.nav.genplan],
    [`${p}/select/`, t.nav.select],
    [`${p}/location/`, t.nav.location],
    [`${p}/contacts/`, t.nav.contacts],
  ];
}

function header(t, path) {
  const items = navItems(t).map(([href, label]) => `      <a href="${href}">${esc(label)}</a>`).join('\n');
  /* Плотное состояние проставляем прямо в разметке всюду, кроме главной:
     там шапка выезжает после первого экрана, а на внутренних страницах она
     нужна с первого кадра. Раньше её показывал только скрипт — при
     неотработавшем JavaScript страница оставалась без логотипа, меню и
     телефона. */
  const inner = path !== '/' && path !== '/uz/';
  return `<header class="bar${inner ? ' is-solid' : ''}" id="bar">
  <span class="bar__progress" aria-hidden="true"></span>
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
  const items = navItems(t).map(([href, label], i) => `        <a class="menu__link" href="${href}">
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
        <img class="medallion__logo" src="/assets/img/pari-logo-vector.png" alt="${site.brand}" width="1872" height="1031" loading="lazy" decoding="async">
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
  const rooms = p.roomWord[x.rooms];
  const blocks = `${p.blockWord[x.blocks.length > 1 ? 2 : 1]} ${x.blocks.join(', ')}`;
  const label = `${rooms} · ${x.area} ${t.ui.sqm} · ${blocks}`;
  return `      <article class="plan reveal" data-rooms="${x.rooms}" data-area="${x.area.replace(',', '.')}">
        <button class="plan__view" type="button"
                data-zoom="/assets/img/plans/${x.id}-1400.webp"
                data-zoom-label="${esc(label)}"
                aria-label="${esc(p.zoom)}: ${esc(label)}">
          <img src="/assets/img/plans/${x.id}-800.webp"
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

/* ── мастер-план района с легендой ──
   Легенда набирается разметкой, а не берётся с картинки: так она читается на
   узбекском и не расплывается при увеличении. */
function masterplan(t) {
  const l = t.location;
  return `<figure class="master">
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

function logoDraw(extra) {
  const script = inkPaths(LOGO.script, 0);
  const caption = inkPaths(LOGO.caption, 5);
  return `<svg class="mark${extra ? ' ' + extra : ''}" viewBox="${LOGO.viewBox}" role="img" aria-label="${site.brand}">
      <title>${site.brand}</title>
      <g class="mark__word">${script}</g>
      <g class="mark__cap">${caption}</g>
    </svg>`;
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
  const h = t.home;
  const items = [
    ['#about', h.aboutEyebrow],
    ['#architecture', h.archEyebrow],
    ['#yard', h.yardEyebrow],
    ['#homes', h.homesEyebrow],
    ['#place', h.placeEyebrow],
    ['#call', h.finalEyebrow],
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
<meta property="og:image" content="${url('/assets/img/hero-aerial-1920.webp')}">
<meta property="og:locale" content="${t.locale}">
<meta property="og:locale:alternate" content="${t.altLocale}">
<meta name="twitter:card" content="summary_large_image">
<!-- Иконки собраны из настоящего логотипа (tools/make-icons.py). Раньше здесь
     стоял только инлайновый SVG с самодельной буквой: вкладка его показывала,
     а превью ссылок в мессенджерах и поиске — нет, там оставался серый глобус.
     ICO лежит в корне: за ним ходят по умолчанию, без разметки. -->
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" type="image/png" sizes="192x192" href="/assets/img/icon-192.png">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
${page.preload || ''}<link rel="stylesheet" href="/styles.css?v=${page.v}">
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
   Порядок разделов: титул → квартиры → кинолента → двор-парк → локация → заявка. */
function home(t, page) {
  const h = t.home;
  /* Слайд раздела: кадр во весь экран, заголовок и абзац поверх него. */
  const cine = h.cine.map((c) => {
    const max = c.w[c.w.length - 1];
    const set = c.w.map((w) => `/assets/img/${c.img}-${w}.webp ${w}w`).join(', ');
    return `      <figure class="frame">
        <img src="/assets/img/${c.img}-${c.w[0]}.webp" srcset="${set}"
             sizes="100vw" alt="${esc(c.title)}" width="${max}" height="${Math.round(max / 2)}"
             loading="lazy" decoding="async">
        <figcaption class="frame__cap">
          <b class="frame__name">${esc(c.title)}</b>
          <span class="frame__text">${esc(c.text)}</span>
        </figcaption>
      </figure>`;
  }).join('\n');

  const stats = h.stats.map((x) => `      <li class="figures__item">
        <b data-count="${x.value}"${x.suffix ? ` data-suffix="${x.suffix}"` : ''}>${x.value}${x.suffix || ''}</b>
        <span>${esc(x.label)}</span>
      </li>`).join('\n');

  /* Планировки стоят на главной целиком: подбор без выбора смысла не имеет. */
  /* На главной показываем шесть планировок, а не весь каталог: тридцать три
     чертежа превращали страницу в свалку картинок, и заказчик справедливо на
     это пожаловался. Отбор по комнатности и площади живёт на странице квартир —
     ровно так же устроен образец, на который он ссылается. */
  const plans = h.homesPreview
    .map((id) => t.plans.items.find((x) => x.id === id))
    .filter(Boolean)
    .map((x) => planCard(t, x)).join('\n');

  /* Диапазон площадей берём из самих планировок: числа в тексте и в карточках
     разойтись не могут. */
  const byArea = t.plans.items.slice().sort((a, b) =>
    parseFloat(a.area.replace(',', '.')) - parseFloat(b.area.replace(',', '.')));
  const areaFrom = byArea[0].area;
  const areaTo = byArea[byArea.length - 1].area;

  const p = t.lang === 'ru' ? '' : '/uz';
  const apartmentsHref = `${p}/apartments/`;
  const locationHref = `${p}/location/`;
  const projectHref = `${p}/project/`;

  page.body = `<!-- ══════════════ 1 · ТИТУЛ ══════════════
     Страница открывается на белом: логотип прорисовывается штрихом, кадр
     квартала лежит в рамке и раскрывается во весь экран по мере прокрутки.
     Логотип стоит на чистом фоне, а не поверх снимка — гайдбук §2.6. -->
<section class="opening" aria-label="${site.brand}">
  <div class="opening__stage">

    <div class="opening__head" data-open-head>
      <p class="opening__eyebrow" lang="uz">${h.heroEyebrow}</p>
      ${logoDraw('opening__mark')}
      <h1 class="opening__slogan script" data-write="heroSlogan">${h.heroSlogan}</h1>
      <p class="opening__sub" lang="${t.lang === 'ru' ? 'uz' : 'ru'}">${esc(h.heroSub)}</p>
    </div>

    <figure class="opening__frame" data-open-frame>
      <!-- Один кадр в двух состояниях: сверху лежит чертёж, под ним тот же
           самый рендер в красках. Оба сделаны из одного исходника без обрезки,
           поэтому при листании рисунок буквально раскрашивается. -->
      <img class="opening__shot" src="/assets/img/opening-shot-1920.webp"
           srcset="/assets/img/opening-shot-1280.webp 1280w, /assets/img/opening-shot-1920.webp 1920w, /assets/img/opening-shot-2560.webp 2560w"
           sizes="100vw" alt="${esc(h.leadFrameAlt)}" width="2560" height="1429"
           fetchpriority="high" decoding="async">

      <img class="opening__plan" src="/assets/img/opening-line-1600.webp"
           srcset="/assets/img/opening-line-1600.webp 1600w, /assets/img/opening-line-2400.webp 2400w"
           sizes="100vw" alt="" aria-hidden="true" width="1600" height="893"
           fetchpriority="high" decoding="async">

      <div class="opening__foot" data-open-foot>
        <a class="opening__scroll" href="#about">
          <span aria-hidden="true"></span>${esc(h.leadScroll)}
        </a>
        <a class="opening__call" href="tel:${site.phone.tel}" data-track="phone_click">
          <span class="opening__call-label">${esc(t.ui.call)}</span>
          <span class="opening__call-num">${site.phone.display}</span>
        </a>
      </div>
    </figure>

  </div>
</section>

<!-- ══════════════ 2 · О ПРОЕКТЕ ══════════════
     Одна мысль на экран и крупные показатели: цифры досчитываются,
     когда раздел выходит на экран. -->
<section class="about" id="about">
  <span class="side-tag" aria-hidden="true">${esc(h.aboutEyebrow)}</span>
  <div class="about__inner">
    <p class="eyebrow reveal"><span class="num">${h.aboutNum}</span> ${esc(h.aboutEyebrow)}</p>
    <h2 class="display display--wide" data-lines>${h.aboutTitle}</h2>

    <div class="about__grid">
      <!-- два кадра внахлёст: арка отсылает к аркадам первых этажей -->
      <div class="about__art reveal">
        <figure class="art art--arch">
          <img src="/assets/img/arch-entrance-1280.webp"
               srcset="/assets/img/arch-entrance-1280.webp 1280w, /assets/img/arch-entrance-1920.webp 1920w"
               sizes="(min-width:900px) 26vw, 58vw" alt="${esc(h.aboutArchAlt)}"
               width="1280" height="714" loading="lazy" decoding="async">
        </figure>
        <figure class="art art--shot">
          <img src="/assets/img/yard-1080.webp"
               srcset="/assets/img/yard-1080.webp 1080w, /assets/img/yard-1920.webp 1920w"
               sizes="(min-width:900px) 34vw, 74vw" alt="${esc(h.aboutShotAlt)}"
               width="1920" height="1071" loading="lazy" decoding="async">
        </figure>
      </div>

      <div class="about__side">
        <p class="about__text reveal">${esc(h.aboutText)}</p>
        <p class="about__text reveal">${esc(h.aboutText2)}</p>
        <ul class="figures">
${stats}
        </ul>
        <a class="pill reveal" href="${projectHref}">${esc(h.archLink)}</a>
      </div>
    </div>
  </div>
</section>

<!-- ══════════════ 3 · АРХИТЕКТУРА ══════════════ -->
<section class="arch" id="architecture">
  <div class="arch__head">
    <p class="eyebrow reveal"><span class="num">${h.archNum}</span> ${esc(h.archEyebrow)}</p>
    <h2 class="display" data-lines>${h.archTitle}</h2>
    <p class="arch__text reveal">${esc(h.archText)}</p>
  </div>
  <div class="gallery__grid">
${shotGrid(h.arch, '(min-width:900px) 58vw, 100vw')}
  </div>
</section>

<!-- ══════════════ 4 · ФИЛЬМ ══════════════
     Единственная тёмная полоса на странице: имиджевый ролик идёт петлёй
     без звука. Не грузится при экономии трафика и на медленной сети. -->
<section class="film" id="film">
  <video class="film__video" id="heroVideo" muted loop playsinline
         preload="none" aria-hidden="true" tabindex="-1"
         poster="/assets/img/hero-poster-1600.webp"
         data-webm="/assets/video/hero-loop-{w}.webm"
         data-mp4="/assets/video/hero-loop-{w}.mp4"
         data-webm-portrait="/assets/video/hero-portrait.webm"
         data-mp4-portrait="/assets/video/hero-portrait.mp4"></video>
  <div class="film__veil" aria-hidden="true"></div>
  <div class="film__inner">
    <p class="eyebrow eyebrow--light reveal">${esc(h.filmEyebrow)}</p>
    <h2 class="display display--light" data-lines>${h.filmTitle}</h2>
    <p class="film__note reveal">${esc(h.filmNote)}</p>
  </div>
</section>

<!-- ══════════════ 5 · ДВОР-ПАРК ══════════════ -->
<section class="split" id="yard">
  <div class="split__media figure-mask">
    <img src="/assets/img/yard-1920.webp"
         srcset="/assets/img/yard-1080.webp 1080w, /assets/img/yard-1920.webp 1920w"
         sizes="(min-width:900px) 52vw, 100vw" alt="${esc(h.yardAlt)}"
         width="1920" height="1071" loading="lazy" decoding="async">
  </div>
  <div class="split__panel">
    <p class="eyebrow reveal"><span class="num">${h.yardNum}</span> ${esc(h.yardEyebrow)}</p>
    <h2 class="display" data-lines>${h.yardTitle}</h2>
    <p class="split__text reveal">${esc(h.yardText)}</p>
  </div>
</section>

<!-- ══════════════ КИНОЛЕНТА ══════════════ -->
<section class="cine" data-cine aria-roledescription="carousel" aria-label="${esc(h.cineLabel)}">
  <div class="cine__head">
    <p class="eyebrow eyebrow--light reveal">${esc(h.cineEyebrow)}</p>
    <h2 class="display display--light" data-lines>${h.cineTitle}</h2>
  </div>

  <div class="cine__stage">
    <div class="cine__track">
${cine}
    </div>

    <button class="cine__arrow cine__arrow--prev" type="button" data-cine-prev aria-label="${esc(h.cinePrev)}"></button>
    <button class="cine__arrow cine__arrow--next" type="button" data-cine-next aria-label="${esc(h.cineNext)}"></button>

    <div class="cine__dots" role="tablist" aria-label="${esc(h.cineLabel)}">
${h.cine.map((c, i) => `      <button class="cine__dot${i === 0 ? ' is-on' : ''}" type="button" role="tab" data-cine-go="${i}" aria-label="${esc(c.title)}"${i === 0 ? ' aria-selected="true"' : ''}><i></i></button>`).join('\n')}
    </div>
  </div>
</section>

<!-- ══════════════ 6 · КВАРТИРЫ И ПОДБОР ══════════════
     Отбор по комнатности и площади стоит прямо на главной: до отдельной
     страницы доходят не все, а выбрать квартиру человек хочет сразу. -->
<section class="homes" id="homes">
  <div class="homes__inner">
    <p class="eyebrow reveal"><span class="num">${h.homesNum}</span> ${esc(h.homesEyebrow)}</p>
    <h2 class="display" data-lines>${h.homesTitle}</h2>
    <p class="homes__lead reveal">${esc(h.homesNote)}</p>

    <ul class="figures figures--pair">
      <li class="figures__item"><b>${areaFrom} – ${areaTo} <span>${t.ui.sqm}</span></b><span>${esc(t.ui.areaWord)}</span></li>
      <li class="figures__item"><b data-count="${t.plans.items.length}">${t.plans.items.length}</b><span>${esc(t.ui.plansWord)}</span></li>
    </ul>
  </div>

  <div class="plans">
${plans}
  </div>

  <div class="homes__inner">
    <a class="pill reveal" href="${apartmentsHref}">${esc(t.ui.pick)}</a>
  </div>
</section>

<!-- ══════════════ 7 · ЛОКАЦИЯ ══════════════ -->
<section class="place" id="place">
  <div class="place__inner">
    <div>
      <p class="eyebrow reveal"><span class="num">${h.placeNum}</span> ${esc(h.placeEyebrow)}</p>
      <h2 class="display" data-lines>${h.placeTitle}</h2>
      ${distanceList(t)}
      <p class="place__addr reveal">${esc(addressLine(t))}</p>
      <a class="link-call reveal" href="${locationHref}">${esc(t.nav.location)}</a>
    </div>
    ${mapBlock(t, 'map--tall')}
  </div>
</section>

<!-- ══════════════ МАСТЕР-ПЛАН РАЙОНА ══════════════ -->
<section class="district" id="district">
  <div class="district__inner">
    <p class="eyebrow reveal">${esc(h.masterEyebrow)}</p>
    <h2 class="display" data-lines>${h.masterTitle}</h2>
    <p class="district__text reveal">${esc(h.masterText)}</p>
    ${masterplan(t)}
    <a class="link-call reveal" href="${locationHref}">${esc(h.masterLink)}</a>
  </div>
</section>

<!-- ══════════════ 8 · КТО СТРОИТ ══════════════ -->
<section class="maker" id="maker">
  <div class="maker__inner">
    <p class="eyebrow reveal">${esc(h.makerEyebrow)}</p>
    <h2 class="display" data-lines>${h.makerTitle}</h2>
    <p class="maker__text reveal">${esc(h.makerText)}</p>
    <dl class="maker__list">
      <div class="maker__row reveal"><dt>${esc(h.makerDev)}</dt><dd>${esc(site.developer.name)}</dd></div>
      <div class="maker__row reveal"><dt>${esc(h.makerArch)}</dt><dd>${esc(site.architect.name)}</dd></div>
    </dl>
  </div>
</section>

${leadSection(t, {})}

${rail(t)}`;
  return page;
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

  page.body = `<section class="page">
  <div class="page__inner">
    ${breadcrumbs(t, [[page.path, s.h1]])}
    <h1 class="display" data-lines>${esc(s.h1)}</h1>
    <p class="page__lead">${esc(s.lead)}</p>
  </div>

  <div class="page__inner">
    <div class="chooser" data-chooser data-total="${total}"
         data-entrance-word="${esc(s.entrance)}" data-floor-word="${esc(s.floorShort)}"
         data-flat-word="${esc(s.flat)}" data-counted-word="${esc(s.counted)}">
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
      <div class="floor__scroll">
        <div class="floor__frame">
          <img class="floor__plan" alt="" data-tpl="${esc(s.planAlt)}" width="885" height="561" decoding="async">
          <svg class="floor__flats" viewBox="0 0 885 561" preserveAspectRatio="none" aria-hidden="true"></svg>
        </div>
      </div>
      <figcaption class="floor__cap" data-floor-cap>${esc(s.pickFlat)}</figcaption>
    </figure>

    <aside class="floor__card" data-floor-card hidden aria-live="polite">
      <p class="eyebrow">${esc(s.flat)} <b data-flat-num></b></p>
      <p class="floor__where"><span data-flat-where></span></p>
      <p class="floor__note">${esc(s.note)}</p>
      <a class="pill" href="tel:${site.phone.tel}" data-track="phone_click">${esc(s.ask)}</a>
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
      </div>

      <!-- Вид с высоты — тот же квартал, только с натуры. Кликабельные корпуса
           оставлены на чертеже: на перспективном снимке ряды застройки
           перекрывают друг друга, и границы блоков пришлось бы угадывать. -->
      <img class="gp__aerial" src="/assets/img/hero-aerial-1920.webp"
           alt="${esc(g.aerialAlt)}" width="1920" height="1080" loading="lazy" decoding="async" hidden>

      <p class="gp__swipe" aria-hidden="true">${esc(g.swipe)}</p>
    </figure>

    <aside class="gp__card" data-genplan-card aria-live="polite">
      <p class="eyebrow">${esc(g.blockWord)}</p>
      <p class="gp__type"><span>${esc(g.typeWord)}</span> <b data-gp-type>${esc(first.type)}</b></p>
      <p class="gp__floors"><b data-gp-floors>${first.floors}</b> <span>${esc(g.floorsWord)}</span></p>
      <p class="gp__scheme"><span data-gp-scheme>${esc(first.scheme)}</span> — ${esc(g.schemeWord)}</p>
      <p class="gp__note">${esc(g.note)}</p>
      <a class="pill" href="${p}/apartments/">${esc(g.toPlans)}</a>
    </aside>
  </div>

  <div class="page__inner">
    <h2 class="page__h2">${esc(g.legendTitle)}</h2>
    <ul class="figures">
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
  const a = t.apartments;
  const p = t.plans;

  const cards = p.items.map((x) => planCard(t, x)).join('\n');

  page.body = `<section class="page">
  <div class="page__inner">
    ${breadcrumbs(t, [[page.path, t.nav.apartments]])}
    <h1 class="display" data-lines>${esc(a.h1)}</h1>
    <p class="page__lead">${esc(a.lead)}</p>
    <p class="page__price">${esc(a.priceLine)}<span>${esc(t.ui.priceNote)}</span></p>
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
  <div class="gallery__grid">
${shotGrid(j.archGallery, '(min-width:900px) 58vw, 100vw')}
  </div>
  <div class="page__inner">
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

<!-- ══════════════ БЛАГОУСТРОЙСТВО ══════════════ -->
<section class="page" id="landscape">
  <div class="page__inner">
    <h2 class="page__h2"><i class="num">${j.yardNum}</i>${esc(j.yardTitle)}</h2>
    <p class="page__text">${esc(j.yardText)}</p>
    <p class="page__text">${esc(j.yardText2)}</p>
    ${marks(j.yardList)}
  </div>
  <div class="gallery__grid">
${shotGrid(j.yardGallery, '(min-width:900px) 58vw, 100vw')}
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

module.exports = { shell, home, project, apartments, genplan, select, location, contacts, notFound, swap, url, esc };
