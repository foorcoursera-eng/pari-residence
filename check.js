#!/usr/bin/env node
/* ==========================================================================
   Проверка собранного сайта: битые ссылки и ассеты, заголовки, метаданные,
   микроразметка, alt у картинок, дубли id. Запуск: node check.js
   Возвращает код 1, если что-то сломано, — годится для CI.
   ========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, 'dist');
const problems = [];
const notes = [];

const walk = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(full, out); } else { out.push(full); }
  }
  return out;
};

if (!fs.existsSync(dist)) {
  console.error('Нет каталога dist — сначала выполните: node build.js');
  process.exit(1);
}

const files = walk(dist);
const pages = files.filter((f) => f.endsWith('.html'));
const exists = (rel) => fs.existsSync(path.join(dist, rel.replace(/^\//, '').split('?')[0]));

const rel = (f) => f.slice(dist.length).replace(/\\/g, '/');

pages.forEach((file) => {
  const html = fs.readFileSync(file, 'utf8');
  const page = rel(file);

  /* ── ссылки и ассеты ── */
  const refs = new Set();
  const push = (v) => { if (v) { refs.add(v.trim()); } };
  html.replace(/(?:href|src)="([^"]+)"/g, (m, v) => (push(v), m));
  html.replace(/srcset="([^"]+)"/g, (m, v) => {
    v.split(',').forEach((part) => push(part.trim().split(/\s+/)[0]));
    return m;
  });
  html.replace(/data-(?:webm|mp4|src)="([^"]+)"/g, (m, v) => (push(v), m));

  refs.forEach((raw) => {
    if (/^(#|tel:|mailto:|data:|https?:|\/\/)/.test(raw)) { return; }
    const ref = raw.split('#')[0];          /* якорь проверяем отдельно, файла он не меняет */
    if (!ref) { return; }
    const candidates = ref.includes('{w}')
      ? [ref.replace('{w}', '1280'), ref.replace('{w}', '1920')]
      : [ref];
    candidates.forEach((c) => {
      const target = c.endsWith('/') ? c + 'index.html' : c;
      if (!exists(target)) { problems.push(`${page}: битая ссылка ${c}`); }
    });
  });

  /* ── заголовки и метаданные ── */
  const h1 = html.match(/<h1[\s>]/g) || [];
  if (h1.length !== 1) { problems.push(`${page}: h1 должен быть ровно один, найдено ${h1.length}`); }

  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  if (title.length < 15 || title.length > 70) { notes.push(`${page}: длина title ${title.length} (норма 15–70)`); }

  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  if (desc.length < 70 || desc.length > 300) { notes.push(`${page}: длина description ${desc.length} (норма 70–300)`); }

  if (!/rel="canonical"/.test(html)) { problems.push(`${page}: нет canonical`); }
  if (!/hreflang="ru"/.test(html) || !/hreflang="uz"/.test(html)) { problems.push(`${page}: нет пары hreflang`); }
  if (!/application\/ld\+json/.test(html) && !/404/.test(page)) { problems.push(`${page}: нет микроразметки`); }

  /* ── картинки ── */
  const imgs = html.match(/<img\b[^>]*>/g) || [];
  imgs.forEach((tag) => {
    if (!/\salt=/.test(tag)) { problems.push(`${page}: <img> без alt — ${tag.slice(0, 70)}…`); }
    if (!/\swidth=/.test(tag) || !/\sheight=/.test(tag)) {
      notes.push(`${page}: <img> без width/height — ${tag.slice(0, 70)}…`);
    }
  });

  /* ── дубли id ── */
  const ids = (html.match(/\sid="([^"]+)"/g) || []).map((s) => s.slice(5, -1));
  const dup = ids.filter((v, i) => ids.indexOf(v) !== i);
  if (dup.length) { problems.push(`${page}: дублируются id: ${[...new Set(dup)].join(', ')}`); }

  /* ── служебные остатки ── */
  if (/_audit|_tmp|TODO:/.test(html)) { problems.push(`${page}: в разметке остались служебные пометки`); }
});

/* ── обязательные файлы ── */
['sitemap.xml', 'robots.txt', '404.html', 'styles.css', 'script.js'].forEach((f) => {
  if (!exists('/' + f)) { problems.push(`нет файла ${f}`); }
});

/* ── карта сайта: все адреса должны существовать ── */
const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
(sitemap.match(/<loc>([^<]+)<\/loc>/g) || []).forEach((m) => {
  const loc = m.replace(/<\/?loc>/g, '');
  const p = loc.replace(/^https?:\/\/[^/]+/, '');
  const target = p.endsWith('/') ? p + 'index.html' : p;
  if (!exists(target)) { problems.push(`sitemap: адрес не существует — ${loc}`); }
});

console.log(`Проверено страниц: ${pages.length}, файлов: ${files.length}`);
if (notes.length) {
  console.log('\nЗамечания:');
  notes.forEach((n) => console.log('  ·', n));
}
if (problems.length) {
  console.log('\nОшибки:');
  problems.forEach((p) => console.log('  ✗', p));
  process.exit(1);
}
console.log('\nОшибок нет.');
