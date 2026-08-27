# -*- coding: utf-8 -*-
"""Добавляет в шрифты знак U+02BB (узбекская окина в oʻ / gʻ).

В исходных файлах его нет, поэтому каждое узбекское слово с oʻ или gʻ добиралось
системным шрифтом — на странице это видно как чужое начертание. Новый глиф не
рисуется: в таблицу cmap добавляется ссылка на уже имеющийся в шрифте знак U+2018,
который в этих гарнитурах и есть нужная форма. Скрипт идемпотентный.
"""
from fontTools.ttLib import TTFont
import sys, os

SRC = 0x2018        # ‘ — форма, которая уже есть в шрифте
DST = 0x02BB        # ʻ — узбекская окина

def patch(path):
    font = TTFont(path)
    cmap = font['cmap']
    added = 0
    for table in cmap.tables:
        if DST in table.cmap:
            continue
        if SRC in table.cmap:
            table.cmap[DST] = table.cmap[SRC]
            added += 1
    if not added:
        return 'пропущен (нет U+2018 или знак уже есть)'
    font.flavor = 'woff2'
    font.save(path)
    return 'добавлен в %d подтаблиц cmap' % added

if __name__ == '__main__':
    for p in sys.argv[1:]:
        print('%-24s %s' % (os.path.basename(p), patch(p)))
