# -*- coding: utf-8 -*-
"""Кадры в форматах образца, на который смотрит заказчик (stellarresidence.uz).

У образца жёсткая система пропорций, замеренная в браузере на ширине 1440:
  * полноэкранные слайды разделов — 1,59 (16:10), кадр ровно во весь экран;
  * галерея архитектуры — 0,93, почти квадрат, все кадры одинаковые;
  * врезки в текстовых разделах — портрет 0,78–0,80 (4:5);
  * паркинг — портрет 0,66 (2:3).
У нас же кадры шли каждый своей пропорции, вплоть до панорамы 3,93 — заказчик
на это и указал. Здесь кадры пережимаются под форматы образца настоящим
кадрированием: из исходных рендеров 5504×3072, где они есть, иначе из самой
крупной готовой копии.

Запуск: python tools/make-formats.py
Требует: pillow.
"""

import os
import unicodedata

from PIL import Image

Image.MAX_IMAGE_PIXELS = None

SRC = os.environ.get('PARI_RENDERS', r'C:/Users/User/Downloads')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'img')

# форматы образца: суффикс → (пропорция, ширины)
FORMATS = {
    'sq': (0.933, (700, 1100, 1400)),    # галерея архитектуры
    'w16': (1.600, (1280, 2048)),        # слайды во весь экран
    'p45': (0.800, (800, 1200)),         # врезки-портреты
    'p23': (0.667, (700, 1000)),         # паркинг
    'sv': (1.430, (900, 1400)),          # раздел «забота в деталях»
}

# что из чего режем.
#   base      — имя на сайте
#   origin    — файл в загрузках (если есть) либо готовая копия в assets/img
#   fmt       — формат из FORMATS
#   anchor    — доля по горизонтали и вертикали, вокруг которой держим кадр
JOBS = [
    # ── галерея архитектуры: четыре одинаковых квадрата ──
    ('arch-facade',   'Рендер фасад_мокрый тротуар.jpg', 'sq',  (0.50, 0.52)),
    ('arch-entrance', 'Рендер_вход в подъезд.jpg',       'sq',  (0.50, 0.50)),
    ('arch-stone',    'Рендер_цветок.jpg',               'sq',  (0.50, 0.50)),
    ('arch-balcony',  'Рендер_балкон.jpg',               'sq',  (0.50, 0.50)),

    # ── врезки-портреты в разделе «о проекте» ──
    ('arch-entrance', 'Рендер_вход в подъезд.jpg',       'p45', (0.50, 0.46)),
    ('arch-yard',     'Рендер_двор.jpg',                 'p45', (0.50, 0.50)),

    # ── слайды во весь экран: 16:10 ──
    ('cine-yard',     'assets/img/cine-yard-2560.webp',     'w16', (0.50, 0.50)),
    ('cine-arcade',   'assets/img/cine-arcade-2560.webp',   'w16', (0.50, 0.50)),
    ('cine-lobby',    'assets/img/cine-lobby-1672.webp',    'w16', (0.50, 0.50)),
    ('cine-balcony',  'assets/img/cine-balcony-2560.webp',  'w16', (0.50, 0.50)),
    ('yard',          'assets/img/yard-1920.webp',          'w16', (0.50, 0.50)),

    # ── паркинг: портрет 2:3 ──
    ('cine-parking',  'assets/img/cine-parking-1535.webp',  'p23', (0.50, 0.50)),

    # ── «забота в деталях»: кадры зон двора, формат 1,43 как у образца ──
    ('arch-arch',     'Рендер_арка во двор.png',         'sv',  (0.50, 0.50)),
    ('arch-pergola',  'Рендер_беседка.jpg',              'sv',  (0.50, 0.50)),
    ('arch-yard',     'Рендер_двор.jpg',                 'sv',  (0.50, 0.54)),
    ('arch-stone',    'Рендер_цветок.jpg',               'sv',  (0.50, 0.50)),

    # ── двор в разделе «двор-парк»: портрет, как пентхаусы у образца ──
    ('yard',          'assets/img/yard-1920.webp',          'p45', (0.50, 0.50)),
]


def find(name):
    """Имена из Telegram приходят с разложенными «й» и «ё» — сравниваем нормализованно."""
    if name.startswith('assets/'):
        path = os.path.join(ROOT, name)
        return path if os.path.exists(path) else None
    want = unicodedata.normalize('NFC', name)
    for f in os.listdir(SRC):
        if unicodedata.normalize('NFC', f) == want:
            return os.path.join(SRC, f)
    return None


def crop_to(im, ratio, anchor):
    """Обрезает до нужной пропорции, держа кадр вокруг точки anchor."""
    ax, ay = anchor
    w, h = im.size
    if w / h > ratio:                      # кадр шире нужного — режем по бокам
        nw, nh = round(h * ratio), h
    else:                                  # кадр выше нужного — режем сверху и снизу
        nw, nh = w, round(w / ratio)
    left = min(max(round(w * ax - nw / 2), 0), w - nw)
    top = min(max(round(h * ay - nh / 2), 0), h - nh)
    return im.crop((left, top, left + nw, top + nh))


def main():
    made = 0
    for base, origin, fmt, anchor in JOBS:
        ratio, widths = FORMATS[fmt]
        path = find(origin)
        if not path:
            print('  нет исходника: %s (для %s-%s)' % (origin, base, fmt))
            continue
        im = Image.open(path)
        if im.mode not in ('RGB', 'L'):
            # альфа-канал на сплошном светлом фоне только утяжеляет файл
            bg = Image.new('RGB', im.size, (250, 250, 250))
            bg.paste(im, mask=im.split()[-1] if im.mode in ('RGBA', 'LA') else None)
            im = bg
        cut = crop_to(im, ratio, anchor)
        for w in widths:
            if cut.width < w * 0.9:        # не растягиваем кадр ради лишней ширины
                continue
            out = cut.resize((w, round(w / ratio)), Image.LANCZOS)
            name = '%s-%s-%d.webp' % (base, fmt, w)
            dest = os.path.join(OUT, name)
            out.save(dest, quality=82, method=6)
            made += 1
            print('  %-30s %5d×%-5d %6d КБ' % (name, out.width, out.height,
                                               os.path.getsize(dest) // 1024))
    print('Готово: %d файлов' % made)


if __name__ == '__main__':
    main()
