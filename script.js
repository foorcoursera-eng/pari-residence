/* PARI Residence — интерактив: видео первого экрана, полёт бабочек,
   шапка, появление блоков и заявка. Без зависимостей. */
(function () {
  'use strict';

  var bar = document.getElementById('bar');
  var hero = document.querySelector('.hero');
  var firstScreen = document.querySelector('.hero, .opening');
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ══════════════ петля первого экрана ══════════════
     На широком экране идёт горизонтальная петля (1920 или 1280 по ширине окна),
     на телефоне — отдельная вертикальная 720×1280 весом 1,4 МБ.
     Не грузим её при включённой экономии трафика, на медленной сети
     и когда человек попросил убрать анимации. */
  var v = document.getElementById('heroVideo');
  var film = v ? v.closest('.film') : null;
  var net = navigator.connection || {};
  var thrifty = net.saveData === true;
  var slow = typeof net.effectiveType === 'string' && /2g$/.test(net.effectiveType);

  if (v && !calm && !thrifty && !slow) {
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
      if (film) { film.classList.add('has-video'); }
    }, { once: true });
    var start = function () {
      v.load();
      var go = v.play();
      if (go && go.catch) { go.catch(function () {}); }
    };
    /* Ролик стоит в середине страницы, поэтому грузим его не сразу, а когда
       раздел подходит к экрану: первый экран не делит канал с видео. */
    if (film && 'IntersectionObserver' in window) {
      var filmIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) { return; }
          filmIO.disconnect();
          start();
        });
      }, { rootMargin: '400px 0px' });
      filmIO.observe(film);
    } else if (document.readyState === 'complete') {
      setTimeout(start, 400);
    } else {
      addEventListener('load', function () { setTimeout(start, 400); });
    }
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
    var visitEl = document.getElementById('flyVisit');
    var measure = function () {
      box.w = hero.clientWidth;
      box.h = hero.clientHeight;
      var cta = document.querySelector('.cta');
      if (cta) {
        var c = cta.getBoundingClientRect(), h = hero.getBoundingClientRect();
        /* Посадка считается от размера самой бабочки, а не от фиксированных 52 px:
           на телефоне кнопка вдвое уже, и постоянный отступ сажал бабочку прямо
           на номер телефона. Так она садится на правый верхний угол кнопки. */
        var fw = (visitEl && visitEl.offsetWidth) || 46;
        var fh = (visitEl && visitEl.offsetHeight) || 40;
        perch = { x: c.right - h.left - fw * 0.95, y: c.top - h.top - fh * 0.72 };
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
          f.peak = parseFloat(getComputedStyle(f.el).getPropertyValue('--peak')) || f.peak;
          f.x = Math.min(f.x, box.w - 20);
          f.y = Math.min(f.y, box.h - 20);
          f.newTarget();
        });
      }, 150);
    });
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

  /* ── липкая панель звонка на телефоне ──
     Между первым экраном и формой внизу точек контакта не было вовсе. */
  /* Шапка с телефоном и липкая панель включаются в одной точке — когда обложка ушла
     вверх. Переключение классов не читает раскладку, поэтому идёт прямо в обработчике
     прокрутки: так оно срабатывает даже там, где кадры анимации придерживаются. */
  var lastY = 0;
  var callbar = document.querySelector('.callbar');
  if ((bar && firstScreen) || callbar) {
    var past = null;
    var sticky = function () {
      var limit = firstScreen ? firstScreen.offsetHeight * 0.5 : 200;
      var now = (window.scrollY || window.pageYOffset) > limit;
      if (now === past) { return; }
      past = now;
      if (bar && hero) { bar.classList.toggle('is-solid', now); }
      /* шапка уходит при движении вниз и возвращается при движении вверх:
         так на длинной странице она не закрывает кадры */
      if (bar) {
        var y = pageYOffset;
        var down = y > lastY + 6;
        var up = y < lastY - 6;
        if (down && y > innerHeight * 0.9 && !document.body.classList.contains('is-locked')) {
          bar.classList.add('is-away');
        } else if (up || y < 60) {
          bar.classList.remove('is-away');
        }
        lastY = y;
      }
      if (callbar) { document.body.classList.toggle('has-callbar', now); }
    };
    addEventListener('scroll', sticky, { passive: true });
    addEventListener('resize', sticky);
    sticky();
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
          if (!data || !data[key] || !data[key].length) { return; }
          writePhrase(el, data[key]);
        });
      });
    }, { rootMargin: '150px 0px 0px 0px' });
    penTargets.forEach(function (el) { penIO.observe(el); });
  }

  /* ── кинолента: кадры меняются сами, скролл страницы не перехватывается ── */
  var cine = document.querySelector('[data-cine]');
  if (cine) {                            /* карусель работает всегда: прокрутку не трогаем */
    var cineTrack = cine.querySelector('.cine__track');
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
      cineTrack.style.transform = 'translate3d(' + (-index * 100) + '%,0,0)';
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

  /* ══════════════ отбор планировок по комнатности ══════════════
     Планировок много, поэтому без отбора страница читается как свалка.
     Без скрипта кнопки просто не появляются: разметка отдаёт все планировки. */
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

    var applyPicker = function () {
      var max = range ? parseFloat(range.value) : Infinity;
      var shown = 0;
      cards.forEach(function (card) {
        var fits = (!rooms || card.dataset.rooms === rooms)
          && (parseFloat(card.dataset.area) <= max + 0.001);
        card.hidden = !fits;
        if (fits) { shown += 1; }
      });
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
      var shown = applyPicker();
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
    var mark = function (el, bad) { el.closest('.field').classList.toggle('invalid', bad); };

    form.addEventListener('focusin', function () {
      if (!opened) { opened = true; track('lead_form_open', { page: location.pathname }); }
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
      mark(form.elements.name, !nameOk);
      mark(form.elements.phone, !phoneOk);
      if (!nameOk || !phoneOk || !form.elements.consent.checked) {
        statusEl.textContent = phrase.bad;
        statusEl.classList.add('err');
        track('lead_error', { reason: 'validation' });
        return;
      }

      btn.disabled = true;
      btn.textContent = phrase.sending;
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
        btn.textContent = btnText;
      });
    });
  });

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
