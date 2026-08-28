/* ==========================================================================
   PARI Residence — движение страницы на GSAP + ScrollTrigger.

   Файл подключается перед script.js и, если GSAP на месте, ставит на <html>
   класс has-motion. По нему script.js уступает: свои появления блоков и
   автопрокрутку киноленты он не запускает, чтобы эффекты не дублировались.

   Без GSAP, при выключенных анимациях в системе и без JS вообще страница
   работает как раньше — просто без движения.

   Тон движения задан гайдбуком: медленно, без пружин и отскоков, золото
   только тонкой линией. Ничего не «выпрыгивает».
   ========================================================================== */

(function () {
  'use strict';

  if (!window.gsap || !window.ScrollTrigger) { return; }
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { return; }

  gsap.registerPlugin(ScrollTrigger);

  var root = document.documentElement;
  root.classList.add('has-motion');

  var wide = matchMedia('(min-width:900px)').matches;
  var EASE = 'power2.out';

  /* ── 0 · инерционная прокрутка ──
     Страница догоняет колесо с небольшой задержкой — именно это ощущение
     отличает дорогой сайт от обычного. На тач-устройствах не включаем:
     там родная прокрутка точнее и не мешает липкой панели звонка. */
  var lenis = null;
  if (wide && window.Lenis && matchMedia('(hover:hover)').matches) {
    lenis = new Lenis({
      duration: 1.05,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      syncTouch: false,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    root.classList.add('has-smooth');   /* не 'has-lenis': Lenis вырезает подстроку lenis из className */

    /* якорные ссылки ведём той же инерцией, иначе прыжок выбивается из ритма */
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) { return; }
      var id = a.getAttribute('href');
      if (id.length < 2) { return; }
      var target = document.querySelector(id);
      if (!target) { return; }
      e.preventDefault();
      lenis.scrollTo(target, { offset: -70, duration: 1.4 });
    });
  }

  /* ── 1 · первый экран: кадр квартала раскрывается ──
     Раздел вдвое выше окна, сцена внутри липкая: пока идёт прокрутка, рамка
     со снимком растёт до полного экрана, а логотип со слоганом растворяется.
     Без GSAP кадр просто остаётся в рамке — первый экран не ломается. */
  var lead = document.querySelector('.opening');
  if (lead) {
    var frame = lead.querySelector('[data-open-frame]');
    var head = lead.querySelector('[data-open-head]');
    var narrow = function () { return innerWidth <= 700; };

    if (frame) {
      gsap.fromTo(frame,
        {
          width: function () { return narrow() ? '88%' : '66%'; },
          height: function () { return Math.round(innerHeight * (narrow() ? 0.38 : 0.42)); },
        },
        {
          width: '100%',
          height: function () { return innerHeight; },
          ease: 'none',
          scrollTrigger: {
            trigger: lead, start: 'top top', end: 'bottom bottom',
            scrub: 0.5, invalidateOnRefresh: true,
          },
        });
    }

    /* Одна шкала прокрутки ведёт весь первый экран: рамка раскрывается,
       чертёж уходит, снимок проявляется и добирает цвет. Считаем всё в одном
       обработчике — так этапы гарантированно совпадают по фазе. */
    var plan = frame && frame.querySelector('.opening__plan');
    var shot = frame && frame.querySelector('.opening__shot');
    if (plan || shot) {
      var seg = function (p, a, b) {
        var v = (p - a) / (b - a);
        return v < 0 ? 0 : v > 1 ? 1 : v;
      };
      ScrollTrigger.create({
        trigger: lead, start: 'top top', end: 'bottom bottom',
        scrub: 0.5, invalidateOnRefresh: true,
        onUpdate: function (self) {
          var p = self.progress;
          /* Окна не пересекаются: первый кадр уходит полностью, и только
             потом приходит второй. При наложении двух разных ракурсов
             получается каша из полупрозрачных зданий. */
          if (plan) { plan.style.opacity = (1 - seg(p, 0.26, 0.46)).toFixed(3); }
          if (shot) {
            shot.style.opacity = seg(p, 0.42, 0.62).toFixed(3);
            var g = 1 - seg(p, 0.52, 0.96);
            shot.style.filter = g < 0.005 ? 'none' : 'grayscale(' + g.toFixed(2) + ')';
          }
          frame.classList.toggle('is-photo', p < 0.30 || p > 0.52);
        },
      });
    }

    if (head) {
      gsap.to(head, {
        opacity: 0, y: -34, ease: 'none',
        scrollTrigger: {
          trigger: lead, start: 'top top',
          end: function () { return '+=' + innerHeight * 0.55; },
          scrub: 0.5, invalidateOnRefresh: true,
        },
      });
    }
  }

  /* ── 2 · заголовки выходят построчно ──
     Строки уже размечены в тексте переносами: каждую прячем в свою маску
     и поднимаем со сдвигом друг за другом. */
  document.querySelectorAll('[data-lines]').forEach(function (el) {
    if (el.querySelector('.line')) { return; }              /* уже разобран */
    var parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map(function (part) {
      return '<span class="line"><span>' + part.trim() + '</span></span>';
    }).join('');
    el.classList.add('is-in');                              /* маски открыты, двигаем сами */

    gsap.from(el.querySelectorAll('.line > span'), {
      yPercent: 108, duration: 1.15, ease: 'power3.out', stagger: 0.09,
      scrollTrigger: { trigger: el, start: 'top 86%', once: true },
    });
  });

  /* ── 3 · блоки проявляются по мере подхода ── */
  gsap.utils.toArray('.reveal').forEach(function (el) {
    gsap.from(el, {
      opacity: 0, y: 26, duration: 1.1, ease: EASE,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  /* ── 4 · кадры выезжают из-под маски ── */
  gsap.utils.toArray('.figure-mask').forEach(function (el) {
    var img = el.querySelector('img');
    var tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    tl.fromTo(el, { clipPath: 'inset(0 0 100% 0)' },
      { clipPath: 'inset(0 0 0% 0)', duration: 1.4, ease: 'power3.inOut' });
    if (img) { tl.from(img, { scale: 1.16, duration: 1.8, ease: 'power3.out' }, 0); }
  });

  /* ── 5 · фотографии дышат при прокрутке ──
     Картинка внутри своей рамки едет медленнее страницы. */
  var parallax = function (selector, amount) {
    gsap.utils.toArray(selector).forEach(function (img) {
      gsap.fromTo(img, { yPercent: -amount }, {
        yPercent: amount, ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  };
  /* На телефоне пина и инерции нет, поэтому параллакс — единственное, что даёт
     кадрам глубину. Амплитуду там уменьшаем: экран узкий, сдвиг заметнее. */
  parallax('.split__media img', wide ? 5 : 3);
  parallax('.gallery .shot img', wide ? 4 : 2.5);
  /* внутри ленты, которую тянут пальцем, вертикальный параллакс дрожит — не ставим */

  /* ── 6 · кинолента листается горизонтально ──
     Секция задерживается на экране, кадры едут вбок ровно на длину ленты.
     На узких экранах остаётся обычная вертикальная лента — там пин мешает. */
  var cine = document.querySelector('[data-cine]');
  if (cine && wide) {
    var track = cine.querySelector('.cine__track');
    var frames = cine.querySelectorAll('.frame');
    if (track && frames.length > 1) {
      cine.classList.add('is-rail');
      var distance = function () { return track.scrollWidth - window.innerWidth; };

      gsap.to(track, {
        x: function () { return -distance(); },
        ease: 'none',
        scrollTrigger: {
          trigger: cine,
          start: 'top top',
          end: function () { return '+=' + distance(); },
          pin: true,
          scrub: 0.7,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: function (self) {
            var i = Math.round(self.progress * (frames.length - 1));
            cine.querySelectorAll('[data-cine-go]').forEach(function (dot, k) {
              dot.classList.toggle('is-on', k === i);
              dot.setAttribute('aria-selected', k === i ? 'true' : 'false');
            });
          },
        },
      });

      /* подпись кадра приподнимается, когда кадр в центре экрана */
      frames.forEach(function (frame) {
        var cap = frame.querySelector('.frame__cap');
        if (!cap) { return; }
        gsap.from(cap, {
          y: 24, opacity: 0, duration: 0.8, ease: EASE,
          scrollTrigger: { trigger: frame, containerAnimation: null, start: 'top 90%', once: true },
        });
      });
    }
  }

  /* ── 6б · ленты, которые листаются пальцем ──
     Полоски под лентой показывают, где мы находимся, и переносят к нужному кадру. */
  if (!wide) {
    var railInit = function (track, items, dots) {
      if (!track || items.length < 2) { return; }
      /* положение считаем от самой ленты: offsetLeft у кадров отмеряется
         от секции, а не от прокручиваемого контейнера, и промахивается */
      var centerShift = function (item) {
        var box = track.getBoundingClientRect();
        var r = item.getBoundingClientRect();
        return (r.left + r.width / 2) - (box.left + box.width / 2);
      };
      var sync = function () {
        var near = 0, best = Infinity;
        items.forEach(function (item, i) {
          var d = Math.abs(centerShift(item));
          if (d < best) { best = d; near = i; }
        });
        dots.forEach(function (dot, i) {
          dot.classList.toggle('is-on', i === near);
          if (dot.tagName === 'BUTTON') { dot.setAttribute('aria-selected', i === near ? 'true' : 'false'); }
        });
      };
      var timer = null;
      track.addEventListener('scroll', function () {
        if (timer) { return; }
        timer = requestAnimationFrame(function () { timer = null; sync(); });
      }, { passive: true });
      dots.forEach(function (dot, i) {
        dot.addEventListener('click', function () {
          track.scrollBy({ left: centerShift(items[i]), behavior: 'smooth' });
        });
      });
      sync();
    };

    var cineTrack = document.querySelector('.cine__track');
    if (cineTrack) {
      railInit(cineTrack,
        [].slice.call(cineTrack.querySelectorAll('.frame')),
        [].slice.call(document.querySelectorAll('[data-cine-go]')));
    }

    var grid = document.querySelector('.gallery__grid');
    if (grid) {
      var shots = [].slice.call(grid.querySelectorAll('.shot'));
      var rowDots = document.createElement('div');
      rowDots.className = 'gallery__rail-dots';
      rowDots.setAttribute('aria-hidden', 'true');
      shots.forEach(function () { rowDots.appendChild(document.createElement('i')); });
      grid.parentNode.insertBefore(rowDots, grid.nextSibling);
      railInit(grid, shots, [].slice.call(rowDots.children));
    }
  }

  /* ── 7 · цифры набегают ── */
  gsap.utils.toArray('[data-count]').forEach(function (el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    if (!isFinite(target)) { return; }
    var box = { v: 0 };
    gsap.to(box, {
      v: target, duration: 1.6, ease: 'power1.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: function () { el.textContent = Math.round(box.v) + suffix; },
      onComplete: function () { el.textContent = target + suffix; },
      /* если анимацию прервали (уход со вкладки, слабый телефон) — цифра
         обязана остаться настоящей, а не застыть на полпути */
      onInterrupt: function () { el.textContent = target + suffix; },
    });
  });

  /* ── 8 · буквенный паттерн сносит вбок ── */
  var homes = document.querySelector('.homes');
  if (homes && wide) {
    gsap.fromTo(homes, { '--pattern-shift': '-40px' }, {
      '--pattern-shift': '40px', ease: 'none',
      scrollTrigger: { trigger: homes, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }

  /* ── 9 · золотая нить прогресса под шапкой ── */
  var progress = document.querySelector('.bar__progress');
  if (progress) {
    gsap.to(progress, {
      scaleX: 1, ease: 'none', transformOrigin: 'left center',
      scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.4 },
    });
  }

  /* ── 10 · первый экран собирается по порядку ──
     Надстрочник, затем письмо логотипа (его ведёт script.js), затем фраза и кнопка. */
  if (lead) {
    /* Кнопку звонка сюда не берём: её прозрачностью управляет класс на body
       (пока человек на первом экране — она в рамке, дальше её роль берёт пара
       кнопок в углу). Инлайновое значение от GSAP этот класс перебило бы. */
    var order = [lead.querySelector('.opening__eyebrow'), lead.querySelector('.opening__sub')].filter(Boolean);
    gsap.fromTo(order, { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 1.2, ease: EASE, stagger: 0.45, delay: 0.3 });
  }

  /* ── 11 · кнопка звонка тянется к курсору ──
     Смещение крошечное: жест должен считываться, а не бросаться в глаза. */
  if (wide && window.matchMedia('(hover:hover)').matches) {
    document.querySelectorAll('.cta, .btn-gold, .btn--call').forEach(function (btn) {
      var pull = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3.out' });
      var lift = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3.out' });
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        pull((e.clientX - r.left - r.width / 2) * 0.16);
        lift((e.clientY - r.top - r.height / 2) * 0.22);
      });
      btn.addEventListener('pointerleave', function () { pull(0); lift(0); });
    });
  }

  /* ── 12 · переход между страницами ──
     Уход в затемнение и появление на новой странице: щелчка белым больше нет. */
  var veil = document.createElement('div');
  veil.className = 'page-veil';
  document.body.appendChild(veil);
  gsap.to(veil, { autoAlpha: 0, duration: 0.6, ease: EASE, onComplete: function () {
    veil.style.pointerEvents = 'none';
  } });

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') { return; }
    var href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#' || href.indexOf('tel:') === 0 || href.indexOf('mailto:') === 0) { return; }
    if (a.hostname && a.hostname !== location.hostname) { return; }
    e.preventDefault();
    gsap.to(veil, { autoAlpha: 1, duration: 0.42, ease: 'power2.in',
      onStart: function () { veil.style.pointerEvents = 'auto'; },
      onComplete: function () { location.href = href; } });
  });

  /* возврат «назад» из кэша браузера не должен оставлять затемнение */
  addEventListener('pageshow', function (e) { if (e.persisted) { gsap.set(veil, { autoAlpha: 0 }); } });

  /* пересчёт после подгрузки картинок: иначе длина ленты берётся до их появления */


  /* ── арка над рендером ──
     Кадр в арке выходит вперёд и потом едва заметно качается: движение
     медленное и без отскока, иначе получится баннер, а не квартал.
     Пока раздел вне экрана, качание стоит — незачем крутить кадры впустую. */
  var arch = document.querySelector('.art--arch');
  if (arch) {
    gsap.fromTo(arch, { opacity: 0, yPercent: 8, scale: 0.965 }, {
      opacity: 1, yPercent: 0, scale: 1, duration: 1.5, ease: EASE,
      scrollTrigger: { trigger: arch, start: 'top 88%', once: true },
      onComplete: function () {
        var swim = gsap.to(arch, {
          yPercent: -3.2, duration: 6.5, ease: 'sine.inOut', yoyo: true, repeat: -1,
        });
        ScrollTrigger.create({
          trigger: arch, start: 'top bottom', end: 'bottom top',
          onToggle: function (self) { if (self.isActive) { swim.play(); } else { swim.pause(); } },
        });
      },
    });
  }

  /* ── навигация по разделам: подсвечиваем тот, что сейчас на экране ── */
  var rail = document.querySelector('[data-rail]');
  if (rail) {
    var links = [].slice.call(rail.querySelectorAll('a'));
    links.forEach(function (a) {
      var target = document.querySelector(a.getAttribute('href'));
      if (!target) { a.hidden = true; return; }
      ScrollTrigger.create({
        trigger: target, start: 'top 60%', end: 'bottom 40%',
        onToggle: function (self) { a.classList.toggle('is-on', self.isActive); },
      });
    });
  }

  addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
