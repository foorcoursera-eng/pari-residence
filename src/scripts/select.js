/* ==========================================================================
   PARI Residence — выпадающий список (ERA filter_select): открытие по клику,
   закрытие по клику вне списка, Esc и уходу фокуса, стрелки ↑↓ и Home / End по пунктам.
   Пункты вне порядка Tab: Tab из открытого списка идёт дальше по странице.
   Фокус возвращается на кнопку только при работе с клавиатуры — после клика мышью рамки фокуса нет.
   ========================================================================== */
const all = new Set();
let keyboard = false;
document.addEventListener('keydown', () => { keyboard = true; }, true);
document.addEventListener('pointerdown', () => { keyboard = false; }, true);
document.addEventListener('click', (e) => {
  const open = [...all].filter((s) => s.isOpen());
  if (!open.length) return;
  if (!open.some((s) => s.box.contains(e.target))) { e.preventDefault(); e.stopPropagation(); }   /* первый тап мимо — только закрыть */
  open.forEach((s) => { if (!s.box.contains(e.target)) s.close(); });
}, true);

export function initSelect(box, onChange) {
  const btn = box.querySelector('[data-select-btn]');
  const items = () => [...box.querySelectorAll('[data-select-item]')];
  items().forEach((x) => { x.tabIndex = -1; });
  const api = {
    box,
    isOpen: () => box.classList.contains('is-open'),
    set(v) {
      const list = items();
      const it = list.find((x) => x.dataset.selectItem === v) || list[0];
      list.forEach((x) => { const on = x === it; x.classList.toggle('is-active', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); });
      box.querySelectorAll('[data-select-value]').forEach((el) => { el.textContent = it.textContent; });
    },
    close() { box.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); },
    open() {
      all.forEach((s) => s !== api && s.close());
      box.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true');
      const cur = box.querySelector('.is-active');
      if (cur) cur.scrollIntoView({ block: 'nearest' });
      if (keyboard && cur) cur.focus({ preventScroll: true });
    },
  };
  all.add(api);
  btn.addEventListener('click', (e) => { e.stopPropagation(); box.classList.contains('is-open') ? api.close() : api.open(); });
  box.addEventListener('click', (e) => {
    const it = e.target.closest('[data-select-item]');
    if (!it) return;
    e.stopPropagation();
    api.set(it.dataset.selectItem);
    api.close();
    if (keyboard) btn.focus({ preventScroll: true });
    onChange(it.dataset.selectItem);
  });
  box.addEventListener('keydown', (e) => {
    const list = items();
    const i = list.indexOf(document.activeElement);
    const open = box.classList.contains('is-open');
    if (e.key === 'Escape' && open) { e.stopPropagation(); api.close(); btn.focus(); }
    else if (e.key === 'ArrowDown' && !open && document.activeElement === btn) { e.preventDefault(); api.open(); }
    else if (e.key === 'ArrowDown' && open) { e.preventDefault(); list[Math.min(list.length - 1, i + 1)].focus(); }
    else if (e.key === 'ArrowUp' && open) { e.preventDefault(); list[Math.max(0, i - 1)].focus(); }
    else if ((e.key === 'Home' || e.key === 'End') && open) { e.preventDefault(); list[e.key === 'Home' ? 0 : list.length - 1].focus(); }
  });
  box.addEventListener('focusout', (e) => { if (api.isOpen() && !box.contains(e.relatedTarget)) api.close(); });
  return api;
}
