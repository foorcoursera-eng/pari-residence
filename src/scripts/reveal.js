/* ==========================================================================
   PARI Residence — появление элементов, перенос системы era-residence.com
   (их функции animateTextH / animateTextA / animateTextP / animateCtn /
   animateLine / animateSlide, параметры сняты из публичного скрипта ERA):
     h     заголовки по буквам: opacity 0→1, yPercent 50→0, rotateY 90→0,
           1.2 с, буквы через .05 с (у длинных заголовков шаг меньше: вся волна ≤ .6 с)
     a     каллиграфия по буквам: opacity 0→1, rotateX 90→0, x 10rem→0,
           ось — низ буквы, буквы через .1 с
     p     абзацы построчно из-под маски: yPercent 110→0, строки через .1 с
     ctn   блоки: opacity 0→1, y 3.333rem→0 (на телефоне 11.54rem)
     line  линии: clip-path сверху вниз
     slide фото: клип-полигон «косой шторкой» + картинка scale 1.5→1, xPercent 25→0
   Запуск — когда верх элемента касается низа экрана, один раз; задержка .3 с
   плюс .1 с на каждый следующий элемент в группе [data-reveal-w].

   Подготовка (разбивка на буквы и строки, исходные состояния) — не вся разом при
   старте, а по группам, когда группа подходит к экрану (IntersectionObserver с запасом
   в экран): нет длинной задачи в момент раскрытия загрузочного экрана, строки режутся
   по текущей ширине. Правило: то, что человек уже видит, не прячется. Если к моменту
   подготовки группа на экране, а загрузочный экран её не закрывает (переход внутри
   сессии, медленная сеть, прыжок по якорю), она остаётся как есть, без анимации.
   В горизонтальной ленте элементы въезжают в кадр сдвигом ленты: IntersectionObserver
   учитывает transform, поэтому отдельный покадровый замер ленты не нужен.
   Если скрипт не выполнился, ничего не спрятано: исходные состояния ставит только он.
   ========================================================================== */
import { animate, cubicBezier } from 'motion';
import { onFrame, wake, desktop } from './ticker.js';

const root = document.documentElement;
const MOTION = root.classList.contains('has-motion');
const DUR_L = 1.2, STEP = .1, DELAY = .3;
const WAVE = .6;                                                   /* вся волна букв заголовка не дольше, с */
const OUT = [.25, 1, .5, 1];
const INOUT = [.75, 0, .25, 1];
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* загрузочный экран ещё закрывает страницу — можно ставить исходные состояния невидимо */
const veiled = () => !!document.querySelector('[data-preloader]') && !root.classList.contains('is-revealed') && !root.classList.contains('pre-skip');
/* шрифты страницы: строки режутся по реальной ширине слов; дольше 3 с не ждём */
const fontsReady = () => {
  const f = document.fonts;
  if (!f || !f.load) return Promise.resolve();
  const sample = root.lang === 'ru' ? 'Aa Жж' : 'Aa';                /* наборы знаков по unicode-range: кириллица — отдельным файлом */
  const all = Promise.all([f.load('500 1em "Cormorant Garamond"', sample), f.load('400 1em Inter', sample), f.load('600 1em Inter', sample)]).then(() => f.ready);
  return Promise.race([all, new Promise((r) => setTimeout(r, 3000))]).catch(() => {});
};
const FONTS = fontsReady();

/* ---------- разбиение текста ----------
   Буквы — отдельные inline-block, слова не рвутся. Текст для экранных дикторов —
   скрытой копией (aria-label на обычном блоке читается не везде), буквы от них спрятаны. */
function splitChars(el) {
  if (el._chars) return el._chars;
  const sr = document.createElement('span');
  sr.className = 'visually-hidden';
  sr.textContent = el.textContent.replace(/\s+/g, ' ').trim();
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/([ \t\n\r]+)/).forEach((part) => {
          if (!part) return;
          if (/^[ \t\n\r]+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span');
          w.className = 'split-word';
          w.setAttribute('aria-hidden', 'true');
          w.style.cssText = 'display:inline-block;white-space:nowrap';
          [...part].forEach((ch) => {
            const c = document.createElement('span');
            c.className = 'split-char';
            c.textContent = ch;
            c.style.display = 'inline-block';
            w.appendChild(c);
          });
          frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR' && !n.classList.contains('a1') && !n.classList.contains('a2')) {
        if (n.matches('sup')) { n.setAttribute('aria-hidden', 'true'); return; }
        walk(n);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') {
        n.setAttribute('aria-hidden', 'true');                     /* каллиграфия внутри заголовка есть в скрытой копии */
      }
    });
  };
  walk(el);
  el.prepend(sr);
  el._chars = $$('.split-char', el);
  return el._chars;
}

/* строки: слова в спанах → группировка по offsetTop → маска на каждую строку.
   После появления исходная разметка возвращается, чтобы текст переносился заново.
   Три прохода на всю группу (запись — чтение — запись): одна раскладка вместо одной на абзац.
   Неразрывные пробелы (U+00A0) остаются внутри слова: строка режется там же, где в тексте. */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
function splitLinesBatch(els) {
  const jobs = els.map((el) => {
    const html = el.innerHTML;
    const words = el.textContent.trim().split(/[ \t\n\r]+/);
    el.innerHTML = words.map((w) => `<span class="split-word" style="display:inline-block">${esc(w)}</span>`).join(' ');
    return { el, html };
  });
  jobs.forEach((j) => {
    const rows = [];
    let top = null;
    $$('.split-word', j.el).forEach((s) => {
      const t = s.offsetTop;
      if (top === null || Math.abs(t - top) > 2) { rows.push([]); top = t; }
      rows[rows.length - 1].push(s.textContent);
    });
    j.rows = rows;
  });
  jobs.forEach((j) => {
    j.el.innerHTML = j.rows.map((r) => `<span class="split-line-mask" style="display:block;overflow:clip;padding-bottom:.08em;margin-bottom:-.08em"><span class="split-line" style="display:block">${esc(r.join(' '))}</span></span>`).join('');
    j.el._lines = { lines: $$('.split-line', j.el), restore: () => { j.el.innerHTML = j.html; j.el._lines = null; } };
  });
}

/* ---------- буквы и строки: лёгкий твин в общем кадре ----------
   Раньше буквы анимировались через WAAPI с rotateY / rotateX и перспективой: на время
   появления каждая буква становилась отдельным 3D-слоем видеокарты, и при прокрутке
   через заголовки кадр проседал в 2–3 раза. Теперь поворот задан его плоской проекцией
   (rotateY θ на экране — это scaleX cos θ, rotateX θ — scaleY cos θ; искажение перспективы
   1000px на букве — доли процента), а значения пишутся в общей фазе записи
   (scripts/ticker.js): без слоёв, одна перерисовка текста за кадр. Тайминг прежний:
   1.2 с на букву, ease-out (0.25, 1, 0.5, 1). */
const ease = cubicBezier(...OUT);
const Q = Math.PI / 2;
const FX = {
  h(c, e) { c.style.opacity = e.toFixed(3); c.style.transform = `translateY(${(50 * (1 - e)).toFixed(2)}%) scaleX(${Math.cos(Q * (1 - e)).toFixed(4)})`; },
  a(c, e) { c.style.opacity = e.toFixed(3); c.style.transform = `translateX(${(10 * (1 - e)).toFixed(3)}rem) scaleY(${Math.cos(Q * (1 - e)).toFixed(4)})`; },
  p(l, e) { l.style.transform = `translateY(${(110 * (1 - e)).toFixed(2)}%)`; },
};
const tweens = new Set();
function tween(els, delay, step, apply) {
  const tw = { els, apply, t0: performance.now() + delay * 1000, step: step * 1000, k: els.map(() => -1) };
  tw.done = new Promise((res) => { tw.res = res; });
  tweens.add(tw);
  wake();
  return tw;
}
onFrame('write', (now) => {
  if (!tweens.size) return;
  tweens.forEach((tw) => {
    let left = 0;
    tw.els.forEach((el, i) => {
      const k = Math.min(1, Math.max(0, (now - tw.t0 - i * tw.step) / (DUR_L * 1000)));
      if (k < 1) left++;
      if (k === tw.k[i]) return;                                   /* ждёт своей задержки или уже на месте */
      tw.k[i] = k;
      tw.apply(el, ease(k));
    });
    if (!left) { tweens.delete(tw); tw.res(); }
  });
  if (tweens.size) wake();                                         /* пока буквы идут — следующий кадр нужен */
});
/* по окончании снимаем инлайн-стили: буквы снова обычный текст */
const clear = (list) => list.forEach((c) => { c.style.transform = ''; c.style.opacity = ''; });
const charStep = (n, step) => Math.min(step, WAVE / Math.max(1, n));

const run = {
  h(el, delay) {
    const chars = splitChars(el);
    if (el._tw) tweens.delete(el._tw);                             /* заголовок слайдера перезапущен */
    const tw = el._tw = tween(chars, delay, charStep(chars.length, STEP * .5), FX.h);
    tw.done.then(() => { if (el._tw === tw) clear(chars); });
    return tw.done;
  },
  a(el, delay) {
    const chars = splitChars(el);
    const tw = tween(chars, delay, charStep(chars.length, STEP * .6), FX.a);
    tw.done.then(() => clear(chars));
    return tw.done;
  },
  p(el, delay) {
    if (!el._lines) return Promise.resolve();
    const { lines, restore } = el._lines;
    const tw = tween(lines, delay, STEP, FX.p);
    tw.done.then(restore);
    return tw.done;
  },
  ctn(el, delay) {
    const y = el._y || '3.333rem';
    const b = el._baseT || '';                                     /* свой transform элемента (центровка −50 %) сохраняем */
    const a = animate(el, { opacity: [0, 1], transform: [`${b} translateY(${y})`, `${b} translateY(0rem)`] }, { duration: DUR_L, delay, ease: OUT });
    a.then(() => setTimeout(() => { el.style.transform = ''; el.style.opacity = ''; }));   /* после того как Motion допишет итог */
    return a;
  },
  line(el, delay) {
    const a = animate(el, { clipPath: ['inset(0% 0% 100% 0%)', 'inset(0% 0% 0% 0%)'] }, { duration: DUR_L, delay, ease: OUT });
    a.then(() => setTimeout(() => { el.style.clipPath = ''; }));
    return a;
  },
  slide(el, delay) {
    const inner = el.firstElementChild;
    animate(el, { clipPath: ['polygon(100% 0%, 100% 0%, 101% 100%, 125% 100%)', 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'] }, { duration: DUR_L, delay, ease: INOUT })
      .then(() => setTimeout(() => { el.style.clipPath = ''; }));
    if (inner) animate(inner, { transform: ['scale(1.5) translateX(25%)', 'scale(1) translateX(0%)'] }, { duration: DUR_L, delay, ease: INOUT })
      .then(() => setTimeout(() => { inner.style.transform = ''; }));
  },
  flower(el, delay) {
    const a = animate(el, { opacity: [0, 1] }, { duration: DUR_L * 1.4, delay, ease: OUT });
    a.then(() => setTimeout(() => { el.style.opacity = ''; }));
    return a;
  },
};

/* исходные состояния: сначала все чтения (свой transform блоков), потом все записи */
function prepare(items) {
  const p = items.filter((it) => it.type === 'p');
  if (p.length) splitLinesBatch(p.map((it) => it.el));
  const ctn = items.filter((it) => it.type === 'ctn');
  const y = desktop() ? '3.333rem' : '11.54rem';
  ctn.forEach((it) => { const t = getComputedStyle(it.el).transform; it.el._baseT = t && t !== 'none' ? t : ''; it.el._y = y; });
  items.forEach(({ el, type }) => {
    if (type === 'h') splitChars(el).forEach((c) => FX.h(c, 0));
    else if (type === 'a') splitChars(el).forEach((c) => { c.style.transformOrigin = 'center bottom'; FX.a(c, 0); });
    else if (type === 'p') { if (el._lines) el._lines.lines.forEach((l) => { l.style.transform = 'translateY(110%)'; }); }
    else if (type === 'ctn') { el.style.opacity = '0'; el.style.transform = `${el._baseT} translateY(${el._y})`; }
    else if (type === 'line') el.style.clipPath = 'inset(0% 0% 100% 0%)';
    else if (type === 'slide') { el.style.clipPath = 'polygon(100% 0%, 100% 0%, 101% 100%, 125% 100%)'; if (el.firstElementChild) el.firstElementChild.style.transform = 'scale(1.5) translateX(25%)'; }
    else if (type === 'flower') el.style.opacity = '0';
  });
}

/* ---------- разметка сцен: какой элемент как появляется ---------- */
const SKIP = '[data-hero], [data-dialog], [data-no-reveal]';
const TEXT_SKIP = '.btn-circle, .pag, .nav-item, .pill, [data-tab], label, .split-char, .fsel, [role="listbox"], .mnav, .acard, .abenefit';
const RULES = [
  ['slide', '.reasons-card, .types_card, .concept-terrace, .concept-relief, .space_garden, .space_terrace, .space_slides'],
  ['line', '.reasons-line, .team_line'],
  ['flower', '[data-flower]'],
  ['ctn', '.btn-circle, .pill, .pag, .reasons-symbol, .concept-symbol, .footer_symbol, .reasons-arc, .concept-path_map, .apt-sim .acard'],
  ['h', '.h1, .h2, .h3, .h4, .h5, .h6'],
  ['a', '.a1, .a2'],
  ['p', '.p1, .l1'],
];

function tag() {
  const scopes = $$('main > section, main > footer').filter((s) => !s.matches(SKIP));
  const items = [];
  const seen = new Set();
  const inside = [];
  scopes.forEach((scope) => {
    RULES.forEach(([type, sel]) => {
      $$(sel, scope).forEach((el) => {
        if (seen.has(el) || el.closest(SKIP)) return;
        if ((type === 'h' || type === 'p' || type === 'a') && el.closest(TEXT_SKIP)) return;
        if (type === 'p' && [...el.children].some((c) => c.tagName !== 'BR')) return;   /* только простой текст */
        if (type === 'h' && el.closest('.a1, .a2')) return;
        if (inside.some((s) => s.contains(el))) return;             /* внутри кнопки, пагинации, карты пути — они появляются целиком */
        seen.add(el);
        if (type === 'ctn' && el.matches('.btn-circle, .pag, .pill, .concept-path_map')) inside.push(el);
        items.push({ el, type });
      });
    });
  });
  return items;
}

/* заголовок слайдера при смене слайда — те же параметры, без задержки */
export function revealTitle(el) {
  if (!MOTION) return;
  splitChars(el).forEach((c) => FX.h(c, 0));
  run.h(el, 0);
}

/* ---------- группы: подготовка на подходе, запуск при входе в кадр ---------- */
const inView = (el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth; };
const HIDDEN = '[data-slide-text]:not(.is-active), [data-tab-text]:not(.is-active)';
const groups = [];

function playGroup(g) {
  if (g.state !== 'ready') return;
  g.state = 'played';
  /* первый экран под загрузочным экраном — ждём раскрытия, иначе анимация пройдёт за ним */
  Promise.resolve(window.__pariLoader).then(() => {
    let k = 0;
    const lag = window.__pariReveal && performance.now() - window.__pariReveal < 300 ? .25 : 0;
    g.items.forEach((it) => {
      /* неактивные заголовки слайдера ждут своего слайда */
      if (it.el.hasAttribute('data-slide-title') && !it.el.classList.contains('is-active')) return;
      /* тексты скрытых слайдов и вкладок появляются сразу и не отодвигают кнопки на секунды */
      if (it.el.closest(HIDDEN)) { run[it.type](it.el, 0); return; }
      run[it.type](it.el, lag + DELAY + k++ * STEP);
    });
  });
}

function prepGroup(g) {
  if (g.state !== 'idle') return;
  g.state = 'waiting';
  FONTS.then(() => {
    if (!veiled() && inView(g.trigger)) {                          /* уже на виду — не прячем */
      g.state = 'static';
      return;
    }
    prepare(g.items);
    g.state = 'ready';
    if (g.visible) playGroup(g);
  });
}

function start() {
  const map = new Map();
  tag().forEach((it) => {
    const key = it.el.closest('[data-reveal-w]') || it.el;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(it);
  });
  map.forEach((items, trigger) => {
    items.sort((x, y) => (x.el.compareDocumentPosition(y.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    groups.push({ trigger, items, state: 'idle', visible: false });
  });
  const byEl = new Map(groups.map((g) => [g.trigger, g]));
  /* подготовка — за экран до появления (снизу и справа — лента едет справа налево) */
  const prepIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    prepIO.unobserve(e.target);
    prepGroup(byEl.get(e.target));
  }), { rootMargin: '0px 100% 100% 0px' });
  /* запуск — когда верх (или левый край в ленте) касается края экрана */
  const playIO = new IntersectionObserver((es) => es.forEach((e) => {
    const g = byEl.get(e.target);
    g.visible = e.isIntersecting;
    if (!e.isIntersecting) return;
    if (g.state === 'idle') prepGroup(g);
    if (g.state === 'ready') { playIO.unobserve(e.target); playGroup(g); }
    else if (g.state === 'played' || g.state === 'static') playIO.unobserve(e.target);
  }), { threshold: 0 });
  groups.forEach((g) => { prepIO.observe(g.trigger); playIO.observe(g.trigger); });

  /* ширина изменилась до появления (поворот телефона, окно): строки подготовленных абзацев режутся заново */
  let w = window.innerWidth, tm = 0;
  window.addEventListener('resize', () => {
    clearTimeout(tm);
    tm = setTimeout(() => {
      if (window.innerWidth === w) return;
      w = window.innerWidth;
      groups.forEach((g) => {
        if (g.state !== 'ready') return;
        const p = g.items.filter((it) => it.type === 'p' && it.el._lines);
        if (!p.length) return;
        p.forEach((it) => it.el._lines.restore());
        splitLinesBatch(p.map((it) => it.el));
        p.forEach((it) => it.el._lines.lines.forEach((l) => { l.style.transform = 'translateY(110%)'; }));
      });
    }, 150);
  });
}

if (MOTION) start();
