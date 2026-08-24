/* PARI Residence — интерактив: видео первого экрана, полёт бабочек,
   шапка, появление блоков и заявка. Без зависимостей. */
(function () {
  'use strict';

  var bar = document.getElementById('bar');
  var hero = document.querySelector('.hero');
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ══════════════ заставка первого захода ══════════════
     Держим не дольше 900 мс: сайт не должен ждать медленную сеть. */
  var splash = document.getElementById('splash');
  if (splash) {
    if (calm || sessionStorage.getItem('pari:seen')) {
      splash.remove();
    } else {
      document.body.classList.add('is-splash');
      var hideSplash = function () {
        if (!splash.parentNode) { return; }
        splash.classList.add('is-gone');
        document.body.classList.remove('is-splash');
        sessionStorage.setItem('pari:seen', '1');
        setTimeout(function () { splash.remove(); }, 700);
      };
      setTimeout(hideSplash, 900);
      addEventListener('load', function () { setTimeout(hideSplash, 350); });
    }
  }

  /* ══════════════ аналитика ══════════════
     Счётчики не подключены: идентификаторы выдаёт владелец (Метрика/GA).
     Скрипт кладёт события в dataLayer и вызывает ym/gtag, если они появятся, —
     подключение сводится к вставке кода счётчика, код страницы менять не нужно. */
  window.dataLayer = window.dataLayer || [];
  var track = function (event, params) {
    var data = params || {};
    window.dataLayer.push(Object.assign({ event: event }, data));
    var cfg = window.PARI_ANALYTICS || {};
    if (cfg.metrika && typeof window.ym === 'function') { window.ym(cfg.metrika, 'reachGoal', event, data); }
    if (typeof window.gtag === 'function') { window.gtag('event', event, data); }
  };
  window.pariTrack = track;

  /* ══════════════ источник визита ══════════════
     utm_* и referrer запоминаем при первом заходе и держим на время сессии,
     чтобы заявка со второй-третьей страницы всё равно знала, откуда пришёл человек. */
  var SOURCE_KEY = 'pari:source';
  var readSource = function () {
    var saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(SOURCE_KEY) || 'null'); } catch (e) { saved = null; }
    var q = new URLSearchParams(location.search);
    var fresh = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
      var v = q.get(k);
      if (v) { fresh[k] = v.slice(0, 120); }
    });
    if (Object.keys(fresh).length || !saved) {
      var data = Object.assign({
        landing_page: location.pathname,
        referrer: document.referrer ? document.referrer.slice(0, 200) : '',
        language: document.documentElement.lang,
        device: innerWidth < 700 ? 'mobile' : innerWidth < 1024 ? 'tablet' : 'desktop'
      }, saved || {}, fresh);
      try { sessionStorage.setItem(SOURCE_KEY, JSON.stringify(data)); } catch (e) {}
      return data;
    }
    return saved;
  };
  var source = readSource();
  track('page_view', { page: location.pathname });

  /* клики по телефону и кнопкам — размечены атрибутом data-track */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-track]');
    if (el) { track(el.getAttribute('data-track'), { page: location.pathname }); }
  });

  /* ══════════════ шапка вне главной ══════════════
     На внутренних страницах нет первого экрана, поэтому шапка нужна сразу. */
  if (!hero && bar) { bar.classList.add('is-solid'); }

  /* ══════════════ карта ══════════════
     Виджет Яндекса подключается сам, когда карта подходит к экрану: заранее
     сторонний скрипт не грузится, но и лишнего действия от человека не требуется.
     При включённой экономии трафика остаётся кнопка. */
  var maps = [].slice.call(document.querySelectorAll('[data-map]'));
  if (maps.length) {
    var thriftyMap = navigator.connection && navigator.connection.saveData;

    var mountMap = function (box) {
      if (box.classList.contains('is-live')) { return; }
      var frame = document.createElement('iframe');
      frame.src = box.dataset.src;
      frame.loading = 'lazy';
      frame.title = document.documentElement.lang === 'uz' ? 'Xarita' : 'Карта';
      frame.setAttribute('allowfullscreen', '');
      box.classList.add('is-live');
      box.innerHTML = '';
      box.appendChild(frame);
      track('map_click', { page: location.pathname });
    };

    maps.forEach(function (box) {
      var btn = box.querySelector('.map__btn');
      if (btn) { btn.addEventListener('click', function () { mountMap(box); }); }
    });

    if (!thriftyMap && 'IntersectionObserver' in window) {
      var mapIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) { return; }
          mapIO.unobserve(e.target);
          mountMap(e.target);
        });
      }, { rootMargin: '250px' });
      maps.forEach(function (box) { mapIO.observe(box); });
    }
  }

  /* ══════════════ анимации ══════════════
     Один общий обработчик скролла на requestAnimationFrame: все эффекты
     считаются в одном кадре, поэтому лишних пересчётов раскладки не возникает. */
  var scenes = [];                       /* функции, которым нужен скролл */
  var ticking = false;
  var onScroll = function () {
    if (ticking) { return; }
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      for (var i = 0; i < scenes.length; i++) { scenes[i](); }
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);

  /* появление: маска кадров и построчные заголовки */
  if ('IntersectionObserver' in window) {
    var inView = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) { return; }
        e.target.classList.add('is-in');
        inView.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px' });

    document.querySelectorAll('.figure-mask').forEach(function (el) { inView.observe(el); });

    /* заголовок делим по строкам, которые уже заданы в тексте через <br> */
    document.querySelectorAll('[data-lines]').forEach(function (el) {
      if (calm) { el.classList.add('is-in'); return; }
      var parts = el.innerHTML.split(/<br\s*\/?>/i);
      el.innerHTML = parts.map(function (part) {
        return '<span class="line"><span>' + part.trim() + '</span></span>';
      }).join('');
      inView.observe(el);
    });
  } else {
    document.querySelectorAll('.figure-mask,[data-lines]').forEach(function (el) { el.classList.add('is-in'); });
  }


  /* ── письмо пером ──
     Контуры букв лежат отдельным файлом и подгружаются, когда фраза подходит
     к экрану. Каждая буква сначала обводится, потом заливается. */
  var penData = null;
  var loadPen = function () {
    if (!penData) {
      penData = fetch('/assets/pen/' + (document.documentElement.lang || 'ru') + '.json')
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; });
    }
    return penData;
  };

  var writePhrase = function (el, phrase) {
    var pen = document.createElement('span');
    pen.className = 'pen';
    pen.setAttribute('aria-hidden', 'true');

    var index = 0;
    phrase.forEach(function (line) {
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'pen__line');
      svg.setAttribute('viewBox', '0 0 ' + line.width + ' ' + line.height);
      /* размер берём от кегля заголовка: ширина строки в em-квадратах */
      svg.style.width = (line.width / (line.upem || 1000)).toFixed(3) + 'em';
      var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('transform', 'translate(0,' + line.baseline + ') scale(1,-1)');
      line.letters.forEach(function (letter) {
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', letter.d);
        path.setAttribute('transform', 'translate(' + letter.x + ',0)');
        path.setAttribute('pathLength', '1');
        path.style.setProperty('--i', index++);
        g.appendChild(path);
      });
      svg.appendChild(g);
      pen.appendChild(svg);
    });

    var text = document.createElement('span');
    text.className = 'pen__text';
    text.innerHTML = el.innerHTML;
    el.innerHTML = '';
    el.appendChild(pen);
    el.appendChild(text);
    requestAnimationFrame(function () { pen.classList.add('is-writing'); });
  };

  var penTargets = [].slice.call(document.querySelectorAll('[data-write]'));
  if (penTargets.length && !calm && 'IntersectionObserver' in window && window.fetch) {
    var penIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) { return; }
        var el = e.target;
        penIO.unobserve(el);
        var key = el.dataset.write;
        if (!key) { return; }
        loadPen().then(function (data) {
          if (data && data[key] && data[key].length) { writePhrase(el, data[key]); }
        });
      });
    }, { rootMargin: '150px 0px 0px 0px' });
    penTargets.forEach(function (el) { penIO.observe(el); });
  }

  /* ── кинолента: кадры меняются сами, скролл страницы не перехватывается ── */
  var cine = document.querySelector('[data-cine]');
  if (cine) {
    var track = cine.querySelector('.cine__track');
    var shots = [].slice.call(cine.querySelectorAll('.frame'));
    var dots = [].slice.call(cine.querySelectorAll('[data-cine-go]'));
    var HOLD = 5000;                       /* сколько держим кадр */
    var index = 0;
    var timer = null;
    var visible = true;

    cine.classList.add('is-live');
    cine.style.setProperty('--cine-hold', HOLD + 'ms');

    var show = function (next, manual) {
      index = (next + shots.length) % shots.length;
      track.style.transform = 'translate3d(' + (-index * 100) + '%,0,0)';
      shots.forEach(function (f, i) { f.classList.toggle('is-current', i === index); });
      dots.forEach(function (d, i) {
        d.classList.remove('is-on', 'is-done');
        if (i < index) { d.classList.add('is-done'); }
        d.setAttribute('aria-selected', i === index ? 'true' : 'false');
      });
      if (dots[index] && !calm) {
        void dots[index].offsetWidth;      /* перезапускаем заливку полоски */
        dots[index].classList.add('is-on');
      } else if (dots[index]) {
        dots[index].classList.add('is-done');
      }
      if (manual) { play(); }
    };

    var play = function () {
      clearInterval(timer);
      if (calm || !visible) { return; }
      timer = setInterval(function () { show(index + 1); }, HOLD);
    };
    var stop = function () { clearInterval(timer); };

    cine.querySelector('[data-cine-next]').addEventListener('click', function () { show(index + 1, true); });
    cine.querySelector('[data-cine-prev]').addEventListener('click', function () { show(index - 1, true); });
    dots.forEach(function (d) {
      d.addEventListener('click', function () { show(+d.dataset.cineGo, true); });
    });

    /* свайп на телефоне */
    var x0 = null;
    cine.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    cine.addEventListener('touchend', function (e) {
      if (x0 === null) { return; }
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) { show(index + (dx < 0 ? 1 : -1), true); }
      x0 = null;
    }, { passive: true });

    /* работает только пока лента на экране и вкладка активна */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        visible = e[0].isIntersecting;
        if (visible) { play(); } else { stop(); }
      }, { threshold: 0.25 }).observe(cine);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { stop(); } else { play(); }
    });

    show(0);
    play();
  }

  /* ── блик по барельефу ── */
  var reliefs = [].slice.call(document.querySelectorAll('[data-relief]'));
  if (reliefs.length && !calm) {
    reliefs.forEach(function (img) {
      var wrap = document.createElement('span');
      wrap.className = 'sheen';
      img.parentNode.insertBefore(wrap, img);
      wrap.appendChild(img);
      scenes.push(function () {
        var r = wrap.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) { return; }
        var p = 1 - (r.top + r.height) / (innerHeight + r.height);
        wrap.style.setProperty('--sheen', p.toFixed(3));
      });
    });
    onScroll();
  }


  /* ══════════════ просмотр планов и мастер-плана ══════════════
     Колесо и щипок — масштаб, перетаскивание — сдвиг. Esc и клик по фону закрывают. */
  var viewer = document.getElementById('viewer');
  if (viewer) {
    var vStage = viewer.querySelector('[data-viewer-stage]');
    var vImg = viewer.querySelector('[data-viewer-img]');
    var vLabel = viewer.querySelector('[data-viewer-label]');
    var scale = 1, tx = 0, ty = 0, back = null;

    var apply = function () {
      vImg.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + scale.toFixed(3) + ')';
    };
    var reset = function () { scale = 1; tx = 0; ty = 0; apply(); };

    var openViewer = function (src, label, source) {
      back = source || null;
      vImg.src = src;
      vImg.alt = label || '';
      vLabel.textContent = label || '';
      viewer.hidden = false;
      document.body.classList.add('is-locked');
      requestAnimationFrame(function () { viewer.classList.add('is-open'); });
      reset();
      viewer.querySelector('[data-viewer-close]').focus({ preventScroll: true });
      track('plan_zoom', { image: src });
    };
    var closeViewer = function () {
      viewer.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      setTimeout(function () { viewer.hidden = true; vImg.removeAttribute('src'); }, 300);
      if (back) { back.focus({ preventScroll: true }); }
    };

    document.querySelectorAll('[data-zoom]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openViewer(btn.dataset.zoom, btn.dataset.zoomLabel, btn);
      });
    });
    viewer.querySelector('[data-viewer-close]').addEventListener('click', closeViewer);
    viewer.addEventListener('click', function (e) { if (e.target === viewer) { closeViewer(); } });
    addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !viewer.hidden) { closeViewer(); }
    });

    /* масштаб колесом — вокруг курсора */
    vStage.addEventListener('wheel', function (e) {
      if (viewer.hidden) { return; }
      e.preventDefault();
      var prev = scale;
      scale = Math.min(6, Math.max(1, scale * (e.deltaY < 0 ? 1.18 : 1 / 1.18)));
      var r = vStage.getBoundingClientRect();
      var cx = e.clientX - r.left - r.width / 2;
      var cy = e.clientY - r.top - r.height / 2;
      tx = (tx - cx) * (scale / prev) + cx;
      ty = (ty - cy) * (scale / prev) + cy;
      if (scale === 1) { tx = 0; ty = 0; }
      apply();
    }, { passive: false });

    /* двойной клик — приблизить или вернуть */
    vStage.addEventListener('dblclick', function () {
      scale = scale > 1.2 ? 1 : 2.6;
      if (scale === 1) { tx = 0; ty = 0; }
      apply();
    });

    /* перетаскивание мышью и пальцем, щипок двумя пальцами */
    var drag = null, pinch = null;
    var point = function (e) { return { x: e.clientX, y: e.clientY }; };
    vStage.addEventListener('pointerdown', function (e) {
      if (viewer.hidden) { return; }
      vStage.setPointerCapture(e.pointerId);
      drag = { id: e.pointerId, start: point(e), tx: tx, ty: ty };
      vStage.classList.add('is-dragging');
    });
    vStage.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id || scale === 1) { return; }
      tx = drag.tx + (e.clientX - drag.start.x);
      ty = drag.ty + (e.clientY - drag.start.y);
      apply();
    });
    var endDrag = function () { drag = null; vStage.classList.remove('is-dragging'); };
    vStage.addEventListener('pointerup', endDrag);
    vStage.addEventListener('pointercancel', endDrag);

    vStage.addEventListener('touchmove', function (e) {
      if (e.touches.length !== 2) { return; }
      e.preventDefault();
      var d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                         e.touches[0].clientY - e.touches[1].clientY);
      if (!pinch) { pinch = { d: d, scale: scale }; return; }
      scale = Math.min(6, Math.max(1, pinch.scale * (d / pinch.d)));
      if (scale === 1) { tx = 0; ty = 0; }
      apply();
    }, { passive: false });
    vStage.addEventListener('touchend', function (e) { if (e.touches.length < 2) { pinch = null; } });
  }

  /* ══════════════ заявка ══════════════
     Форм на сайте несколько (главная, квартиры, локация, контакты) — обработчик один. */
  var uzPage = document.documentElement.lang === 'uz';
  var say = {
    ok: uzPage ? 'Rahmat! Savdo boʻlimi menejeri siz bilan bogʻlanib, tashrif vaqtini kelishadi.'
               : 'Спасибо! Менеджер отдела продаж свяжется с вами и согласует время визита.',
    bad: uzPage ? 'Belgilangan maydonlarni tekshiring.' : 'Проверьте поля, отмеченные рамкой.',
    fail: uzPage ? 'Yuborilmadi. Qayta urinib koʻring yoki qoʻngʻiroq qiling: 55 705 05 05.'
                 : 'Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам: 55 705 05 05.',
    sending: uzPage ? 'Yuborilmoqda…' : 'Отправляем…'
  };

  document.querySelectorAll('[data-lead]').forEach(function (form) {
    var statusEl = form.querySelector('[data-status]');
    var btn = form.querySelector('[data-submit]');
    var btnText = btn.textContent;
    var opened = false;
    var mark = function (el, bad) { el.closest('.field').classList.toggle('invalid', bad); };

    form.addEventListener('focusin', function () {
      if (!opened) { opened = true; track('lead_form_open', { page: location.pathname }); }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      statusEl.textContent = '';
      statusEl.className = 'lead__status';

      if (form.elements.company.value.trim() !== '') {   /* ловушка для ботов */
        statusEl.textContent = say.ok;
        statusEl.classList.add('ok');
        form.reset();
        return;
      }

      var nameOk = form.elements.name.value.trim().length >= 2;
      var phoneOk = form.elements.phone.value.replace(/\D/g, '').length >= 9;
      mark(form.elements.name, !nameOk);
      mark(form.elements.phone, !phoneOk);
      if (!nameOk || !phoneOk || !form.elements.consent.checked) {
        statusEl.textContent = say.bad;
        statusEl.classList.add('err');
        track('lead_error', { reason: 'validation' });
        return;
      }

      btn.disabled = true;
      btn.textContent = say.sending;
      track('lead_form_submit', { page: location.pathname });

      fetch('/api/lead/', {   /* со слэшем: иначе Vercel делает лишний редирект */
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({
          name: form.elements.name.value.trim(),
          phone: form.elements.phone.value.trim(),
          rooms: form.elements.rooms ? form.elements.rooms.value : '',
          page: location.pathname
        }, source))
      }).then(function (res) {
        if (!res.ok) { throw new Error('bad response'); }
        statusEl.textContent = say.ok;
        statusEl.classList.add('ok');
        form.reset();
        track('lead_success', { page: location.pathname });
      }).catch(function () {
        statusEl.textContent = say.fail;
        statusEl.classList.add('err');
        track('lead_error', { reason: 'network' });
      }).then(function () {
        btn.disabled = false;
        btn.textContent = btnText;
      });
    });
  });

  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  items.forEach(function (el) { io.observe(el); });
})();
