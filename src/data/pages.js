/* ==========================================================================
   Есть ли в проекте страница по адресу — для ссылок на страницы, которых пока нет
   (политика конфиденциальности, текст согласия на обработку данных). Ссылка на
   несуществующий адрес вела на 404; тексты этих документов даёт юрист застройщика,
   их нельзя сочинить. Как только страница появится в src/pages, ссылки вернутся сами.
   ========================================================================== */
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const PAGES = join(process.cwd(), 'src', 'pages');
const variants = (dir, slug) => [`${slug}.astro`, `${slug}.md`, `${slug}.mdx`, join(slug, 'index.astro'), join(slug, 'index.md')].map((f) => join(dir, f));

export function pageExists(lang, path) {
  const slug = path.replace(/^\/|\/$/g, '');
  if (!slug) return true;
  if (lang === 'ru') return variants(PAGES, slug).some(existsSync);
  return [join(PAGES, lang), join(PAGES, '[lang]')].some((dir) => variants(dir, slug).some(existsSync));
}
