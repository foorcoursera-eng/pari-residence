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
/* Файл подтверждения прав Яндекса — не страница сайта: его содержимое
   продиктовано Яндексом, и требовать от него h1, canonical и микроразметку
   бессмысленно. Из проверки страниц он исключён, но битые ссылки на него
   по-прежнему нашлись бы. */
const pages = files.filter((f) => f.endsWith('.html') && !/^yandex_[0-9a-f]+\.html$/.test(path.basename(f)));
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
  /* Ступени ролика перечисляет его собственный data-widths: у hero их две-три,
     у короткого отрезка в концепции — одна. Подстановка {w} идёт по ним. */
  const widthsOf = {};
  html.replace(/<video[^>]*>/g, (tag) => {
    const w = (tag.match(/data-widths="([^"]+)"/) || [])[1];
    tag.replace(/data-(?:webm|mp4)(?:-portrait)?="([^"]+)"/g, (m, v) => { if (w) { widthsOf[v.trim()] = w.split(','); } return m; });
    return tag;
  });
  html.replace(/data-(?:webm|mp4|src)(?:-portrait)?="([^"]+)"/g, (m, v) => (push(v), m));

  refs.forEach((raw) => {
    if (/^(#|tel:|mailto:|data:|https?:|\/\/)/.test(raw)) { return; }
    const ref = raw.split('#')[0];          /* якорь проверяем отдельно, файла он не меняет */
    if (!ref) { return; }
    const candidates = ref.includes('{w}')
      ? (widthsOf[raw.trim()] || ['1280', '1920']).map((w) => ref.replace('{w}', w))
      : [ref];
    candidates.forEach((c) => {
      const target = c.endsWith('/') ? c + 'index.html' : c;
      if (!exists(target)) { problems.push(`${page}: битая ссылка ${c}`); }
    });
  });

  /* ── заголовки и метаданные ── */
  const h1 = html.match(/<h1[\s>]/g) || [];
  if (h1.length !== 1) { problems.push(`${page}: h1 должен быть ровно один, найдено ${h1.length}`); }

  /* Границы взяты по тому, что поиск реально показывает, а не по тому, что
     он разрешает записать. Верхняя планка description была 300 — под неё
     проходило всё, и 28 страниц из 31 ездили с описанием на 170–199 знаков:
     в выдаче они обрывались на полуслове. Яндекс и Google режут около 160,
     на телефоне раньше. Title режется около 65. */
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  if (title.length < 15 || title.length > 65) { notes.push(`${page}: длина title ${title.length} (норма 15–65)`); }

  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  if (desc.length < 70 || desc.length > 160) { notes.push(`${page}: длина description ${desc.length} (норма 70–160)`); }

  /* Невставленная подстановка. Ловится именно здесь, а не глазами: описание
     страницы рассрочки полгода уезжало в поиск со строкой «цена от {price}
     за м²», и на самой странице этого видно не было. */
  const leftover = html.match(/content="[^"]*\{[a-zA-Z]+\}[^"]*"/);
  if (leftover) { problems.push(`${page}: подстановка не заполнена — ${leftover[0].slice(0, 90)}`); }

  /* Страницы под noindex canonical и hreflang не нужны — они не участвуют
     в индексе, и самоссылающийся canonical на них только мешает. */
  const noindex = /<meta name="robots" content="noindex/.test(html);
  if (!noindex) {
    if (!/rel="canonical"/.test(html)) { problems.push(`${page}: нет canonical`); }
    if (!/hreflang="ru"/.test(html) || !/hreflang="uz"/.test(html)) { problems.push(`${page}: нет пары hreflang`); }
  }
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

  /* ── микроразметка: разбирается ли она вообще ──
     Сломанный JSON-LD не виден глазом: страница выглядит целой, а поисковик
     просто молча пропускает блок. */
  const ld = [];
  (html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || []).forEach((block) => {
    const body = block.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '');
    try { ld.push(JSON.parse(body)); } catch (e) {
      problems.push(`${page}: микроразметка не разбирается — ${e.message}`);
    }
  });

  /* Ответы в FAQPage обязаны совпадать с напечатанными на странице: расхождение
     видимого текста и разметки — прямое нарушение правил и Google, и Яндекса,
     и самый частый способ получить ручные санкции за разметку. */
  const faq = ld.find((o) => o['@type'] === 'FAQPage');
  if (faq) {
    /* Сначала выбрасываем сами блоки script — иначе сравниваем разметку
       с ней же самой, и проверка проходит всегда. */
    const text = html.replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&laquo;|&raquo;/g, '"')
      .replace(/\s+/g, ' ');
    faq.mainEntity.forEach((q) => {
      /* Сверяем ответ целиком, а не первые слова: подмена обычно и сидит
         в середине — там, где на страницу попадает одно, а в разметку другое. */
      const answer = q.acceptedAnswer.text.replace(/\s+/g, ' ').trim();
      if (text.indexOf(answer) === -1) {
        problems.push(`${page}: ответ FAQPage не совпадает с текстом страницы — «${answer.slice(0, 50)}…»`);
      }
    });
  }

  /* ── превью ссылки ──
     WebP в og:image Telegram и ВКонтакте не разворачивают: вместо кадра
     приходит пустой прямоугольник. Для Узбекистана это заметная потеря. */
  const og = (html.match(/<meta property="og:image" content="([^"]*)"/) || [])[1] || '';
  if (!og) { problems.push(`${page}: нет og:image`); }
  else if (/\.webp($|\?)/i.test(og)) { problems.push(`${page}: og:image в WebP — превью не покажут`); }

  /* ── запасной путь без JavaScript ──
     .reveal держит контент на opacity:0, пока его не покажет скрипт. Без
     правила в <noscript> одна ошибка в скриптах гасит всю страницу. */
  if (!/<noscript><style>[\s\S]*?\.reveal/.test(html)) {
    problems.push(`${page}: нет правила .reveal в <noscript> — без JS страница пустая`);
  }

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
if (!/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(sitemap)) {
  problems.push('sitemap: нет lastmod — Яндекс не поймёт, что переобходить');
}
['ru', 'uz', 'x-default'].forEach((h) => {
  if (sitemap.indexOf(`hreflang="${h}"`) === -1) { problems.push(`sitemap: нет hreflang="${h}"`); }
});

/* robots.txt: карта сайта и незакрытые ассеты */
const robots = fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8');
if (robots.indexOf('Sitemap:') === -1) { problems.push('robots.txt: нет ссылки на карту сайта'); }
if (/Disallow:\s*\/(assets|styles|script)/.test(robots)) {
  problems.push('robots.txt: закрыты ассеты — робот не отрисует страницу');
}

/* Число квартир в текстах против числа квартир в шахматке.
   Расхождение известное и настоящее: в альбоме проекта 1202 квартиры, в
   выгрузке CRM — 1186 (см. шапку src/flats.js). Но наружу оно выходит так:
   в текстах написано одно, а каталог по комнатности складывается в другое,
   и покупатель это сложит. Какое число рекламировать — решает застройщик,
   поэтому здесь замечание, а не ошибка: пусть висит на виду, пока не решат. */
const flats = require('./src/flats.js');
const { site } = require('./src/content.js');
const inChess = flats.expand().length;
if (site.facts.apartments !== inChess) {
  notes.push(`квартир в текстах ${site.facts.apartments}, в шахматке ${inChess}`
    + ' — на сайте оба числа видны сразу, нужно решение застройщика');
}

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
