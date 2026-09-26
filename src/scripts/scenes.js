/* ==========================================================================
   PARI Residence — сцены главной по раскладке era-residence.com.
   Motion (MIT) для скролла и анимаций; значения — из разбора ERA:
   short .4 / medium .8 / long 1.2 с, stagger символов .05, ease-out (0.25,1,0.5,1),
   in-out (0.76,0,0.24,1); горизонтальная глава и тяжёлый параллакс — только ≥992.
   Граница 992 px проверяется в каждом кадре (desktop()): поворот планшета без
   перезагрузки переключает сцены между раскладками.
   ========================================================================== */
import { revealTitle } from './reveal.js';
import { onFrame, onLayout, progress, wake, desktop, docRect, viewRect, layoutVersion } from './ticker.js';
import { initTabs } from './tabs.js';
import './blossom.js';
import './clouds.js';

const root = document.documentElement;
const MOTION = root.classList.contains('has-motion');
const FINE = matchMedia('(pointer: fine)').matches && matchMedia('(hover: hover)').matches;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- мягкое догоняние (аналог scrub у ScrollTrigger: .5 с — параллакс, .25 с — лента) ----------
   Скролл задаёт цель, кадр подтягивается к ней экспоненциально каждый кадр; пока не догнал — просит кадры. */
const smoothers = new Set();
function smooth(apply, lag) {
  const s = { t: null, c: null, apply, lag };
  smoothers.add(s);
  const set = (v) => { if (v !== s.t) wake(); s.t = v; if (s.c === null) { s.c = v; apply(v); } };
  set.jump = (v) => { s.t = s.c = v; apply(v); };                   /* без догоняния: смена раскладки, первый кадр */
  set.redraw = () => { if (s.c !== null) apply(s.c); };             /* то же значение заново: размеры изменились */
  return set;
}
onFrame('write', (now, dt) => {
  let moving = false;
  smoothers.forEach((s) => {
    if (s.t === null || Math.abs(s.t - s.c) < 1e-4) return;
    s.c += (s.t - s.c) * (1 - Math.exp(-dt * (3 / s.lag)));
    if (Math.abs(s.t - s.c) < 1e-4) s.c = s.t;
    s.apply(s.c);
    moving = true;
  });
  if (moving) wake();
});

/* ---------- слайдеры (ERA initSlider: кадр из маски-полигона, scale 1.5→1, xPercent 25→0) ---------- */
$$('[data-slider]').forEach((box) => {
  const imgs = $$('[data-slide-img]', box);
  const titles = $$('[data-slide-title]', box);
  const texts = $$('[data-slide-text]', box);
  const index = $('[data-slide-index]', box);
  const fill = $('[data-slide-fill]', box);
  const n = Math.max(imgs.length, titles.length, texts.length);
  if (n < 2) return;
  const auto = MOTION ? parseInt(box.dataset.autoplay || '0', 10) : 0;
  let cur = 0;
  /* следующий слайд грузим заранее: иначе ленивая картинка под маской появляется с пустой полосой */
  const warm = (i) => { const im = imgs[(i + n) % n]?.querySelector('img'); if (im && im.loading === 'lazy') im.loading = 'eager'; };
  /* автолистание (data-autoplay = мс): линия пагинации растёт, пока идёт отсчёт до следующего кадра.
     Рост линии — анимация transform средствами браузера (WAAPI): ни одного кадра скрипта.
     Пауза при наведении на фото или стрелки и при фокусе, вне экрана и в скрытой вкладке;
     ручное переключение начинает отсчёт заново. При «меньше движения» — выключено. */
  let run = null, visible = false, over = 0, focused = false;
  const shouldRun = () => visible && !over && !focused && !document.hidden;
  const sync = () => { if (run) { if (shouldRun()) run.play(); else run.pause(); } };
  const restart = () => {
    if (!auto || !fill) return;
    if (run) run.cancel();
    run = fill.animate([{ transform: `scaleX(${cur / n})` }, { transform: `scaleX(${(cur + 1) / n})` }], { duration: auto, easing: 'linear', fill: 'forwards' });
    run.onfinish = () => set(cur + 1, true);
    sync();
  };
  function set(i, fromAuto) {
    cur = (i + n) % n;
    [imgs, titles, texts].forEach((list) => list.forEach((el, k) => {
      el.classList.toggle('is-active', k === cur);
      if (el.hasAttribute('data-slide-title')) el.setAttribute('aria-hidden', k === cur ? 'false' : 'true');
    }));
    if (index) index.textContent = String(cur + 1);
    if (fill && !auto) fill.style.transform = `scaleX(${(cur + 1) / n})`;
    if (titles[cur]) revealTitle(titles[cur]);
    warm(cur + 1);
    /* «Посмотреть планировку» в типологиях ведёт в каталог с фильтром по комнатам текущего слайда */
    const tl = $('[data-types-link]', box);
    if (tl) tl.href = tl.dataset.typesBase + '?type=' + (cur + 1);
    if (auto) restart();
    else if (!fromAuto && fill) fill.style.transform = `scaleX(${(cur + 1) / n})`;
  }
  new IntersectionObserver(([e], io) => { if (e.isIntersecting) { warm(cur + 1); io.disconnect(); } }, { rootMargin: '100% 0px' }).observe(box);
  /* свайп по фото: влево — следующий, вправо — предыдущий (вертикальная прокрутка страницы не мешает) */
  const zone = imgs[0]?.parentElement;
  if (zone) {
    zone.style.touchAction = 'pan-y';
    let sx = null, sy = 0;
    zone.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') { sx = e.clientX; sy = e.clientY; } });
    zone.addEventListener('pointerup', (e) => {
      if (sx === null) return;
      const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) set(cur + (dx < 0 ? 1 : -1));
    });
    zone.addEventListener('pointercancel', () => { sx = null; });
  }
  $('[data-slide-prev]', box)?.addEventListener('click', () => set(cur - 1));
  $('[data-slide-next]', box)?.addEventListener('click', () => set(cur + 1));
  if (fill) fill.style.transform = `scaleX(${1 / n})`;         /* линия — transform, а не width: без пересчёта раскладки */
  if (auto && fill) {
    fill.style.transition = 'none';
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, { threshold: .3 }).observe(box);
    /* пауза — только когда курсор на фото или на стрелках: сцена во весь экран,
       и пауза по всей секции означала бы, что на компьютере слайды почти не листаются */
    [zone, $('.pag', box)].filter(Boolean).forEach((z) => {
      z.addEventListener('mouseenter', () => { over++; sync(); });
      z.addEventListener('mouseleave', () => { over = Math.max(0, over - 1); sync(); });
    });
    box.addEventListener('focusin', () => { focused = true; sync(); });
    box.addEventListener('focusout', (e) => { if (!box.contains(e.relatedTarget)) { focused = false; sync(); } });
    document.addEventListener('visibilitychange', sync);
    restart();
  }
});

/* ---------- вкладки удобств (ERA initTabs) ---------- */
$$('[data-tabs]').forEach((box) => {
  const tabs = $$('[data-tab]', box);
  const imgs = $$('[data-tab-img]', box);
  const texts = $$('[data-tab-text]', box);
  const select = initTabs(tabs, texts, (i) => {
    tabs.forEach((t, k) => t.classList.toggle('is-active', k === i));
    imgs.forEach((t, k) => t.classList.toggle('is-active', k === i));
    texts.forEach((t, k) => t.classList.toggle('is-active', k === i));
  }, { orientation: 'vertical' });
  if (FINE) tabs.forEach((t, i) => t.addEventListener('mouseenter', () => select(i, false)));
});

/* ---------- горизонтальная глава о месте (ERA horScroll) ----------
   Ширина ленты и положение секции меряются при смене раскладки, в кадре — только scrollY. */
$$('[data-hscroll]').forEach((sec) => {
  const track = $('[data-hscroll-track]', sec);
  const path = $('[data-path]', sec);
  if (!track) return;
  const START = .18;
  let dist = 0, distV = -1, draw = '', on = null;
  const set = smooth((t) => {
    if (!on) return;
    track.style.transform = `translate3d(${(-dist * t).toFixed(1)}px,0,0)`;
    const d = `${((1 - clamp01((t - .78) / .2)) * 100).toFixed(1)}%`;
    if (path && d !== draw) path.style.setProperty('--draw', draw = d);
  }, MOTION ? .25 : .001);
  onFrame('read', () => {
    const d = desktop();
    const turned = d !== on;
    if (turned) {
      on = d;
      if (!d) { track.style.transform = ''; if (path) path.style.setProperty('--draw', draw = '0%'); return; }
    }
    if (!on) return;
    const r = docRect(sec);
    const remeasure = distV !== r.v;
    if (remeasure) { distV = r.v; dist = Math.max(0, track.scrollWidth - window.innerWidth); }   /* ширину ленты — только при смене раскладки */
    const t = clamp01((progress(viewRect(sec), 'pin') - START) / (1 - START));
    if (turned) set.jump(t);
    else { if (remeasure) set.redraw(); set(t); }
  });
});

/* ---------- генплан: облака расходятся на скролле, кадр перетаскивается ---------- */
$$('[data-masterplan]').forEach((sec) => {
  const drag = $('[data-drag]', sec);
  const cursor = $('[data-drag-cursor]', sec);
  /* облака — scripts/clouds.js (видео + WebGL) */
  if (!drag) return;
  let x = 0, y = 0, sx = 0, sy = 0, px = 0, py = 0, down = false;
  const bounds = () => {
    const r = sec.getBoundingClientRect();
    return {
      minX: r.width - drag.offsetWidth - drag.offsetLeft, maxX: -drag.offsetLeft,
      minY: r.height - drag.offsetHeight - drag.offsetTop, maxY: -drag.offsetTop,
    };
  };
  let touch = false;
  sec.addEventListener('pointerdown', (e) => {
    touch = e.pointerType === 'touch';
    down = true; sx = e.clientX; sy = e.clientY; px = x; py = y;
    sec.classList.add('is-dragging');
    sec.setPointerCapture(e.pointerId);
  });
  sec.addEventListener('pointermove', (e) => {
    if (cursor && !touch) { const r = sec.getBoundingClientRect(); cursor.style.left = `${e.clientX - r.left}px`; cursor.style.top = `${e.clientY - r.top}px`; }
    if (!down) return;
    const b = bounds();
    x = Math.min(b.maxX, Math.max(b.minX, px + (e.clientX - sx)));
    if (!touch) y = Math.min(b.maxY, Math.max(b.minY, py + (e.clientY - sy)));
    drag.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  });
  const up = () => { down = false; sec.classList.remove('is-dragging'); };
  sec.addEventListener('pointerup', up);
  sec.addEventListener('pointercancel', up);
  /* смена раскладки: кадр возвращается в исходное положение, границы у него другие */
  onLayout(() => { x = y = 0; drag.style.transform = ''; });
});

/* ---------- «Архитектура»: кадр раскрывается из колонки на весь экран ---------- */
$$('[data-archi]').forEach((sec) => {
  const frame = $('[data-archi-frame]', sec);
  const word = $('[data-archi-word]', sec);
  const text = $('[data-archi-text]', sec);
  if (!frame) return;
  const img = $('[data-archi-img]', frame);
  /* Кадр всегда во всю ширину, «узкая колонка» — это scaleX кадра, а картинка внутри
     получает обратный масштаб по X и общий масштаб k: на экране то же, что раньше давала
     анимация width (cover-кадр шириной 75→100vw), но без раскладки и перерисовки на каждом кадре. */
  const IW = +(img?.getAttribute('width') || 1920), IH = +(img?.getAttribute('height') || 1080);
  const cover = (w, h) => Math.max(w / IW, h / IH);
  let W = 0, H = 0, box = '', mode = null, geoV = -1;
  /* картинка — в полный cover-размер кадра шириной 100vw (не обрезается своей рамкой),
     со сдвигом как у object-position 50% 30%; масштаб — вокруг той же точки 50% 30% */
  const fit = () => {
    const c = cover(W, H), bw = c * IW, bh = c * IH;
    const key = `${bw.toFixed(1)}x${bh.toFixed(1)}`;
    if (key === box) return;
    box = key;
    Object.assign(img.style, { width: `${bw.toFixed(1)}px`, height: `${bh.toFixed(1)}px`, left: `${((W - bw) / 2).toFixed(1)}px`, top: `${(.3 * (H - bh)).toFixed(1)}px` });
  };
  const open = (s) => {
    frame.style.transform = `translateX(-50%) scaleX(${s.toFixed(4)})`;
    if (img) {
      fit();
      const k = cover(s * W, H) / cover(W, H);
      img.style.transform = `scale(${(k / s).toFixed(4)}, ${k.toFixed(4)})`;
    }
  };
  const draw = (p) => {
    open(.75 + .25 * easeOut(clamp01((p - .08) / .5)));
    frame.style.setProperty('--grad', clamp01((p - .45) / .3).toFixed(3));
    if (word) {
      const w = clamp01((p - .25) / .35);
      word.style.transform = `translate3d(0, ${(-w * 30).toFixed(1)}vh, 0)`;
      word.style.opacity = String(1 - w);
    }
    if (text) text.style.setProperty('--txt', clamp01((p - .62) / .25).toFixed(3));
  };
  const set = smooth((p) => { if (mode === 'scroll') draw(p); }, .35);
  /* раскладки: телефон — кадр в потоке, всё видно (стили из CSS); ПК без движения — кадр открыт; ПК — сцена на скролле */
  const reset = () => {
    box = '';
    frame.style.transform = ''; frame.style.removeProperty('--grad');
    if (img) img.removeAttribute('style');
    if (word) { word.style.transform = ''; word.style.opacity = ''; }
    if (text) text.style.removeProperty('--txt');
  };
  onFrame('read', () => {
    const want = !desktop() ? 'mobile' : MOTION ? 'scroll' : 'static';
    const r = docRect(sec);
    if (want === mode && r.v === geoV) { if (mode === 'scroll') set(progress(viewRect(sec), 'pin')); return; }
    const turned = want !== mode;
    mode = want; geoV = r.v;
    W = window.innerWidth; H = frame.offsetHeight || window.innerHeight; box = '';
    if (turned) reset();
    if (mode === 'mobile') { if (text) text.style.setProperty('--txt', '1'); return; }
    if (mode === 'static') { open(1); frame.style.setProperty('--grad', '1'); if (text) text.style.setProperty('--txt', '1'); return; }
    if (turned) set.jump(progress(viewRect(sec), 'pin'));
    else { set.redraw(); set(progress(viewRect(sec), 'pin')); }
  });
});

/* ---------- параллакс кадров (ERA initAllParallax; на телефоне выключен) ---------- */
if (MOTION) {
  $$('[data-parallax]').forEach((el) => {
    const amt = parseFloat(el.dataset.parallax) || 10;
    const box = el.parentElement;
    let on = null;
    const set = smooth((p) => { if (on) el.style.transform = `translate3d(0, ${((p * 2 - 1) * amt).toFixed(2)}%, 0)`; }, .5);
    onFrame('read', () => {
      const d = desktop();
      if (d !== on) { on = d; if (!d) el.style.transform = ''; else set.jump(progress(viewRect(box), 'pass')); }
      if (!on) return;
      const r = viewRect(box);
      if (r.bottom < -window.innerHeight || r.top > 2 * window.innerHeight) return;   /* далеко от экрана — не трогаем */
      set(progress(r, 'pass'));
    });
  });
}

/* ---------- индикатор прокрутки слева (ERA initScrollBar) ---------- */
{
  const bar = $('[data-scrollbar]');
  if (bar) {
    const fill = $('[data-scrollbar-fill]', bar);
    const num = $('[data-scrollbar-num]', bar);
    let p = 0, h = 0, shown = -1, txt = '', max = 0, v = -1;
    onFrame('read', () => {
      if (layoutVersion() !== v) { v = layoutVersion(); max = document.documentElement.scrollHeight - window.innerHeight; h = bar.offsetHeight; }   /* высота документа — при смене раскладки, не в каждом кадре */
      p = max > 0 ? clamp01(window.scrollY / max) : 0;
    });
    onFrame('write', () => {
      const val = Math.round(p * 2000);                            /* пишем, только когда сдвиг заметен */
      if (val === shown) return;
      shown = val;
      fill.style.transform = `scaleY(${p.toFixed(4)})`;
      num.style.transform = `translate3d(0, ${(p * h).toFixed(1)}px, 0) translateY(-50%)`;
      const t = String(Math.round(p * 100)).padStart(2, '0');
      if (t !== txt) num.textContent = txt = t;
    });
  }
}

/* ---------- цвет шапки по сцене под ней (ERA theme_on-color / theme_on-brand) ---------- */
/* В фазе чтения смотрим, какая сцена с data-ui под шапкой: побеждает последняя по порядку
   (она рисуется поверх, вложенная — важнее родителя); первый экран — всегда тёмная шапка.
   Положение сцен — из кеша (секции неподвижны относительно документа), в кадре только scrollY. */
/* На телефоне кадры-фото внутри светлых сцен помечены data-ui-m="dark": шапка над ними белая. */
{
  const mob = matchMedia('(max-width: 991px)');
  const scenes = $$('[data-ui], [data-ui-m], [data-hero]');
  const Y = 70;
  let light = null, away = false, lastY = window.scrollY;
  onFrame('read', () => {
    let hit = null, ui = 'dark';
    const y = window.scrollY + Y;
    for (const el of scenes) {
      const v = (mob.matches && el.dataset.uiM) || el.dataset.ui;
      if (!v && !el.hasAttribute('data-hero')) continue;             /* только data-ui-m, а мы на ПК */
      const r = docRect(el);
      if (r.top <= y && r.bottom > y && r.height > 0) { hit = el; ui = v; }   /* позже = поверх / вложенный */
    }
    const on = !!hit && !hit.hasAttribute('data-hero') && ui === 'light';
    if (on !== light) root.classList.toggle('is-light-ui', light = on);
    /* телефон: шапка прячется при прокрутке вниз, возвращается при прокрутке вверх и у самого верха */
    if (mob.matches) {
      const sy = window.scrollY, d = sy - lastY;
      if (Math.abs(d) > 6) {
        const want = d > 0 && sy > window.innerHeight * .6 && !root.classList.contains('is-menu-open');
        if (want !== away) root.classList.toggle('is-header-away', away = want);
        lastY = sy;
      }
    } else if (away) root.classList.toggle('is-header-away', away = false);
  });
  /* шапка получила фокус с клавиатуры — возвращаем её на экран */
  $$('[data-header-logo], [data-header-nav]').forEach((el) => el.addEventListener('focusin', () => { if (away) root.classList.toggle('is-header-away', away = false); }));
}

/* ---------- фон подвала грузится, только когда подвал в двух экранах от видимой части ---------- */
$$('footer.footer').forEach((f) => {
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { f.classList.add('is-near'); io.disconnect(); } }, { rootMargin: '200% 0px' });
  io.observe(f);
});

/* ---------- контекст заявки: откуда пришёл человек и что смотрел ----------
   Метки utm_*, первая страница визита и переход с — запоминаются на время сессии
   при первом заходе; квартира — с страницы планировки (подъезд, этаж, номер, тип). */
{
  try {
    if (!sessionStorage.getItem('pari-visit')) {
      const q = new URLSearchParams(location.search);
      const v = { landing_page: location.pathname + location.search, referrer: document.referrer.slice(0, 200) };
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((k) => { if (q.get(k)) v[k] = q.get(k); });
      sessionStorage.setItem('pari-visit', JSON.stringify(v));
    }
  } catch (e) { /* приватный режим — без меток */ }
}
/* цели Метрики и GA — те же имена, что на прежнем сайте: отчёты и конверсии не ломаются */
function track(event, params = {}) {
  const data = { page: location.pathname, ...params };
  try {
    (window.dataLayer = window.dataLayer || []).push({ event, ...data });
    const id = window.PARI_ANALYTICS && window.PARI_ANALYTICS.metrika;
    if (id && typeof window.ym === 'function') window.ym(id, 'reachGoal', event, data);
    if (typeof window.gtag === 'function') window.gtag('event', event, data);
  } catch (e) { /* счётчик заблокирован — заявка работает и без него */ }
}
window.pariTrack = track;

function leadContext() {
  let visit = {};
  try { visit = JSON.parse(sessionStorage.getItem('pari-visit') || '{}'); } catch (e) { /* нет хранилища */ }
  const flatInfo = document.querySelector('[data-flat]');
  const ctx = {
    ...visit,
    page: location.pathname + location.search,
    language: document.documentElement.lang,
    device: matchMedia('(max-width: 991px)').matches ? 'mobile' : 'desktop',
    site: 'pari-residence.uz',
  };
  if (flatInfo) {
    /* значения — из data-атрибутов (их пишет scripts/flat.js при выборе квартиры), а не из текста
       на странице: заголовки режутся на буквы и несут скрытую копию для экранных дикторов */
    const { leadType: type, leadArea: area, leadNo: no, leadFloor: fl, leadEnt: ent } = flatInfo.dataset;
    if (type && no) ctx.flat = `${type}, ${area} — подъезд ${ent}, этаж ${fl}, ${no}`;
  }
  const t = new URLSearchParams(location.search).get('type');
  if (t) ctx.rooms = t === 's' ? 'студия' : t + '-комн.';
  return ctx;
}

/* прокрутка страницы на время окна и меню: Lenis стоит, нативная прокрутка закрыта в CSS */
const lockScroll = (on) => { const l = window.__lenis; if (l) { if (on) l.stop(); else l.start(); } };

/* ---------- меню телефона ----------
   Открыто — страница под ним недоступна (inert): Tab ходит только по меню и шапке;
   Escape закрывает и возвращает фокус на кнопку «Меню». */
const menuBtn = $('[data-menu-btn]');
const menuNav = $('[data-mnav]');
const behind = () => $$('main, [data-scrollbar], [data-crumbs], .skip-link');
let toggleMenu = () => {};
if (menuBtn && menuNav) {
  const labels = $$('[data-menu-label]', menuBtn);
  const openLabel = menuBtn.getAttribute('aria-label');
  let tHide = 0;
  toggleMenu = (on, { focusBtn = false } = {}) => {
    if (on === root.classList.contains('is-menu-open')) return;
    menuBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', on ? menuBtn.dataset.labelClose : openLabel);
    labels.forEach((l) => { l.textContent = on ? menuBtn.dataset.labelClose : menuBtn.dataset.labelOpen; });
    root.classList.toggle('is-menu-open', on);
    behind().forEach((el) => { el.inert = on; });
    lockScroll(on);
    clearTimeout(tHide);
    if (on) { menuNav.hidden = false; requestAnimationFrame(() => menuNav.classList.add('is-open')); }
    else { menuNav.classList.remove('is-open'); tHide = setTimeout(() => { if (!menuNav.classList.contains('is-open')) menuNav.hidden = true; }, 400); }
    if (focusBtn) menuBtn.focus();
  };
  menuBtn.addEventListener('click', () => toggleMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  menuNav.addEventListener('click', (e) => { if (e.target.closest('a, button')) toggleMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && root.classList.contains('is-menu-open')) toggleMenu(false, { focusBtn: true }); });
  matchMedia('(min-width: 992px)').addEventListener('change', (e) => { if (e.matches) toggleMenu(false); });
}

/* ---------- окно «Записаться на встречу» (ERA initModalCta) ---------- */
{
  const dlg = $('[data-dialog]');
  if (dlg) {
    const form = $('[data-lead-form]', dlg);
    const status = $('[data-status]', form);
    const submit = $('[data-submit]', form);
    let opener = null, sending = false, tClose = 0;
    const open = (from) => {
      clearTimeout(tClose);
      if (dlg.open) return;
      /* открыли из меню телефона: кнопка в меню спрячется, фокус потом вернётся на «Меню» */
      opener = from && from.closest('[data-mnav]') ? menuBtn : from;
      if (!sending) status.textContent = '';                       /* старое «Спасибо» или ошибка — от прошлого раза */
      dlg.showModal();
      lockScroll(true);
      track('lead_form_open');
      requestAnimationFrame(() => dlg.classList.add('is-open'));
      $('#lead-name', dlg)?.focus();
    };
    const close = () => {
      dlg.classList.remove('is-open');
      clearTimeout(tClose);
      tClose = setTimeout(() => {
        if (dlg.open) dlg.close();
        lockScroll(root.classList.contains('is-menu-open'));
        if (opener && opener.isConnected) opener.focus({ preventScroll: true });
      }, 400);
    };
    document.addEventListener('click', (e) => {
      const t = e.target.closest('[data-open-dialog]');
      if (t) { e.preventDefault(); open(t); }
    });
    $('[data-close-dialog]', dlg)?.addEventListener('click', close);
    dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });

    /* ошибки полей: текст под полем связан с ним (aria-describedby), поле помечено aria-invalid */
    const fieldOf = (input) => input.closest('.mdlg_field, .mdlg_consent');
    const setError = (input, bad) => {
      const box = fieldOf(input);
      const err = box.querySelector('.mdlg_err');
      box.classList.toggle('is-error', bad);
      /* текст ошибки связан с полем только пока ошибка есть: скрытый текст иначе читался бы всегда */
      if (bad) { input.setAttribute('aria-invalid', 'true'); if (err) input.setAttribute('aria-describedby', err.id); }
      else { input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); }
    };
    /* телефон: +998 XX XXX XX XX по мере ввода; больше 12 цифр ввести нельзя.
       Без кода страны — до 9 цифр (XX XXX XX XX), код +998 сервер добавит сам. */
    const phoneEl = form.elements.phone;
    const fmtPhone = (raw) => {
      let d = raw.replace(/\D/g, '');
      const intl = d.startsWith('998') || raw.trim().startsWith('+');
      if (intl) {
        d = d.slice(0, 12);
        const rest = d.slice(3);
        const g = [rest.slice(0, 2), rest.slice(2, 5), rest.slice(5, 7), rest.slice(7, 9)].filter(Boolean).join(' ');
        return '+' + d.slice(0, Math.min(3, d.length)) + (rest ? ' ' + g : '');
      }
      d = d.slice(0, 9);
      return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ');
    };
    phoneEl.addEventListener('input', () => { phoneEl.value = fmtPhone(phoneEl.value); setError(phoneEl, false); });
    form.elements.name.addEventListener('input', () => setError(form.elements.name, false));
    form.elements.consent.addEventListener('change', () => setError(form.elements.consent, false));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (sending) return;
      const { name, phone, consent, company } = form.elements;
      const digits = phone.value.replace(/\D/g, '');
      const okName = name.value.trim().length >= 2;
      const okPhone = digits.length === 9 || (digits.length === 12 && digits.startsWith('998'));
      setError(name, !okName);
      setError(phone, !okPhone);
      setError(consent, !consent.checked);
      if (!okName || !okPhone || !consent.checked) {
        status.textContent = '';
        (!okName ? name : !okPhone ? phone : consent).focus();       /* фокус на первое поле с ошибкой: её текст прочтётся */
        track('lead_error', { reason: 'validation' });
        return;
      }
      if (company.value) return;                                   /* ловушка для ботов */
      sending = true;
      submit.disabled = true;
      form.setAttribute('aria-busy', 'true');
      status.textContent = status.dataset.sending;
      track('lead_form_submit');
      /* сервер не ответил за 15 с — не держим человека: сообщаем об ошибке, можно повторить или позвонить */
      const ctl = 'AbortController' in window ? new AbortController() : null;
      const tm = setTimeout(() => ctl && ctl.abort(), 15000);
      try {
        const res = await fetch('/api/lead/', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.value.trim(), phone: digits, company: company.value, ...leadContext() }),
          signal: ctl ? ctl.signal : undefined,
        });
        if (!res.ok) throw new Error(String(res.status));
        status.textContent = status.dataset.ok;                    /* успех — только по ответу сервера */
        track('lead_success');
        form.reset();
      } catch (err) {
        status.textContent = status.dataset.fail;
        track('lead_error', { reason: err && err.name === 'AbortError' ? 'timeout' : 'network' });
      } finally {
        clearTimeout(tm);
        sending = false;
        submit.disabled = false;
        form.removeAttribute('aria-busy');
      }
    });
  }
}

/* ---------- переключатель языка: та же страница с теми же фильтрами / квартирой ---------- */
$$('[data-lang-link]').forEach((a) => {
  a.addEventListener('click', () => {
    if (location.search) a.href = a.getAttribute('href').split('?')[0] + location.search;
  });
});
