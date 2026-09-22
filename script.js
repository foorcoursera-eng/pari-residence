/* PARI Residence — интерактив: видео первого экрана, шапка, появление
   блоков, подбор квартир и заявка. Без зависимостей. */
(function () {
  'use strict';

  var bar = document.getElementById('bar');
  var firstScreen = document.querySelector('.s-hero');
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ══════════════ петля первого экрана ══════════════
     Идёт без звука, лежит поверх кадра и проявляется, только когда
     действительно пошла: пока ролик грузится — виден снимок, и если сеть его
     не дала, снимок так и остаётся. Не грузим при включённой экономии
     трафика, на медленной сети и когда человек попросил убрать анимации.
     На широком экране горизонтальная петля (1920 или 1280 по ширине окна),
     на телефоне — вертикальная, если она у ролика есть. */
  var net = navigator.connection || {};
  var thrifty = net.saveData === true;
  var slow = typeof net.effectiveType === 'string' && /2g$/.test(net.effectiveType);
  var mayLoop = !calm && !thrifty && !slow;

  var playLoop = function (el, onPlaying) {
    var portrait = innerWidth <= 700;
    /* Ступени перечисляет сам ролик: у них разный набор, и брать «1920, если
       окно шире 1400» нельзя — на экране 1440 с двойной плотностью браузер
       растягивал такую дорожку в полтора раза, и это было видно. Считаем,
       сколько точек реально нужно, и берём первую ступень не мельче. */
    var widths = (el.dataset.widths || '1280,1920').split(',');
    var want = innerWidth * (devicePixelRatio > 1.5 ? 1.5 : devicePixelRatio || 1);
    var wide = widths[widths.length - 1];
    for (var i = 0; i < widths.length; i++) {
      if (parseInt(widths[i], 10) >= want) { wide = widths[i]; break; }
    }
    var pick = function (kind) {
      var vertical = el.dataset[kind + 'Portrait'];
      if (portrait && vertical) { return vertical; }
      return el.dataset[kind].replace('{w}', wide);
    };
    [['video/webm', pick('webm')], ['video/mp4', pick('mp4')]].forEach(function (pair) {
      var s = document.createElement('source');
      s.type = pair[0]; s.src = pair[1];
      el.appendChild(s);
    });
    el.addEventListener('playing', function () {
      el.classList.add('is-playing');
      if (onPlaying) { onPlaying(); }
    }, { once: true });
    el.load();
    var go = el.play();
    if (go && go.catch) { go.catch(function () {}); }
  };

  /* Первый экран. Ролик стартует только после полной загрузки страницы:
     иначе он делит канал с кадром, который человек видит первым, и первый
     экран рисуется медленнее, чем сейчас. */
  var promo = document.querySelector('.s-hero__video');
  if (promo && mayLoop) {
    var startPromo = function () { setTimeout(function () { playLoop(promo); }, 600); };
    if (document.readyState === 'complete') { startPromo(); }
    else { addEventListener('load', startPromo); }
  }


  /* Короткие петли внутри страницы (Самарканд в развороте концепции):
     грузятся, когда кадр подходит к экрану, и стоят, пока он вне экрана —
     ролику незачем крутиться под пальцем на другом конце страницы. */
  var lazyLoops = [].slice.call(document.querySelectorAll('[data-lazy-loop]'));
  if (lazyLoops.length && mayLoop && 'IntersectionObserver' in window) {
    var loopIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          if (!v.dataset.started) { v.dataset.started = '1'; playLoop(v); }
          else if (v.paused) { var p = v.play(); if (p && p.catch) { p.catch(function () {}); } }
        } else if (v.dataset.started && !v.paused) { v.pause(); }
      });
    }, { rootMargin: '320px 0px' });
    lazyLoops.forEach(function (v) { loopIO.observe(v); });
  }

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

  /* ══════════════ глубина прокрутки ══════════════
     Страница длинная и ведётся главами: без этого события нельзя понять,
     до какой главы люди вообще доходят. Каждый порог отправляется один раз,
     обработчик снимается сам, когда пройдены все. */
  (function () {
    var marks = [25, 50, 75, 100];
    var seen = 0;
    var onScroll = function () {
      var doc = document.documentElement;
      var full = doc.scrollHeight - innerHeight;
      if (full <= 0) { return; }
      var pct = ((pageYOffset / full) * 100);
      while (seen < marks.length && pct >= marks[seen]) {
        track('scroll_depth', { percent: marks[seen], page: location.pathname });
        seen += 1;
      }
      if (seen >= marks.length) { removeEventListener('scroll', onScroll); }
    };
    addEventListener('scroll', onScroll, { passive: true });
  }());

  /* ══════════════ шапка вне главной ══════════════
     На внутренних страницах нет первого экрана, поэтому шапка нужна сразу.
     Проверяем именно первый экран, а не старый класс .hero: после v3 главная
     открывается разделом .opening, условие переставало срабатывать — и на
     главной шапка стояла плотной прямо поверх титульного кадра, дублируя
     кнопку звонка, которая и так лежит в кадре. */
  if (!firstScreen && bar) { bar.classList.add('is-solid'); }

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
      frame.addEventListener('load', function () { box.classList.add('is-ready'); });
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

  /* ── мобильное меню ── */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');
  if (burger && menu) {
    var openLabel = burger.getAttribute('aria-label');
    var closeLabel = document.documentElement.lang === 'uz' ? 'Menyuni yopish' : 'Закрыть меню';
    var lastFocus = null;

    var barWasSolid = false;

    var setMenu = function (open) {
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? closeLabel : openLabel);
      document.body.classList.toggle('is-locked', open);
      /* На светлом полотне меню белая шапка сливается с фоном, и закрыть его
         нечем. На время открытия переводим её в тот же вид, что и на внутренних
         страницах, а при закрытии возвращаем как было. */
  if (bar) {
        if (open) {
          barWasSolid = bar.classList.contains('is-solid');
          bar.classList.add('is-solid');
        } else if (!barWasSolid) {
          bar.classList.remove('is-solid');
        }
      }
      if (open) {
        lastFocus = document.activeElement;
        menu.hidden = false;
        void menu.offsetWidth;          /* принудительный пересчёт: класс должен
                                           лечь отдельным кадром, но не ждать rAF —
                                           в фоновой вкладке кадров может не быть */
        menu.classList.add('is-open');
        var first = menu.querySelector('a');
        if (first) { first.focus({ preventScroll: true }); }
      } else {
        menu.classList.add('is-closing');
        menu.classList.remove('is-open');
        setTimeout(function () { menu.hidden = true; menu.classList.remove('is-closing'); }, 360);
        if (lastFocus) { lastFocus.focus({ preventScroll: true }); }
      }
    };

    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) { setMenu(false); }     /* по ссылке — закрываем */
    });
    addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setMenu(false); }
    });
    addEventListener('resize', function () {
      if (innerWidth >= 980 && burger.getAttribute('aria-expanded') === 'true') { setMenu(false); }
    });
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

  /* ── шапка и липкая панель звонка ──
     Шапка плотнеет после 40 px, уходит вверх, когда человек прокрутил вниз
     больше 90 px подряд ниже первого экрана, и возвращается после 60 px
     вверх или у самого верха. Порог накопительный: крошечные движения
     колеса не дёргают её туда-сюда. Панель звонка на телефоне включается,
     когда первый экран ушёл. */
  var callbar = document.querySelector('.callbar');
  if (bar || callbar) {
    var lastY = window.scrollY || 0;
    var acc = 0;
    var past = null;
    var sticky = function () {
      var y = window.scrollY || window.pageYOffset || 0;
      var limit = firstScreen ? firstScreen.offsetHeight * 0.5 : 200;
      var now = y > limit;
      if (now !== past) {
        past = now;
        if (bar && firstScreen) { bar.classList.toggle('is-solid', now); }
        if (callbar) { document.body.classList.toggle('has-callbar', now); }
      }
      if (!bar) { return; }
      bar.classList.toggle('is-compact', y > 40);
      var dy = y - lastY;
      lastY = y;
      if ((dy > 0 && acc < 0) || (dy < 0 && acc > 0)) { acc = 0; }
      acc += dy;
      if (document.body.classList.contains('is-locked')) { return; }
      if (acc > 90 && y > innerHeight * 0.8) { bar.classList.add('is-away'); acc = 0; }
      else if (acc < -60 || y < 80) { bar.classList.remove('is-away'); if (acc < -60) { acc = 0; } }
    };
    addEventListener('scroll', sticky, { passive: true });
    addEventListener('resize', sticky);
    sticky();
  }
  /* На главной шапка въезжает последней в хореографии первого экрана
     (motion.js). Если движение выключено или скрипт не отработал —
     показываем её сразу, а на всякий случай — не позже, чем через 1,8 с. */
  if (bar && bar.hasAttribute('data-bar-intro')) {
    setTimeout(function () { bar.classList.add('is-in'); }, 1800);
  }

  /* появление: маска кадров и построчные заголовки.
     Если подключился GSAP, эти эффекты делает motion.js — здесь пропускаем. */
  var motion = document.documentElement.classList.contains('has-motion');
  if (!motion && 'IntersectionObserver' in window) {
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
  } else if (!motion) {
    document.querySelectorAll('.figure-mask,[data-lines]').forEach(function (el) { el.classList.add('is-in'); });
  }


  /* ══════════════ отбор планировок по комнатности ══════════════
     Планировок много, поэтому без отбора страница читается как свалка.
     Без скрипта кнопки просто не появляются: разметка отдаёт все планировки. */
  /* ══════════════ подвижный индикатор переключателей ══════════════
     Активная плашка не вспыхивает под новым чипом, а переезжает к нему:
     одна золотая плитка на группу, положение — transform от размеров
     активного чипа. Группы с перестраиваемым составом (этажи) зовут
     syncInk заново. */
  var inkOf = function (group) {
    if (!group) { return null; }
    var ink = group.querySelector(':scope > .pick-ink');
    if (!ink) {
      ink = document.createElement('span');
      ink.className = 'pick-ink';
      ink.setAttribute('aria-hidden', 'true');
      group.insertBefore(ink, group.firstChild);
      group.classList.add('has-ink');
    }
    return ink;
  };
  var syncInk = function (group, instant) {
    var ink = inkOf(group);
    if (!ink) { return; }
    var on = group.querySelector('.pick.is-on');
    if (!on) { ink.classList.add('is-off'); return; }
    if (instant) { ink.style.transition = 'none'; }
    ink.style.transform = 'translate(' + on.offsetLeft + 'px,' + on.offsetTop + 'px) scale('
      + (on.offsetWidth / 10) + ',' + (on.offsetHeight / 10) + ')';
    ink.classList.remove('is-off');
    if (instant) { void ink.offsetWidth; ink.style.transition = ''; }
  };
  var inkGroups = [].slice.call(document.querySelectorAll('.picker__rooms, .fl__set, .chooser__set'));
  var syncAllInk = function (instant) { inkGroups.forEach(function (g) { syncInk(g, instant); }); };
  if (!calm && inkGroups.length) {
    syncAllInk(true);
    addEventListener('resize', function () { syncAllInk(true); });
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { syncAllInk(true); }); }
    /* группы переключаются в своих обработчиках; здесь — общий пересчёт после клика */
    document.addEventListener('click', function (e) {
      var g = e.target.closest('.picker__rooms, .fl__set, .chooser__set');
      if (g) { requestAnimationFrame(function () { syncInk(g); }); }
    });
  }

  /* ══════════════ подбор квартиры ══════════════
     Отбор по комнатности и площади. Без скрипта видны все планировки —
     он только сужает выдачу и считает, сколько осталось. */
  var picker = document.querySelector('[data-picker]');
  var planGrid = document.querySelector('[data-picker-grid]');
  if (picker && planGrid) {
    var buttons = [].slice.call(picker.querySelectorAll('[data-filter]'));
    var range = picker.querySelector('[data-picker-area]');
    var areaLabel = picker.querySelector('[data-picker-area-label]');
    var countEl = picker.querySelector('[data-picker-count]');
    var emptyEl = document.querySelector('[data-picker-empty]');
    var cards = [].slice.call(planGrid.children);
    var areaTpl = picker.getAttribute('data-area-tpl') || '{n}';
    var rooms = '';

    /* Смена выдачи: уходящие карточки гаснут за 180 мс, оставшиеся и новые
       приходят короткой волной. Пока ползунок тянут, перестраиваем без
       волны — иначе карточки мигают на каждом шаге. */
    var swapTimer = null;
    var applyPicker = function (animate) {
      var max = range ? parseFloat(range.value) : Infinity;
      var shown = 0;
      var fresh = [];
      cards.forEach(function (card) {
        var fits = (!rooms || card.dataset.rooms === rooms)
          && (parseFloat(card.dataset.area) <= max + 0.001);
        if (fits) { shown += 1; }
        if (!animate || calm) { card.hidden = !fits; card.classList.remove('is-out', 'is-in-fresh'); return; }
        if (!fits && !card.hidden) { card.classList.add('is-out'); }
        if (fits) { fresh.push(card); }
      });
      if (animate && !calm) {
        clearTimeout(swapTimer);
        swapTimer = setTimeout(function () {
          cards.forEach(function (card) {
            var keep = fresh.indexOf(card) !== -1;
            card.classList.remove('is-out', 'is-in-fresh');
            card.hidden = !keep;
          });
          fresh.forEach(function (card, i) {
            card.style.setProperty('--i', i);
            void card.offsetWidth;
            card.classList.add('is-in-fresh');
          });
        }, 180);
      }
      if (countEl) { countEl.textContent = shown; }
      if (emptyEl) { emptyEl.hidden = shown !== 0; }
      if (areaLabel && range) {
        areaLabel.textContent = areaTpl.replace('{n}', range.value);
      }
      return shown;
    };

    var setRooms = function (value, push) {
      rooms = value;
      buttons.forEach(function (b) {
        var on = b.dataset.filter === value;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var shown = applyPicker(push);
      if (push) {
        history.replaceState(null, '', value ? '#rooms-' + value : location.pathname);
        track('plans_filter', { rooms: value || 'all', found: shown });
      }
    };

    picker.addEventListener('click', function (e) {
      var b = e.target.closest('[data-filter]');
      if (b) { setRooms(b.dataset.filter, true); }
    });

    if (range) {
      var areaTimer = null;
      range.addEventListener('input', function () {
        var shown = applyPicker();
        clearTimeout(areaTimer);
        areaTimer = setTimeout(function () {
          track('plans_area', { max: range.value, found: shown });
        }, 700);
      });
    }

    /* Ссылки с плиток ведут на #rooms-2 и должны сразу открывать нужный отбор */
    var fromHash = function () {
      var m = /^#rooms-(\d)$/.exec(location.hash);
      if (m && buttons.some(function (b) { return b.dataset.filter === m[1]; })) {
        setRooms(m[1], false);
      }
    };
    fromHash();
    addEventListener('hashchange', fromHash);
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

    /* кнопки масштаба: видны всегда — на телефоне колесо недоступно, а щипок
       не все находят; шаг тот же, что у колеса, вокруг центра кадра */
    var zoomBy = function (k) {
      var prev = scale;
      scale = Math.min(6, Math.max(1, scale * k));
      tx = tx * (scale / prev); ty = ty * (scale / prev);
      if (scale === 1) { tx = 0; ty = 0; }
      apply();
    };
    var zIn = viewer.querySelector('[data-zoom-in]');
    var zOut = viewer.querySelector('[data-zoom-out]');
    var zFit = viewer.querySelector('[data-fit]');
    if (zIn) { zIn.addEventListener('click', function () { zoomBy(1.4); }); }
    if (zOut) { zOut.addEventListener('click', function () { zoomBy(1 / 1.4); }); }
    if (zFit) { zFit.addEventListener('click', reset); }

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

  /* Отдел продаж работает 9:00–20:00 по Ташкенту: заявку вне этих часов
     не обещаем обработать сразу, чтобы человек не ждал звонка ночью. */
  var salesOpen = function () {
    var uz = new Date(Date.now() + (5 * 60 + new Date().getTimezoneOffset()) * 60000);
    var h = uz.getHours();
    return h >= 9 && h < 20;
  };

  document.querySelectorAll('[data-lead]').forEach(function (form) {
    var statusEl = form.querySelector('[data-status]');
    var d = form.dataset;                       /* тексты приходят из content.js через разметку */
    var phrase = {
      ok: d.sayOk || say.ok,
      late: d.sayLate || d.sayOk || say.ok,
      bad: d.sayBad || say.bad,
      fail: d.sayFail || say.fail,
      sending: d.saySending || say.sending
    };
    var btn = form.querySelector('[data-submit]');
    var btnText = btn.textContent;
    var opened = false;
    /* Рамку ставим и полю, и его состоянию для скринридера: сообщение
       «проверьте отмеченные поля» без aria-invalid для незрячего человека
       ничего не значит. */
    var mark = function (el, bad) {
      var box = el.closest('.field') || el.closest('label') || el.parentNode;
      if (box && box.classList) { box.classList.toggle('invalid', bad); }
      el.classList.toggle('is-bad', bad);
      if (bad) { el.setAttribute('aria-invalid', 'true'); } else { el.removeAttribute('aria-invalid'); }
    };

    form.addEventListener('focusin', function () {
      if (!opened) { opened = true; track('lead_form_open', { page: location.pathname }); }
    });
    form.addEventListener('input', function (e) {
      if (e.target.classList && e.target.classList.contains('is-bad')) { mark(e.target, false); }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      statusEl.textContent = '';
      statusEl.className = 'lead__status';

      if (form.elements.company.value.trim() !== '') {   /* ловушка для ботов */
        statusEl.textContent = salesOpen() ? phrase.ok : phrase.late;
        statusEl.classList.add('ok');
        form.reset();
        return;
      }

      var nameOk = form.elements.name.value.trim().length >= 2;
      var phoneOk = form.elements.phone.value.replace(/\D/g, '').length >= 9;
      /* Согласие раньше молча блокировало отправку: поля были в порядке,
         подпись просила проверить отмеченные — а отмечено ничего не было. */
      var consentOk = form.elements.consent.checked;
      mark(form.elements.name, !nameOk);
      mark(form.elements.phone, !phoneOk);
      mark(form.elements.consent, !consentOk);
      if (!nameOk || !phoneOk || !consentOk) {
        statusEl.textContent = phrase.bad;
        statusEl.classList.add('err');
        var first = !nameOk ? form.elements.name : (!phoneOk ? form.elements.phone : form.elements.consent);
        try { first.focus({ preventScroll: false }); } catch (err) { first.focus(); }
        track('lead_error', { reason: 'validation' });
        return;
      }

      btn.disabled = true;
      btn.classList.add('is-busy');
      btn.setAttribute('aria-label', phrase.sending);
      statusEl.textContent = phrase.sending;
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
        statusEl.textContent = salesOpen() ? phrase.ok : phrase.late;
        statusEl.classList.add('ok');
        form.reset();
        track('lead_success', { page: location.pathname });
      }).catch(function () {
        statusEl.textContent = phrase.fail;
        statusEl.classList.add('err');
        track('lead_error', { reason: 'network' });
      }).then(function () {
        btn.disabled = false;
        btn.classList.remove('is-busy');
        btn.removeAttribute('aria-label');
        btn.textContent = btnText;
      });
    });
  });

  /* ══════════════ выбор квартиры ══════════════
     Подъезд → этаж → план этажа. Контуры квартир приходят по одному файлу
     на подъезд, поэтому страница не тянет схемы всех 156 этажей сразу. */
  /* Подбор и план этажа — два разных блока страницы, но подбор должен уметь
     открыть найденную квартиру на плане. Мост между ними — эти две
     переменные: их заполняет блок плана, а пользуется блок подбора. */
  var openFlat = null;
  var flatInfo = null;                      /* «подъезд-этаж-номер» → подпись из выгрузки */

  var chooser = document.querySelector('[data-chooser]');
  var stage = document.querySelector('[data-floor-stage]');
  if (chooser && stage) {
    var planImg = stage.querySelector('.floor__plan');
    var flatsSvg = stage.querySelector('.floor__flats');
    var floorCap = stage.querySelector('[data-floor-cap]');
    var floorSet = chooser.querySelector('[data-floor-set]');
    var flatCard = document.querySelector('[data-floor-card]');
    var flatNum = document.querySelector('[data-flat-num]');
    var flatWhere = document.querySelector('[data-flat-where]');
    var flatArea = document.querySelector('[data-flat-area]');
    var capText = floorCap ? floorCap.textContent : '';
    var cache = {};
    var current = { podil: null, floor: null };

    var mismatch = document.querySelector('[data-flat-mismatch]');
    /* Карточка квартиры. exact=false — квартира из выгрузки, номер которой на
       схеме этажа не найден (подъезды 8–13): показываем её данные, но без
       контура и с пояснением. Данные ищем по точному ключу подъезд-этаж-номер:
       у подъездов 8–13 номер «3» на схеме и «3» в выгрузке — разные квартиры. */
    var say = function (podil, floor, num, exact) {
      if (!flatCard) { return; }
      flatCard.hidden = false;
      if (flatNum) { flatNum.textContent = num; }
      if (flatWhere) {
        flatWhere.textContent = chooser.dataset.entranceWord + ' ' + podil
          + ' · ' + floor + ' ' + chooser.dataset.floorWord;
      }
      if (flatArea) {
        var info = flatInfo && flatInfo[podil + '-' + floor + '-' + num];
        flatArea.hidden = !info;
        if (info) { flatArea.textContent = info.label; }
      }
      if (mismatch) { mismatch.hidden = exact !== false; }
      track('flat_pick', { podil: podil, floor: floor, num: num, exact: exact !== false });
    };

    /* Подсказка над контуром: номер, комнатность и площадь, если выгрузка
       уже пришла. Стоит в рамке плана и следует за курсором. */
    var frame = stage.querySelector('.floor__frame');
    var tip = document.createElement('span');
    tip.className = 'floor__tip';
    tip.setAttribute('aria-hidden', 'true');
    if (frame) { frame.appendChild(tip); }
    var tipText = function (num) {
      var info = flatInfo && flatInfo[current.podil + '-' + current.floor + '-' + num];
      return (info ? chooser.dataset.flatWord : chooser.dataset.planNumWord) + ' ' + num
        + (info ? ' · ' + info.label : '');
    };
    flatsSvg.addEventListener('pointermove', function (e) {
      var p = e.target.closest('path[data-num]');
      if (!p || !frame) { tip.classList.remove('is-on'); return; }
      var r = frame.getBoundingClientRect();
      tip.textContent = tipText(p.dataset.num);
      tip.style.left = (e.clientX - r.left) + 'px';
      tip.style.top = (e.clientY - r.top) + 'px';
      tip.classList.add('is-on');
    }, { passive: true });
    flatsSvg.addEventListener('pointerleave', function () { tip.classList.remove('is-on'); });

    /* На телефоне чертёж шире экрана: пока его не сдвинули, над ним стоит
       подсказка; кнопка «Весь этаж» вписывает план в экран целиком. */
    var scroller = stage.querySelector('[data-floor-scroll]');
    var fitBtn = stage.querySelector('[data-floor-fit]');
    var judgeScroll = function () {
      if (!scroller) { return; }
      var can = !stage.classList.contains('is-fit') && scroller.scrollWidth > scroller.clientWidth + 2;
      stage.classList.toggle('is-scrollable', can || stage.classList.contains('is-fit'));
    };
    if (scroller) {
      scroller.addEventListener('scroll', function () {
        if (scroller.scrollLeft > 24) { stage.classList.add('is-scrolled'); }
      }, { passive: true });
      addEventListener('resize', judgeScroll);
    }
    if (fitBtn) {
      fitBtn.addEventListener('click', function () {
        var fit = !stage.classList.contains('is-fit');
        stage.classList.toggle('is-fit', fit);
        fitBtn.setAttribute('aria-pressed', fit ? 'true' : 'false');
        fitBtn.textContent = fit ? fitBtn.dataset.labelZoom : fitBtn.dataset.labelFit;
        judgeScroll();
      });
    }

    var swapping = null;
    /* имя без var render: ниже, в подборе, есть свой render в той же области видимости */
    var paintFloor = function (data, f, floor) {
      planImg.src = '/assets/img/floors/p' + data.podil + '-f' + floor + '.webp';
      planImg.width = f.w; planImg.height = f.h;
      planImg.alt = (planImg.dataset.tpl || '').replace('{p}', data.podil).replace('{f}', floor);
      flatsSvg.setAttribute('viewBox', f.box);
      /* контуры доступны с клавиатуры: Tab по квартирам, Enter — выбрать */
      flatsSvg.innerHTML = f.flats.map(function (x) {
        return '<path d="' + x.d + '" data-num="' + x.num + '" tabindex="0" role="button"><title>'
          + chooser.dataset.flatWord + ' ' + x.num + '</title></path>';
      }).join('');
      if (floorCap) { floorCap.textContent = f.flats.length + ' ' + chooser.dataset.countedWord; }
      if (planImg.complete) { judgeScroll(); } else { planImg.addEventListener('load', judgeScroll, { once: true }); }
    };
    var drawFloor = function (data, floor) {
      var f = data.floors[String(floor)];
      if (!f) { return; }
      if (flatCard) { flatCard.hidden = true; }
      tip.classList.remove('is-on');
      current = { podil: data.podil, floor: floor };
      /* старый план гаснет за 180 мс, новый приходит на его место; при
         быстром переборе этажей ждём только последний */
      if (calm) { paintFloor(data, f, floor); return; }
      stage.classList.add('is-swapping');
      clearTimeout(swapping);
      swapping = setTimeout(function () {
        paintFloor(data, f, floor);
        requestAnimationFrame(function () { stage.classList.remove('is-swapping'); });
      }, 180);
    };

    var pickFloor = function (floor) {
      [].forEach.call(floorSet.children, function (b) {
        var on = +b.dataset.floor === +floor;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      drawFloor(cache[current.podil], floor);
    };

    var loadEntrance = function (podil, floors, then) {
      var show = function (data) {
        cache[podil] = data;
        current.podil = podil;
        floorSet.innerHTML = floors.map(function (f, i) {
          return '<button class="pick' + (i === 0 ? ' is-on' : '') + '" type="button" data-floor="'
            + f + '" aria-pressed="' + (i === 0) + '">' + f + '</button>';
        }).join('');
        syncInk(floorSet, true);
        drawFloor(data, floors[0]);
        if (then) { then(); }
      };
      if (cache[podil]) { show(cache[podil]); return; }
      fetch('/assets/floors/p' + podil + '.json')
        .then(function (r) { return r.json(); })
        .then(show)
        .catch(function () { if (floorCap) { floorCap.textContent = capText; } });
    };

    /* Открыть конкретную квартиру: переключить подъезд, этаж, подсветить
       контур и подвести страницу к плану. Этим пользуется блок подбора. */
    /* Выделенный контур подводим в поле зрения и по горизонтали: на телефоне
       чертёж шире экрана и ездит вбок, и без этого выбранная квартира могла
       остаться за краем. */
    var centerOn = function (p) {
      var scroller = stage.querySelector('.floor__scroll');
      if (!scroller || scroller.scrollWidth <= scroller.clientWidth + 2) { return; }
      var r = p.getBoundingClientRect();
      var box = scroller.getBoundingClientRect();
      var left = scroller.scrollLeft + (r.left + r.width / 2 - box.left) - box.width / 2;
      scroller.scrollTo({ left: Math.max(0, left), behavior: calm ? 'auto' : 'smooth' });
    };
    openFlat = function (podil, floor, num, exact) {
      var btn = chooser.querySelector('[data-entrance="' + podil + '"]');
      if (!btn) { return; }
      [].forEach.call(btn.parentNode.children, function (o) {
        var on = o === btn;
        o.classList.toggle('is-on', on);
        o.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      syncInk(btn.parentNode);
      var finish = function () {
        pickFloor(floor);
        /* план приходит после короткого наплыва — контур ищем, когда он есть */
        var after = function () {
          var p = exact ? flatsSvg.querySelector('path[data-num="' + num + '"]') : null;
          [].forEach.call(flatsSvg.children, function (o) { o.classList.toggle('is-on', o === p); });
          say(podil, floor, num, !!p);
          if (p) { centerOn(p); }
        };
        if (calm) { after(); } else { setTimeout(after, 220); }
        stage.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'center' });
      };
      loadEntrance(podil, btn.dataset.floors.split(',').map(Number), finish);
    };

    chooser.addEventListener('click', function (e) {
      var b = e.target.closest('[data-entrance]');
      if (b) {
        [].forEach.call(b.parentNode.children, function (o) {
          var on = o === b;
          o.classList.toggle('is-on', on);
          o.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        loadEntrance(+b.dataset.entrance, b.dataset.floors.split(',').map(Number));
        track('entrance_pick', { podil: +b.dataset.entrance });
        return;
      }
      var f = e.target.closest('[data-floor]');
      if (f) {
        pickFloor(+f.dataset.floor);
        /* Единственное звено цепочки «подъезд → этаж → квартира», по которому
           не было события: в отчёте выходил разрыв между выбором подъезда и
           выбором квартиры, и не было видно, где люди останавливаются. */
        track('floor_pick', { podil: current.podil, floor: +f.dataset.floor });
      }
    });

    var choose = function (p) {
      [].forEach.call(flatsSvg.children, function (o) { o.classList.toggle('is-on', o === p); });
      var known = flatInfo && flatInfo[current.podil + '-' + current.floor + '-' + p.dataset.num];
      say(current.podil, current.floor, p.dataset.num, !!known || !flatInfo);
    };
    flatsSvg.addEventListener('click', function (e) {
      var p = e.target.closest('path[data-num]');
      if (p) { choose(p); }
    });
    flatsSvg.addEventListener('keydown', function (e) {
      var p = e.target.closest('path[data-num]');
      if (!p || (e.key !== 'Enter' && e.key !== ' ')) { return; }
      e.preventDefault();
      choose(p);
    });

    var first = chooser.querySelector('[data-entrance]');
    if (first) { loadEntrance(+first.dataset.entrance, first.dataset.floors.split(',').map(Number)); }
  }

  /* ══════════════ подбор квартиры ══════════════
     Фильтр идёт по выгрузке состава: 1186 квартир, у каждой подъезд, этаж,
     номер, комнатность и площадь. Файл тянем один раз и лениво — до него
     страница уже полностью работает планом этажа.

     Студии в выгрузке помечены отдельно, хотя формально они однокомнатные:
     поэтому «1 комната» и «студия» не пересекаются, и суммы сходятся. */
  var flBox = document.querySelector('[data-flats]');
  if (flBox) {
    var flResults = document.querySelector('[data-results]');
    var flEmpty = document.querySelector('[data-empty]');
    var flMore = document.querySelector('[data-more]');
    var flFound = flBox.querySelector('[data-found]');
    var outFloor = flBox.querySelector('[data-out-floor]');
    var outArea = flBox.querySelector('[data-out-area]');
    var drawn = {};
    try { drawn = JSON.parse(flBox.dataset.drawn || '{}'); } catch (e) {}
    var roomWords = (flBox.dataset.wordRooms || '').split('|');
    var W = flBox.dataset;
    /* На телефоне 48 строк — десять экранов одинакового текста до кнопки
       «Показать ещё»; дюжина помещается в два и оставляет план этажа в поле зрения. */
    var PAGE = innerWidth < 700 ? 12 : 48;

    var items = [];
    var matched = [];
    var shown = PAGE;
    var pick = { rooms: '', ent: '' };

    var ranges = {};
    [].forEach.call(flBox.querySelectorAll('[data-range]'), function (box) {
      ranges[box.dataset.range] = {
        lo: box.querySelector('[data-lo]'),
        hi: box.querySelector('[data-hi]'),
        fill: box.querySelector('.fl__track i'),
      };
    });

    var num = function (v) { return String(v).replace('.', ','); };

    /* Ползунки ходят парой и не перепрыгивают друг друга. */
    var clampRange = function (r) {
      var lo = +r.lo.value, hi = +r.hi.value;
      if (lo > hi) { if (document.activeElement === r.lo) { r.hi.value = lo; } else { r.lo.value = hi; } }
      if (r.fill) {
        var min = +r.lo.min, max = +r.lo.max, span = max - min;
        r.fill.style.left = ((+r.lo.value - min) / span * 100) + '%';
        r.fill.style.right = ((max - +r.hi.value) / span * 100) + '%';
      }
    };

    var label = function (f) {
      var rooms = f[5] ? W.wordStudio : roomWords[f[3]];
      return num(f[4]) + ' ' + W.wordSqm + ' · ' + rooms;
    };

    var render = function () {
      var list = matched.slice(0, shown);
      /* новые строки приходят короткой волной: --i задаёт задержку в CSS */
      flResults.innerHTML = list.map(function (f, i) {
        /* drawn: подъезд → этаж → номера квартир на схеме. Точное совпадение —
           «На плане»; этаж есть, номера нет — «Схема этажа» без контура;
           этажа нет — перехода нет. */
        var floorNums = (drawn[f[0]] || {})[String(f[1])];
        var has = !!floorNums;
        var exact = has && floorNums.indexOf(f[2]) !== -1;
        var rooms = f[5] ? W.wordStudio : roomWords[f[3]];
        return '<' + (has ? 'button' : 'div') + ' class="fl__item is-in-fresh' + (has ? '' : ' is-flat') + (has && !exact ? ' is-floor-only' : '') + '"'
          + ' style="--i:' + Math.min(i, 14) + '"'
          + (has ? ' type="button" data-go="' + f[0] + ',' + f[1] + ',' + f[2] + ',' + (exact ? 1 : 0) + '"' : '')
          + '><span class="fl__a">' + num(f[4]) + '<i>' + W.wordSqm + '</i></span>'
          + '<span class="fl__r">' + rooms + '</span>'
          + '<span class="fl__w">' + W.wordEntrance + ' ' + f[0] + ' · ' + f[1] + ' ' + W.wordFloor
          + ' · ' + W.wordFlat + ' ' + f[2] + '</span>'
          + '<span class="fl__g">' + (exact ? W.wordGo : (has ? W.wordFloorOnly : W.wordNoplan)) + '</span>'
          + '</' + (has ? 'button' : 'div') + '>';
      }).join('');
      if (flEmpty) { flEmpty.hidden = matched.length > 0; }
      if (flMore) { flMore.hidden = matched.length <= shown; }
    };

    var apply = function () {
      var fr = ranges.floor, ar = ranges.area;
      var fLo = +fr.lo.value, fHi = +fr.hi.value, aLo = +ar.lo.value, aHi = +ar.hi.value;
      if (outFloor) { outFloor.textContent = fLo + ' – ' + fHi; }
      if (outArea) { outArea.textContent = aLo + ' – ' + aHi; }
      matched = items.filter(function (f) {
        if (pick.ent && +pick.ent !== f[0]) { return false; }
        if (pick.rooms === 's' && !f[5]) { return false; }
        if (pick.rooms && pick.rooms !== 's' && (+pick.rooms !== f[3] || f[5])) { return false; }
        if (f[1] < fLo || f[1] > fHi) { return false; }
        if (f[4] < aLo || f[4] > aHi) { return false; }
        return true;
      });
      shown = PAGE;
      if (flFound) { flFound.textContent = matched.length; }
      render();
    };

    var setPick = function (group, key, value) {
      pick[key] = value;
      [].forEach.call(group.children, function (o) {
        var on = o.dataset[key === 'rooms' ? 'rooms' : 'ent'] === value;
        o.classList.toggle('is-on', on);
        o.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      apply();
      track('apartment_filter', { rooms: pick.rooms || 'all', entrance: pick.ent || 'all',
        found: matched.length });
    };

    flBox.addEventListener('click', function (e) {
      var r = e.target.closest('[data-rooms]');
      if (r) { setPick(r.parentNode, 'rooms', r.dataset.rooms); return; }
      var en = e.target.closest('[data-ent]');
      if (en) { setPick(en.parentNode, 'ent', en.dataset.ent); return; }
      if (e.target.closest('[data-reset]')) {
        pick = { rooms: '', ent: '' };
        [].forEach.call(flBox.querySelectorAll('[data-rooms],[data-ent]'), function (o) {
          var on = o.dataset.rooms === '' || o.dataset.ent === '';
          o.classList.toggle('is-on', on);
          o.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        Object.keys(ranges).forEach(function (k) {
          ranges[k].lo.value = ranges[k].lo.min;
          ranges[k].hi.value = ranges[k].hi.max;
          clampRange(ranges[k]);
        });
        apply();
      }
    });

    flBox.addEventListener('input', function (e) {
      var box = e.target.closest('[data-range]');
      if (!box) { return; }
      clampRange(ranges[box.dataset.range]);
      apply();
    });

    if (flMore) {
      flMore.addEventListener('click', function () { shown += PAGE; render(); });
    }

    if (flResults) {
      flResults.addEventListener('click', function (e) {
        var b = e.target.closest('[data-go]');
        if (!b || !openFlat) { return; }
        var p = b.dataset.go.split(',').map(Number);
        track('apartment_select', { podil: p[0], floor: p[1], num: p[2], exact: p[3] === 1 });
        openFlat(p[0], p[1], p[2], p[3] === 1);
      });
    }

    /* Файл состава грузим, когда подбор подходит к экрану: на телефоне он не
       должен соревноваться за канал с чертежом этажа. */
    var loadFlats = function () {
      fetch(flBox.dataset.src)
        .then(function (r) { return r.json(); })
        .then(function (d) {
          items = d.items || [];
          flatInfo = {};
          items.forEach(function (f) { flatInfo[f[0] + '-' + f[1] + '-' + f[2]] = { label: label(f) }; });
          Object.keys(ranges).forEach(function (k) { clampRange(ranges[k]); });
          apply();
        })
        .catch(function () {
          if (flBox.parentNode) { flBox.parentNode.removeChild(flBox); }
        });
    };
    if ('IntersectionObserver' in window) {
      var flSeen = new IntersectionObserver(function (es) {
        if (es.some(function (x) { return x.isIntersecting; })) { flSeen.disconnect(); loadFlats(); }
      }, { rootMargin: '400px' });
      flSeen.observe(flBox);
    } else { loadFlats(); }
  }

  /* ══════════════ генеральный план ══════════════
     Наведение и нажатие выбирают корпус, карточка рядом обновляется.
     Событие в аналитику шлём только по нажатию: на наведении их были бы сотни. */
  var gp = document.querySelector('[data-genplan]');
  var gpCard = document.querySelector('[data-genplan-card]');
  if (gp && gpCard) {
    var gpZones = [].slice.call(gp.querySelectorAll('.gp__zone'));
    var gpType = gpCard.querySelector('[data-gp-type]');
    var gpFloors = gpCard.querySelector('[data-gp-floors]');
    var gpScheme = gpCard.querySelector('[data-gp-scheme]');

    var gpPick = function (z, push) {
      gpZones.forEach(function (o) {
        var on = o === z;
        o.classList.toggle('is-on', on);
        o.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (gpType) { gpType.textContent = z.dataset.type; }
      if (gpFloors) { gpFloors.textContent = z.dataset.floors; }
      if (gpScheme) { gpScheme.textContent = z.dataset.scheme; }
      if (push) { track('genplan_block', { type: z.dataset.type, floors: z.dataset.floors }); }
    };

    /* переключатель «чертёж / с высоты» */
    var gpViews = document.querySelectorAll('[data-gp-view]');
    var gpAerial = gp.querySelector('.gp__aerial');
    if (gpViews.length && gpAerial) {
      [].forEach.call(gpViews, function (b) {
        b.addEventListener('click', function () {
          var aerial = b.dataset.gpView === 'aerial';
          [].forEach.call(gpViews, function (o) {
            var on = o === b;
            o.classList.toggle('is-on', on);
            o.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
          gp.classList.toggle('is-aerial', aerial);
          gpAerial.hidden = !aerial;
          track('genplan_view', { view: b.dataset.gpView });
        });
      });
    }

    gpZones.forEach(function (z) {
      z.addEventListener('click', function () { gpPick(z, true); });
      z.addEventListener('mouseenter', function () { gpPick(z, false); });
      z.addEventListener('focus', function () { gpPick(z, false); });
      z.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); gpPick(z, true); }
      });
    });
  }

  /* ══════════════ навигация по разделам ══════════════
     Считаем положение разделов в момент прокрутки, а не заранее: страница
     растёт по мере загрузки планировок, и заранее посчитанные границы
     разъезжаются — подсветка начинает показывать не тот раздел.
     Активным считается раздел, пересекающий линию на 42% высоты экрана. */
  var rail = document.querySelector('[data-rail]');
  if (rail) {
    var railItems = [].slice.call(rail.querySelectorAll('a'))
      .map(function (a) { return { a: a, el: document.querySelector(a.getAttribute('href')) }; })
      .filter(function (x) { return x.el; });

    var markSection = function () {
      var line = innerHeight * 0.42;
      var hit = null;
      var above = null;
      railItems.forEach(function (x) {
        var r = x.el.getBoundingClientRect();
        if (r.top <= line && r.bottom > line) { hit = x; }
        if (r.top <= line) { above = x; }
      });
      var on = hit || above;
      railItems.forEach(function (x) {
        x.a.classList.toggle('is-on', x === on);
        if (x === on) { x.a.setAttribute('aria-current', 'true'); }
        else { x.a.removeAttribute('aria-current'); }
      });
    };

    var railWaiting = false;
    var railTick = function () {
      if (railWaiting) { return; }
      railWaiting = true;
      requestAnimationFrame(function () { railWaiting = false; markSection(); });
    };
    addEventListener('scroll', railTick, { passive: true });
    addEventListener('resize', railTick);
    markSection();
  }

  var items = document.querySelectorAll('.reveal');
  if (motion) { return; }                /* появления блоков ведёт motion.js */
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

/* ══════════════ калькулятор рассрочки ══════════════
   Рассрочка беспроцентная, поэтому считать здесь нечего сложнее деления:
   остаток стоимости делится на срок. Аннуитет был бы враньём — процента нет.
   Разметка уже приходит с осмысленными числами, скрипт только пересчитывает
   их при движении ползунков; если он не отработает, страница остаётся
   с корректным примером, а не с нулями. */
(function () {
  var box = document.querySelector('[data-calc]');
  if (!box) { return; }

  var mln = box.dataset.mln || '';
  var q = function (sel) { return box.querySelector(sel); };
  var area = q('[data-calc-area]');
  var rate = q('[data-calc-rate]');
  var down = q('[data-calc-down]');
  var term = q('[data-calc-term]');

  var outDown = q('[data-calc-down-out]');
  var outTerm = q('[data-calc-term-out]');
  var outCost = q('[data-calc-cost]');
  var outDownSum = q('[data-calc-downsum]');
  var outRest = q('[data-calc-rest]');
  var outMonth = q('[data-calc-month]');

  /* Суммы в миллионах сумов: «469,4 млн сум» читается, «469 350 000» — нет.
     Разряды разделяем узким пробелом, дробную часть держим одну и только
     там, где она что-то значит. */
  var money = function (v) {
    var n = Math.round(v * 10) / 10;
    var str = (n >= 100 ? String(Math.round(n)) : String(n).replace('.', ','));
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009') + ' ' + mln;
  };

  var num = function (el, fallback) {
    var v = parseFloat(String(el.value).replace(',', '.'));
    return isFinite(v) && v > 0 ? v : fallback;
  };

  /* Суммы не прыгают, а перетекают к новому значению за 340 мс: значение
     в конце — ровно рассчитанное, промежуточные кадры только для глаза.
     При отключённом движении число ставится сразу. */
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var shown = new WeakMap();
  var flow = function (el, value) {
    if (!el) { return; }
    var from = shown.get(el);
    shown.set(el, value);
    if (calm || from === undefined || !isFinite(from)) { el.textContent = money(value); return; }
    var t0 = performance.now();
    var step = function (now) {
      var k = Math.min(1, (now - t0) / 340);
      var e = 1 - Math.pow(1 - k, 3);
      el.textContent = money(from + (value - from) * e);
      if (k < 1) { requestAnimationFrame(step); } else { el.textContent = money(value); }
    };
    requestAnimationFrame(step);
  };

  var recalc = function () {
    var cost = num(area, 67) * num(rate, 10);
    var pct = Math.min(100, Math.max(0, parseFloat(down.value) || 0));
    var months = Math.max(1, parseInt(term.value, 10) || 1);
    var first = cost * pct / 100;
    var rest = cost - first;

    if (outDown) { outDown.textContent = pct + '%'; }
    if (outTerm) { outTerm.textContent = months; }
    flow(outCost, cost);
    flow(outDownSum, first);
    flow(outRest, rest);
    flow(outMonth, rest / months);
  };

  [area, rate, down, term].forEach(function (el) {
    if (!el) { return; }
    el.addEventListener('input', recalc);
    el.addEventListener('change', recalc);
  });

  /* Событие шлём один раз за посещение и только когда человек действительно
     трогал ползунки: иначе в отчёте окажется каждый, кто просто пролистал. */
  var sent = false;
  box.addEventListener('input', function () {
    if (sent) { return; }
    sent = true;
    if (window.pariTrack) { window.pariTrack('view_installment', { tool: 'calculator' }); }
  }, { once: false });

  recalc();
})();
