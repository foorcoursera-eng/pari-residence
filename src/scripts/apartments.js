/* ==========================================================================
   PARI Residence — каталог «Выбрать квартиру» (ERA: /apartments).
   Фильтры «Комнат» и «Подъезд», сортировка по площади, «Сбросить»; состояние
   в адресе (?type=2&ent=4&sort=asc), как у ERA (?type=penthouse-duplex).
   Карточки по 24 + «Показать ещё»; при смене фильтра сетка гаснет (.4 с),
   перестраивается и карточки въезжают снизу с шагом .05 с (ERA ctn: y 3.33rem → 0).
   Счётчик в заголовке пересчитывается плавно.
   ========================================================================== */
import { animate } from 'motion';
import { initSelect } from './select.js';

const root = document.querySelector('[data-apts]');
const dataEl = document.getElementById('apts-data');
if (root && dataEl) {
  const { rows, s: S, page: PAGE } = JSON.parse(dataEl.textContent);
  const list = root.querySelector('[data-apts-list]');
  const countEl = root.querySelector('[data-apts-count]');
  const moreBtn = root.querySelector('[data-apts-more]');
  const emptyEl = root.querySelector('[data-apts-empty]');
  const resetBtn = root.querySelector('[data-apts-reset]');
  const selects = [...root.querySelectorAll('[data-select]')];
  const MOTION = document.documentElement.classList.contains('has-motion');

  const fill = (str, v) => String(str).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));
  const area = (a) => { const x = (Math.round(a * 100) / 100).toFixed(2); return S.lang === 'en' ? x : x.replace('.', ','); };
  const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- состояние ---------- */
  const DEF = { type: '', ent: '', sort: 'rel' };
  const q = new URLSearchParams(location.search);
  const state = { type: q.get('type') || '', ent: q.get('ent') || '', sort: q.get('sort') || 'rel' };
  let shown = PAGE;

  const result = () => {
    let r = rows.filter((x) => (!state.type || x.t === state.type) && (!state.ent || String(x.e) === state.ent));
    if (state.sort === 'asc') r = [...r].sort((a, b) => a.a - b.a || a.e - b.e || a.f - b.f);
    else if (state.sort === 'desc') r = [...r].sort((a, b) => b.a - a.a || a.e - b.e || a.f - b.f);
    return r;
  };

  /* ---------- разметка карточки (та же, что в ApartmentsView.astro) ---------- */
  const cardHTML = (r) => {
    let img;
    if (r.p) img = `<img src="/img/plans/${r.p}-800.webp" alt="" loading="lazy" decoding="async" />`;
    else if (r.poly) img = `<div class="acard_floor"><img src="/img/floors/p${r.e}-f${r.f}.webp" alt="" loading="lazy" decoding="async" /><svg viewBox="${r.poly.box}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path d="${r.poly.d}" /></svg></div>`;
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
  const benefitHTML = (b) => `<div class="abenefit theme_on-color"><div class="abenefit_bg"><img src="/img/scenes/${b.img}.webp" alt="" loading="lazy" decoding="async" /><div class="abenefit_grad"></div></div><div class="abenefit_info"><h3 class="h5">${esc(b.title)}</h3><div class="u-12"></div><p class="p1">${esc(b.text)}</p></div></div>`;
  /* вставки — в слоты 5, 12 и 20 сетки (ряд 2 справа, ряд 5 слева, ряд 7 справа) */
  const BEFORE = { 5: 0, 11: 1, 18: 2 };

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
    if (!countEl) return;
    if (!MOTION) { countEl.textContent = String(n); shownCount = n; return; }
    const from = shownCount; shownCount = n;
    animate(0, 1, { duration: .6, ease: [.25, 1, .5, 1], onUpdate: (p) => { countEl.textContent = String(Math.round(from + (n - from) * p)); } });
  };

  /* ---------- отрисовка ---------- */
  let first = true;
  const render = (keepShown) => {
    const r = result();
    if (!keepShown) shown = PAGE;
    const apply = () => {
      list.innerHTML = html(r.slice(0, shown), 0);
      enter([...list.children]);
      list.classList.remove('is-swapping');
      emptyEl.hidden = r.length > 0;
      moreBtn.parentElement.classList.toggle('is-hidden', r.length <= shown);
    };
    setCount(r.length);
    if (first || !MOTION) { first = false; apply(); return; }
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
  };

  /* ---------- адрес ---------- */
  const sync = () => {
    const p = new URLSearchParams();
    if (state.type) p.set('type', state.type);
    if (state.ent) p.set('ent', state.ent);
    if (state.sort !== 'rel') p.set('sort', state.sort);
    const qs = p.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
    resetBtn.classList.toggle('is-disabled', !state.type && !state.ent && state.sort === 'rel');
  };

  /* ---------- выпадающие списки (ERA filter_select) — scripts/select.js ---------- */
  const apis = selects.map((box) => {
    const name = box.dataset.select;
    const api = initSelect(box, (v) => { state[name] = v; sync(); render(); });
    api.set(state[name]);
    return { name, api };
  });

  resetBtn.addEventListener('click', () => {
    Object.assign(state, DEF);
    apis.forEach(({ name, api }) => api.set(state[name]));
    sync(); render();
  });
  moreBtn.addEventListener('click', more);

  /* первый показ: если в адресе были фильтры — перестраиваем, иначе оставляем карточки из HTML */
  if (state.type || state.ent || state.sort !== 'rel') { sync(); render(); }
  else { first = false; enter([...list.children]); moreBtn.parentElement.classList.toggle('is-hidden', rows.length <= PAGE); sync(); }
}
