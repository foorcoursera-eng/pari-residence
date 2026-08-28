# -*- coding: utf-8 -*-
"""Линейная подложка первого экрана — из настоящего генплана.

Источник: «Самарканд_ЖК_«Pari_Residence»_Альбом_23_07_2026.pdf», стр. 3 —
генеральный план М1:500 (492 тысячи векторных путей). Берём только пятно
застройки без рамки листа, таблиц и экспликации, оставляем одну графику:
светлое отбрасываем, тёмное превращаем в золотую линию с прозрачным фоном.

Порог подобран так, чтобы цветные заливки газонов и проездов ушли, а контуры
корпусов, разбивочные оси и штриховка остались: подложка должна читаться как
чертёж, а не как выцветшая картинка.

Запуск: python tools/make-genplan-line.py
"""
import os
import pymupdf
from PIL import Image, ImageOps, ImageChops

SRC = r'C:\Users\User\Downloads\Самарканд_ЖК_«Pari_Residence»_Альбом_23_07_2026.pdf'
PAGE = 2                       # третья страница: генеральный план
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'img')

# доля листа, которую занимает само пятно застройки (без заголовка и таблиц)
CROP = (0.038, 0.085, 0.915, 0.755)

GOLD = (179, 131, 43)          # 3.1 — фирменное золото
INK_MAX = 190                  # светлее этого считаем фоном
INK_MIN = 55                   # темнее этого — линия в полную силу
SAT_MAX = 70                   # цветные заливки газонов и проездов отбрасываем:
                               # настоящая графика листа почти нейтральна по цвету


def main():
    doc = pymupdf.open(SRC)
    page = doc[PAGE]
    r = page.rect
    clip = pymupdf.Rect(r.x0 + r.width * CROP[0], r.y0 + r.height * CROP[1],
                        r.x0 + r.width * CROP[2], r.y0 + r.height * CROP[3])
    pix = page.get_pixmap(dpi=150, clip=clip)
    im = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    print('рендер', im.size)

    # линии ищем по яркости: чем темнее пиксель, тем плотнее линия
    gray = ImageOps.grayscale(im)
    alpha = gray.point(lambda v: 0 if v >= INK_MAX else
                       (255 if v <= INK_MIN else int(255 * (INK_MAX - v) / (INK_MAX - INK_MIN))))

    # и отсекаем всё цветное: газон и проезды окрашены, чертёж — нет
    sat = im.convert('HSV').getchannel('S')
    alpha = ImageChops.multiply(alpha, sat.point(lambda v: 255 if v < SAT_MAX else 0))

    for w in (1600, 2400):
        h = round(alpha.height * w / alpha.width)
        a = alpha.resize((w, h), Image.LANCZOS)
        out = Image.new('RGBA', (w, h), GOLD + (0,))
        out.putalpha(a)
        name = 'genplan-line-%d.webp' % w
        out.save(os.path.join(OUT, name), 'WEBP', quality=88, method=6)
        print('  %s  %dx%d  %d КБ' % (name, w, h, os.path.getsize(os.path.join(OUT, name)) / 1024))


if __name__ == '__main__':
    main()
