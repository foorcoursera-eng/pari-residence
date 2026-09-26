/* ==========================================================================
   PARI Residence — ветки вишни: ветер, глубина и лепестки.
   У ERA ветки бугенвиллеи — видео с лёгким движением. У PARI ветка — картинка,
   поэтому движение собрано из трёх слоёв:
     1. покой — медленное покачивание (CSS flowerSway на картинке);
     2. ветер — прокрутка страницы гнёт ветку вокруг линии среза, после
        остановки она упруго возвращается (пружина с лёгким перелётом);
     3. глубина — ветки на переднем плане едут быстрее ленты / страницы,
        ветки за фото и барельеф — медленнее (только ≥992, на телефоне параллакс
        выключен по требованиям «Этапа 1»).
   В сцене «Характер PARI» с веток падают лепестки (canvas); при быстрой
   прокрутке их сдувает в сторону движения.
   ========================================================================== */
import { onFrame } from './ticker.js';

const root = document.documentElement;
const MOTION = root.classList.contains('has-motion');
const DESKTOP = matchMedia('(min-width: 992px)').matches;
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

if (MOTION) {
  /* ---------- скорость прокрутки (px/с), сглаженная ---------- */
  let lastY = window.scrollY, vy = 0, wind = 0;

  /* ---------- ветки и слои глубины ---------- */
  const layers = $$('[data-flower], [data-depth]').filter((el, i, a) => a.indexOf(el) === i).map((el) => ({
    el,
    flower: el.hasAttribute('data-flower'),
    depth: parseFloat(el.dataset.depth || (el.hasAttribute('data-flower') ? '-0.12' : '0')),
    sign: el.classList.contains('is-r') || el.classList.contains('is-rb') ? -1 : 1,
    track: el.closest('[data-hscroll-track]'),
    a: 0, va: 0,
    tx: 0, ty: 0, near: false, far: null, shown: '',
    gain: .8 + Math.random() * .5,                          /* ветки гнутся по-разному */
  }));

  /* ---------- лепестки ---------- */
  const fields = $$('[data-petals]').map((cv) => {
    const ctx = cv.getContext('2d');
    const n = DESKTOP ? 34 : 14;
    const f = { cv, ctx, w: 0, h: 0, dpr: 1, petals: [], n };
    const size = () => {
      f.dpr = Math.min(2, window.devicePixelRatio || 1);
      f.w = cv.clientWidth; f.h = cv.clientHeight;
      cv.width = Math.round(f.w * f.dpr); cv.height = Math.round(f.h * f.dpr);
    };
    size();
    window.addEventListener('resize', size);
    /* рождаются у ветки слева вверху (и немного по всей верхней кромке) */
    const spawn = (p, anywhere) => {
      const fromBranch = Math.random() < .75;
      p.x = anywhere ? Math.random() * f.w : (fromBranch ? Math.random() * f.w * .32 : Math.random() * f.w);
      p.y = anywhere ? Math.random() * f.h : (fromBranch ? f.h * (.05 + Math.random() * .45) : -20);
      p.s = 9 + Math.random() * 9;                            /* размер, px */
      p.vy = 16 + Math.random() * 26;                         /* падение, px/с */
      p.vx = 8 + Math.random() * 22;                          /* лёгкий бриз вправо */
      p.sw = 10 + Math.random() * 24;                         /* размах колебаний */
      p.ph = Math.random() * Math.PI * 2;
      p.fr = .6 + Math.random() * .9;                         /* частота колебаний */
      p.r = Math.random() * Math.PI * 2;
      p.vr = (Math.random() - .5) * 2.2;
      p.flip = Math.random() * Math.PI * 2;
      p.vf = 1.4 + Math.random() * 2.2;                       /* переворот лепестка */
      p.o = .7 + Math.random() * .3;
      p.t = 0;
      p.bx = 0;
      return p;
    };
    for (let i = 0; i < n; i++) f.petals.push(spawn({}, true));
    f.spawn = spawn;
    return f;
  });

  /* лепесток сакуры: капля с вырезом на широком конце, тон шампани */
  const drawPetal = (ctx, p) => {
    const s = p.s, w = s * .62;
    ctx.save();
    ctx.translate(p.x + p.bx, p.y);
    ctx.rotate(p.r);
    ctx.scale(Math.max(.18, Math.abs(Math.cos(p.flip))), 1);
    ctx.globalAlpha = p.o;
    const g = ctx.createLinearGradient(0, -s / 2, 0, s / 2);
    g.addColorStop(0, '#F3E8D2');
    g.addColorStop(1, '#C9AD7C');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, s / 2);
    ctx.bezierCurveTo(w, s * .25, w, -s * .45, s * .16, -s / 2);
    ctx.lineTo(0, -s * .36);
    ctx.lineTo(-s * .16, -s / 2);
    ctx.bezierCurveTo(-w, -s * .45, -w, s * .25, 0, s / 2);
    ctx.fill();
    ctx.restore();
  };

  /* ---------- фаза чтения: все замеры кадра разом (общий цикл, scripts/ticker.js) ---------- */
  let y = window.scrollY, W = window.innerWidth, H = window.innerHeight;
  onFrame('read', () => {
    y = window.scrollY; W = window.innerWidth; H = window.innerHeight;
    const tracks = new Map();
    layers.forEach((L) => {
      L.tx = 0; L.ty = 0; L.near = false;
      if (L.track) {
        if (!tracks.has(L.track)) tracks.set(L.track, L.track.getBoundingClientRect());
        const tr = tracks.get(L.track);
        const cx = tr.left + L.el.offsetLeft + L.el.offsetWidth / 2;
        L.near = cx > -W && cx < 2 * W && tr.bottom > 0 && tr.top < H;
        if (DESKTOP && L.depth && L.near) {
          const home = Math.min(L.el.offsetLeft + L.el.offsetWidth / 2, W / 2);   /* где элемент стоит по макету */
          L.tx = -(cx - home) * L.depth;
        }
      } else if (L.el.offsetParent) {
        const pr = L.el.offsetParent.getBoundingClientRect();
        const cy = pr.top + L.el.offsetTop + L.el.offsetHeight / 2;
        L.near = cy > -H && cy < 2 * H;
        if (DESKTOP && L.depth && L.near) L.ty = -(cy - H / 2) * L.depth;
      }
    });
    fields.forEach((f) => {
      const r = f.cv.getBoundingClientRect();
      f.vis = !(r.right < 0 || r.left > W || r.bottom < 0 || r.top > H);
    });
  });

  /* ---------- фаза записи ---------- */
  onFrame('write', (now, dt) => {
    if (dt > 0) vy += ((y - lastY) / dt - vy) * Math.min(1, dt * 6);
    lastY = y;
    wind = clamp(vy / 1600, -1, 1);

    /* ветки: пружина к углу «ветра» + глубина; вдали от экрана и в покое стиль не трогаем */
    layers.forEach((L) => {
      if (L.flower && L.far !== !L.near) L.el.classList.toggle('is-far', L.far = !L.near);   /* покачивание — только рядом с экраном */
      let tr = '';
      if (L.flower) {
        const target = L.sign * wind * 6 * L.gain;             /* до ±6° при быстрой прокрутке */
        L.va += (48 * (target - L.a) - 6.5 * L.va) * dt;        /* недодемпфированная пружина: лёгкое «отыгрывание» */
        L.a += L.va * dt;
        if (Math.abs(L.a) < .002 && Math.abs(L.va) < .002 && Math.abs(target) < .002) { L.a = 0; L.va = 0; }
        if (!L.near) return;
        tr = `translate3d(${L.tx.toFixed(1)}px,${L.ty.toFixed(1)}px,0) rotate(${L.a.toFixed(2)}deg)`;
      } else {
        if (!L.near || !(DESKTOP && L.depth)) return;            /* слои без глубины (телефон) не трогаем вовсе */
        tr = `translate3d(${L.tx.toFixed(1)}px,${L.ty.toFixed(1)}px,0)`;
      }
      if (tr !== L.shown) L.el.style.transform = L.shown = tr;
    });

    /* лепестки — только пока поле на экране */
    fields.forEach((f) => {
      if (!f.vis) return;
      const { ctx } = f;
      ctx.setTransform(f.dpr, 0, 0, f.dpr, 0, 0);
      ctx.clearRect(0, 0, f.w, f.h);
      f.petals.forEach((p) => {
        p.t += dt;
        p.y += (p.vy + Math.abs(wind) * 30) * dt;
        p.x += (p.vx + wind * 260) * dt;                        /* прокрутка вниз — сдувает вправо */
        p.bx = Math.sin(p.t * p.fr + p.ph) * p.sw;
        p.r += (p.vr + wind * 3) * dt;
        p.flip += p.vf * dt;
        if (p.y > f.h + 24 || p.x + p.bx > f.w + 40 || p.x + p.bx < -60) f.spawn(p, false);
        drawPetal(ctx, p);
      });
    });
  });
}
