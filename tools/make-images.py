# -*- coding: utf-8 -*-
"""Картинки для разделов «О проекте», «Архитектурные решения» и «Локация».

Источники — материалы застройщика, ничего не дорисовывается:
  * рендеры 5504×3072 из папки загрузок (фасады, входная группа, двор, камень);
  * мастер-план района и вид сверху — страницы финального буклета.

Запуск: python tools/make-images.py
Требует: pymupdf, pillow.
"""

import os
import unicodedata

import pymupdf
from PIL import Image

Image.MAX_IMAGE_PIXELS = None

SRC = os.environ.get('PARI_RENDERS', r'C:/Users/User/Downloads')
BOOK = os.environ.get('PARI_BOOK', r'C:/Users/User/Downloads/Pari_буклет финал.pdf')
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'img')

# имя файла в загрузках → имя на сайте (ширины отдаём три: телефон, ноутбук, ретина)
RENDERS = [
    ('Рендер фасад_мокрый тротуар.jpg', 'arch-facade'),
    ('Рендер_балкон.jpg', 'arch-balcony'),
    ('Рендер_вход в подъезд.jpg', 'arch-entrance'),
    ('Рендер_арка во двор.png', 'arch-arch'),
    ('Рендер_двор.jpg', 'arch-yard'),
    ('Рендер_беседка.jpg', 'arch-pergola'),
    ('Рендер_цветок.jpg', 'arch-stone'),
    ('Рендер_фасад 1я линия.jpg', 'arch-line'),
]
WIDTHS = (1280, 1920, 2560)

# Вторая партия рендеров (архив 3.1.zip, 19.09.2026): первая линия днём и на
# рассвете, угловая торговая галерея. Кадр галереи берём только левой частью:
# в правой на витринах стоят подписи чужих марок-заглушек, их на сайте быть
# не должно. Кадр (left, top, right, bottom) — в долях исходника.
SRC_31 = os.environ.get('PARI_RENDERS_31', r'C:/Users/User/Downloads/Telegram Desktop/3.1')
RENDERS_31 = [
    ('6-Кадр01.jpg', 'line-day', None),
    ('3.1.jpg', 'line-dawn', None),
    ('13.jpg', 'gallery-corner', (0.04, 0.30, 0.42, 1.0)),
]


# Интерьеры из материалов PARI (папка «pari 21.09», четыре вертикальных кадра
# с маркой PARI): иллюстрация возможной отделки при white-box. Порядок —
# гостиная-кухня, спальня, столовая у окна, кухня. Исходники 960×1280 —
# ступени 760 и 960, выше не поднимаем.
SRC_INT = os.environ.get('PARI_INTERIORS', r'D:/Новый дизайн для Pari/Reference & Design/pari 21.09')
INTERIORS = [
    ('3213dd39-ecd8-40fb-bfa1-85555f4bc571.jfif', 'interior-01'),
    ('9b6f3fc8-e14b-4dcd-9ff4-c605b1cb85f3.jfif', 'interior-02'),
    ('d3e6a93b-3992-4244-b1b8-efd57738223b.jfif', 'interior-03'),
    ('e7d57188-9f71-4f24-bcb0-3cd7013b0b7f.jfif', 'interior-04'),
]


def find(name, src=None):
    """Имена приходят из Telegram с разложенными «й» и «ё» — сравниваем нормализованно."""
    src = src or SRC
    if not os.path.isdir(src):
        return None
    want = unicodedata.normalize('NFC', name)
    for f in os.listdir(src):
        if unicodedata.normalize('NFC', f) == want:
            return os.path.join(src, f)
    return None


def save_set(im, base, widths=WIDTHS, quality=80):
    for w in widths:
        if im.width < w:
            continue
        out = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        path = os.path.join(OUT, '%s-%d.webp' % (base, w))
        out.save(path, quality=quality, method=6)
        print('  %-28s %5d×%-5d %6d КБ' % (os.path.basename(path), out.width, out.height,
                                           os.path.getsize(path) // 1024))


def main():
    print('Рендеры:')
    for name, base in RENDERS:
        path = find(name)
        if not path:
            print('  ПРОПУЩЕН (нет файла):', name)
            continue
        save_set(Image.open(path).convert('RGB'), base)

    print('Рендеры 3.1:')
    for name, base, box in RENDERS_31:
        path = find(name, SRC_31)
        if not path:
            print('  ПРОПУЩЕН (нет файла):', name)
            continue
        im = Image.open(path).convert('RGB')
        if box:
            im = im.crop((round(im.width * box[0]), round(im.height * box[1]),
                          round(im.width * box[2]), round(im.height * box[3])))
        save_set(im, base)

    print('Интерьеры:')
    for name, base in INTERIORS:
        path = find(name, SRC_INT)
        if not path:
            print('  ПРОПУЩЕН (нет файла):', name)
            continue
        save_set(Image.open(path).convert('RGB'), base, (760, 960), quality=82)

    doc = pymupdf.open(BOOK)

    # ── мастер-план района: та же картинка, что в буклете, но с подписью PARI
    # и значками школ, детсада, университета и торгового центра. Нижнюю
    # кремовую полосу с легендой отрезаем — легенда набирается на сайте, чтобы
    # была и по-узбекски. ──
    print('Мастер-план района:')
    pix = doc[6].get_pixmap(dpi=300)
    page = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    plan = page.crop((0, 0, page.width, round(page.height * 0.782)))
    save_set(plan, 'masterplan', (1000, 1600, 2560), quality=70)

    # ── вид сверху на квартал: разворот целиком, без нижней полосы с текстом ──
    print('Вид сверху:')
    pix = doc[7].get_pixmap(dpi=300)
    page = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    aerial = page.crop((0, 0, page.width, round(page.height * 0.687)))
    save_set(aerial, 'complex-aerial', (1280, 1920, 2560), quality=80)


if __name__ == '__main__':
    main()
