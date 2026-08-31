// Готовит копии страниц для скриншотов: анимации показаны, картинки грузятся сразу.
const fs = require('fs');
const path = require('path');

const pages = ['', 'project', 'apartments', 'location', 'contacts', 'uz', 'uz/project', 'uz/apartments', 'uz/location', 'uz/contacts'];
const out = path.join('dist', '_shot');
fs.mkdirSync(out, { recursive: true });

const patch = `
<style id="shot-patch">
  .reveal, [class*="reveal"] { opacity: 1 !important; transform: none !important; visibility: visible !important; }
  /* построчные заголовки и маски кадров показываются наблюдателем — в кадре включаем сразу */
  [data-lines] .line > span { transform: none !important; }
  .figure-mask { clip-path: inset(0 0 0 0) !important; }
  .figure-mask img { transform: none !important; }
  * { animation-play-state: paused !important; }
  /* переходы в кадре не проигрываются — элементы должны сразу быть в конечном виде */
  * { transition: none !important; }
  html, body { scroll-behavior: auto !important; }
  video { display: none !important; }
  /* высоты во вьюпортных единицах при съёмке длинным окном ломают вёрстку */
  .hero, .hero__inner { min-height: 900px !important; }
  .split__media { min-height: 460px !important; }
  /* первый экран v5 занимает два окна и держит сцену липкой: при съёмке
     длинным окном это превращается в четыре пустых экрана подряд */
  .opening { height: 860px !important; }
  .opening__stage { position: static !important; height: 860px !important; }
  .opening__frame { height: 860px !important; }
  .opening__head { height: 860px !important; }
  /* на широком кадре первый экран двухколоночный, на узком — сверху вниз:
     иначе съёмка узкого окна показывает пустое поле вместо рендера */
  @media (min-width: 901px) { .opening__frame { width: 62% !important; } }
  @media (max-width: 900px) {
    .opening__frame { height: 420px !important; }
    .opening__head { height: 440px !important; }
  }
  .hectare__panorama img { height: 520px !important; }
  .scene { min-height: 760px !important; }
  /* заголовки, написанные «пером», показываем в конечном состоянии — иначе в кадре пусто */
  .pen path { animation: none !important; stroke-dashoffset: 0 !important; fill: currentColor !important; stroke-opacity: 0 !important; }

</style>
<script>
  addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('img').forEach(i => { i.loading = 'eager'; i.decoding = 'sync'; });
    document.querySelectorAll('[data-src]').forEach(e => { if (e.dataset.src) e.src = e.dataset.src; });
  });
</script>
`;

for (const p of pages) {
  const file = path.join('dist', p, 'index.html');
  let html = fs.readFileSync(file, 'utf8').replace('</head>', patch + '</head>');
  // GSAP в кадре замирает на стартовом состоянии и всё выглядит бледным —
  // для съёмки страницу берём без движения, только вёрстка
  html = html.replace(/\s*<script src="\/assets\/js\/(gsap|ScrollTrigger|motion|lenis)[^>]*><\/script>/g, '');
  const name = (p || 'ru') .replace(/\//g, '-') + '.html';
  fs.writeFileSync(path.join(out, name), html);
}
console.log('готово:', fs.readdirSync(out).join(' '));
