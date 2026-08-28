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


def find(name):
    """Имена приходят из Telegram с разложенными «й» и «ё» — сравниваем нормализованно."""
    want = unicodedata.normalize('NFC', name)
    for f in os.listdir(SRC):
        if unicodedata.normalize('NFC', f) == want:
            return os.path.join(SRC, f)
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
