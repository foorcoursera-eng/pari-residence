/* ==========================================================================
   PARI Residence — вкладки по шаблону WAI-ARIA Tabs: вкладка и панель связаны
   (aria-controls / aria-labelledby), в порядке Tab стоит только активная вкладка,
   между вкладками — стрелки, Home и End. Скрытые панели убраны от экранных дикторов
   (у «Удобств» они лежат друг на друге и гаснут прозрачностью — hidden их бы сломал).
   ========================================================================== */
let uid = 0;
export function initTabs(tabs, panels, onSelect, { orientation = 'horizontal', start = 0 } = {}) {
  if (!tabs.length) return () => {};
  const list = tabs[0].closest('[role="tablist"]');
  if (list) list.setAttribute('aria-orientation', orientation);
  tabs.forEach((t, i) => {
    const p = panels[i];
    if (!t.id) t.id = `tab-${++uid}`;
    if (p) {
      if (!p.id) p.id = `tabpanel-${uid}`;
      t.setAttribute('aria-controls', p.id);
      p.setAttribute('aria-labelledby', t.id);
    }
  });
  let cur = -1;
  const select = (i, focus) => {
    if (i === cur) { if (focus) tabs[i].focus(); return; }
    cur = i;
    tabs.forEach((t, k) => { const on = k === i; t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; });
    panels.forEach((p, k) => { if (p) p.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
    onSelect(i);
    if (focus) tabs[i].focus();
  };
  const next = orientation === 'vertical' ? ['ArrowDown', 'ArrowRight'] : ['ArrowRight', 'ArrowDown'];
  const prev = orientation === 'vertical' ? ['ArrowUp', 'ArrowLeft'] : ['ArrowLeft', 'ArrowUp'];
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i, false));
    t.addEventListener('keydown', (e) => {
      let j = null;
      if (next.includes(e.key)) j = (i + 1) % tabs.length;
      else if (prev.includes(e.key)) j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = tabs.length - 1;
      if (j === null) return;
      e.preventDefault();
      select(j, true);
    });
  });
  select(start, false);
  return select;
}
