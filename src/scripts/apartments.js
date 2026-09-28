/* ==========================================================================
   PARI Residence — каталог «Выбрать квартиру» (ERA: /apartments).
   Фильтры «Комнат» и «Подъезд», сортировка по площади, «Сбросить»; состояние
   в адресе (?type=2&ent=4&sort=asc), как у ERA (?type=penthouse-duplex).
   Карточки по 24 + «Показать ещё»; при смене фильтра сетка гаснет (.4 с),
   перестраивается и карточки въезжают снизу с шагом .05 с (ERA ctn: y 3.33rem → 0).
   Счётчик в заголовке пересчитывается плавно; число найденных объявляется
   экранным дикторам отдельной строкой (сам счётчик мелькает промежуточными числами).
   Возврат браузером из карточки квартиры: сколько карточек было открыто и где был
   экран — в history.state, список и позиция восстанавливаются.
   ========================================================================== */
import { animate } from 'motion';
import { initSelect } from './select.js';
import { onFrame, wake, desktop } from './ticker.js';

const root = document.querySelector('[data-apts]');
const dataEl = document.getElementById('apts-data');
if (root && dataEl) {
  const { rows, s: S, page: PAGE } = JSON.parse(dataEl.textContent);
  const list = root.querySelector('[data-apts-list]');
  const countEl = root.querySelector('[data-apts-count]');
  const foundEl = root.querySelector('[data-apts-found]');
  const moreBtn = root.querySelector('[data-apts-more]');
  const emptyEl = root.querySelector('[data-apts-empty]');
  const resetBtn = root.querySelector('[data-apts-reset]');
  const resetEmpty = root.querySelector('[data-apts-reset-empty]');
  const selects = [...root.querySelectorAll('[data-select]')];
  const html_ = document.documentElement;
  const MOTION = html_.classList.contains('has-motion');
  /* загрузочный экран ещё закрывает страницу — въезд карточек пройдёт за ним и не мигнёт */
  const veiled = () => !!document.querySelector('[data-preloader]') && !html_.classList.contains('is-revealed') && !html_.classList.contains('pre-skip');

  const fill = (str, v) => String(str).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));
  const area = (a) => { const x = (Math.round(a * 100) / 100).toFixed(2); return S.lang === 'en' ? x : x.replace('.', ','); };
  const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- состояние: только допустимые значения (неверный адрес — как без фильтра) ---------- */
  const DEF = { type: '', ent: '', sort: 'rel' };
  const VALID = {
    type: new Set(rows.map((r) => r.t)),
    ent: new Set(rows.map((r) => String(r.e))),
    sort: new Set(['rel', 'asc', 'desc']),
  };
  const q = new URLSearchParams(location.search);
  const pickVal = (k) => { const v = q.get(k); return v && VALID[k].has(v) ? v : DEF[k]; };
  const state = { type: pickVal('type'), ent: pickVal('ent'), sort: pickVal('sort') };
  const saved = history.state && history.state.apts;
  let shown = saved && saved.shown > PAGE ? saved.shown : PAGE;

  const result = () => {
    let r = rows.filter((x) => (!state.type || x.t === state.type) && (!state.ent || String(x.e) === state.ent));
    if (state.sort === 'asc') r = [...r].sort((a, b) => a.a - b.a || a.e - b.e || a.f - b.f);
    else if (state.sort === 'desc') r = [...r].sort((a, b) => b.a - a.a || a.e - b.e || a.f - b.f);
    return r;
  };

  /* ---------- разметка карточки (та же, что в ApartmentsView.astro) ---------- */
  const cardHTML = (r) => {
    let img;
    if (r.p) img = `<img src="/img/plans/${r.p}-800.webp" alt="${esc(fill(S.alt, { type: S.types[r.t], area: area(r.a) }))}" loading="lazy" decoding="async" />`;
    else if (r.poly) img = `<div class="acard_floor"><img src="/img/floors/p${r.e}-f${r.f}.webp" alt="${esc(fill(S.altFloor, { floor: r.f, ent: r.e }))}" loading="lazy" decoding="async" /><svg viewBox="${r.poly.box}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path d="${r.poly.d}" /></svg></div>`;
    else img = '<div class="acard_none" aria-hidden="true"></div>';
    return `<a class="acard" href="${S.base}${r.l}/?flat=${r.id}" data-id="${r.id}">
      <div class="decor" aria-hidden="true"><div class="decor_line"></div><div class="decor_fill"></div></div>
      <div class="acard_shadow" aria-hidden="true"></div>
      <div class="acard_c">
        <div class="acard_t"><h2 class="l2 a-center">${esc(S.types[r.t])}</h2><div class="u-4"></div><p class="l2 reg a-center">${esc(S.finish)}</p></div>
        <div class="acard_img">${img}</div>
        <div class="acard_b">
          <p class="acard_data l2 reg"><span>${esc(fill(S.noFmt, { n: r.n }))}</span><i></i><span>${esc(fill(S.entFmt, { n: r.e }))}</span><i></i><span>${esc(fill(S.floorFmt, { n: r.f }))}</span></p>
          <div class="u-16"></div>
          <p class="acard_info h5"><span>${esc(S.roomsShort[r.t])}</span><span class="acard_sl">/</span><span>${area(r.a)} ${esc(S.m2)}</span></p>
          <div class="u-16"></div>
          <p class="acard_add l1">${r.c > 1 ? esc(fill(S.same, { n: r.c - 1 })) : '&nbsp;'}</p>
        </div>
      </div>
    </a>`;
  };
  /* та же разметка, что в components/apts/Benefit.astro */
  const benefitHTML = (b) => {
    const src = (w) => `/img/scenes/${b.img}-${w}.webp`;
    return `<div class="abenefit theme_on-color"><div class="abenefit_bg"><div class="abenefit_par"><img src="${src(700)}" srcset="${src(700)} 700w, ${src(1100)} 1100w" sizes="(max-width: 991px) 92vw, 28vw" alt="" loading="lazy" decoding="async" width="700" height="1296" /></div><div class="abenefit_grad"></div></div><div class="abenefit_info"><h3 class="h5">${esc(b.title)}</h3><div class="u-12"></div><p class="p1">${esc(b.text)}</p></div></div>`;
  };
  /* вставки — в ячейки 5, 12, 20 (первая страница: ряды 2, 5, 7) и 27, 35 (после «Показать ещё»: ряды 10, 12),
     поочерёдно справа и слева (как SLOTS в ApartmentsView.astro) */
  const BEFORE = { 5: 0, 11: 1, 18: 2, 24: 3, 31: 4 };

  const html = (items, from) => items.map((r, k) => {
    const i = from + k;
    const b = BEFORE[i] !== undefined && S.benefits[BEFORE[i]] ? benefitHTML(S.benefits[BEFORE[i]]) : '';
    return b + cardHTML(r);
  }).join('');

  const enter = (els) => {
    if (!MOTION) return;
    els.forEach((el, k) => { el.style.animationDelay = `${Math.min(k, 11) * .05}s`; el.classList.add('is-in'); });
  };

  /* ---------- счётчик ---------- */
  let shownCount = rows.length;
  const setCount = (n) => {
    if (foundEl) foundEl.textContent = fill(S.found, { n });
    if (!countEl) return;
    if (!MOTION) { countEl.textContent = String(n); shownCount = n; return; }
    const from = shownCount; shownCount = n;
    animate(0, 1, { duration: .6, ease: [.25, 1, .5, 1], onUpdate: (p) => { countEl.textContent = String(Math.round(from + (n - from) * p)); } });
  };

  /* ---------- адрес и history.state ---------- */
  const remember = () => {
    const st = { ...(history.state || {}), apts: { shown, y: Math.round(window.scrollY) } };
    history.replaceState(st, '', location.href);
  };
  const sync = () => {
    const p = new URLSearchParams();
    if (state.type) p.set('type', state.type);
    if (state.ent) p.set('ent', state.ent);
    if (state.sort !== 'rel') p.set('sort', state.sort);
    const qs = p.toString();
    history.replaceState({ ...(history.state || {}), apts: { shown, y: Math.round(window.scrollY) } }, '', location.pathname + (qs ? '?' + qs : ''));
    resetBtn.classList.toggle('is-disabled', !state.type && !state.ent && state.sort === 'rel');
    resetBtn.setAttribute('aria-disabled', !state.type && !state.ent && state.sort === 'rel' ? 'true' : 'false');
  };

  /* ---------- отрисовка ---------- */
  let first = true;
  const render = (keepShown, done) => {
    const r = result();
    if (!keepShown) shown = PAGE;
    const apply = () => {
      list.innerHTML = html(r.slice(0, shown), 0);
      if (!first || veiled()) enter([...list.children]);
      list.classList.remove('is-swapping');
      emptyEl.hidden = r.length > 0;
      moreBtn.parentElement.classList.toggle('is-hidden', r.length <= shown);
      first = false;
      remember();
      if (done) done();
    };
    setCount(r.length);
    if (first || !MOTION) { apply(); return; }
    list.classList.add('is-swapping');
    setTimeout(apply, 400);
  };

  const more = () => {
    const r = result();
    const from = list.querySelectorAll('.acard').length;
    shown += PAGE;
    const tmp = document.createElement('div');
    tmp.innerHTML = html(r.slice(from, shown), from);
    const added = [...tmp.children];
    added.forEach((el) => list.appendChild(el));
    enter(added);
    moreBtn.parentElement.classList.toggle('is-hidden', r.length <= shown);
    remember();
    /* карточки кончились и кнопка спряталась — фокус не теряется, а встаёт на первую новую карточку */
    const firstNew = added.find((el) => el.classList.contains('acard'));
    if (firstNew && document.activeElement === moreBtn && moreBtn.parentElement.classList.contains('is-hidden')) firstNew.focus({ preventScroll: true });
  };

  /* ---------- выпадающие списки (ERA filter_select) — scripts/select.js ---------- */
  const apis = selects.map((box) => {
    const name = box.dataset.select;
    const api = initSelect(box, (v) => { state[name] = v; sync(); render(); });
    api.set(state[name]);
    return { name, api };
  });

  const reset = () => {
    Object.assign(state, DEF);
    apis.forEach(({ name, api }) => api.set(state[name]));
    sync(); render();
  };
  resetBtn.addEventListener('click', reset);
  if (resetEmpty) resetEmpty.addEventListener('click', () => { reset(); resetBtn.focus({ preventScroll: true }); });
  moreBtn.addEventListener('click', more);
  /* позиция экрана — к возврату браузером: после прокрутки (не на каждый кадр) и в момент перехода в квартиру.
     Восстанавливает её каталог сам (history.scrollRestoration = manual ставится на запись истории сразу):
     браузер иначе прокручивал раньше, чем список дорисован, и попадал не туда */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  let tSave = 0;
  window.addEventListener('scroll', () => { clearTimeout(tSave); tSave = setTimeout(remember, 250); }, { passive: true });
  list.addEventListener('click', (e) => { if (e.target.closest('a')) remember(); }, true);
  document.addEventListener('visibilitychange', () => { if (document.hidden) remember(); });

  /* восстановление после возврата: столько же карточек и то же место на экране */
  const restoreY = () => {
    if (!saved || !saved.y) return;
    const y = saved.y;
    /* нативная прокрутка, а не lenis.scrollTo: Lenis ещё помнит высоту страницы до перерисовки списка и
       обрезал бы позицию; на нативную прокрутку он переключается сам */
    requestAnimationFrame(() => { window.scrollTo(0, y); if (window.__lenis) window.__lenis.resize(); });
  };

  /* ---------- параллакс кадров во вставках (ERA .benefit-card: картинка 140 %, yPercent −15 → 15, scrub .5) ----------
     Кадр едет внутри рамки навстречу прокрутке: листают вниз — картинка в рамке опускается (на экране
     поднимается медленнее страницы), вверх — наоборот. Вставки перерисовываются вместе со списком,
     поэтому берутся из живой коллекции в каждом кадре (их три). Телефон — без параллакса («Этап 1»). */
  if (MOTION) {
    const pars = list.getElementsByClassName('abenefit_par');
    const cur = new WeakMap(), drawn = new WeakMap(), want = [];
    let on = null;
    onFrame('read', () => {
      want.length = 0;
      const d = desktop();
      if (d !== on) { on = d; if (!d) for (const el of pars) { el.style.transform = ''; cur.delete(el); drawn.delete(el); } }
      if (!on) return;
      const vh = window.innerHeight;
      for (const el of pars) {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -vh * .5 || r.top > vh * 1.5) continue;             /* далеко от экрана — не трогаем */
        want.push([el, Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)))]);
      }
    });
    onFrame('write', (now, dt) => {
      let moving = false;
      want.forEach(([el, p]) => {
        let c = cur.get(el);
        c = c === undefined ? p : c + (p - c) * (1 - Math.exp(-dt * 6));
        if (Math.abs(p - c) < 1e-4) c = p; else moving = true;
        cur.set(el, c);
        const tr = `translate3d(0,${((c * 2 - 1) * 14).toFixed(2)}%,0)`;   /* ±14 % от 140 % — край кадра не выходит в рамку */
        if (drawn.get(el) !== tr) { el.style.transform = tr; drawn.set(el, tr); }
      });
      if (moving) wake();
    });
  }

  /* первый показ: неверные параметры — поправить адрес; фильтры или «Показать ещё» из истории — перестроить;
     иначе оставляем карточки из HTML */
  const bad = ['type', 'ent', 'sort'].some((k) => q.has(k) && !VALID[k].has(q.get(k)));
  if (state.type || state.ent || state.sort !== 'rel' || shown > PAGE || bad) { sync(); render(true, restoreY); }
  else {
    first = false;
    if (veiled()) enter([...list.children]);
    moreBtn.parentElement.classList.toggle('is-hidden', rows.length <= PAGE);
    sync();
    restoreY();
  }
}
