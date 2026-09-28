/* ==========================================================================
   PARI Residence — живая ветка вишни (WebGL), по просьбе заказчика 28.09:
   «сделать крутую анимацию, чтобы смотрелось прям реалистично».
   Раньше картинка ветки качалась целиком, как доска на петле. Теперь она гнётся:
     • изгиб вокруг места, где ствол входит в кадр: угол растёт с долей длины
       (доля^1.6 — у среза ветка неподвижна, кончик ходит сильнее всего);
       два медленных колебания разной частоты + ветер от прокрутки (пружина — blossom.js);
     • цветки мелко дрожат — плавный шум по кадру, у среза его нет;
     • лепестки срываются с цветков и падают: кувыркаются (переворот — scaleX cos),
       покачиваются, при быстрой прокрутке их сносит в сторону движения.
   Один контекст WebGL на страницу (их число у браузера ограничено): видимая ветка
   рисуется в нём и копируется в свой холст внутри .flower — слои страницы сохраняются
   (ветка за фото, перед текстом). Ветки вне экрана не рисуются; нет веток на экране —
   цикл кадров спит. Нет WebGL или «меньше движения» — неподвижная картинка с CSS-покачиванием.
   Картинки и точки срыва — renders/make-branch.py (src/data/branch.json).
   ========================================================================== */
import { onFrame, hold, release, desktop } from './ticker.js';
import { windNow } from './blossom.js';
import data from '../data/branch.json';

const MOTION = document.documentElement.classList.contains('has-motion');
const PAD = { x: .06, top: .06, bottom: .9 };                  /* холст шире ветки: запас на изгиб и падение лепестков */
const MAXP = 16;                                               /* лепестков на ветку одновременно */
const FLIP = { l: [1, 1], r: [-1, 1], lb: [1, -1], rb: [-1, -1] };

const VS_B = `attribute vec2 p; varying vec2 v;
void main(){ v = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0., 1.); }`;
const FS_B = `precision mediump float;
varying vec2 v;
uniform sampler2D tex;
uniform vec4 box;     /* ветка в долях холста: x0, y0, ширина, высота */
uniform vec2 flip;    /* зеркала варианта: экран → кадр «l» */
uniform vec2 px;      /* размер ветки в пикселях холста: поворот без искажения пропорций */
uniform vec2 piv;     /* место крепления ствола в кадре «l» */
uniform float ang;    /* угол изгиба на кончике, рад */
uniform float t;
uniform float amp;    /* дрожь цветков, доля кадра */
void main(){
  vec2 b = (v - box.xy) / box.zw;
  vec2 q = vec2(flip.x > 0. ? b.x : 1. - b.x, flip.y > 0. ? b.y : 1. - b.y);
  float reach = clamp(q.x, 0., 1.);
  float a = -ang * pow(reach, 1.6);                           /* обратное отображение: откуда пришла точка */
  vec2 r = (q - piv) * px;
  q = piv + vec2(r.x * cos(a) - r.y * sin(a), r.x * sin(a) + r.y * cos(a)) / px;
  vec2 n = vec2(sin(q.y * 23. + t * 2.1 + sin(q.x * 11. + t * 1.3)) + .35 * sin(q.x * 47. + t * 4.3),
                cos(q.x * 19. - t * 1.7 + sin(q.y * 13. - t * 1.1)) + .35 * cos(q.y * 41. - t * 3.7));
  q -= n * amp * reach;
  if (q.x < 0. || q.y < 0. || q.x > 1. || q.y > 1.) { gl_FragColor = vec4(0.); return; }
  gl_FragColor = texture2D(tex, q);
}`;
const VS_P = `attribute vec2 pos; attribute vec4 prm; attribute float idx;
uniform vec2 res; varying vec4 vp; varying float vi;
void main(){
  vec2 c = pos / res * 2. - 1.;
  gl_Position = vec4(c.x, -c.y, 0., 1.);
  gl_PointSize = prm.x * 1.42;
  vp = prm; vi = idx;
}`;
const FS_P = `precision mediump float;
uniform sampler2D atlas; uniform float slots;
varying vec4 vp; varying float vi;
void main(){
  vec2 p = gl_PointCoord - .5;
  float c = cos(vp.y), s = sin(vp.y);
  p = vec2(c * p.x + s * p.y, -s * p.x + c * p.y) * 1.42;
  p.x /= (abs(vp.z) < .15 ? .15 * sign(vp.z + 1e-4) : vp.z);  /* кувырок: лепесток то ребром, то плашмя, то изнанкой */
  vec2 uv = p + .5;
  if (uv.x < 0. || uv.y < 0. || uv.x > 1. || uv.y > 1.) discard;
  gl_FragColor = texture2D(atlas, vec2((vi + uv.x) / slots, uv.y)) * vp.w;
}`;

const els = [...document.querySelectorAll('[data-flower]')];
if (MOTION && els.length) {
  let gl = null, glc = null, failed = false, texB = null, texP = null, texW = 0, quad, pbuf, progB, progP, uB, uP;
  const arr = new Float32Array(MAXP * 7);
  const t0 = performance.now();

  const items = els.map((el) => ({
    el, side: el.dataset.side in FLIP ? el.dataset.side : 'l', on: false, cv: null, ctx: null,
    cw: 0, ch: 0, bw: 0, bh: 0, dirty: true, petals: [], nextAt: 0, drawn: false, seed: Math.random() * 60,
  }));

  /* ---------- WebGL: один контекст, две программы, две текстуры (создаются при первой видимой ветке) ---------- */
  const compile = (vs, fs) => {
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('branch shader');
    return p;
  };
  const texture = (src, done) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (!gl) return;
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);                         /* обе стороны — степени двойки (make-branch.py) */
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      done(t);
    };
    img.onerror = () => { failed = true; };
    img.src = src;
  };
  const setup = (bigW) => {
    if (gl || failed) return;
    glc = document.createElement('canvas');
    gl = glc.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false });
    if (!gl) { failed = true; return; }
    try {
      progB = compile(VS_B, FS_B);
      progP = compile(VS_P, FS_P);
    } catch (e) { failed = true; gl = null; return; }
    quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    pbuf = gl.createBuffer();
    const u = (p, names) => Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(p, n)]));
    uB = { ...u(progB, ['tex', 'box', 'flip', 'px', 'piv', 'ang', 't', 'amp']), p: gl.getAttribLocation(progB, 'p') };
    uP = { ...u(progP, ['atlas', 'slots', 'res']), pos: gl.getAttribLocation(progP, 'pos'), prm: gl.getAttribLocation(progP, 'prm'), idx: gl.getAttribLocation(progP, 'idx') };
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    /* текстура по размеру самой крупной ветки на экране: на телефоне 2048 не нужна */
    texW = bigW > 900 ? 2048 : 1024;
    texture(`/img/scenes/branch-tex-${texW}.webp`, (t) => { texB = t; });
    texture('/img/scenes/petals.webp', (t) => { texP = t; });
    glc.addEventListener('webglcontextlost', (e) => { e.preventDefault(); failed = true; items.forEach((it) => it.el.classList.remove('is-gl')); });
  };

  /* ---------- размеры: ветка — рамка .flower, холст шире на запасы PAD ---------- */
  const dpr = () => Math.min(window.devicePixelRatio || 1, desktop() ? 2 : 1.5);
  const measure = (it) => {
    const w = it.el.offsetWidth, h = it.el.offsetHeight;
    if (!w || !h) return false;
    const k = dpr();
    it.bw = w * k; it.bh = h * k;
    it.cw = Math.round(w * (1 + 2 * PAD.x) * k);
    it.ch = Math.round(h * (1 + PAD.top + PAD.bottom) * k);
    if (!it.cv) {
      it.cv = document.createElement('canvas');
      it.cv.className = 'flower_gl';
      it.cv.setAttribute('aria-hidden', 'true');
      it.el.appendChild(it.cv);
      it.ctx = it.cv.getContext('2d');
    }
    if (it.cv.width !== it.cw || it.cv.height !== it.ch) { it.cv.width = it.cw; it.cv.height = it.ch; }
    it.dirty = false;
    return true;
  };
  window.addEventListener('resize', () => items.forEach((it) => { it.dirty = true; }));

  /* ---------- лепестки: срываются с цветков (точки из make-branch.py), падают, кувыркаются ---------- */
  const R = (a, b) => a + Math.random() * (b - a);
  const spawn = (it, midAir) => {
    const s = data.spawn[(Math.random() * data.spawn.length) | 0];
    const [fx, fy] = FLIP[it.side];
    const bx = fx > 0 ? s[0] : 1 - s[0], by = fy > 0 ? s[1] : 1 - s[1];
    const sc = it.bw / 700;                                    /* лепестки — в масштабе ветки */
    const x0 = (PAD.x + bx) / (1 + 2 * PAD.x) * it.cw;
    const y0 = (PAD.top + by) / (1 + PAD.top + PAD.bottom) * it.ch;
    it.petals.push({
      x: x0, y: midAir ? R(y0, it.ch * .85) : y0, age: midAir ? 1 : 0,
      vy: R(22, 46) * sc, vx: R(-8, 10) * sc, sw: R(6, 16) * sc, f: R(.6, 1.3), ph: R(0, 6.3),
      size: R(18, 31) * sc, rot: R(0, 6.3), vr: R(-.9, .9), tum: R(0, 6.3), vt: R(.9, 2.2) * (Math.random() < .5 ? -1 : 1),   /* кувырок медленный — падение плавное */
      idx: (Math.random() * data.petals) | 0,
    });
  };
  const stepPetals = (it, now, dt, wind) => {
    if (now >= it.nextAt && it.petals.length < MAXP) { spawn(it, false); it.nextAt = now + R(500, 1100); }
    const sc = it.bw / 700;
    let n = 0;
    for (let i = it.petals.length - 1; i >= 0; i--) {
      const p = it.petals[i];
      p.age += dt;
      p.y += (p.vy + Math.abs(wind) * 60 * sc) * dt;
      p.x += (p.vx + wind * 220 * sc) * dt;
      p.rot += (p.vr + wind * 2) * dt;
      p.tum += p.vt * dt;
      const x = p.x + Math.sin(p.age * p.f + p.ph) * p.sw;
      const fade = Math.min(1, p.age / .45) * Math.min(1, (it.ch * .97 - p.y) / (it.ch * .14));
      if (fade <= 0 || x < -40 || x > it.cw + 40) { it.petals.splice(i, 1); continue; }
      const o = n * 7;
      arr[o] = x; arr[o + 1] = p.y; arr[o + 2] = p.size; arr[o + 3] = p.rot;
      arr[o + 4] = Math.cos(p.tum); arr[o + 5] = fade; arr[o + 6] = p.idx;
      n++;
    }
    return n;
  };

  /* ---------- кадр ветки ---------- */
  const draw = (it, now, dt) => {
    if (it.dirty && !measure(it)) return;
    if (glc.width < it.cw || glc.height < it.ch) {                /* общий холст — по самой большой ветке */
      glc.width = Math.max(glc.width, it.cw); glc.height = Math.max(glc.height, it.ch);
    }
    const t = (now - t0) / 1000 + it.seed;
    const [fx, fy] = FLIP[it.side];
    /* качание: два медленных колебания + ветер прокрутки (угол пружины blossom.js); в зеркальном варианте знак угла меняется */
    const sway = (1.1 * Math.sin(t * .97) + .55 * Math.sin(t * 1.71 + 1.3) + .25 * Math.sin(t * 3.1 + .4)) * Math.PI / 180;
    const bend = ((it.el.__bend || 0) * .9) * Math.PI / 180;
    const ang = (sway + bend) * fx * fy;
    const wind = windNow();
    const n = texP ? stepPetals(it, now, dt, wind) : 0;

    gl.viewport(0, 0, it.cw, it.ch);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(progB);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(uB.p);
    gl.vertexAttribPointer(uB.p, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texB);
    gl.uniform1i(uB.tex, 0);
    gl.uniform4f(uB.box, PAD.x / (1 + 2 * PAD.x), PAD.top / (1 + PAD.top + PAD.bottom), 1 / (1 + 2 * PAD.x), 1 / (1 + PAD.top + PAD.bottom));
    gl.uniform2f(uB.flip, fx, fy);
    gl.uniform2f(uB.px, it.bw, it.bh);
    gl.uniform2f(uB.piv, data.pivot[0], data.pivot[1]);
    gl.uniform1f(uB.ang, ang);
    gl.uniform1f(uB.t, t);
    gl.uniform1f(uB.amp, .0042 + Math.min(.004, Math.abs(wind) * .006));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disableVertexAttribArray(uB.p);

    if (n) {
      gl.useProgram(progP);
      gl.bindBuffer(gl.ARRAY_BUFFER, pbuf);
      gl.bufferData(gl.ARRAY_BUFFER, arr.subarray(0, n * 7), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(uP.pos); gl.vertexAttribPointer(uP.pos, 2, gl.FLOAT, false, 28, 0);
      gl.enableVertexAttribArray(uP.prm); gl.vertexAttribPointer(uP.prm, 4, gl.FLOAT, false, 28, 8);
      gl.enableVertexAttribArray(uP.idx); gl.vertexAttribPointer(uP.idx, 1, gl.FLOAT, false, 28, 24);
      gl.bindTexture(gl.TEXTURE_2D, texP);
      gl.uniform1i(uP.atlas, 0);
      gl.uniform1f(uP.slots, data.slots);
      gl.uniform2f(uP.res, it.cw, it.ch);
      gl.drawArrays(gl.POINTS, 0, n);
      [uP.pos, uP.prm, uP.idx].forEach((a) => gl.disableVertexAttribArray(a));
    }
    /* в свой холст: отрисованное лежит в нижнем левом углу общего холста */
    it.ctx.clearRect(0, 0, it.cw, it.ch);
    it.ctx.drawImage(glc, 0, glc.height - it.ch, it.cw, it.ch, 0, 0, it.cw, it.ch);
    if (!it.drawn) { it.drawn = true; it.el.classList.add('is-gl'); }
  };

  /* ---------- видимость: рисуются только ветки у экрана ---------- */
  const key = {};
  let active = 0;
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    const it = items.find((x) => x.el === e.target);
    if (!it || it.on === e.isIntersecting) return;
    it.on = e.isIntersecting;
    active += it.on ? 1 : -1;
    if (it.on) {
      if (!gl && !failed) setup(Math.max(...items.map((x) => x.el.offsetWidth * dpr())));
      if (!it.petals.length && measure(it)) for (let k = 0; k < 4; k++) spawn(it, true);   /* в воздухе уже есть лепестки */
    }
    if (active > 0 && !failed) hold(key); else release(key);
  }), { rootMargin: '15% 0px 15% 0px' });
  items.forEach((it) => io.observe(it.el));

  onFrame('write', (now, dt) => {
    if (!active || failed || !gl || !texB) return;
    items.forEach((it) => { if (it.on) draw(it, now, dt); });
  });
}
