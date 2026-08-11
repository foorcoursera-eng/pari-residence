(() => {
  'use strict';

  /* ---------- header scroll state ---------- */
  const header = document.getElementById('siteHeader');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- hero wordmark: gold -> ink as it scrolls out of the "sky" ---------- */
  const heroEl = document.getElementById('top');
  const heroWordmark = document.querySelector('.hero-corner-logo');
  if (heroEl && heroWordmark) {
    let ticking = false;
    const updateHeroLogo = () => {
      ticking = false;
      const rect = heroEl.getBoundingClientRect();
      const progress = 1 - Math.min(Math.max(rect.bottom / rect.height, 0), 1);
      heroWordmark.style.setProperty('--hero-logo-progress', progress.toFixed(3));
    };
    updateHeroLogo();
    window.addEventListener('scroll', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateHeroLogo);
      }
    }, { passive: true });
    window.addEventListener('resize', updateHeroLogo);
  }

  /* ---------- mobile nav ---------- */
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  const closeNav = () => {
    mainNav.classList.remove('open');
    mainNav.style.transform = '';
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
  };
  navToggle.addEventListener('click', () => {
    const open = mainNav.classList.toggle('open');
    mainNav.style.transform = open ? 'translateX(0)' : '';
    navToggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('nav-open', open);
  });
  mainNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));

  /* ---------- scroll reveal (fail-safe: never leaves content stuck invisible) ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const revealNow = (el) => el.classList.add('in');

  // Safety net: whatever IntersectionObserver misses (fast programmatic scroll,
  // anchor jumps, odd browser timing) still becomes visible shortly after load.
  window.setTimeout(() => revealEls.forEach(revealNow), 1200);
  // Second net on scroll/resize, in case the timeout fires before layout settles.
  const revealVisible = () => {
    revealEls.forEach((el) => {
      if (el.classList.contains('in')) return;
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) revealNow(el);
    });
  };
  window.addEventListener('scroll', revealVisible, { passive: true });
  window.addEventListener('load', revealVisible);

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          revealNow(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ---------- floor plan cards (real photos + real chertyozhi) ---------- */
  const ICONS = {
    floor: '<path d="M4 10l8-6 8 6M6 10v9h12v-9" stroke-linejoin="round"/>',
    height: '<path d="M12 3v18M8 6l4-3 4 3M8 18l4 3 4-3"/>',
    bath: '<path d="M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2Z"/><path d="M6 12V7a2 2 0 0 1 3.6-1.2"/>',
    balcony: '<path d="M4 21V9l8-5 8 5v12"/><path d="M4 21h16M8 21v-6h8v6"/>',
  };
  const icon = (name) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">${ICONS[name]}</svg>`;

  const PLAN_DATA = [
    {
      type: '1', name: '1-комнатная квартира (евро)', area: '27,21', photo: 'card-1k.jpg', plan: 'plan-1k.png',
      specs: [['floor', 'Блок 1: этажи 3–11'], ['height', 'Высота потолков: 3 м'], ['bath', 'Санузел: 1'], ['balcony', 'Балкон']],
    },
    {
      type: '2', name: '2-комнатная квартира', area: '42,5', photo: 'card-2k.jpg', plan: 'plan-2k.png',
      specs: [['floor', 'Блок 1/1: этажи 3–12'], ['height', 'Высота потолков: 3 м'], ['bath', 'Санузел: 1'], ['balcony', '2 балкона']],
    },
    {
      type: '2', name: '2-комнатная квартира с террасой', area: '64,23', photo: 'card-2k-terrace.jpg', plan: 'plan-2k-terrace.png',
      specs: [['floor', 'Блок 1/1.1: верхние этажи'], ['height', 'Высота потолков: 3 м'], ['bath', 'Санузел: 1'], ['balcony', 'Терраса 10,8 м²']],
    },
    {
      type: '3', name: '3-комнатная квартира (евро)', area: '74,71', photo: 'card-3k.jpg', plan: 'plan-3k.png',
      specs: [['floor', 'Блок 1: этажи 3–11'], ['height', 'Высота потолков: 3 м'], ['bath', 'Санузел: 2'], ['balcony', '2 балкона']],
    },
  ];

  const planGrid = document.getElementById('planGrid');
  if (planGrid) {
    planGrid.innerHTML = PLAN_DATA.map((p) => `
      <article class="plan-card-v2" data-type="${p.type}">
        <div class="pcard-frame">
          <div class="pcard-media">
            <img class="photo" src="assets/img/${p.photo}" alt="${p.name} — визуализация PARI Residence" loading="lazy">
          </div>
          <div class="pcard-body">
            <div class="pcard-area">${p.area}<span>м²</span></div>
            <div class="pcard-type">${p.name}</div>
            <ul class="pcard-specs">
              ${p.specs.map(([k, label]) => `<li>${icon(k)}<span>${label}</span></li>`).join('')}
            </ul>
            <div class="pcard-plan"><img src="assets/img/${p.plan}" alt="Чертёж планировки: ${p.name}, ${p.area} м²" loading="lazy"></div>
            <a class="btn btn-ghost pcard-cta" href="#lead" data-type="${p.type}">Уточнить планировку</a>
          </div>
          <div class="pcard-footer">PARI · Самарканд</div>
        </div>
      </article>
    `).join('');
  }

  /* prefill "Интересующий формат" when a plan card CTA is clicked */
  const typeSelect = document.getElementById('f-type');
  if (planGrid) {
    planGrid.addEventListener('click', (e) => {
      const cta = e.target.closest('.pcard-cta');
      if (!cta) return;
      const t = cta.dataset.type;
      if (typeSelect && t) typeSelect.value = t;
    });
  }

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
