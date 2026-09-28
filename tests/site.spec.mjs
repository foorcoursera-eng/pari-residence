/* Регрессионные проверки собранного сайта: каждая — по ошибке, найденной при аудите 26.09.2026.
   Заявки не уходят никуда: ответ /api/lead/ подменяется в браузере, сервер тестов на /api/* отвечает 503.
   Счётчики (GA, Метрика) в тестах отключены. */
import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const MOBILE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };

test.beforeEach(async ({ page }) => {
  await page.route(/googletagmanager\.com|google-analytics\.com|mc\.yandex\.ru/, (r) => r.abort());
});

/* страница открыта: загрузочного экрана нет или он убран */
async function open(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const p = document.querySelector('[data-preloader]');
    return !p || p.classList.contains('is-done') || getComputedStyle(p).display === 'none';
  }, null, { timeout: 15_000 });
}
const focused = (page) => page.evaluate(() => {
  const a = document.activeElement;
  return a ? (a.id || a.getAttribute('data-menu-btn') !== null && 'menu-btn' || a.className) : null;
});

test.describe('загрузочный экран', () => {
  test('без JavaScript не закрывает страницу', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'load' });
    await expect(page.locator('[data-preloader]')).toBeHidden();
    await expect(page.locator('main')).toBeVisible();
    await ctx.close();
  });

  test('открывается, даже если скрипты страницы не загрузились', async ({ page }) => {
    await page.route('**/_astro/*.js', (r) => r.abort());
    await page.goto('/apartments/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-preloader]')).toBeHidden({ timeout: 6_000 });
    await expect(page.locator('.apts_h1')).toBeVisible();
  });

  test('в сессии показывается один раз: на следующей странице его нет', async ({ page }) => {
    await open(page, '/');
    await page.goto('/apartments/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveClass(/pre-skip/);
    await expect(page.locator('[data-preloader]')).toBeHidden();
  });
});

test.describe('меню телефона', () => {
  test.use(MOBILE);

  test('страница под меню недоступна, Escape возвращает фокус на «Меню»', async ({ page }) => {
    await open(page, '/');
    const btn = page.locator('[data-menu-btn]');
    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    expect(await page.evaluate(() => document.querySelector('main').inert)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(await page.evaluate(() => document.querySelector('main').inert)).toBe(false);
    expect(await focused(page)).toBe('menu-btn');
  });

  test('окно записи, открытое из меню, после закрытия возвращает фокус на «Меню»', async ({ page }) => {
    await open(page, '/');
    await page.locator('[data-menu-btn]').click();
    await page.locator('.mnav [data-open-dialog]').click();
    await expect(page.locator('[data-dialog]')).toHaveAttribute('open', '');
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-dialog]')).not.toHaveAttribute('open', '');
    await expect.poll(() => focused(page)).toBe('menu-btn');
  });
});

test.describe('заявка', () => {
  async function openForm(page, url = '/') {
    await open(page, url);
    await page.locator('.header-nav [data-open-dialog]').click();
    await expect(page.locator('#lead-name')).toBeFocused();
  }
  const fill = async (page) => {
    await page.fill('#lead-name', 'Тест');
    await page.fill('#lead-phone', '901234567');
    await page.check('#lead-consent');
  };

  test('ошибки связаны с полями, фокус — на первое неверное поле', async ({ page }) => {
    await openForm(page);
    await page.locator('[data-submit]').click();
    await expect(page.locator('#lead-name')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#lead-phone')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#lead-consent')).toHaveAttribute('aria-describedby', 'lead-consent-err');
    await expect(page.locator('#lead-consent-err')).toBeVisible();
    await expect(page.locator('#lead-name')).toBeFocused();
  });

  test('«Спасибо» — только после ответа сервера 200, при ошибке данные остаются', async ({ page }) => {
    let status = 502;
    await page.route('**/api/lead/', (r) => r.fulfill({ status, contentType: 'application/json', body: status === 200 ? '{"ok":true}' : '{"ok":false}' }));
    await openForm(page);
    const st = page.locator('[data-status]');
    await fill(page);
    await page.locator('[data-submit]').click();
    await expect(st).toHaveText(await st.getAttribute('data-fail'));
    await expect(page.locator('#lead-name')).toHaveValue('Тест');
    status = 200;
    await page.locator('[data-submit]').click();
    await expect(st).toHaveText(await st.getAttribute('data-ok'));
  });

  test('сервер не отвечает — через 15 с ошибка, кнопка снова доступна', async ({ page }) => {
    await page.route('**/api/lead/', () => { /* ответа нет */ });
    await openForm(page);
    await fill(page);
    await page.clock.install();
    await page.locator('[data-submit]').click();
    const st = page.locator('[data-status]');
    await expect(st).toHaveText(await st.getAttribute('data-sending'));
    await expect(page.locator('[data-submit]')).toBeDisabled();
    await page.clock.runFor(15_500);
    await expect(st).toHaveText(await st.getAttribute('data-fail'));
    await expect(page.locator('[data-submit]')).toBeEnabled();
  });

  test('со страницы квартиры уходит выбранная квартира (не текст разметки)', async ({ page }) => {
    let body = null;
    await page.route('**/api/lead/', async (r) => { body = JSON.parse(r.request().postData()); await r.fulfill({ status: 200, body: '{"ok":true}' }); });
    await open(page, '/apartments/2-6708/?flat=4-45');
    await page.locator('.apt_info [data-open-dialog]').click();
    await fill(page);
    await page.locator('[data-submit]').click();
    await expect.poll(() => body && body.flat).toBe('2-комнатная, 67,08 м² — подъезд 4, этаж 8, № 45');
  });
});

test.describe('каталог', () => {
  /* 28.09: вставки — «Архитектура», падел-корт и парковка на первой странице, сад и white-box — после «Показать ещё»;
     кадры — вертикальные, из исходников полного разрешения (не растянутые 800×400) */
  test('вставки: падел и парковка на первой странице, всего пять', async ({ page }) => {
    await open(page, '/apartments/');
    await expect(page.locator('.abenefit h3')).toHaveText(['Архитектура', 'Падел-корт', 'Парковка']);
    await expect(page.locator('.abenefit img').first()).toHaveAttribute('srcset', /apt-arch-1100\.webp 1100w/);
    await page.locator('[data-apts-more]').click();
    await expect(page.locator('.abenefit')).toHaveCount(5);
  });

  test('неверные параметры адреса отбрасываются', async ({ page }) => {
    await open(page, '/apartments/?type=9&ent=99&sort=zzz');
    await expect(page.locator('[data-apts-count]')).toHaveText('1186');
    await expect(page).toHaveURL(/\/apartments\/$/);
    await expect(page.locator('.acard')).toHaveCount(24);
  });

  test('пустой результат: список фильтра не обрезан, сброс возвращает квартиры', async ({ page }) => {
    await open(page, '/apartments/?type=4&ent=3');
    await expect(page.locator('[data-apts-empty]')).toBeVisible();
    await page.locator('[data-select="ent"] [data-select-btn]').click();
    const last = page.locator('[data-select="ent"] [data-select-item]').last();
    await last.scrollIntoViewIfNeeded();
    /* последний пункт виден и не перекрыт следующей секцией */
    const hit = await last.evaluate((el) => { const r = el.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return el.contains(t); });
    expect(hit).toBe(true);
    await page.keyboard.press('Escape');
    await page.locator('[data-apts-reset-empty]').click();
    await expect(page.locator('[data-apts-count]')).toHaveText('1186');
    await expect(page.locator('.acard')).toHaveCount(24);
  });

  test('«Показать ещё», переход в квартиру и назад: список и место сохраняются', async ({ page }) => {
    await open(page, '/apartments/');
    await page.locator('[data-apts-more]').click();
    await expect(page.locator('.acard')).toHaveCount(48);
    await page.locator('[data-apts-more]').click();
    await expect(page.locator('.acard')).toHaveCount(72);
    await page.waitForTimeout(1500);                                 /* въезд новых карточек закончился */
    await page.evaluate(() => window.scrollTo(0, Math.round(document.documentElement.scrollHeight * .45)));
    await page.waitForTimeout(600);
    const before = await page.evaluate(() => {
      const c = [...document.querySelectorAll('.acard')].find((a) => a.getBoundingClientRect().top > 120);
      return { y: Math.round(scrollY), id: c.dataset.id, top: Math.round(c.getBoundingClientRect().top) };
    });
    await page.locator(`.acard[data-id="${before.id}"]`).evaluate((el) => el.click());   /* без автопрокрутки Playwright */
    await page.waitForURL(/\/apartments\/\d-\d+\/\?flat=/);
    await page.goBack();
    await expect(page.locator('.acard')).toHaveCount(72);
    await expect.poll(() => page.evaluate(() => Math.round(scrollY))).toBe(before.y);
    const top = await page.locator(`.acard[data-id="${before.id}"]`).evaluate((el) => Math.round(el.getBoundingClientRect().top));
    expect(Math.abs(top - before.top)).toBeLessThan(3);
  });

  test.describe('телефон', () => {
    test.use(MOBILE);
    test('счётчик квартир на экране', async ({ page }) => {
      await open(page, '/apartments/');
      await expect(page.locator('[data-apts-count]')).toBeInViewport({ ratio: 1 });
    });
  });
});

test.describe('главная', () => {
  test('знак PARI на линии пути не растянут', async ({ page }) => {
    await open(page, '/');
    const r = await page.evaluate(() => {
      const map = document.querySelector('.concept-path_map > svg').getBoundingClientRect();
      const mark = document.querySelector('.concept-path_map > svg svg').getBoundingClientRect();
      return mark.width / map.width;
    });
    expect(r).toBeLessThan(.1);
  });

  /* 28.09: цикл кадров спит в покое, и часы Lenis получали «прошедшие» секунды разом —
     первый щелчок колеса после паузы перескакивал весь шаг за один кадр */
  test('первый щелчок колеса после паузы доезжает плавно, а не прыгает', async ({ page }) => {
    await open(page, '/');
    await page.mouse.move(700, 450);
    await page.waitForTimeout(2500);
    const y0 = await page.evaluate(() => scrollY);
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(60);
    const early = await page.evaluate((y0) => scrollY - y0, y0);
    await page.waitForTimeout(1600);
    const full = await page.evaluate((y0) => scrollY - y0, y0);
    expect(full).toBeGreaterThan(0);
    expect(early).toBeLessThan(full * .7);
  });

  /* 28.09: старый кадр сжимался с одной стороны, новый рос с другой — посередине смены открывался пустой фон */
  test('смена вкладки удобств: новый кадр входит по краю старого, без просвета', async ({ page }) => {
    await open(page, '/');
    await page.evaluate(() => { const s = document.querySelector('.amen'); window.scrollTo(0, s.getBoundingClientRect().top + scrollY); });
    await page.waitForTimeout(800);
    await page.locator('[data-tab]').nth(1).click();
    /* по ходу смены верхняя и нижняя строки кадра целиком закрыты хотя бы одним кадром
       (маски кадров — из вычисленного clip-path: polygon у шторки, inset у прежней смены) */
    for (const t of [350, 600, 850]) {
      await page.waitForTimeout(t === 350 ? 350 : 250);
      const holes = await page.evaluate(() => {
        const spans = (el) => {
          const c = getComputedStyle(el).clipPath, w = el.offsetWidth || 1;
          const pc = (v) => (v.endsWith('%') ? parseFloat(v) : parseFloat(v) / w * 100);
          if (c === 'none') return [[0, 100], [0, 100]];
          let m = c.match(/^polygon\((.*)\)$/);
          if (m) {
            const pts = m[1].split(',').map((s) => s.trim().split(/\s+/)).map(([x, y]) => [pc(x), parseFloat(y)]);
            const row = (yy) => { const xs = pts.filter((p) => p[1] === yy).map((p) => p[0]); return xs.length ? [Math.min(...xs), Math.max(...xs)] : [0, 0]; };
            return [row(0), row(100)];
          }
          m = c.match(/^inset\((.*)\)$/);
          if (m) { const v = m[1].split(/\s+/); const r = pc(v[1] ?? v[0]), l = pc(v[3] ?? v[1] ?? v[0]); return [[l, 100 - r], [l, 100 - r]]; }
          return [[0, 100], [0, 100]];
        };
        const all = [...document.querySelectorAll('[data-tab-img]')].map(spans);
        const out = [];
        [0, 1].forEach((row) => [1, 10, 25, 40, 50, 60, 75, 90, 99].forEach((x) => {
          if (!all.some((s) => s[row][0] <= x && x <= s[row][1])) out.push(`${row ? 'низ' : 'верх'} ${x}%`);
        }));
        return out;
      });
      expect(holes, `на ${t} мс без кадра: ${holes}`).toEqual([]);
    }
    await expect(page.locator('[data-tab-text]').nth(1)).toHaveClass(/is-active/);
  });

  /* 28.09: ветка вишни — WebGL (изгиб, дрожь цветков, падающие лепестки); без WebGL остаётся картинка */
  test('ветка вишни оживает: холст вместо неподвижной картинки', async ({ page }) => {
    await open(page, '/');
    const gl = await page.evaluate(() => !!document.createElement('canvas').getContext('webgl'));
    test.skip(!gl, 'в этом браузере нет WebGL — остаётся картинка');
    await page.evaluate(() => { const s = document.querySelector('.statement'); scrollTo(0, s.getBoundingClientRect().top + scrollY - 100); });
    await expect(page.locator('.statement .flower')).toHaveClass(/is-gl/, { timeout: 10_000 });
    await expect(page.locator('.statement .flower canvas.flower_gl')).toHaveCount(1);
  });

  test('вкладки удобств переключаются стрелками', async ({ page }) => {
    await open(page, '/');
    const tabs = page.locator('[data-tab]');
    await tabs.first().focus();
    await page.keyboard.press('ArrowDown');
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(tabs.nth(1)).toBeFocused();
    await expect(page.locator('[data-tab-text]').nth(1)).toHaveClass(/is-active/);
  });

  /* 28.09: размеры ленты идут от ширины экрана, и путь, прибитый к верху, уходил за нижний край
     у браузера на весь экран 1920×1080 (окно ~1904×950) — видна была только подпись «Университет» */
  test.describe('широкое невысокое окно', () => {
    test.use({ viewport: { width: 1904, height: 950 } });
    test('линия пути с подписями — целиком на экране и ниже заголовка', async ({ page }) => {
      await open(page, '/');
      await page.evaluate(() => { const s = document.querySelector('.concept'); scrollTo(0, s.getBoundingClientRect().top + scrollY + s.offsetHeight - innerHeight - 40); });
      await expect.poll(() => page.evaluate(() => document.querySelector('[data-path]').classList.contains('is-drawn')), { timeout: 10_000 }).toBe(true);
      const g = await page.evaluate(() => {
        const b = (s) => document.querySelector(s).getBoundingClientRect();
        const lbl = [...document.querySelectorAll('.concept-path_lbl')].map((e) => e.getBoundingClientRect());
        return { vh: innerHeight, title: b('.concept-city').bottom, note: b('.concept-path_note').bottom, top: Math.min(...lbl.map((r) => r.top)), bottom: Math.max(...lbl.map((r) => r.bottom)) };
      });
      expect(g.note).toBeLessThanOrEqual(g.vh);
      expect(g.bottom).toBeLessThanOrEqual(g.vh);
      expect(g.top).toBeGreaterThan(g.title);
    });
  });

  test.describe('планшет', () => {
    test.use({ viewport: { width: 768, height: 1024 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

    test('круглая кнопка не ложится на слоган и «Днём / Вечером»', async ({ page }) => {
      await open(page, '/');
      /* переключатель есть только при паре кадров одной камеры; без него — нижняя граница слогана */
      const tabs = await page.locator('.hero-s_tabs').first().boundingBox();
      const above = tabs || await page.locator('.hero-s_title').first().boundingBox();
      const btn = await page.locator('.btn-circle').first().boundingBox();
      expect(btn.y).toBeGreaterThanOrEqual(above.y + above.height);
    });

    test('поворот в альбом включает горизонтальную главу без перезагрузки', async ({ page }) => {
      await open(page, '/');
      await page.setViewportSize({ width: 1194, height: 834 });
      await page.waitForTimeout(500);
      const top = await page.evaluate(() => document.querySelector('.concept').getBoundingClientRect().top + scrollY);
      const h = await page.evaluate(() => document.querySelector('.concept').offsetHeight);
      await page.evaluate((y) => window.scrollTo(0, y), top + h * .6);
      await expect.poll(() => page.evaluate(() => document.querySelector('[data-hscroll-track]').style.transform)).toMatch(/translate3d\(-[1-9]/);
    });
  });
});

test.describe('страница планировки', () => {
  test('лист планировки — с размерами и без кадра-обрезки из каталога в srcset', async ({ page }) => {
    await open(page, '/apartments/2-6708/');
    const img = page.locator('.apt_plan img');
    await expect(img).toHaveAttribute('width', /\d+/);
    await expect(img).toHaveAttribute('height', /\d+/);
    expect(await img.getAttribute('srcset')).not.toContain('-800.webp');
  });

  test('вкладки — стрелками, соседняя квартира на плане этажа — с клавиатуры', async ({ page }) => {
    await open(page, '/apartments/2-6708/?flat=4-45');
    await page.locator('[data-flat-tab="0"]').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-flat-tab="1"]')).toHaveAttribute('aria-selected', 'true');
    const go = page.locator('[data-floor-svg] [data-go]').first();
    await expect(go).toHaveAttribute('role', 'button');
    const target = await go.getAttribute('data-go');
    await go.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`flat=${target}`));
  });
});

test.describe('готовые файлы', () => {
  /* та же сборка, что раздаёт сервер тестов (DIST — другая сборка для сравнения) */
  const root = process.env.DIST ? pathToFileURL(process.env.DIST.replace(/\/?$/, '/')) : new URL('../dist/', import.meta.url);
  const dist = (p) => new URL(p, root);
  test('404 не индексируется и не ссылается на несуществующие языковые версии', () => {
    const html = readFileSync(dist('404.html'), 'utf8');
    expect(html).toContain('<meta name="robots" content="noindex">');
    expect(html).not.toMatch(/<link[^>]+rel="canonical"|<link[^>]+rel="alternate"[^>]+hreflang=/);
    /* переключатель языка на 404 — на главные страницы языков, а не на /en/404/ (такой страницы нет) */
    expect(html).not.toMatch(/href="\/(?:uz\/|en\/|fr\/)?404\/"/);
  });
  test('в sitemap нет даты сборки вместо даты изменения', () => {
    expect(readFileSync(dist('sitemap.xml'), 'utf8')).not.toContain('<lastmod>');
  });
  test('нет ссылок на страницы, которых нет (политика, согласие)', () => {
    for (const page of ['index.html', 'en/index.html', 'apartments/index.html']) {
      const html = readFileSync(dist(page), 'utf8');
      if (!existsSync(dist('privacy/index.html'))) expect(html).not.toContain('/privacy/');
      if (!existsSync(dist('consent/index.html'))) expect(html).not.toContain('/consent/');
    }
  });
});
