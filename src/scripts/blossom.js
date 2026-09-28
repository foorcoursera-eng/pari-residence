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
   Кадры нужны, только пока ветки отыгрывают ветер или лепестки на экране (hold / wake):
   в покое вдали от сцены цикл спит.
   ========================================================================== */
import { onFrame, wake, hold, release, desktop, viewRect } from './ticker.js';
import branchData from '../data/branch.json';

const root = document.documentElement;
const MOTION = root.classList.contains('has-motion');
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ветер от прокрутки (−1…1): его же берут живые ветки и их лепестки (scripts/branch.js) */
let wind = 0;
export const windNow = () => wind;

if (MOTION) {
  /* ---------- скорость прокрутки (px/с), сглаженная ---------- */
  let lastY = window.scrollY, vy = 0;

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

  /* ---------- лепестки ----------
     Поля: во весь экран горизонтальной главы (ПК, data-petals-wide: back — за текстом и фото, front —
     ближние, поверх) и в первой панели (телефон). У лепестка своя глубина z: ближе — крупнее, быстрее
     и плотнее. Падение плавное: долгое покачивание из стороны в сторону с наклоном по ходу (как
     планирующий лист), медленный кувырок изнанкой, лёгкое вращение; прокрутка сдувает. */
  const fields = $$('[data-petals]').map((cv) => {
    const ctx = cv.getContext('2d');
    const layer = cv.dataset.petalsWide || '';
    const wide = !!layer;
    const [z0, z1] = layer === 'front' ? [.78, 1] : layer === 'back' ? [.3, .78] : [.35, 1];
    const n = layer === 'front' ? 12 : layer === 'back' ? 34 : (desktop() ? 22 : 14);
    const f = { cv, ctx, w: 0, h: 0, dpr: 1, petals: [], n };
    const size = () => {
      f.dpr = Math.min(wide ? 1.5 : 2, window.devicePixelRatio || 1);
      f.w = cv.clientWidth; f.h = cv.clientHeight;
      cv.width = Math.round(f.w * f.dpr); cv.height = Math.round(f.h * f.dpr);
    };
    size();
    window.addEventListener('resize', size);
    const spawn = (p, anywhere) => {
      const z = p.z = z0 + Math.random() * (z1 - z0);
      p.s = (10 + 15 * z) * (wide ? 1.15 : 1);                /* размер, px */
      p.vy = 12 + 32 * z;                                     /* падение, px/с */
      p.vx = -4 + Math.random() * 14;                         /* лёгкий бриз вправо */
      p.sw = 12 + 36 * z;                                     /* размах покачивания */
      p.T = 3.6 + Math.random() * 3.4;                        /* период покачивания, с */
      p.ph = Math.random() * Math.PI * 2;
      p.r0 = Math.random() * Math.PI * 2;
      p.vr = (Math.random() - .5) * .6;                       /* медленное вращение */
      p.flip = Math.random() * Math.PI * 2;
      p.vf = .7 + Math.random() * 1.3;                        /* медленный кувырок */
      p.o = .5 + .5 * z;
      p.t = 0;
      p.bx = 0;
      p.k = (Math.random() * branchData.petals) | 0;           /* какой лепесток из атласа */
      if (anywhere) { p.x = Math.random() * f.w; p.y = Math.random() * f.h; }
      else if (!wide && Math.random() < .7) { p.x = Math.random() * f.w * .32; p.y = f.h * (.05 + Math.random() * .45); }   /* у ветки слева вверху */
      else { p.x = Math.random() * (f.w + 240) - 160; p.y = -40 - Math.random() * 80; }                                   /* сверху по всей ширине */
      return p;
    };
    for (let i = 0; i < n; i++) f.petals.push(spawn({}, true));
    f.spawn = spawn;
    return f;
  });

  /* лепестки — настоящие, из той же ветки (атлас renders/make-branch.py): кувыркаются и переворачиваются
     изнанкой; пока атлас не загрузился — нарисованная капля с вырезом, тон шампани */
  const atlas = new Image();
  let atlasOk = false;
  atlas.decoding = 'async';
  atlas.onload = () => { atlasOk = true; };
  atlas.src = '/img/scenes/petals.webp';
  const drawPetal = (ctx, p) => {
    if (atlasOk) {
      const c = Math.cos(p.flip), s2 = p.s * 1.9;
      ctx.save();
      ctx.translate(p.x + p.bx, p.y);
      ctx.rotate(p.r);
      ctx.scale((Math.abs(c) < .18 ? .18 : Math.abs(c)) * (c < 0 ? -1 : 1), 1);
      ctx.globalAlpha = p.o;
      ctx.drawImage(atlas, p.k * 128, 0, 128, 128, -s2 / 2, -s2 / 2, s2, s2);
      ctx.restore();
      return;
    }
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
    const DESKTOP = desktop();
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
        const pr = viewRect(L.el.offsetParent);                   /* секция неподвижна относительно документа — из кеша */
        const cy = pr.top + L.el.offsetTop + L.el.offsetHeight / 2;
        L.near = cy > -H && cy < 2 * H;
        if (DESKTOP && L.depth && L.near) L.ty = -(cy - H / 2) * L.depth;
      }
    });
    fields.forEach((f, i) => {
      const r = f.cv.getBoundingClientRect();
      const vis = !(r.right < 0 || r.left > W || r.bottom < 0 || r.top > H);
      if (vis !== f.vis) { f.vis = vis; if (vis) hold('petals' + i); else release('petals' + i); }
    });
  });
  /* лепестки видны с первого кадра (перезагрузка посреди сцены) — цикл должен знать об этом сразу */
  fields.forEach((f, i) => new IntersectionObserver(([e]) => { if (e.isIntersecting) hold('petals' + i); }).observe(f.cv));

  /* ---------- фаза записи ---------- */
  onFrame('write', (now, dt) => {
    const DESKTOP = desktop();
    if (dt > 0) vy += ((y - lastY) / dt - vy) * Math.min(1, dt * 6);
    lastY = y;
    if (Math.abs(vy) < .5) vy = 0;
    wind = clamp(vy / 1600, -1, 1);
    let busy = vy !== 0;

    /* ветки: пружина к углу «ветра» + глубина; вдали от экрана и в покое стиль не трогаем */
    layers.forEach((L) => {
      if (L.flower && L.far !== !L.near) L.el.classList.toggle('is-far', L.far = !L.near);   /* покачивание — только рядом с экраном */
      let tr = '';
      if (L.flower) {
        const target = L.sign * wind * 6 * L.gain;             /* до ±6° при быстрой прокрутке */
        L.va += (48 * (target - L.a) - 6.5 * L.va) * dt;        /* недодемпфированная пружина: лёгкое «отыгрывание» */
        L.a += L.va * dt;
        if (Math.abs(L.a) < .002 && Math.abs(L.va) < .002 && Math.abs(target) < .002) { L.a = 0; L.va = 0; }
        else busy = true;                                        /* ветка ещё отыгрывает — нужен следующий кадр */
        if (!L.near) return;
        /* живая ветка (WebGL, scripts/branch.js) гнётся сама: угол ветра уходит в изгиб, рамка только сдвигается */
        if (L.el.classList.contains('is-gl')) { L.el.__bend = L.a; tr = `translate3d(${L.tx.toFixed(1)}px,${L.ty.toFixed(1)}px,0)`; }
        else tr = `translate3d(${L.tx.toFixed(1)}px,${L.ty.toFixed(1)}px,0) rotate(${L.a.toFixed(2)}deg)`;
      } else {
        if (!(DESKTOP && L.depth)) { if (L.shown) L.el.style.transform = L.shown = ''; return; }   /* телефон: глубины нет, сдвиг снят */
        if (!L.near) return;
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
        p.y += (p.vy + Math.abs(wind) * 40 * p.z) * dt;
        p.x += (p.vx + wind * 260 * p.z) * dt;                  /* прокрутка вниз — сдувает вправо, ближние сильнее */
        const a = p.t * Math.PI * 2 / p.T + p.ph;
        p.bx = Math.sin(a) * p.sw;
        p.r0 += (p.vr + wind * 1.5) * dt;
        p.r = p.r0 + Math.cos(a) * .5;                          /* наклон по ходу покачивания — лист планирует */
        p.flip += p.vf * dt;
        if (p.y > f.h + 40 || p.x + p.bx > f.w + 80 || p.x + p.bx < -120) f.spawn(p, false);
        drawPetal(ctx, p);
      });
    });
    if (busy) wake();
  });
}
