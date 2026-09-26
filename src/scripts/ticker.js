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
   ========================================================================== */
const ORDER = ['scroll', 'read', 'write'];
const phases = { scroll: new Set(), read: new Set(), write: new Set() };

export function onFrame(phase, fn) {
  phases[phase].add(fn);
  return () => phases[phase].delete(fn);
}

let last = performance.now();
const tick = (now) => {
  const dt = Math.min(.05, Math.max(0, (now - last) / 1000));
  last = now;
  for (const k of ORDER) phases[k].forEach((fn) => fn(now, dt));
  requestAnimationFrame(tick);
};
requestAnimationFrame(tick);

/* ---------- прогресс прокрутки по прямоугольнику цели (как offset у Motion scroll) ----------
   'pin'  — ['start start', 'end end']: 0, когда верх цели у верха экрана, 1 — низ цели у низа;
   'pass' — ['start end', 'end start']: 0, когда цель вошла снизу, 1 — ушла вверх. */
export function progress(rect, mode, vh = window.innerHeight) {
  const p = mode === 'pin'
    ? -rect.top / Math.max(1, rect.height - vh)
    : (vh - rect.top) / Math.max(1, vh + rect.height);
  return Math.min(1, Math.max(0, p));
}
