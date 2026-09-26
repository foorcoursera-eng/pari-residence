/* ==========================================================================
   PARI Residence — страница планировки (ERA: /apartments/011).
   Конкретная квартира — ?flat=4-45: номер, этаж, подъезд, выбор в списке и
   план этажа с подсветкой. На плане пунктиром отмечены другие квартиры этой же
   планировки на этаже — по ним можно перейти одним кликом (и с клавиатуры: Tab, Enter).
   Контуры квартир — data/floors/p{подъезд}.json (из архива поэтажных планов).
   ========================================================================== */
import { initSelect } from './select.js';
import { initTabs } from './tabs.js';

const root = document.querySelector('[data-flat]');
const dataEl = document.getElementById('flat-data');
if (root && dataEl) {
  const { flats, floors, sizes = {}, s: S } = JSON.parse(dataEl.textContent);
  const byId = new Map(flats.map((f) => [f.id, f]));
  const fill = (str, v) => String(str).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));
  const noEl = root.querySelector('[data-flat-no]');
  const floorEl = root.querySelector('[data-flat-floor]');
  const entEl = root.querySelector('[data-flat-ent]');
  const img = root.querySelector('[data-floor-img]');
  const svg = root.querySelector('[data-floor-svg]');
  const none = root.querySelector('[data-floor-none]');
  const title = root.querySelector('[data-floor-title]');
  const wrap = img.parentElement;

  const cache = {};
  const plan = (ent) => (cache[ent] = cache[ent] || fetch(`/data/floors/p${ent}.json`).then((r) => (r.ok ? r.json() : { floors: {} })).catch(() => ({ floors: {} })));
  const hasFloor = (e, f) => floors[e] && f >= floors[e][0] && f <= floors[e][1];

  let cur = byId.get(new URLSearchParams(location.search).get('flat')) || flats[0];

  const pick = initSelect(root.querySelector('[data-select="flat"]'), (id) => { const f = byId.get(id); if (f) show(f, true); });
  const label = (f) => `${fill(S.entFmt, { n: f.e })} · ${fill(S.floorFmt, { n: f.f })} · ${fill(S.noFmt, { n: f.n })}`;

  const drawFloor = (f) => {
    title.textContent = `${S.floorTitle} · ${fill(S.entFmt, { n: f.e })} · ${fill(S.floorFmt, { n: f.f })}`;
    if (!hasFloor(f.e, f.f)) { wrap.hidden = true; none.hidden = false; return; }
    wrap.hidden = false; none.hidden = true;
    /* пропорции плана — до загрузки картинки: место занято, текст ниже не прыгает */
    const sz = sizes[`${f.e}-${f.f}`];
    if (sz) wrap.style.aspectRatio = `${sz[0]} / ${sz[1]}`;
    const src = `/img/floors/p${f.e}-f${f.f}.webp`;
    if (img.getAttribute('src') !== src) { img.src = src; img.alt = fill(S.floorAlt, { floor: f.f, ent: f.e }); }
    plan(f.e).then((p) => {
      const fl = p.floors[String(f.f)];
      if (!fl || cur !== f) { if (cur === f) svg.innerHTML = ''; return; }
      svg.setAttribute('viewBox', fl.box);
      /* квартиры этой планировки на этом этаже */
      const same = new Map(flats.filter((x) => x.e === f.e && x.f === f.f).map((x) => [x.n, x]));
      const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      svg.innerHTML = fl.flats.map((q) => {
        const s = same.get(q.num);
        const cls = q.num === f.n ? 'is-cur' : s ? 'is-same' : '';
        const go = s && q.num !== f.n ? ` data-go="${s.id}" tabindex="0" role="button" aria-label="${esc(fill(S.flatGo, { flat: label(s) }))}"` : '';
        return `<path d="${q.d}" class="${cls}"${go} />`;
      }).join('');
      /* на плане есть переходы — svg больше не декоративный */
      if (svg.querySelector('[data-go]')) svg.removeAttribute('aria-hidden'); else svg.setAttribute('aria-hidden', 'true');
    });
  };

  const goFrom = (e) => { const p = e.target.closest('[data-go]'); if (!p) return; const f = byId.get(p.dataset.go); if (f) show(f, true); };
  svg.addEventListener('click', goFrom);
  svg.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { if (e.target.closest('[data-go]')) { e.preventDefault(); goFrom(e); } } });

  function show(f, user) {
    cur = f;
    /* для заявки — чистые значения, не текст из разметки (заголовки на странице режутся на буквы) */
    Object.assign(root.dataset, { leadNo: fill(S.noFmt, { n: f.n }), leadFloor: String(f.f), leadEnt: String(f.e) });
    noEl.textContent = fill(S.noFmt, { n: f.n });
    floorEl.textContent = f.f;
    entEl.textContent = f.e;
    pick.set(f.id);
    drawFloor(f);
    if (user) {
      const u = new URL(location.href); u.searchParams.set('flat', f.id);
      history.replaceState(history.state, '', u.pathname + u.search);
    }
  }
  show(cur, false);

  /* вкладки «Инфо / Преимущества» */
  const tabs = [...root.querySelectorAll('[data-flat-tab]')];
  const panels = tabs.map((tb) => root.querySelector(`[data-flat-panel="${tb.dataset.flatTab}"]`));
  initTabs(tabs, panels, (i) => {
    tabs.forEach((x, k) => x.classList.toggle('is-active', k === i));
    panels.forEach((p, k) => p && p.classList.toggle('is-active', k === i));
  });
}
