/* ==========================================================================
   PARI Residence — появление элементов, перенос системы era-residence.com
   (их функции animateTextH / animateTextA / animateTextP / animateCtn /
   animateLine / animateSlide, параметры сняты из публичного скрипта ERA):
     h     заголовки по буквам: opacity 0→1, yPercent 50→0, rotateY 90→0,
           1.2 с, буквы через .05 с
     a     каллиграфия по буквам: opacity 0→1, rotateX 90→0, x 10rem→0,
           ось — низ буквы, буквы через .1 с
     p     абзацы построчно из-под маски: yPercent 110→0, строки через .1 с
     ctn   блоки: opacity 0→1, y 3.333rem→0 (на телефоне 11.54rem)
     line  линии: clip-path сверху вниз
     slide фото: клип-полигон «косой шторкой» + картинка scale 1.5→1, xPercent 25→0
   Запуск — когда верх элемента касается низа экрана, один раз; задержка .3 с
   плюс .1 с на каждый следующий элемент в группе [data-reveal-w].
   ========================================================================== */
import { animate, inView, cubicBezier } from 'motion';
import { onFrame } from './ticker.js';

const MOTION = document.documentElement.classList.contains('has-motion');
const DESKTOP = matchMedia('(min-width: 992px)').matches;
const DUR_L = 1.2, STEP = .1, DELAY = .3;
const OUT = [.25, 1, .5, 1];
const INOUT = [.75, 0, .25, 1];
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- разбиение текста ---------- */
function splitChars(el) {
  if (el._chars) return el._chars;
  el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
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
        walk(n);
      }
    });
  };
  walk(el);
  el._chars = $$('.split-char', el);
  return el._chars;
}

/* строки: слова в спанах → группировка по offsetTop → маска на каждую строку.
   После появления исходная разметка возвращается, чтобы текст переносился заново. */
function splitLines(el) {
  const html = el.innerHTML;
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map((w) => `<span class="split-word" style="display:inline-block">${w.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>`).join(' ');
  const spans = $$('.split-word', el);
  const rows = [];
  let top = null;
  spans.forEach((s) => {
    const t = s.offsetTop;
    if (top === null || Math.abs(t - top) > 2) { rows.push([]); top = t; }
    rows[rows.length - 1].push(s.textContent);
  });
  el.innerHTML = rows.map((r) => `<span class="split-line-mask" style="display:block;overflow:clip;padding-bottom:.08em;margin-bottom:-.08em"><span class="split-line" style="display:block">${r.join(' ').replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span></span>`).join('');
  return { lines: $$('.split-line', el), restore: () => { el.innerHTML = html; } };
}

/* ---------- буквы и строки: лёгкий твин в общем кадре ----------
   Раньше буквы анимировались через WAAPI с rotateY / rotateX и перспективой: на время
   появления каждая буква становилась отдельным 3D-слоем видеокарты, и при прокрутке
   через заголовки кадр проседал в 2–3 раза. Теперь поворот задан его плоской проекцией
   (rotateY θ на экране — это scaleX cos θ, rotateX θ — scaleY cos θ; искажение перспективы
   1000px на букве — доли процента), а значения пишутся в общей фазе записи
   (scripts/ticker.js): без слоёв, одна перерисовка текста за кадр. Тайминг прежний:
   1.2 с на букву, ease-out (0.25, 1, 0.5, 1), те же задержки. */
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
  return tw;
}
onFrame('write', (now) => {
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
});
/* по окончании снимаем инлайн-стили: буквы снова обычный текст */
const clear = (list) => list.forEach((c) => { c.style.transform = ''; c.style.opacity = ''; });

const run = {
  h(el, delay) {
    const chars = splitChars(el);
    if (el._tw) tweens.delete(el._tw);                             /* заголовок слайдера перезапущен */
    const tw = el._tw = tween(chars, delay, STEP * .5 * Math.min(1, 30 / chars.length), FX.h);
    tw.done.then(() => { if (el._tw === tw) clear(chars); });
    return tw.done;
  },
  a(el, delay) {
    const chars = splitChars(el);
    const tw = tween(chars, delay, STEP * .6, FX.a);
    tw.done.then(() => clear(chars));
    return tw.done;
  },
  p(el, delay) {
    const { lines, restore } = el._lines;
    const tw = tween(lines, delay, STEP, FX.p);
    tw.done.then(restore);
    return tw.done;
  },
  ctn(el, delay) {
    const y = DESKTOP ? '3.333rem' : '11.54rem';
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

const initial = {
  h(el) { splitChars(el).forEach((c) => FX.h(c, 0)); },
  a(el) { splitChars(el).forEach((c) => { c.style.transformOrigin = 'center bottom'; FX.a(c, 0); }); },
  p(el) { el._lines = splitLines(el); el._lines.lines.forEach((l) => { l.style.transform = 'translateY(110%)'; }); },
  ctn(el) {
    const t = getComputedStyle(el).transform;
    el._baseT = t && t !== 'none' ? t : '';
    el.style.opacity = '0'; el.style.transform = `${el._baseT} translateY(${DESKTOP ? '3.333rem' : '11.54rem'})`;
  },
  line(el) { el.style.clipPath = 'inset(0% 0% 100% 0%)'; },
  slide(el) { el.style.clipPath = 'polygon(100% 0%, 100% 0%, 101% 100%, 125% 100%)'; if (el.firstElementChild) el.firstElementChild.style.transform = 'scale(1.5) translateX(25%)'; },
  flower(el) { el.style.opacity = '0'; },
};

/* ---------- разметка сцен: какой элемент как появляется ---------- */
const SKIP = '[data-hero], [data-dialog], [data-no-reveal]';
const TEXT_SKIP = '.btn-circle, .pag, .nav-item, .pill, [data-tab], label, .split-char, .fsel, [role="listbox"], .mnav';
const RULES = [
  ['slide', '.reasons-card, .types_card, .concept-terrace, .concept-relief, .space_garden, .space_terrace, .space_slides'],
  ['line', '.reasons-line, .team_line'],
  ['flower', '[data-flower]'],
  ['ctn', '.btn-circle, .pill, .pag, .reasons-symbol, .concept-symbol, .footer_symbol, .reasons-arc, .concept-path_map'],
  ['h', '.h1, .h2, .h3, .h4, .h5, .h6'],
  ['a', '.a1, .a2'],
  ['p', '.p1, .l1'],
];

function tag() {
  const scopes = $$('main > section, main > footer').filter((s) => !s.matches(SKIP));
  const items = [];
  const seen = new Set();
  scopes.forEach((scope) => {
    RULES.forEach(([type, sel]) => {
      $$(sel, scope).forEach((el) => {
        if (seen.has(el) || el.closest(SKIP)) return;
        if ((type === 'h' || type === 'p' || type === 'a') && el.closest(TEXT_SKIP)) return;
        if (type === 'p' && [...el.children].some((c) => c.tagName !== 'BR')) return;   /* только простой текст */
        if (type === 'h' && el.closest('.a1, .a2')) return;
        if ([...seen].some((s) => s.contains(el) && (s.matches('.btn-circle, .pag, .pill, .concept-path_map')))) return;
        seen.add(el);
        items.push({ el, type });
      });
    });
  });
  return items;
}

/* заголовок слайдера при смене слайда — те же параметры, без задержки */
export function revealTitle(el) {
  if (!MOTION) return;
  initial.h(el);
  run.h(el, 0);
}

/* строки режутся по реальной ширине слов — ждём загрузки шрифтов, иначе переносы
   посчитаются по запасному шрифту и во время появления строки будут рваными */
const start = () => {
  const items = tag();
  const groups = new Map();
  items.forEach((it) => {
    initial[it.type](it.el);
    const key = it.el.closest('[data-reveal-w]') || it.el;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(it);
  });
  /* шаг задержки — только у видимых: тексты скрытых слайдов и вкладок появляются сразу и не
     отодвигают кнопку «Посмотреть планировку» на секунды */
  const HIDDEN = '[data-slide-text]:not(.is-active), [data-tab-text]:not(.is-active)';
  const play = (list) => {
    let k = 0;
    list.forEach((it) => {
      /* неактивные заголовки слайдера ждут своего слайда */
      if (it.el.hasAttribute('data-slide-title') && !it.el.classList.contains('is-active')) return;
      if (it.el.closest(HIDDEN)) { run[it.type](it.el, 0); return; }
      run[it.type](it.el, DELAY + k++ * STEP);
    });
  };
  /* В горизонтальной ленте элементы въезжают в кадр сдвигом ленты, а не прокруткой —
     как у ERA (containerAnimation, start "left bottom"), проверяем их положение каждый кадр
     и запускаем, когда левый край вошёл в экран справа. */
  const pending = [];
  groups.forEach((list, trigger) => {
    list.sort((x, y) => (x.el.compareDocumentPosition(y.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    if (DESKTOP && trigger.closest('[data-hscroll-track]')) { pending.push({ trigger, list }); return; }
    inView(trigger, () => play(list), { amount: 0 });
  });
  if (pending.length) {
    const off = onFrame('read', () => {                            /* замеры — в общей фазе чтения */
      for (let i = pending.length - 1; i >= 0; i--) {
        const r = pending[i].trigger.getBoundingClientRect();
        if (r.left < window.innerWidth && r.right > 0 && r.top < window.innerHeight && r.bottom > 0) {
          play(pending[i].list);
          pending.splice(i, 1);
        }
      }
      if (!pending.length) off();
    });
  }
};
/* ждём загрузочный экран (он дожидается шрифтов Google, подключённых без блокировки), затем fonts.ready */
if (MOTION) Promise.resolve(window.__pariLoader).then(() => (document.fonts && document.fonts.ready) || null).then(start);
