/* ==========================================================================
   PARI Residence — смена кадра и текста в слайдерах и вкладках, как у ERA
   (initSlider / initTabs с animateSlide):
     кадр   старый уходит влево «косой шторкой», новый входит справа по той же
            линии, между ними нет просвета. Раньше старый кадр сжимался с одной
            стороны, новый рос с другой, и посередине смены открывался пустой фон
            (у вкладок «Двор-сад / Прогулка…» — чёрная половина экрана).
            Картинки едут: старая к −25 % с масштабом 1.5, новая от +25 % и 1.5
            на место; 1.2 с, in-out (0.75, 0, 0.25, 1).
     текст  старый гаснет с лёгким подъёмом за .4 с (ease-in), новый появляется
            через .8 с (reveal.js showText), поэтому старый и новый не накладываются.
   Пока идёт смена кадра (1.2 с), новая не начинается поверх: запоминается последний
   запрос, он выполнится сразу после. У ERA клики в это время просто пропадают.
   Движение — средствами браузера (WAAPI): transform картинок идёт на видеокарте.
   «Меньше движения» — мгновенная смена классов.
   ========================================================================== */
import { showText } from './reveal.js';

const MOTION = document.documentElement.classList.contains('has-motion');
const L = 1200, M = 800, S = 400;
const INOUT = 'cubic-bezier(.75,0,.25,1)';
const IN = 'cubic-bezier(.5,0,.75,0)';
const finished = (a) => a.finished.catch(() => {});

/* кадр: у старого уезжает правый край, у нового — левый, по одной и той же косой линии */
function swapFrames(prev, next) {
  const o = { duration: L, easing: INOUT, fill: 'both' };
  const pi = prev.firstElementChild, ni = next.firstElementChild;
  prev.style.zIndex = '1';
  next.style.zIndex = '2';
  const a = [
    prev.animate([{ clipPath: 'polygon(0% 0%, 100% 0%, 125% 100%, 0% 100%)' }, { clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)' }], o),
    next.animate([{ clipPath: 'polygon(100% 0%, 100% 0%, 101% 100%, 125% 100%)' }, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' }], o),
  ];
  if (pi) a.push(pi.animate([{ transform: 'translateX(0%) scale(1)' }, { transform: 'translateX(-25%) scale(1.5)' }], o));
  if (ni) a.push(ni.animate([{ transform: 'translateX(25%) scale(1.5)' }, { transform: 'translateX(0%) scale(1)' }], o));
  next.classList.add('is-active');
  /* по окончании кадры отдаются стилям: у нового они те же, старый скрыт — подмены не видно */
  return Promise.all(a.map(finished)).then(() => {
    prev.classList.remove('is-active');
    a.forEach((x) => x.cancel());
    prev.style.zIndex = next.style.zIndex = '';
  });
}

function hideText(box) {
  const a = box.animate([{ opacity: 1, transform: 'translateY(0px)' }, { opacity: 0, transform: 'translateY(-12px)' }], { duration: S, easing: IN, fill: 'forwards' });
  return finished(a).then(() => { box.classList.remove('is-active'); a.cancel(); });
}

/* frames — кадры по номерам слайдов; texts — списки текстовых блоков (заголовки, абзацы…),
   в каждом списке блок с номером слайда. Возвращает go(i). */
export function switcher({ frames = [], texts = [], start = 0 } = {}) {
  const lists = texts.filter((l) => l && l.length);
  const n = Math.max(frames.length, 0, ...lists.map((l) => l.length));
  let cur = start, busy = false, want = null;
  const go = (i) => {
    if (!n) return;
    i = ((i % n) + n) % n;
    if (busy) { want = i; return; }
    if (i === cur) return;
    const prev = cur;
    cur = i;
    if (!MOTION) {
      [frames, ...lists].forEach((l) => { l[prev]?.classList.remove('is-active'); l[i]?.classList.add('is-active'); });
      return;
    }
    busy = true;
    const jobs = [new Promise((r) => setTimeout(r, L))];
    if (frames[prev] && frames[i]) jobs.push(swapFrames(frames[prev], frames[i]));
    lists.forEach((l) => { if (l[prev]) jobs.push(hideText(l[prev])); });
    setTimeout(() => lists.forEach((l) => {
      const box = l[i];
      if (!box) return;
      showText(box, 0);                                         /* части блока — в исходное положение, пока он скрыт */
      box.classList.add('is-active');
    }), M);
    Promise.all(jobs).then(() => {
      busy = false;
      if (want !== null) { const w = want; want = null; go(w); }
    });
  };
  return { go };
}
