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
     Виджет Яндекса подключается по нажатию: страница не тянет сторонний скрипт заранее. */
  document.querySelectorAll('[data-map]').forEach(function (box) {
    var btn = box.querySelector('.map__btn');
    if (!btn) { return; }
    btn.addEventListener('click', function () {
      var frame = document.createElement('iframe');
      frame.src = box.dataset.src;
      frame.loading = 'lazy';
      frame.title = document.documentElement.lang === 'uz' ? 'Xarita' : 'Карта';
      frame.setAttribute('allowfullscreen', '');
      box.classList.add('is-live');
      box.innerHTML = '';
      box.appendChild(frame);
    });
  });

  /* ══════════════ петля первого экрана ══════════════
     На широком экране идёт горизонтальная петля (1920 или 1280 по ширине окна),
     на телефоне — отдельная вертикальная 720×1280 весом 1,4 МБ.
     Не грузим её при включённой экономии трафика, на медленной сети
     и когда человек попросил убрать анимации. */
  var v = document.getElementById('heroVideo');
  var net = navigator.connection || {};
  var thrifty = net.saveData === true;
  var slow = typeof net.effectiveType === 'string' && /2g$/.test(net.effectiveType);

  if (v && hero && !calm && !thrifty && !slow) {
    var portrait = innerWidth <= 700;
    var pick = function (kind) {
      if (portrait) { return v.dataset[kind + 'Portrait']; }
      var wide = innerWidth * (devicePixelRatio > 1.5 ? 1.5 : 1) >= 1400 ? '1920' : '1280';
      return v.dataset[kind].replace('{w}', wide);
    };
    [['video/webm', pick('webm')], ['video/mp4', pick('mp4')]].forEach(function (pair) {
      var s = document.createElement('source');
      s.type = pair[0]; s.src = pair[1];
      v.appendChild(s);
    });
    v.addEventListener('playing', function () {
      v.classList.add('is-playing');
      if (hero) { hero.classList.add('has-video'); }
    }, { once: true });
    /* на телефоне ждём, пока страница дорисуется: петля не должна мешать
       первой отрисовке и конкурировать за канал со шрифтами и кадром-постером */
    var start = function () {
      v.load();
      var go = v.play();
      if (go && go.catch) { go.catch(function () {}); }
    };
    if (!portrait) { start(); }
    else if (document.readyState === 'complete') { setTimeout(start, 400); }
    else { addEventListener('load', function () { setTimeout(start, 400); }); }
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

  /* ══════════════ шапка вне главной ══════════════
     На внутренних страницах нет первого экрана, поэтому шапка нужна сразу. */
  if (!hero && bar) { bar.classList.add('is-solid'); }

  /* ══════════════ карта ══════════════
     Виджет Яндекса подключается по нажатию: страница не тянет сторонний скрипт заранее. */
  document.querySelectorAll('[data-map]').forEach(function (box) {
    var btn = box.querySelector('.map__btn');
    if (!btn) { return; }
    btn.addEventListener('click', function () {
      var frame = document.createElement('iframe');
      frame.src = box.dataset.src;
      frame.loading = 'lazy';
      frame.title = document.documentElement.lang === 'uz' ? 'Xarita' : 'Карта';
      frame.setAttribute('allowfullscreen', '');
      box.classList.add('is-live');
      box.innerHTML = '';
      box.appendChild(frame);
    });
  });

  /* ══════════════ полёт бабочек ══════════════
     Кейфреймы дают «рельсы», поэтому движение считается покадрово:
     у каждой бабочки своя скорость и инерция, она подворачивает к цели,
     кренится на поворотах, машет сериями и планирует между ними,
     а на подъёме взмах сильнее. Гостья садится на кнопку звонка. */
  var flies = [].slice.call(document.querySelectorAll('.fly'));

  if (flies.length && hero && !calm) {
    var rnd = function (a, b) { return a + Math.random() * (b - a); };

    var Fly = function (el) {
      this.el = el;
      this.bob = el.querySelector('.fly__bob');
      this.wl = el.querySelector('.wing--l');
      this.wr = el.querySelector('.wing--r');
      this.visitor = el.classList.contains('fly--visit');
      this.depth = el.classList.contains('fly--far') ? 0.62
                 : el.classList.contains('fly--mid') ? 0.8 : 1;
      this.peak = parseFloat(getComputedStyle(el).getPropertyValue('--peak')) || 0.5;

      this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
      this.angle = 0;                   // куда повёрнут корпус
      this.phase = rnd(0, 6.28);        // фаза взмаха
      this.flapRate = rnd(7.6, 9.4);    // взмахов в секунду (радиан/с считаем ниже)
      this.glide = 0;                   // остаток времени планирования
      this.burst = rnd(0.5, 1.4);       // сколько ещё махать до планирования
      this.speed = rnd(34, 58) * this.depth;
      this.opacity = 0;
      this.mode = 'cruise';
      this.timer = this.visitor ? rnd(3.5, 6) : 0;  // через сколько лететь к кнопке
      this.target = null;
      this.newTarget();
    };

    /* геометрию читаем не в каждом кадре, а по событиям: иначе браузер
       пересчитывает раскладку 60 раз в секунду */
    var box = { w: 0, h: 0 };
    var perch = null;
    var measure = function () {
      box.w = hero.clientWidth;
      box.h = hero.clientHeight;
      var cta = document.querySelector('.cta');
      if (cta) {
        var c = cta.getBoundingClientRect(), h = hero.getBoundingClientRect();
        perch = { x: c.right - h.left - 52, y: c.top - h.top - 26 };
      }
    };

    Fly.prototype.bounds = function () { return box; };
    Fly.prototype.perchPoint = function () { return perch; };

    /* новая цель блуждания: верхняя часть кадра, но не по центру, где логотип */
    Fly.prototype.newTarget = function () {
      var b = this.bounds();
      var side = Math.random() < 0.5 ? -1 : 1;
      var cx = b.w / 2;
      this.target = {
        x: cx + side * rnd(0.18, 0.46) * b.w,
        y: rnd(0.12, 0.78) * b.h
      };
      this.retarget = rnd(1.6, 3.8);
    };

    Fly.prototype.place = function () {
      var b = this.bounds();
      if (this.visitor) {                    /* гостье лететь к кнопке — стартует рядом */
        this.x = rnd(0.6, 0.92) * b.w;
        this.y = rnd(0.55, 0.85) * b.h;
      } else {
        this.x = rnd(0.1, 0.9) * b.w;
        this.y = rnd(0.45, 0.95) * b.h;
      }
    };

    Fly.prototype.step = function (dt, t) {
      var b = this.bounds();
      var goal = this.target;

      if (this.visitor) {
        this.timer -= dt;
        if (this.mode === 'cruise' && this.timer <= 0) { this.mode = 'approach'; }
        if (this.mode === 'approach' || this.mode === 'land') {
          var p = this.perchPoint();
          if (p) {
            goal = p;
            var dx = p.x - this.x, dy = p.y - this.y;
            var far = Math.sqrt(dx * dx + dy * dy);
            /* прицельный заход: у самой кнопки скорость задаётся напрямую и гаснет
               по мере приближения, иначе бабочка бесконечно кружит рядом */
            if (far < 120) {
              var want = Math.min(this.speed * 2.6, far * 2.2);
              this.vx = dx / far * want;
              this.vy = dy / far * want;
              this.x += this.vx * dt;
              this.y += this.vy * dt;
            }
            if (far < 14) {
              this.mode = 'rest';
              this.timer = rnd(4.5, 7.5);
              this.x = p.x; this.y = p.y;
              this.vx = this.vy = 0;
              this.angle = 0;            /* на кнопке сидит ровно */
            }
          }
        }
        if (this.mode === 'rest') {
          if (this.timer <= 0) {                     /* взлёт */
            this.mode = 'cruise';
            this.timer = rnd(14, 24);
            this.vx = -rnd(20, 40); this.vy = -rnd(30, 55);
            this.burst = 1.6; this.glide = 0;
            this.newTarget();
          }
        }
      }

      if (this.mode !== 'rest') {
        this.retarget -= dt;
        if (this.retarget <= 0 && this.mode === 'cruise') { this.newTarget(); }

        /* подворот к цели + поперечное рысканье, чтобы траектория не была прямой */
        var gx = goal.x - this.x, gy = goal.y - this.y;
        var d = Math.hypot(gx, gy) || 1;
        var wobble = Math.sin(t * 1.7 + this.phase) * (this.mode === 'approach' ? 8 : 34);
        var pull = this.mode === 'approach' ? 160 : 46;
        var ax = (gx / d) * pull - (gy / d) * wobble * 0.5;
        var ay = (gy / d) * pull + (gx / d) * wobble * 0.5;

        /* на махе бабочка подбрасывается вверх, между махами слегка проседает */
        var lift = this.glide > 0 ? 12 : -26 * Math.max(0, Math.sin(this.phase));

        this.vx += ax * dt;
        this.vy += (ay + lift) * dt;

        var sp = Math.hypot(this.vx, this.vy);
        var max = this.speed * (this.mode === 'approach' ? 2.6 : 1);
        if (sp > max) { this.vx *= max / sp; this.vy *= max / sp; }
        this.vx *= (1 - 1.1 * dt);                 /* вязкость воздуха */
        this.vy *= (1 - 1.1 * dt);

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        /* мягкий разворот у границ кадра */
        var pad = 30;
        if (this.x < pad) { this.vx += 60 * dt; }
        if (this.x > b.w - pad) { this.vx -= 60 * dt; }
        if (this.y < pad) { this.vy += 60 * dt; }
        if (this.y > b.h - pad) { this.vy -= 60 * dt; }

        /* вид сверху: корпус держится вертикально и лишь кренится в сторону сноса —
           так бабочка не превращается в «листик», а на поворотах видно вираж */
        var drift = Math.max(-1, Math.min(1, this.vx / (this.speed || 1)));
        var want = drift * 0.38;                             /* до ±22° */
        if (this.mode === 'approach') { want *= 0.4; }
        var diff = want - this.angle;
        this.angle += diff * Math.min(1, dt * 3.2);
      }

      /* взмахи: серия ударов, затем короткое планирование */
      var open;
      if (this.mode === 'rest') {
        this.angle += (0 - this.angle) * Math.min(1, dt * 6);
        this.phase += dt * 1.5;                          /* сидит и «дышит» крыльями */
        open = 0.42 + 0.3 * (0.5 + 0.5 * Math.sin(this.phase));
      } else {
        if (this.glide > 0) {
          this.glide -= dt;
          this.phase += dt * 2.2;
          open = 0.86 + 0.1 * Math.sin(this.phase);
        } else {
          this.burst -= dt;
          this.phase += dt * this.flapRate;
          if (this.burst <= 0) { this.glide = rnd(0.25, 0.75); this.burst = rnd(0.6, 1.6); }
          /* удар вниз быстрый, возврат медленнее — отсюда несимметричная форма */
          var c = Math.sin(this.phase);
          open = c > 0 ? 1 - 0.78 * Math.pow(c, 0.6) : 1 - 0.2 * Math.pow(-c, 1.6);
        }
      }

      var bobY = this.mode === 'rest' ? Math.sin(t * 1.1) * 0.6
                                      : Math.sin(this.phase) * 2.4 * this.depth;
      var scale = this.depth * (this.mode === 'rest' ? 1 : 1 + 0.03 * Math.sin(this.phase * 0.5));

      this.opacity += (this.peak - this.opacity) * Math.min(1, dt * 1.2);

      this.el.style.opacity = this.opacity.toFixed(3);
      this.el.style.transform = 'translate3d(' + this.x.toFixed(1) + 'px,' + this.y.toFixed(1) + 'px,0)' +
        ' rotate(' + (this.angle * 57.2958).toFixed(1) + 'deg) scale(' + scale.toFixed(3) + ')';
      this.bob.style.transform = 'translateY(' + bobY.toFixed(2) + 'px)';
      var sx = Math.max(0.12, open).toFixed(3);
      this.wl.style.transform = 'scaleX(' + sx + ')';
      this.wr.style.transform = 'scaleX(' + sx + ')';
      /* сложенное крыло ловит меньше света */
      var shade = (0.72 + 0.28 * open).toFixed(3);
      this.wl.style.opacity = shade;
      this.wr.style.opacity = shade;
    };

    measure();
    var swarm = flies.map(function (el) { var f = new Fly(el); f.place(); return f; });
    var last = 0, clock = 0, running = true;

    var frame = function (now) {
      if (!running) { return; }
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now; clock += dt;
      for (var i = 0; i < swarm.length; i++) { swarm[i].step(dt, clock); }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);

    /* не жжём батарею: считаем только когда первый экран виден и вкладка активна */
    var onScreen = true;
    var sync = function () {
      var on = onScreen && !document.hidden;
      if (on === running) { return; }
      running = on;
      if (on) { last = 0; requestAnimationFrame(frame); }
    };
    document.addEventListener('visibilitychange', sync);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { onScreen = e[0].isIntersecting; sync(); },
        { threshold: 0 }).observe(hero);
    }
    var resizeTimer;
    addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        measure();
        swarm.forEach(function (f) {
          f.x = Math.min(f.x, box.w - 20);
          f.y = Math.min(f.y, box.h - 20);
          f.newTarget();
        });
      }, 150);
    });
  }

  if (bar && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      bar.classList.toggle('is-solid', !entries[0].isIntersecting);
    }, { rootMargin: '-88% 0px 0px 0px' }).observe(hero);
  }

  /* ── мобильное меню ── */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');
  if (burger && menu) {
    var openLabel = burger.getAttribute('aria-label');
    var closeLabel = document.documentElement.lang === 'uz' ? 'Menyuni yopish' : 'Закрыть меню';
    var lastFocus = null;

    var setMenu = function (open) {
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? closeLabel : openLabel);
      document.body.classList.toggle('is-locked', open);
      if (open) {
        lastFocus = document.activeElement;
        menu.hidden = false;
        requestAnimationFrame(function () { menu.classList.add('is-open'); });
        var first = menu.querySelector('a');
        if (first) { first.focus({ preventScroll: true }); }
      } else {
        menu.classList.remove('is-open');
        setTimeout(function () { menu.hidden = true; }, 400);
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

  /* ── кинолента: кадры едут вбок при обычном вертикальном скролле ── */
  var cine = document.querySelector('[data-cine]');
  if (cine && !calm) {
    var stage = cine.querySelector('.cine__stage');
    var track = cine.querySelector('.cine__track');
    var rail = cine.querySelector('.cine__rail i');
    var shots = [].slice.call(cine.querySelectorAll('.frame img'));
    cine.classList.add('is-live');

    var runCine = function () {
      var box = cine.getBoundingClientRect();
      var travel = cine.offsetHeight - stage.offsetHeight;      /* сколько скролла на всю ленту */
      if (travel <= 0) { return; }
      var p = Math.min(1, Math.max(0, -box.top / travel));
      var shift = track.scrollWidth - stage.clientWidth;
      track.style.transform = 'translate3d(' + (-p * shift).toFixed(1) + 'px,0,0)';
      if (rail) { rail.style.width = (p * 100).toFixed(1) + '%'; }
      /* картинка внутри кадра идёт чуть медленнее ленты — появляется глубина */
      var per = 1 / Math.max(1, shots.length - 1);
      shots.forEach(function (img, i) {
        var local = Math.min(1, Math.max(-1, (p - i * per) / per));
        /* запас масштаба больше сдвига — край кадра не оголяется */
        img.style.transform = 'translate3d(' + (local * 5).toFixed(2) + '%,0,0) scale(1.14)';
      });
    };
    scenes.push(runCine);
    runCine();
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
