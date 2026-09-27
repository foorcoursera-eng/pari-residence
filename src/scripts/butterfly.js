/* ==========================================================================
   PARI Residence — бабочка у кнопки «Изучить расположение» (просьба заказчика 27.09).
   Когда кнопка целиком на экране, бабочка прилетает из-за верхнего края: порхает
   неровно — на каждом взмахе чуть поднимается, её слегка ведёт в сторону, — у круга
   замедляется, зависает и садится на край кольца (около «часа дня») головой к центру,
   крылья раскрыты. В покое изредка вздрагивает крыльями (CSS, на паузе вне экрана).
   При наведении на кнопку вспархивает и садится снова.
   Полёт считается в общем кадре (scripts/ticker.js: hold на время полёта), своих
   requestAnimationFrame нет. «Меньше движения» — бабочка сразу сидит на круге.
   ========================================================================== */
import { onFrame, hold, release } from './ticker.js';

const MOTION = document.documentElement.classList.contains('has-motion');
const TH = -60 * Math.PI / 180;                    /* точка посадки на кольце: «час дня» */
const REST = TH * 180 / Math.PI + 270;             /* поворот в покое: голова к центру круга */
const FLY = 3600, HOP = 950;                       /* мс: полёт и вспархивание */
const TAU = Math.PI * 2;
const smooth = (t) => t * t * (3 - 2 * t);
const bez = (a, b, c, d, u) => { const m = 1 - u; return m * m * m * a + 3 * m * m * u * b + 3 * m * u * u * c + u * u * u * d; };

document.querySelectorAll('[data-butterfly]').forEach((bf) => {
  const btn = bf.closest('.btn-circle');
  const wings = [...bf.querySelectorAll('[data-wing]')];
  if (!btn || wings.length < 2) return;

  let R = 0, L = { x: 0, y: 0 }, N = { x: 0, y: 0 };
  const geo = () => {
    R = btn.offsetWidth / 2;
    N = { x: Math.cos(TH), y: Math.sin(TH) };
    L = { x: R * N.x, y: R * N.y };
  };
  const place = (x, y, rot, s = 1) => {
    bf.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scale(${s.toFixed(3)})`;
  };
  const flap = (k) => { const v = `scaleX(${k.toFixed(3)})`; wings.forEach((w) => { w.style.transform = v; }); };
  const land = () => {
    place(L.x, L.y, REST);
    wings.forEach((w) => { w.style.transform = ''; });   /* дальше крыльями двигает CSS (вздрагивание в покое) */
    bf.classList.remove('is-flying');
    bf.classList.add('is-landed');
  };

  geo();
  if (!MOTION) { land(); return; }

  let mode = null, t0 = 0, P = null, phase = 0, rot = null;
  const start = () => {
    geo();
    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const T = { x: -N.y, y: N.x };                                   /* касательная к кольцу в точке посадки */
    /* старт — за верхним краем экрана, левее кнопки; провал слева от круга; заход на посадку снаружи кольца */
    const p0 = { x: -Math.min(cx + 40, 3.4 * R), y: -(cy + 90) };
    const p1 = { x: p0.x * .5, y: R * .55 };
    const p2 = { x: L.x + N.x * 1.7 * R + T.x * .8 * R, y: L.y + N.y * 1.7 * R + T.y * .8 * R };
    P = [p0, p1, p2, L];
    mode = 'fly'; t0 = performance.now(); rot = null;
    bf.classList.remove('is-landed');
    bf.classList.add('is-flying');
    hold('butterfly');
  };
  const hop = () => {
    if (mode || !bf.classList.contains('is-landed')) return;
    mode = 'hop'; t0 = performance.now();
    bf.classList.remove('is-landed');
    bf.classList.add('is-flying');
    hold('butterfly');
  };

  onFrame('write', (now, dt) => {
    if (!mode) return;
    const k = Math.min(1, (now - t0) / (mode === 'fly' ? FLY : HOP));
    let x, y, r, s = 1, hz;
    if (mode === 'fly') {
      /* быстро издалека, медленно у круга: последние ~15 % — почти зависание над точкой посадки */
      const u = 1 - Math.pow(1 - k, 2.4);
      const bx = bez(P[0].x, P[1].x, P[2].x, P[3].x, u), by = bez(P[0].y, P[1].y, P[2].y, P[3].y, u);
      const u2 = Math.min(1, u + .01);
      const dx = bez(P[0].x, P[1].x, P[2].x, P[3].x, u2) - bx, dy = bez(P[0].y, P[1].y, P[2].y, P[3].y, u2) - by;
      const len = Math.hypot(dx, dy) || 1;
      /* неровное порхание: подъём на каждом взмахе и лёгкий снос вбок, к посадке затихают */
      const amp = R * .13 * (1 - smooth(Math.min(1, k / .9)));
      const lift = Math.sin(phase * .5) * amp, drift = Math.sin(phase * .19 + 1.3) * amp * .7;
      x = bx + (-dy / len) * drift;
      y = by + lift;
      const head = Math.atan2(dy, dx) * 180 / Math.PI + 90;
      /* у самой посадки нос доворачивается к центру круга */
      const want = k > .82 ? head + (((REST - head + 540) % 360) - 180) * smooth((k - .82) / .18) : head;
      rot = rot === null ? want : rot + ((((want - rot + 540) % 360) - 180) * Math.min(1, dt * 7));
      r = rot;
      s = 1.28 - .28 * smooth(k);                                    /* «опускается» к поверхности */
      hz = k < .8 ? 9 : 9 - 4 * smooth((k - .8) / .2);
    } else {
      /* вспархивание: отрывается от кольца наружу, пара взмахов, садится обратно */
      const a = Math.sin(Math.PI * k);
      x = L.x + N.x * R * .2 * a;
      y = L.y + N.y * R * .2 * a - R * .06 * a;
      r = REST + 14 * Math.sin(TAU * k) * a;
      hz = 11;
    }
    phase += dt * hz * TAU;
    const open = k >= 1 ? 1 : .22 + .78 * Math.abs(Math.cos(phase / 2));
    place(x, y, r, s);
    flap(open);
    if (k >= 1) { mode = null; land(); release('butterfly'); }
  });

  /* прилёт — один раз, когда кнопка видна целиком; покой — на паузе вне экрана */
  let flown = false;
  new IntersectionObserver(([e]) => {
    bf.classList.toggle('is-far', !e.isIntersecting);
    if (!flown && e.intersectionRatio > .85) { flown = true; start(); }
  }, { threshold: [0, .85, 1] }).observe(btn);
  btn.addEventListener('mouseenter', hop);
  btn.addEventListener('focusin', hop);
  window.addEventListener('resize', () => { geo(); if (!mode && bf.classList.contains('is-landed')) place(L.x, L.y, REST); });
});
