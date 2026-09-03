#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Иконки сайта из фирменного логотипа.

Раньше в разметке стоял только инлайновый SVG-фавикон с самодельной буквой:
вкладка его показывала, а превью ссылок в мессенджерах и поиске — нет, там
оставался серый глобус. Здесь из настоящего логотипа режется монограмма «P»
и собирается полный набор: ICO для корня, PNG для манифеста и iOS.

Монограмма — только каллиграфическая часть логотипа (подпись SAMARKAND в
16 px превращается в грязь). Поле золотое, буква светлая: на 16 px это
единственный вариант, который держит и форму, и цвет — светлая плашка на
белой панели вкладок пропадает.

Запуск: python tools/make-icons.py
"""
import os

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'img', 'pari-logo-vector.png')
OUT = os.path.join(ROOT, 'assets', 'img')

GOLD = (179, 131, 43)          # 3.1 гайдбука
LIGHT = (250, 250, 250)

SCRIPT_PART = 0.74             # верхняя часть логотипа — каллиграфия
# «P» в логотипе — с росчерком, её чаша уходит вправо и почти дотягивается до
# «A». Разрез ищем не на глаз, а по провалу заливки: до 34.5% ширины идёт буква,
# дальше пустое место перед стойкой «A». Прежние 0.245 резали чашу пополам —
# в иконке оставался обрубок, упиравшийся в правый край.
MONO_PART = 0.345              # доля ширины, в которую укладывается «P»
PAD = 0.11                     # поле вокруг буквы: на 16 px важен каждый пиксель


def mono():
    im = Image.open(SRC).convert('RGBA')
    logo = im.crop(im.getbbox())
    w, h = logo.size
    script = logo.crop((0, 0, w, int(h * SCRIPT_PART)))
    sw, sh = script.size
    p = script.crop((0, 0, int(sw * MONO_PART), sh))
    return p.crop(p.getbbox())


def icon(letter, size):
    tile = Image.new('RGBA', (size, size), GOLD + (255,))
    box = int(size * (1 - 2 * PAD))
    pw, ph = letter.size
    s = min(box / pw, box / ph)
    q = letter.resize((max(1, int(pw * s)), max(1, int(ph * s))), Image.LANCZOS)
    paint = Image.new('RGBA', q.size, LIGHT + (255,))
    paint.putalpha(q.split()[3])
    tile.alpha_composite(paint, ((size - q.size[0]) // 2, (size - q.size[1]) // 2))
    return tile


def main():
    letter = mono()
    for size, name in [(512, 'icon-512.png'), (192, 'icon-192.png'),
                       (180, 'apple-touch-icon.png')]:
        icon(letter, size).save(os.path.join(OUT, name))
        print('  ', name)
    # ICO кладём в корень сборки — туда за ним ходят по умолчанию
    ico = os.path.join(OUT, 'favicon.ico')
    icon(letter, 256).save(ico, sizes=[(16, 16), (32, 32), (48, 48)])
    print('   favicon.ico')
    print('готово:', OUT)


main()
