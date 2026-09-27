/* ==========================================================================
   PARI Residence — один кадр на все эффекты.
   Раньше у каждого эффекта был свой requestAnimationFrame: замеры одного шли
   после записей другого, и браузер пересчитывал стили и раскладку по 8–10 раз
   за кадр, а эффекты, привязанные к прокрутке, отставали от Lenis на кадр
   (дрожание закреплённых сцен). Теперь цикл один и идёт по фазам:
     scroll — Lenis двигает страницу;
     read   — все замеры (getBoundingClientRect, scrollY);
     write  — все записи стилей, WebGL и canvas.
   Колбэк получает (now мс, dt с, не больше .05).

   Цикл не крутится вхолостую: когда страница стоит, кадры не запрашиваются
   (раньше — 60 пересчётов стилей в секунду в простое). Будят его прокрутка,
   колесо, касание, клавиши, изменение размера и сами эффекты: wake() — ещё
   несколько кадров (пружина доходит, догоняние сходится), hold(key) — пока
   эффект виден и движется сам (лепестки, облака); release(key) — отпустить.
   ========================================================================== */
const ORDER = ['scroll', 'read', 'write'];
const phases = { scroll: new Set(), read: new Set(), write: new Set() };
const holds = new Set();
let running = false;
let until = 0;
let last = 0;

export function onFrame(phase, fn) {
  phases[phase].add(fn);
  wake();
  return () => phases[phase].delete(fn);
}

/* ещё ms миллисекунд кадров (по умолчанию ~12 кадров: хватает, чтобы дочитать новое положение) */
export function wake(ms = 200) {
  const now = performance.now();
  if (now + ms > until) until = now + ms;
  if (!running) {
    running = true;
    last = now;
    requestAnimationFrame(tick);
  }
}
export function hold(key) { holds.add(key); wake(); }
export function release(key) { holds.delete(key); }

const tick = (now) => {
  const dt = Math.min(.05, Math.max(0, (now - last) / 1000));
  last = now;
  for (const k of ORDER) phases[k].forEach((fn) => fn(now, dt));
  if (holds.size || now < until) requestAnimationFrame(tick);
  else running = false;
};

/* ввод и изменения раскладки будят цикл; прокрутка — на всё время движения */
const opts = { passive: true, capture: true };
['scroll', 'wheel', 'touchstart', 'touchmove', 'keydown', 'pointerdown'].forEach((e) => window.addEventListener(e, () => wake(400), opts));
window.addEventListener('resize', () => wake(600));
document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });

/* ---------- прогресс прокрутки по прямоугольнику цели (как offset у Motion scroll) ----------
   'pin'  — ['start start', 'end end']: 0, когда верх цели у верха экрана, 1 — низ цели у низа;
   'pass' — ['start end', 'end start']: 0, когда цель вошла снизу, 1 — ушла вверх. */
export function progress(rect, mode, vh = window.innerHeight) {
  const p = mode === 'pin'
    ? -rect.top / Math.max(1, rect.height - vh)
    : (vh - rect.top) / Math.max(1, vh + rect.height);
  return Math.min(1, Math.max(0, p));
}

/* ---------- положение неподвижных блоков в координатах документа ----------
   Секции и их рамки не двигаются относительно документа: их положение меряется один раз
   и сбрасывается, когда меняется раскладка (размер окна, догрузились шрифты или картинки,
   каталог перестроил список). В кадре остаётся арифметика от scrollY, без getBoundingClientRect.
   Только для блоков без собственной анимации transform (и без таких предков). */
let layoutV = 0;
const bump = () => { layoutV++; wake(); };
window.addEventListener('resize', bump);
window.addEventListener('load', bump);
if (document.fonts) document.fonts.addEventListener('loadingdone', bump);
if ('ResizeObserver' in window) new ResizeObserver(bump).observe(document.documentElement);
const rects = new WeakMap();
export function docRect(el) {
  let c = rects.get(el);
  if (!c || c.v !== layoutV) {
    const r = el.getBoundingClientRect();
    const y = window.scrollY, x = window.scrollX;
    c = { v: layoutV, top: r.top + y, bottom: r.bottom + y, left: r.left + x, right: r.right + x, width: r.width, height: r.height };
    rects.set(el, c);
  }
  return c;
}
export const layoutVersion = () => layoutV;
/* прямоугольник блока на экране сейчас (как getBoundingClientRect, но из кеша) */
export function viewRect(el) {
  const c = docRect(el);
  const y = window.scrollY, x = window.scrollX;
  return { top: c.top - y, bottom: c.bottom - y, left: c.left - x, right: c.right - x, width: c.width, height: c.height };
}

/* ---------- раскладка ПК / телефон ----------
   Граница 992 px может смениться без перезагрузки: поворот планшета (834 ↔ 1194),
   окно браузера. Эффекты читают desktop() в каждом кадре, а onLayout сообщает о смене. */
const mqDesk = matchMedia('(min-width: 992px)');
export const desktop = () => mqDesk.matches;
const layoutFns = new Set();
export function onLayout(fn) { layoutFns.add(fn); return () => layoutFns.delete(fn); }
mqDesk.addEventListener('change', () => { layoutFns.forEach((fn) => fn(mqDesk.matches)); wake(600); });
