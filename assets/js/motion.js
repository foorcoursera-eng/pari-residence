/* PARI Residence — движение на GSAP + ScrollTrigger (+ Lenis на десктопе).

   Одна шкала времени и одна кривая на весь сайт (см. :root в styles.css):
     micro .18 · ui .34 · editorial .62 · cinematic .96, ease power4.out.
   Правило отбора: движение либо строит иерархию, либо показывает состояние,
   либо даёт глубину — иначе его здесь нет. Анимируются только transform и
   opacity. Без GSAP (или при prefers-reduced-motion) страница статична и
   полностью читается: все примитивы ниже — надстройка над разметкой. */
(function () {
  'use strict';

  var root = document.documentElement;
  if (!window.gsap || !window.ScrollTrigger || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.remove('has-motion');      /* класс поставил inline-скрипт в head — снимаем, страница статична */
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  root.classList.add('has-motion');

  var wide = matchMedia('(min-width:900px)').matches;
  var pointer = wide && matchMedia('(hover:hover)').matches;
  /* На телефоне ходы короче и ближе: экран узкий, а палец — быстрее колеса. */
  var K = wide ? 1 : 0.78;
  var T = { micro: 0.18, ui: 0.34, ed: 0.62 * K, cine: 0.96 * K };
  var EASE = 'power4.out';
  var clamp = gsap.utils.clamp;

  /* ── 0 · инерционная прокрутка ──
     Страница догоняет колесо с небольшой задержкой — это и отличает дорогой
     сайт. На тач-устройствах не включаем: там родная прокрутка точнее и не
     мешает липкой панели звонка. Якоря ведём той же инерцией. */
  var lenis = null;
  if (pointer && window.Lenis) {
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

  /* ── 1 · заголовки выходят построчно ──
     Строки уже размечены в тексте переносами: каждую прячем в свою маску и
     поднимаем со сдвигом. Строки первого экрана ведёт его собственная
     хореография (data-hero-lines), здесь их пропускаем. */
  var splitLines = function (el) {
    if (el.querySelector('.line')) { return; }
    var parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map(function (part) {
      return '<span class="line"><span>' + part.trim() + '</span></span>';
    }).join('');
  };
  document.querySelectorAll('[data-lines]:not([data-hero-lines])').forEach(function (el) {
    splitLines(el);
    el.classList.add('is-in');
    gsap.from(el.querySelectorAll('.line > span'), {
      yPercent: 108, duration: T.cine, ease: EASE, stagger: 0.08,
      scrollTrigger: { trigger: el, start: 'top 86%', once: true },
    });
  });

  /* ── 2 · блоки проявляются по мере подхода ──
     Одно наблюдение на все блоки, а не свой триггер на каждый: на главной
     их под сотню. Пришедшие в кадр одной пачкой выходят со сдвигом, кадры
     идут длиннее и выше, чем подписи. */
  var isPhoto = function (el) { return !!el.querySelector('img') || el.tagName === 'IMG'; };
  var reveals = gsap.utils.toArray('.reveal');
  if (reveals.length) {
    gsap.set(reveals, { opacity: 0, y: function (i, el) { return (isPhoto(el) ? 40 : 22) * K; } });
    ScrollTrigger.batch(reveals, {
      start: 'top 88%', once: true,
      onEnter: function (batch) {
        batch.forEach(function (el) { el.classList.add('is-in'); });
        gsap.to(batch, {
          opacity: 1, y: 0, ease: EASE, stagger: 0.08,
          duration: function (i, el) { return isPhoto(el) ? T.cine : T.ed + 0.2; },
        });
      },
    });
  }

  /* дети выходят по очереди: списки материалов, времена в пути, факты */
  gsap.utils.toArray('[data-stagger]').forEach(function (group) {
    var kids = group.children;
    if (!kids.length) { return; }
    gsap.from(kids, {
      opacity: 0, y: 14, duration: T.ed, ease: EASE, stagger: 0.06,
      scrollTrigger: { trigger: group, start: 'top 90%', once: true },
    });
  });

  /* ── 3 · кадры выезжают из-под маски ──
     Направление задаёт композиция (data-mask="up|left|right"), кадр внутри
     садится с 1.06 к 1. Старый .figure-mask — то же движение снизу. */
  var MASKS = {
    up: ['inset(0 0 100% 0)', 'inset(0 0 0% 0)'],
    down: ['inset(100% 0 0 0)', 'inset(0% 0 0 0)'],
    left: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'],
    right: ['inset(0 0 0 100%)', 'inset(0 0 0 0%)'],
  };
  gsap.utils.toArray('[data-mask], .figure-mask').forEach(function (el) {
    var dir = MASKS[el.getAttribute('data-mask')] || MASKS.up;
    var img = el.querySelector('img, video');
    var tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    tl.fromTo(el, { clipPath: dir[0] }, { clipPath: dir[1], duration: 1.1 * K, ease: 'power3.inOut' });
    if (img) { tl.from(img, { scale: 1.07, duration: 1.5 * K, ease: 'power3.out' }, 0); }
  });

  /* ── 4 · глубина при прокрутке ──
     Картинка внутри рамки едет медленнее страницы. Ставим после загрузки:
     до прихода картинок высоты рамок не окончательные. Украшение не имеет
     права ронять остальное — отсюда защита. На телефоне амплитуда меньше. */
  var parallax = function (selector, amount) {
    var run = function () {
      gsap.utils.toArray(selector).forEach(function (img) {
        try {
          gsap.fromTo(img, { yPercent: -amount }, {
            yPercent: amount, ease: 'none',
            scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
          });
        } catch (e) { /* без параллакса кадр просто стоит на месте */ }
      });
    };
    if (document.readyState === 'complete') { run(); } else { addEventListener('load', run); }
  };
  parallax('.split__media img', wide ? 5 : 3);
  parallax('.s-frame__media:not([data-grow]) img', wide ? 4 : 2.5);
  parallax('.s-final__media img', wide ? 4 : 2.5);
  parallax('.gallery__grid .shot img', wide ? 4 : 2.5);
  parallax('[data-parallax] > img', wide ? 4 : 2.5);

  /* ── 5 · первый экран ──
     Кадр виден с первого кадра; текст собирается сверху вниз: адрес → имя →
     слоган построчно из-под маски → подпись → кнопки → шапка → подсказка
     прокрутки. Кадр за это время садится с 1.06 к 1. */
  var hero = document.querySelector('.s-hero');
  if (hero) {
    var media = hero.querySelector('[data-hero-media]');
    var panel = hero.querySelector('[data-hero-panel]');
    var steps = hero.querySelectorAll('[data-hero-step]');
    var lines = hero.querySelector('[data-hero-lines]');
    var scrollHint = hero.querySelector('[data-hero-scroll]');
    var bar = document.querySelector('[data-bar-intro]');
    var video = hero.querySelector('.s-hero__video');

    /* is-in ставим до создания твина: GSAP читает базовый transform из
       CSS, и сдвиг «до появления» иначе прибавился бы к его собственному */
    if (lines) { splitLines(lines); lines.classList.add('is-in'); }
    var lineSpans = lines ? lines.querySelectorAll('.line > span') : [];

    var intro = gsap.timeline({ defaults: { ease: EASE } });
    if (media) { intro.fromTo(media, { scale: 1.06 }, { scale: 1, duration: 2.4, ease: 'power2.out' }, 0); }
    if (steps[0]) { intro.fromTo(steps[0], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: T.ed }, 0.15); }
    if (steps[1]) { intro.fromTo(steps[1], { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: T.ed }, 0.28); }
    if (lineSpans.length) {
      /* 160, а не 112: маска строк слогана расширена вниз на .5em под хвосты
         рукописных J/j/q (styles.css), и из-под неё надо уходить дальше */
      intro.fromTo(lineSpans, { yPercent: 160 }, { yPercent: 0, duration: T.cine, stagger: 0.11 }, 0.34);
    }
    for (var i = 2; i < steps.length; i++) {
      intro.fromTo(steps[i], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: T.ed }, 0.72 + (i - 2) * 0.16);
    }
    if (bar) { intro.add(function () { bar.classList.add('is-in'); }, 1.1); }
    if (scrollHint) { intro.fromTo(scrollHint, { opacity: 0 }, { opacity: 1, duration: T.ed }, 1.35); }

    /* уход: следующий разворот наезжает на закреплённый кадр; панель уходит
       вверх и растворяется, кадр едва заметно приближается (1 → 1.035) */
    var next = hero.nextElementSibling;
    if (next) {
      var exit = gsap.timeline({
        scrollTrigger: {
          trigger: next, start: 'top bottom', end: 'top top', scrub: 0.4, invalidateOnRefresh: true,
          /* когда первый экран закрыт целиком, прячем его: иначе он
             просвечивал в зазорах, когда главы ниже отступают вглубь */
          onLeave: function () { hero.style.visibility = 'hidden'; if (video && !video.paused) { video.pause(); video.dataset.held = '1'; } },
          onEnterBack: function () { hero.style.visibility = ''; if (video && video.dataset.held) { delete video.dataset.held; video.play().catch(function () {}); } },
        },
      });
      if (media) { exit.fromTo(media, { scale: 1 }, { scale: 1.035, ease: 'none' }, 0); }
      if (panel) { exit.to(panel, { y: -48, opacity: 0, ease: 'power1.in' }, 0); }
      if (scrollHint) { exit.to(scrollHint, { opacity: 0, ease: 'none', duration: 0.3 }, 0); }
    }

    /* глубина от курсора: кадр ±6 px, панель ∓3 px, с интерполяцией */
    if (pointer && media) {
      var mx = gsap.quickTo(media, 'x', { duration: 0.9, ease: 'power3.out' });
      var my = gsap.quickTo(media, 'y', { duration: 0.9, ease: 'power3.out' });
      /* панель по вертикали ведёт уход при прокрутке, поэтому от курсора
         она откликается только по горизонтали */
      var px = panel ? gsap.quickTo(panel, 'x', { duration: 1.1, ease: 'power3.out' }) : null;
      hero.addEventListener('pointermove', function (e) {
        var dx = (e.clientX / innerWidth - 0.5) * 2;
        var dy = (e.clientY / innerHeight - 0.5) * 2;
        mx(dx * 6); my(dy * 6);
        if (px) { px(dx * -3); }
      }, { passive: true });
      hero.addEventListener('pointerleave', function () { mx(0); my(0); if (px) { px(0); } });
    }
  }

  /* ── 5б · переходы между главами ──
     Следующая глава наезжает на предыдущую, как страница на страницу:
     входящая поднимается на 56 px (36 на телефоне) и прочерчивает по верхней
     кромке золотую нить, уходящая чуть отступает вглубь и светлеет. Всё —
     scrub, только transform и opacity; перекрытие задаёт CSS-отступ. */
  if (hero) {
    var chapters = [].slice.call(hero.parentElement.children).filter(function (el) {
      return el !== hero && el.tagName === 'SECTION';
    });
    var lift = wide ? 56 : 36;
    chapters.forEach(function (ch, i) {
      ch.style.zIndex = String(2 + i);
      if (getComputedStyle(ch).position === 'static') { ch.style.position = 'relative'; }
      var thread = document.createElement('span');
      thread.className = 'chapter__thread'; thread.setAttribute('aria-hidden', 'true');
      ch.appendChild(thread);
      var veil = document.createElement('span');
      veil.className = 'chapter__veil'; veil.setAttribute('aria-hidden', 'true');
      ch.appendChild(veil);
      ch.__veil = veil;
      if (i === 0) { return; }             /* первая глава уже наезжает на закреплённый кадр */
      var prev = chapters[i - 1];
      var turn = gsap.timeline({
        scrollTrigger: { trigger: ch, start: 'top bottom', end: 'top 28%', scrub: 0.5, invalidateOnRefresh: true },
      });
      turn.fromTo(ch, { y: lift }, { y: 0, ease: 'none' }, 0)
        .fromTo(thread, { scaleX: 0, opacity: 1 }, { scaleX: 1, ease: 'power1.out', duration: 0.7 }, 0)
        .to(thread, { opacity: 0, duration: 0.3 }, 0.7)
        .fromTo(prev, { scale: 1, transformOrigin: '50% 100%' }, { scale: wide ? 0.972 : 0.98, ease: 'none' }, 0)
        .fromTo(prev.__veil, { opacity: 0 }, { opacity: 0.42, ease: 'none' }, 0);
    });
  }

  /* ── 6 · концепция: Париж × Самарканд → PARI ──
     На широком экране сцена закреплена на 2,2 экрана: два кадра стоят по
     краям, разведённые наружу, и по мере прокрутки сходятся к центру, где
     на светлой панели рождается PARI. На телефоне сцена не закреплена и
     стоит статичной — кадры выходят из-под маски. */
  var concept = document.querySelector('[data-concept]');
  if (concept && wide) {
    var paris = concept.querySelector('[data-concept-side="paris"]');
    var samarkand = concept.querySelector('[data-concept-side="samarkand"]');
    var core = concept.querySelector('[data-concept-core]');
    var section = concept.parentElement;
    var tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: 0.5, invalidateOnRefresh: true },
    });
    tl.fromTo(paris, { xPercent: -22 }, { xPercent: 0, ease: 'none', duration: 0.55 }, 0)
      .fromTo(samarkand, { xPercent: 22 }, { xPercent: 0, ease: 'none', duration: 0.55 }, 0)
      .fromTo(gsap.utils.toArray([paris, samarkand].map(function (s) { return s.querySelectorAll('img, video'); })), { scale: 1.14 }, { scale: 1, ease: 'none', duration: 0.55 }, 0)
      .fromTo(core, { opacity: 0, y: 36, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, ease: 'power2.out', duration: 0.3,
        onStart: function () { core.classList.add('is-on'); }, onReverseComplete: function () { core.classList.remove('is-on'); } }, 0.5)
      /* слова двух миров уступают место панели: дальше их называет она сама */
      .to(concept.querySelectorAll('.s-concept__word'), { opacity: 0, y: 12, ease: 'power1.in', duration: 0.2 }, 0.5)
      .to({}, { duration: 0.15 });
  } else if (concept) {
    concept.querySelectorAll('[data-concept-side]').forEach(function (side) {
      var media = side.querySelectorAll('img, video');
      gsap.timeline({ scrollTrigger: { trigger: side, start: 'top 85%', once: true } })
        .fromTo(side, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.1, ease: 'power3.inOut' })
        .from(media, { scale: 1.07, duration: 1.5, ease: 'power3.out' }, 0);
    });
  }

  /* ── 7 · двор: кадр раскрывается из рамки в полный экран ──
     Единственное раскрытие на сайте. Кадр начинается в 78 % и доходит до
     края, пока разворот занимает экран; дальше стоит как обычный кадр. */
  gsap.utils.toArray('[data-grow]').forEach(function (m) {
    var sec = m.closest('section') || m.parentElement;
    gsap.fromTo(m, { scale: wide ? 0.78 : 0.9, transformOrigin: '50% 50%' }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top bottom', end: 'top 12%', scrub: 0.4, invalidateOnRefresh: true },
    });
  });

  /* ── 8 · день, рассказанный кварталом ──
     Кадр слева закреплён (CSS sticky), ступени справа. При подходе ступени
     к середине экрана меняется кадр и индекс; переходы резкие, по стадиям. */
  var day = document.querySelector('[data-day]');
  if (day && wide) {
    var imgs = day.querySelectorAll('[data-day-img]');
    var index = day.querySelector('[data-day-index]');
    var stepEls = day.querySelectorAll('[data-day-step]');
    var setStage = function (n) {
      imgs.forEach(function (im, i) { im.classList.toggle('is-on', i === n); });
      stepEls.forEach(function (st, i) { st.classList.toggle('is-on', i === n); });
      if (index) { index.textContent = '0' + (n + 1) + ' / 0' + stepEls.length; }
    };
    stepEls.forEach(function (st, i) {
      ScrollTrigger.create({
        trigger: st, start: 'top 55%', end: 'bottom 55%',
        onEnter: function () { setStage(i); }, onEnterBack: function () { setStage(i); },
      });
    });
  }

  /* ── 9 · ленты, которые листаются пальцем ──
     Полоски под лентой показывают, где мы находимся, и переносят к кадру. */
  if (!wide) {
    var railInit = function (track, items, dots) {
      if (!track || items.length < 2) { return; }
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
    /* лента планировок на главной: точки в разметке, стрелки листают по кадру,
       «дальше» подмигивает, пока ленту не тронули */
    document.querySelectorAll('[data-strip]').forEach(function (track) {
      var items = [].slice.call(track.children).filter(function (el) { return el.tagName !== 'SPAN'; });
      /* стрелки стоят сразу за лентой или в следующем блоке (галереи «О проекте») */
      var sib = track.nextElementSibling;
      var nav = sib && (sib.hasAttribute('data-strip-nav') ? sib : sib.querySelector('[data-strip-nav]'));
      if (!nav || items.length < 2) { return; }
      var dotsBox = nav.querySelector('[data-strip-dots]');
      var prev = nav.querySelector('[data-strip-prev]');
      var next = nav.querySelector('[data-strip-next]');
      var dots = items.map(function (item, i) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'rail-dots__dot' + (i === 0 ? ' is-on' : '');
        b.setAttribute('role', 'tab');
        var cap = item.querySelector('.plan__area, figcaption');
        b.setAttribute('aria-label', cap ? cap.textContent.trim() : String(i + 1));
        dotsBox.appendChild(b);
        return b;
      });
      railInit(track, items, dots);
      var nearest = function () {
        var box = track.getBoundingClientRect(); var best = 0, d0 = Infinity;
        items.forEach(function (it, i) { var r = it.getBoundingClientRect(); var d = Math.abs((r.left + r.width / 2) - (box.left + box.width / 2)); if (d < d0) { d0 = d; best = i; } });
        return best;
      };
      var go = function (i) {
        i = Math.max(0, Math.min(items.length - 1, i));
        var box = track.getBoundingClientRect(); var r = items[i].getBoundingClientRect();
        track.scrollBy({ left: (r.left + r.width / 2) - (box.left + box.width / 2), behavior: 'smooth' });
      };
      var edges = function () {
        var n = nearest();
        if (prev) { prev.disabled = n === 0; }
        if (next) { next.disabled = n === items.length - 1; }
      };
      if (prev) { prev.addEventListener('click', function () { go(nearest() - 1); }); }
      if (next) { next.addEventListener('click', function () { go(nearest() + 1); }); }
      if (next) { next.classList.add('is-nudge'); }
      var settled = null;
      track.addEventListener('scroll', function () {
        if (next) { next.classList.remove('is-nudge'); }
        clearTimeout(settled); settled = setTimeout(edges, 120);
      }, { passive: true });
      /* стрелки живут, только пока лента шире экрана: на планшете кадры
         встают сеткой, и листать нечего */
      var live = function () { nav.classList.toggle('is-live', track.scrollWidth > track.clientWidth + 4); };
      live(); addEventListener('resize', live); addEventListener('load', live);
      edges();
    });

  }

  /* ── 10 · цифры набегают — один раз, только чистые числа ── */
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
      onInterrupt: function () { el.textContent = target + suffix; },
    });
  });

  /* ── 11 · золотая нить прогресса под шапкой ── */
  var progress = document.querySelector('.bar__progress');
  if (progress) {
    gsap.to(progress, {
      scaleX: 1, ease: 'none', transformOrigin: 'left center',
      scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.4 },
    });
  }

  /* ── 12 · магнит только у главных кнопок ──
     Смещение до 6 px: жест считывается, а не бросается в глаза. */
  if (pointer) {
    document.querySelectorAll('[data-magnet]').forEach(function (btn) {
      var pull = gsap.quickTo(btn, 'x', { duration: 0.55, ease: 'power3.out' });
      var lift = gsap.quickTo(btn, 'y', { duration: 0.55, ease: 'power3.out' });
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        pull(clamp(-6, 6, (e.clientX - r.left - r.width / 2) * 0.12));
        lift(clamp(-5, 5, (e.clientY - r.top - r.height / 2) * 0.16));
      }, { passive: true });
      btn.addEventListener('pointerleave', function () { pull(0); lift(0); });
    });
  }

  /* ── 13 · переход между страницами ──
     Уходящая страница бледнеет и приподнимается за 320 мс, новая приходит
     сразу: без заставок между разделами. */
  var main = document.querySelector('main');
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') { return; }
    var href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#' || href.indexOf('tel:') === 0 || href.indexOf('mailto:') === 0) { return; }
    if (a.hostname && a.hostname !== location.hostname) { return; }
    if (!main) { return; }
    e.preventDefault();
    root.classList.add('is-leaving');
    setTimeout(function () { location.href = href; }, 320);
  });
  addEventListener('pageshow', function (e) { if (e.persisted) { root.classList.remove('is-leaving'); } });

  /* ── 14 · арка над рендером ──
     Кадр в арке выходит вперёд и потом едва заметно качается; пока раздел
     вне экрана, качание стоит. */
  var arch = document.querySelector('.art--arch');
  if (arch) {
    gsap.fromTo(arch, { opacity: 0, yPercent: 8, scale: 0.965 }, {
      opacity: 1, yPercent: 0, scale: 1, duration: 1.5, ease: EASE,
      scrollTrigger: { trigger: arch, start: 'top 88%', once: true },
      onComplete: function () {
        var swim = gsap.to(arch, { yPercent: -3.2, duration: 6.5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        ScrollTrigger.create({
          trigger: arch, start: 'top bottom', end: 'bottom top',
          onToggle: function (self) { if (self.isActive) { swim.play(); } else { swim.pause(); } },
        });
      },
    });
  }

  /* Пересчёт после загрузки и после подмены шрифтов: пока висит подстановочный
     шрифт, высоты блоков другие, и границы разделов уезжают. */
  addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();
