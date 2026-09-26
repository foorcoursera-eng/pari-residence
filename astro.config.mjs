// @ts-check
import { defineConfig } from 'astro/config';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/* Скрипты страницы — модули: Base.js сам импортирует общий кусок animate.js, и браузер
   узнаёт о нём только после загрузки Base.js (на медленной сети +1,2 с до DOMContentLoaded).
   После сборки дописываем в <head> каждой страницы <link rel="modulepreload"> на всю цепочку
   её модулей — все куски грузятся параллельно. */
const modulePreload = () => ({
  name: 'pari-modulepreload',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const root = fileURLToPath(dir);
      const deps = (file, seen = new Set()) => {
        if (seen.has(file)) return seen;
        seen.add(file);
        let js = '';
        try { js = readFileSync(join(root, '_astro', file), 'utf8'); } catch { return seen; }
        for (const m of js.matchAll(/(?:from|import)\s*"\.\/([^"]+\.js)"/g)) deps(m[1], seen);
        return seen;
      };
      const walk = (d) => readdirSync(d).forEach((n) => {
        const p = join(d, n);
        if (statSync(p).isDirectory()) return walk(p);
        if (!n.endsWith('.html')) return;
        let html = readFileSync(p, 'utf8');
        const all = new Set();
        for (const m of html.matchAll(/<script type="module" src="\/_astro\/([^"]+\.js)"/g)) deps(m[1]).forEach((f) => all.add(f));
        if (!all.size) return;
        const links = [...all].map((f) => `<link rel="modulepreload" href="/_astro/${f}">`).join('');
        html = html.replace('</head>', `${links}</head>`);
        writeFileSync(p, html);
      });
      walk(root);
      writeSitemap(root);
    },
  },
});

/* sitemap.xml для pari-residence.uz: все страницы, у каждой — альтернативы на других языках */
const ORIGIN = 'https://pari-residence.uz';
const LANGS = ['ru', 'uz', 'en', 'fr'];
function writeSitemap(root) {
  const pages = [];
  const walk = (d) => readdirSync(d).forEach((n) => {
    const p = join(d, n);
    if (statSync(p).isDirectory()) return walk(p);
    if (n !== 'index.html') return;
    const rel = '/' + p.slice(root.length).split(/[\\/]+/).filter(Boolean).join('/').replace(/index\.html$/, '');
    if (rel.startsWith('/404')) return;
    pages.push(rel);
  });
  walk(root);
  const split = (u) => { const m = u.match(/^\/(uz|en|fr)(\/.*)$/); return m ? [m[1], m[2]] : ['ru', u]; };
  const byBase = new Map();
  pages.forEach((u) => { const [l, b] = split(u); if (!byBase.has(b)) byBase.set(b, {}); byBase.get(b)[l] = u; });
  const day = new Date().toISOString().slice(0, 10);
  const NL = '\n';
  const urls = [];
  byBase.forEach((alts, base) => {
    const prio = base === '/' ? '1.0' : base === '/apartments/' ? '0.9' : '0.6';
    Object.values(alts).forEach((u) => {
      const links = LANGS.filter((l) => alts[l]).map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${ORIGIN}${alts[l]}"/>`);
      if (alts.ru) links.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}${alts.ru}"/>`);
      urls.push(['  <url>', `    <loc>${ORIGIN}${u}</loc>`, `    <lastmod>${day}</lastmod>`, ...links, `    <priority>${prio}</priority>`, '  </url>'].join(NL));
    });
  });
  writeFileSync(join(root, 'sitemap.xml'), ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">', ...urls, '</urlset>', ''].join(NL));
}

// https://astro.build/config
export default defineConfig({
  /* CSS сайта — прямо в HTML: первая отрисовка не ждёт отдельных файлов стилей
     (на медленной мобильной сети это секунды белого экрана); ~12 КБ в сжатом виде */
  build: { inlineStylesheets: 'always' },
  integrations: [modulePreload()],
});
