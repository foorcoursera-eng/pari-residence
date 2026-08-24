# -*- coding: utf-8 -*-
"""
Готовит контуры букв для эффекта письма пером.

Берёт фирменную каллиграфическую гарнитуру, превращает каждую акцентную фразу
в набор путей — по одному на букву — и складывает результат в assets/pen/<язык>.json.
Скрипт на странице обводит эти пути по очереди: получается почерк, а не заливка.

Контуры лежат отдельным файлом, а не в разметке: страница остаётся лёгкой,
данные подгружаются только когда фраза подходит к экрану.

Запуск (нужен при смене фраз или шрифта):
    python tools/make-pen.py
"""

import io
import json
import os
import re
import unicodedata

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = [
    os.path.join(ROOT, 'assets', 'fonts', 'greatvibes-lat.woff2'),
    os.path.join(ROOT, 'assets', 'fonts', 'greatvibes-cyr.woff2'),
]
OUT_DIR = os.path.join(ROOT, 'assets', 'pen')
KEYS = ['heroSlogan', 'homesTitle', 'yardTitle', 'placeTitle', 'finalTitle']

PAD = 60          # запас по краям в единицах шрифта, чтобы росчерки не срезались


def load_fonts():
    fonts = []
    for path in FONTS:
        font = TTFont(path)
        fonts.append((font, font.getBestCmap(), font.getGlyphSet(), font['hmtx']))
    return fonts


def glyph_for(fonts, char):
    """Латиница и кириллица лежат в разных подмножествах — ищем в обоих."""
    for font, cmap, glyphs, hmtx in fonts:
        name = cmap.get(ord(char))
        if name:
            return font, glyphs, hmtx, name
    return None


def line_to_svg(fonts, text):
    """Одна строка фразы → размеры и список путей по буквам."""
    head = fonts[0][0]['head']
    hhea = fonts[0][0]['hhea']

    x = 0
    letters = []
    for char in text:
        found = glyph_for(fonts, char)
        if not found:
            x += head.unitsPerEm * 0.28           # неизвестный знак — просто пробел
            continue
        _, glyphs, hmtx, name = found
        width = hmtx[name][0]
        if char != ' ' and not unicodedata.category(char).startswith('Z'):
            pen = SVGPathPen(glyphs, ntos=lambda v: repr(int(round(v))))
            glyphs[name].draw(pen)
            d = pen.getCommands()
            if d:
                letters.append({'d': d, 'x': int(round(x)), 'char': char})
        x += width

    return {
        'upem': head.unitsPerEm,
        'width': int(round(x + PAD * 2)),
        'height': int(round(hhea.ascender - hhea.descender + PAD * 2)),
        'baseline': int(round(hhea.ascender + PAD)),
        'letters': letters,
    }


def phrase_to_svg(fonts, phrase):
    """Фраза может занимать несколько строк — они разделены <br>."""
    parts = re.split(r'<br\s*/?>', phrase)
    lines = [re.sub(r'\s+', ' ', p.replace('&nbsp;', ' ')).strip() for p in parts]
    return [line_to_svg(fonts, l) for l in lines if l]


def collect_phrases():
    """Фразы берём из контента: сначала идёт русский словарь, затем узбекский."""
    src = io.open(os.path.join(ROOT, 'src', 'content.js'), encoding='utf-8').read()
    by_lang = {'ru': {}, 'uz': {}}
    for key in KEYS:
        found = [m.group(1).replace("\\'", "'")
                 for m in re.finditer(key + r":\s*'((?:[^'\\]|\\.)*)'", src)]
        if len(found) >= 2:
            by_lang['ru'][key], by_lang['uz'][key] = found[0], found[1]
        elif found:
            by_lang['ru'][key] = by_lang['uz'][key] = found[0]
        else:
            print(f'  ! фраза {key} в контенте не найдена')
    return by_lang


def main():
    fonts = load_fonts()
    os.makedirs(OUT_DIR, exist_ok=True)
    for lang, phrases in collect_phrases().items():
        data = {}
        for key, phrase in phrases.items():
            data[key] = phrase_to_svg(fonts, phrase)
            letters = sum(len(l['letters']) for l in data[key])
            print(f'  {lang}  {key:12s} {letters:3d} букв  {phrase[:46]}')
        path = os.path.join(OUT_DIR, lang + '.json')
        io.open(path, 'w', encoding='utf-8', newline='\n').write(
            json.dumps(data, ensure_ascii=False, separators=(',', ':')))
        print(f'  → {os.path.relpath(path, ROOT)}  {os.path.getsize(path) / 1024:.0f} КБ\n')


if __name__ == '__main__':
    main()
