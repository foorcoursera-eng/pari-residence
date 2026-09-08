# -*- coding: utf-8 -*-
"""Входные группы: лобби, зона ожидания, колясочная, лифтовой холл.

Источник — вертикальные рендеры 2871×4105 от застройщика (qw_View*.jpg).
Ничего не дорисовывается и не кадрируется: меняется только размер.

Кадры вертикальные, в галерее они стоят колонками максимум ~600 px шириной,
поэтому широких вариантов не делаем — двух ширин хватает и на ретину.

Запуск: python tools/make-lobby.py
Требует: pillow.
"""

import os

from PIL import Image

Image.MAX_IMAGE_PIXELS = None

SRC = os.environ.get('PARI_RENDERS', r'C:/Users/User/Downloads')
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'img')

# Порядок — как идёт человек: с улицы в лобби, дальше к лифтам.
SHOTS = [
    ('qw_View02.jpg', 'lobby-01'),   # вход с улицы, перегородки, почтовые ящики
    ('qw_View01.jpg', 'lobby-02'),   # лобби целиком, гостиная зона и знак PARI
    ('qw_View03.jpg', 'lobby-03'),   # знак PARI на лепном панно
    ('qw_View07.jpg', 'lobby-04'),   # зона ожидания с мягкой мебелью
    ('qw_View06.jpg', 'lobby-05'),   # колясочная и почтовые ящики
    ('qw_View05.jpg', 'lobby-06'),   # помещение для колясок крупно
    ('qw_View08.jpg', 'lobby-07'),   # лифтовой холл
    ('qw_View09.jpg', 'lobby-08'),   # указатель «Лобби, 1 этаж»
]
WIDTHS = (760, 1180)


def main():
    total = 0
    print('Входные группы:')
    for name, base in SHOTS:
        path = os.path.join(SRC, name)
        if not os.path.exists(path):
            print('  НЕТ ИСХОДНИКА: %s' % name)
            continue
        im = Image.open(path).convert('RGB')
        for w in WIDTHS:
            if im.width < w:
                continue
            out = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
            dst = os.path.join(OUT, '%s-%d.webp' % (base, w))
            out.save(dst, quality=80, method=6)
            kb = os.path.getsize(dst) // 1024
            total += kb
            print('  %-20s %4d×%-5d %5d КБ' % (os.path.basename(dst), out.width, out.height, kb))
    print('Всего: %d КБ' % total)


if __name__ == '__main__':
    main()
