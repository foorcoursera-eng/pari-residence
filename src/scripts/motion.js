/* ==========================================================================
   PARI Residence — движение. Стек по документу «Этап 1»: Lenis + Motion (MIT).
   Параметры сняты с референса era-residence.com:
   short .4 / medium .8 / long 1.2 с; stagger .1, символы заголовка .05;
   ease-out (0.25,1,0.5,1), in-out (0.76,0,0.24,1); Lenis duration 1.2,
   touchMultiplier 2; hero: контент уходит вверх, фон сдвигается на «хвост»
   картинки, затем масштаб до 2 в точку 50 % 75 %; рамка медальона вращается
   при прокрутке (30°/с + скорость) и в покое возвращается к знаку; магнит с упругим возвратом.
   ========================================================================== */
import { animate, stagger } from 'motion';
import Lenis from 'lenis';
import { onFrame, progress } from './ticker.js';

const root = document.documentElement;
const MOTION = root.classList.contains('has-motion');
const DESKTOP = matchMedia('(min-width: 992px)').matches;
const FINE = matchMedia('(pointer: fine)').matches && matchMedia('(hover: hover)').matches;

const DUR = { s: .4, m: .8, l: 1.2 };
const EASE_OUT = [.25, 1, .5, 1];
const EASE_IN_OUT = [.76, 0, .24, 1];
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/* ---------- Lenis ---------- */
let scrollVelocity = 0;
let scrollDir = 1; /* направление последней прокрутки: вниз = +1 (по часовой), вверх = −1 */
if (MOTION) {
  const lenis = new Lenis({ duration: 1.2, smoothWheel: true, wheelMultiplier: 2, touchMultiplier: 2 }); /* у ERA один щелчок колеса = 2× путь */
  lenis.on('scroll', (e) => {
    scrollVelocity = e.velocity;
    if (Math.abs(e.velocity) > .05) scrollDir = e.velocity > 0 ? 1 : -1;
  });
  onFrame('scroll', (t) => lenis.raf(t));                  /* общий кадр: сначала прокрутка, потом замеры и записи */
}

/* ---------- элементы ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const hero = $('[data-hero]');
const heroS = $('[data-hero-s]');
const heroW = $('[data-hero-w]');
const heroBg = $('[data-hero-bg]');
const heroImg = $('[data-hero-img]');
const scrollArea = $('[data-hero-scroll]');
const h1Wrap = $('[data-hero-h1]');
const h1Chars = $$('[data-hero-h1] .split-char');
const a2 = $('[data-hero-a2] .a2 span');
const lines = $$('[data-hero-line] .line');
const btnCircle = $('[data-btn-circle]');
const headerLogo = $('[data-header-logo]');
const headerNav = $('[data-header-nav]');
const ring = $('[data-logo-ring]');
const preloader = $('[data-preloader]');

/* ---------- исходные состояния интро (только при движении) ---------- */
if (MOTION && hero) {
  if (h1Wrap) h1Wrap.style.perspective = '1000px';
  h1Chars.forEach((c) => { c.style.opacity = '0'; c.style.transform = 'translateY(50%) rotateY(90deg)'; });
  if (a2) { a2.style.opacity = '0'; a2.style.transform = 'translateX(10rem) rotateX(90deg)'; }
  lines.forEach((l) => { l.style.transform = 'translateY(110%)'; });
  [btnCircle, headerLogo, headerNav].forEach((el) => { if (el) el.style.opacity = '0'; });
}

/* ---------- интро первого экрана (как animateTextH / animateTextA / animateTextP референса) ---------- */
let introDone = false;
function heroIntro() {
  if (introDone || !MOTION || !hero) return;
  introDone = true;
  /* после появления снимаем с букв transform и перспективу: иначе каждая буква остаётся
     отдельным 3D-слоем и браузер пересобирает сотни слоёв на каждом кадре прокрутки */
  animate(h1Chars, { opacity: [0, 1], transform: ['translateY(50%) rotateY(90deg)', 'translateY(0%) rotateY(0deg)'] },
    { duration: DUR.l, delay: stagger(.05, { startDelay: .3 }), ease: EASE_OUT })
    .then(() => setTimeout(() => { h1Chars.forEach((c) => { c.style.transform = ''; c.style.opacity = ''; }); if (h1Wrap) h1Wrap.style.perspective = ''; }));
  if (a2) animate(a2, { opacity: [0, 1], transform: ['translateX(10rem) rotateX(90deg)', 'translateX(0rem) rotateX(0deg)'] },
    { duration: DUR.l, delay: .7, ease: EASE_OUT }).then(() => setTimeout(() => { a2.style.transform = ''; a2.style.opacity = ''; }));
  if (lines.length) animate(lines, { transform: ['translateY(110%)', 'translateY(0%)'] },
    { duration: DUR.l, delay: stagger(.1, { startDelay: .9 }), ease: EASE_OUT }).then(() => setTimeout(() => lines.forEach((l) => { l.style.transform = ''; })));
  [headerLogo, headerNav, btnCircle].forEach((el, i) => {
    if (el) animate(el, { opacity: [0, 1] }, { duration: DUR.m, delay: 1 + i * .1, ease: EASE_OUT });
  });
}

/* ---------- прелоадер → окно-рамка → интро ---------- */
function runPreloader() {
  if (!preloader) { heroIntro(); return; }
  /* прогресс считает встроенный скрипт загрузочного экрана (components/Preloader.astro):
     разметка, шрифты, фото первого экрана; здесь — только раскрытие, когда всё готово */
  const ready = window.__pariLoader || Promise.resolve();
  let seen = false;
  try { seen = sessionStorage.getItem('pari-preloaded') === '1'; } catch (e) { /* приватный режим */ }
  ready.then(() => {
    try { sessionStorage.setItem('pari-preloaded', '1'); } catch (e) { /* приватный режим */ }
    const finish = () => { preloader.classList.add('is-done'); heroIntro(); };
    if (!MOTION) { finish(); return; }
    if (seen) { animate(preloader, { opacity: [1, 0] }, { duration: DUR.s, ease: EASE_OUT }).then(finish); return; }
    /* окно в форме рамки растёт из прорисованной рамки в центре (у ERA здесь арка); знак,
       подпись и линия гаснут. Конечный размер — с запасом на диагональ экрана:
       у рамки между лепестками «талия». */
    setTimeout(heroIntro, 700);
    const ctn = $('[data-preloader-ctn]', preloader);
    const frame = $('[data-preloader-frame]', preloader);
    const start = frame ? frame.getBoundingClientRect().width : 0;
    const end = Math.hypot(window.innerWidth, window.innerHeight) * 2.1;
    preloader.style.setProperty('--hole', `${start.toFixed(1)}px`);
    preloader.classList.add('is-opening');
    if (ctn) animate(ctn, { opacity: [1, 0] }, { duration: DUR.s, ease: EASE_OUT });
    /* в Motion 13 animate(fn, …) колбэк не вызывает — только animate(from, to, { onUpdate }) */
    animate(0, 1, {
      duration: DUR.l * 1.15, ease: EASE_IN_OUT,
      onUpdate: (p) => preloader.style.setProperty('--hole', `${(start + p * (end - start)).toFixed(1)}px`),
    }).then(finish);
  });
}
runPreloader();

/* ---------- скролл первого экрана ----------
   Замер и запись в одном кадре с Lenis: фон и текст не отстают от прокрутки. */
if (MOTION && scrollArea && heroBg && heroS) {
  let p = -1, vh = 0, bgH = 0, sS = '', sB = '';
  onFrame('read', () => {
    const r = scrollArea.getBoundingClientRect();
    vh = (heroW && heroW.offsetHeight) || window.innerHeight;   /* высота липкого экрана (100svh): не прыгает от адресной строки iOS */
    p = r.bottom < -vh ? 1 : progress(r, 'pin', vh);          /* ушли далеко вниз — кадр стоит в конце */
    bgH = heroBg.offsetHeight;
  });
  onFrame('write', () => {
    const p1 = easeOut(clamp01(p / .65));
    const tail = Math.max(0, bgH - vh);
    const p2 = clamp01((p - .5) / .5);
    const scale = 1 + p2 * (DESKTOP ? 1 : .2);
    const tS = `translate3d(0, ${(-0.78 * vh * p1).toFixed(2)}px, 0)`;
    const tB = `translate3d(0, ${(-tail * p1).toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
    if (tS !== sS) { heroS.style.transform = sS = tS; }
    if (tB !== sB) { heroBg.style.transform = sB = tB; }
  });
}

/* первый экран вне видимости — бесконечный пульс меток ставим на паузу (класс hero-off) */
if (hero) new IntersectionObserver(([e]) => hero.classList.toggle('hero-off', !e.isIntersecting)).observe(hero);

/* ---------- день / вечер (crossfade .8s в CSS) ----------
   Вечерний кадр не грузится вместе с первым экраном: по первому «Вечером» или через
   пару секунд после открытия страницы, когда сеть свободна. */
const loadNight = () => {
  const img = $('[data-night-img]');
  if (!img || img.dataset.loaded) return img;
  img.dataset.loaded = '1';
  $$('source[data-srcset]', img.parentElement).forEach((s) => { s.srcset = s.dataset.srcset; });
  img.srcset = img.dataset.srcset; img.src = img.dataset.src;
  return img;
};
Promise.resolve(window.__pariLoader).then(() => setTimeout(() => (window.requestIdleCallback || setTimeout)(loadNight), 2500));
$$('[data-theme-btn]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const night = btn.dataset.themeBtn === 'night';
    if (night) {
      const img = loadNight();
      /* кадр ещё грузится — переключаем, когда он готов (без мигания пустоты) */
      if (img && !img.complete) { img.addEventListener('load', () => { if (btn.classList.contains('is-active')) heroImg.classList.add('is-night'); }, { once: true }); $$('[data-theme-btn]').forEach((b) => b.classList.toggle('is-active', b === btn)); return; }
    }
    if (heroImg) heroImg.classList.toggle('is-night', night);
    $$('[data-theme-btn]').forEach((b) => b.classList.toggle('is-active', b === btn));
  });
});

/* ---------- медальон: вращение как у референса ----------
   У ERA кольцо идёт 30°/с в сторону последней прокрутки (вниз → по часовой,
   вверх → против) и разгоняется со скоростью Lenis (до ~450°/с). У PARI вращается
   рамка-арабеска: пока страница движется — те же скорости и направление; после
   остановки рамка упруго доходит до ближайшего положения, кратного 180°, где она
   совпадает с утверждённым знаком (рамка симметрична относительно центра). */
let lastScrollT = -1e9;
if (MOTION) window.addEventListener('scroll', () => { lastScrollT = performance.now(); }, { passive: true });
if (MOTION && ring && DESKTOP) {
  let angle = 0, vel = 0, target = null, shown = '';
  onFrame('write', (now, dt) => {
    if (now - lastScrollT < 180) {
      target = null;
      const boost = Math.max(-450, Math.min(450, scrollVelocity * 26));
      const want = 30 * scrollDir + boost;
      vel += (want - vel) * Math.min(1, dt * 8);
      angle += vel * dt;
    } else {
      if (target === null) {
        const ahead = angle + vel * .35;                      /* куда рамка докатится по инерции */
        target = (vel >= 0 ? Math.ceil(ahead / 180) : Math.floor(ahead / 180)) * 180;
      }
      const k = 26, c = 2 * Math.sqrt(k);                     /* критическое затухание: без перелёта */
      vel += (k * (target - angle) - c * vel) * dt;
      angle += vel * dt;
      if (Math.abs(target - angle) < .02 && Math.abs(vel) < .05) { angle = target; vel = 0; }
    }
    const tr = `rotate(${angle.toFixed(2)}deg)`;
    if (tr !== shown) ring.style.transform = shown = tr;      /* в покое не трогаем стиль — кадр не пересчитывается */
  });
}

/* ---------- магнитная круглая кнопка (только мышь, ≥992) ---------- */
if (MOTION && FINE && DESKTOP) {
  $$('[data-magnetic]').forEach((btn) => {
    const inner = $('[data-magnetic-inner]', btn);
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      animate(btn, { x: dx * r.width * .2, y: dy * r.height * .2 }, { duration: DUR.s, ease: EASE_OUT });
      if (inner) animate(inner, { x: dx * r.width * .1, y: dy * r.height * .1 }, { duration: DUR.s, ease: EASE_OUT });
    });
    btn.addEventListener('mouseleave', () => {
      animate(btn, { x: 0, y: 0 }, { type: 'spring', stiffness: 150, damping: 9 });
      if (inner) animate(inner, { x: 0, y: 0 }, { type: 'spring', stiffness: 150, damping: 9 });
    });
  });
}

/* появление остальных сцен — scripts/reveal.js (система ERA) */
