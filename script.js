(() => {
  'use strict';

  /* ---------- header scroll state ---------- */
  const header = document.getElementById('siteHeader');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- mobile nav ---------- */
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  const closeNav = () => {
    mainNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
  };
  navToggle.addEventListener('click', () => {
    const open = mainNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('nav-open', open);
  });
  mainNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));

  /* ---------- scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ---------- floor plan data ---------- */
  const PLAN_DATA = [
    { type: 'studio', name: 'Студия', area: 'от 27,2 м²', tags: ['Студия'] },
    { type: '1', name: '1-комнатная', area: '36,8–45,3 м²', tags: ['1-комн'] },
    { type: '2', name: '2-комнатная, классика', area: '41,5–46,0 м²', tags: ['2-комн'] },
    { type: '2', name: '2-комнатная, евро', area: '60,0–74,0 м²', tags: ['2-комн', 'Евро'] },
    { type: '2', name: '2-комнатная, с террасой', area: '67,7–74,0 м²', tags: ['2-комн', 'Терраса'] },
    { type: '3', name: '3-комнатная, евро', area: '74,7–85,3 м²', tags: ['3-комн', 'Евро'] },
    { type: '4', name: '4-комнатная, евро', area: '89,1 м²', tags: ['4-комн', 'Евро', 'Флагман'] },
  ];

  const PLAN_ICON = {
    studio: '<rect x="10" y="10" width="80" height="80" rx="2"/>',
    1: '<rect x="10" y="10" width="80" height="80" rx="2"/><line x1="55" y1="10" x2="55" y2="55"/>',
    2: '<rect x="10" y="10" width="80" height="80" rx="2"/><line x1="45" y1="10" x2="45" y2="90"/><line x1="45" y1="50" x2="90" y2="50"/>',
    3: '<rect x="10" y="10" width="80" height="80" rx="2"/><line x1="40" y1="10" x2="40" y2="90"/><line x1="40" y1="45" x2="90" y2="45"/><line x1="65" y1="45" x2="65" y2="90"/>',
    4: '<rect x="10" y="10" width="80" height="80" rx="2"/><line x1="38" y1="10" x2="38" y2="90"/><line x1="38" y1="40" x2="90" y2="40"/><line x1="38" y1="68" x2="90" y2="68"/><line x1="65" y1="10" x2="65" y2="40"/>',
  };

  const planGrid = document.getElementById('planGrid');
  const svgIcon = (type) => `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.4">${PLAN_ICON[type] || PLAN_ICON.studio}</svg>`;

  function renderPlans() {
    planGrid.innerHTML = PLAN_DATA.map((p) => `
      <article class="plan-card" data-type="${p.type}">
        <div class="plan-icon">${svgIcon(p.type)}</div>
        <h4>${p.name}</h4>
        <div class="area">${p.area}</div>
        <div class="tags">${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
        <a class="cta" href="#lead" data-type="${p.type}">Уточнить планировку</a>
      </article>
    `).join('');
  }
  renderPlans();

  /* ---------- plan filter ---------- */
  const filterTabs = document.getElementById('filterTabs');
  filterTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-tab');
    if (!btn) return;
    filterTabs.querySelectorAll('.filter-tab').forEach(b => b.setAttribute('aria-pressed', 'false'));
    btn.setAttribute('aria-pressed', 'true');
    const filter = btn.dataset.filter;
    planGrid.querySelectorAll('.plan-card').forEach(card => {
      const show = filter === 'all' || card.dataset.type === filter;
      card.style.display = show ? '' : 'none';
    });
  });

  /* prefill "Интересующий формат" when a plan card CTA is clicked */
  const typeSelect = document.getElementById('f-type');
  planGrid.addEventListener('click', (e) => {
    const cta = e.target.closest('.cta');
    if (!cta) return;
    const t = cta.dataset.type;
    if (typeSelect && t) typeSelect.value = t;
  });

  /* ---------- lead form ---------- */
  const form = document.getElementById('leadForm');
  const statusEl = document.getElementById('formStatus');
  const submitBtn = document.getElementById('leadSubmit');

  function setFieldError(field, hasError) {
    field.closest('.field').classList.toggle('invalid', hasError);
  }

  function validate() {
    let ok = true;
    const name = form.elements['name'];
    const phone = form.elements['phone'];
    const consent = form.elements['consent'];

    const nameOk = name.value.trim().length >= 2;
    setFieldError(name, !nameOk);
    ok = ok && nameOk;

    const digits = phone.value.replace(/\D/g, '');
    const phoneOk = digits.length >= 9;
    setFieldError(phone, !phoneOk);
    ok = ok && phoneOk;

    if (!consent.checked) ok = false;

    return ok;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = '';
    statusEl.className = 'form-status';

    // honeypot
    if (form.elements['company'].value.trim() !== '') {
      statusEl.textContent = 'Спасибо! Мы свяжемся с вами в ближайшее время.';
      statusEl.classList.add('ok');
      form.reset();
      return;
    }

    if (!validate()) {
      statusEl.textContent = 'Проверьте поля, отмеченные красным.';
      statusEl.classList.add('err');
      return;
    }

    const payload = {
      name: form.elements['name'].value.trim(),
      phone: form.elements['phone'].value.trim(),
      type: form.elements['type'].value,
      page: 'PARI Residence — лендинг',
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправляем…';

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('bad response');
      statusEl.textContent = 'Спасибо! Мы свяжемся с вами в ближайшее время.';
      statusEl.classList.add('ok');
      form.reset();
    } catch (err) {
      statusEl.textContent = 'Не удалось отправить заявку. Попробуйте ещё раз чуть позже.';
      statusEl.classList.add('err');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Отправить заявку';
    }
  });
})();
