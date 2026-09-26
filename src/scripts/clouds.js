/* ==========================================================================
   PARI Residence — живые облака над генпланом (ERA: img_clouds над аэровидом).
   Видео «сложенное»: верхняя половина кадра — цвет облаков, нижняя — маска
   прозрачности (renders/make-clouds-video.py). WebGL собирает из них наложение
   с альфой: так прозрачное видео работает во всех браузерах, включая Safari.

   Прокрутка (от момента, когда сцена встала на экран, до её середины):
     слой поднимается и чуть укрупняется, как будто камера опускается сквозь
     облака; облака тают с тонких краёв (порог маски растёт), затем гаснут.
   В покое облака медленно плывут (видео + лёгкий дрейф кадра).
   Пока видео не готово или без WebGL — неподвижный кадр-постер с альфой.
   ========================================================================== */
import { onFrame } from './ticker.js';

const MOTION = document.documentElement.classList.contains('has-motion');
const MOBILE = matchMedia('(max-width: 991px)').matches;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const ease = (t) => t * t * (3 - 2 * t);

const VS = `attribute vec2 p; varying vec2 v; void main(){ v = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0., 1.); }`;
const FS = `precision mediump float;
varying vec2 v;
uniform sampler2D tex;
uniform vec4 map;      /* масштаб и сдвиг: координаты экрана → половина кадра */
uniform float t;       /* 0 — облака целиком, 1 — растаяли */
void main(){
  vec2 q = v * map.xy + map.zw;
  if (q.x < 0. || q.x > 1. || q.y < 0. || q.y > 1.) { gl_FragColor = vec4(0.); return; }
  float y = clamp(q.y, .002, .998) * .5;
  vec3 c = texture2D(tex, vec2(q.x, y)).rgb;
  float a = texture2D(tex, vec2(q.x, y + .5)).r;
  /* верхняя кромка слоя — сплошное облако, переходящее в светлую сцену выше: без просветов */
  float top = 1. - smoothstep(.08, .36, v.y);
  c = mix(c, vec3(.975, .97, .962), top * (1. - a));
  a = max(a, top);
  float th = t * .8;
  a = smoothstep(th, th + .32, a) * (1. - t * .35);
  a *= 1. - smoothstep(.84, 1., v.y);                  /* нижняя кромка слоя растворяется */
  gl_FragColor = vec4(c * a, a);
}`;

document.querySelectorAll('[data-clouds]').forEach((box) => {
  const sec = box.closest('section') || box.parentElement;
  const canvas = box.querySelector('[data-clouds-gl]');
  const poster = box.querySelector('[data-clouds-poster]');
  if (!MOTION) { box.style.opacity = '.85'; return; }        /* «меньше движения»: только постер */

  /* ---------- прокрутка: подъём, укрупнение, таяние ---------- */
  let target = 0, cur = 0;
  const progress = () => {
    const r = sec.getBoundingClientRect();
    const p = (window.innerHeight - r.top) / (window.innerHeight + r.height);   /* 0 — сцена вошла снизу, 1 — ушла вверх */
    /* облака держатся, пока сцена встаёт на экран, и расходятся дальше; на телефоне сцена ниже экрана — окно раньше */
    target = MOBILE ? clamp01((p - .3) / .45) : clamp01((p - .38) / .4);
  };

  /* ---------- WebGL ---------- */
  let gl = null, prog, tex, uMap, uT, video = null, ready = false, frameNew = false;
  if (canvas) {
    gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false }) ||
         canvas.getContext('experimental-webgl', { premultipliedAlpha: true, alpha: true });
  }
  if (gl) {
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) gl = null;
  }
  if (gl) {
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((k) => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    uMap = gl.getUniformLocation(prog, 'map');
    uT = gl.getUniformLocation(prog, 't');
    gl.clearColor(0, 0, 0, 0);
  }

  /* облака мягкие — плотность пикселей 1 на глаз не отличить, а шейдеру вдвое меньше работы */
  const size = () => {
    if (!gl) return;
    const dpr = 1;
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  const startVideo = () => {
    if (video || !gl) return;
    /* 1920-я версия — только на больших экранах: каждый кадр видео заливается в текстуру,
       и 1920×2160 против 1280×1440 — это в 2,25 раза больше данных 30 раз в секунду */
    const cw = canvas.clientWidth;
    video = document.createElement('video');
    video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'auto';
    video.setAttribute('muted', ''); video.setAttribute('playsinline', '');
    video.src = cw > 1800 ? box.dataset.srcDesk : cw > 700 ? (box.dataset.srcMid || box.dataset.srcDesk) : box.dataset.srcMob;   /* телефон — 640 (0,6 МБ вместо 1,8) */
    const mark = () => { frameNew = true; if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(mark); };
    video.addEventListener('playing', () => { ready = true; mark(); }, { once: true });
    video.play().catch(() => {});                              /* автозапуск запрещён — остаётся постер */
  };

  /* ---------- видимость: видео играет и кадры рисуются только рядом с экраном ---------- */
  let near = false;
  new IntersectionObserver((es) => {
    near = es[0].isIntersecting;
    if (near) { startVideo(); if (video && video.paused) video.play().catch(() => {}); }
    else if (video) video.pause();
  }, { rootMargin: '50% 0px' }).observe(sec);

  size();
  window.addEventListener('resize', size);

  let t0 = performance.now(), shown = false, sT = '', sO = '';
  onFrame('read', () => { if (near) progress(); });
  onFrame('write', (now, dt) => {
    if (near) {
      cur += (target - cur) * (1 - Math.exp(-dt * 5));        /* мягкое догоняние, как scrub .5 у ERA */
      if (Math.abs(target - cur) < 1e-4) cur = target;
      const e = ease(cur);
      const tr = `translate3d(0, ${(-e * 38).toFixed(2)}%, 0) scale(${(1 + e * .18).toFixed(4)})`;
      const op = (1 - ease(clamp01((cur - .55) / .45))).toFixed(3);
      if (tr !== sT) box.style.transform = sT = tr;
      if (op !== sO) box.style.opacity = sO = op;
      sec.classList.toggle('is-clouded', cur < .45);             /* подсказку «потяните» не показываем поверх облаков */
      const ui = cur < .5 ? 'light' : 'dark';                    /* на белых облаках шапка графитовая, на аэровиде — белая */
      if (sec.dataset.ui !== ui) sec.dataset.ui = ui;            /* цвет шапки проверяется каждый кадр (scenes.js) */
      /* облака растаяли и слой погашен — видео и шейдер не нужны */
      if (op === '0.000') { if (video && !video.paused) video.pause(); return; }
      if (video && video.paused && ready) video.play().catch(() => {});
      if (gl && ready) {
        if (frameNew || !video.requestVideoFrameCallback) {
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
          frameNew = false;
        }
        /* заполнение «cover» с привязкой к верху, увеличение 1.35 и медленный дрейф кадра */
        const va = video.videoWidth / (video.videoHeight / 2 || 1);
        const ca = canvas.width / (canvas.height || 1);
        let sx = 1, sy = 1;
        if (ca > va) sy = va / ca; else sx = ca / va;
        const over = 1 / 1.35, time = (now - t0) / 1000;           /* облака крупнее: клубы в масштабе квартала, а не этажа */
        const drift = Math.sin(time * .045) * .025;
        gl.uniform4f(uMap, sx * over, sy * over, .5 - sx * over * .5 + drift, .015);
        gl.uniform1f(uT, cur);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        if (!shown) { shown = true; if (poster) poster.classList.add('is-hidden'); }
      }
    }
  });
});
