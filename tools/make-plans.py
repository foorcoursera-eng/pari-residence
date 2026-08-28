# -*- coding: utf-8 -*-
"""Планировки для сайта из рабочих листов застройщика.

Листы `Блок 1 и Блок 1.1.pdf`, `Блок 2 и Блок 2.1.pdf`, `Блок 2.2.pdf`,
`Блок 3..pdf`, `Блок 3.1..pdf` — векторные, с текстовым слоем: чертёж
не растр, поэтому его можно отрисовать в любом размере без замыливания.
Это лучший источник из имеющихся. В буклете те же планировки лежат
картинкой ~870 px, и поднимать её разрешение бессмысленно — оттуда берётся
только 95,13 м² (лист блока 4 застройщик не присылал).

На листе есть всё, что просил заказчик: чертёж с размерами и подписями комнат,
экспликация по комнатам, роза инсоляции, расположение квартиры на этаже и
расположение таких же квартир в комплексе.

  <id>-1400.webp — лист целиком (его открывает просмотрщик);
  <id>-800.webp  — только чертёж (он стоит в карточке на странице).

Идентификаторы должны совпадать со списком planItems в src/content.js.

Запуск: python tools/make-plans.py
Требует: pymupdf, pillow.
"""

import glob
import os
import re
import unicodedata

import numpy as np
import pymupdf
from PIL import Image, ImageFilter

SRC = os.environ.get('PARI_SHEETS', r'C:/Users/User/Downloads')
BOOK = os.environ.get('PARI_BOOK', r'C:/Users/User/Downloads/Pari_буклет финал.pdf')
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'img', 'plans')

FULL_W = 1600                 # лист целиком: с этой ширины план читается при увеличении
CARD_W = 900                  # чертёж в карточке
RENDER_DPI = 300              # чертёж векторный, рисуем с запасом и уменьшаем

# Площадь → id и блоки для подписи. Порядок важен: первый блок задаёт, с какого
# листа брать чертёж, чтобы схема этажа отвечала названному блоку.
PLANS = [
    ('f1-2721', 1, '27,21', ['1.1/1']),
    ('f1-3684', 1, '36,84', ['2/2.1', '2.2']),
    ('f1-3751', 1, '37,51', ['1/1.2']),
    ('f1-3981', 1, '39,81', ['3', '3.1']),
    ('f1-4534', 1, '45,34', ['1/1.1']),

    ('f2-4146', 2, '41,46', ['2', '2.1', '2/2']),
    ('f2-4169', 2, '41,69', ['3', '3.1']),
    ('f2-4250', 2, '42,50', ['1.1/1']),
    ('f2-4330', 2, '43,30', ['3', '3.1']),
    ('f2-4367', 2, '43,67', ['1', '1.1']),
    ('f2-4389', 2, '43,89', ['2.2', '2.2/1']),
    ('f2-5252', 2, '52,52', ['1.1/1']),
    ('f2-5844', 2, '58,44', ['3', '3.1']),
    ('f2-6347', 2, '63,47', ['1/1.1']),
    ('f2-6423', 2, '64,23', ['1/1.1']),
    ('f2-6569', 2, '65,69', ['1/1.1']),
    ('f2-6595', 2, '65,95', ['1/1.1']),
    ('f2-6708', 2, '67,08', ['1', '1.1', '2', '2.1', '2.2', '3', '3.1']),
    ('f2-6769', 2, '67,69', ['1', '2.1']),
    ('f2-6863', 2, '68,63', ['3', '3.1']),
    ('f2-6995', 2, '69,95', ['3', '3.1']),
    ('f2-7015', 2, '70,15', ['2.1', '2.2']),
    ('f2-7052', 2, '70,52', ['2/2.1', '2.2']),
    ('f2-7285', 2, '72,85', ['3', '3.1']),
    ('f2-7327', 2, '73,27', ['3', '3.1']),
    ('f2-7338', 2, '73,38', ['1/1.1']),
    ('f2-7373', 2, '73,73', ['2/2.1', '2.2']),
    ('f2-7388', 2, '73,88', ['1/1.1']),
    ('f2-7403', 2, '74,03', ['2/2.1', '2.2']),

    ('f3-7471', 3, '74,71', ['1/1.1']),
    ('f3-8531', 3, '85,31', ['3', '3.1']),
    ('f3-9513', 3, '95,13', ['4.4/1']),

    ('f4-8911', 4, '89,11', ['2/2.1', '2.2']),
]

# Лист какого файла отвечает какому блоку: по нему выбираем страницу.
SHEET_BLOCKS = {
    'Блок 1 и Блок 1.1.pdf': ['1', '1.1', '1/1.1', '1.1/1', '1/1.2'],
    'Блок 2 и Блок 2.1.pdf': ['2', '2.1', '2/2.1'],
    'Блок 2.2.pdf': ['2.2', '2/2', '2.2/1'],
    'Блок 3..pdf': ['3'],
    'Блок 3.1..pdf': ['3.1'],
}

# Планировки, которых в листах нет: 95,13 м² — блок 4, лист не присылали.
# (id, страница буклета, половина разворота)
FROM_BOOK = {'f3-9513': (50, 'R')}

AREA = re.compile(r'^\d{2},\d{1,2}$')


def norm(name):
    return unicodedata.normalize('NFC', name)


def sheet_index():
    """Площадь квартиры → список листов, где она встречается."""
    index = {}
    for path in sorted(glob.glob(os.path.join(SRC, '*.pdf'))):
        base = norm(os.path.basename(path))
        if base not in SHEET_BLOCKS:
            continue
        doc = pymupdf.open(path)
        for no in range(doc.page_count):
            page = doc[no]
            words = page.get_text('words')
            # «Общая площадь квартиры  NN,NN  м2» — берём число на той же строке
            area = None
            for w in words:
                if w[4] != 'квартиры':
                    continue
                same = [q for q in words if abs(q[1] - w[1]) < 4]
                if not any(q[4] == 'площадь' for q in same):
                    continue
                right = sorted((q for q in same if q[0] > w[2]), key=lambda q: q[0])
                for q in right:
                    if AREA.match(q[4]):
                        a, b = q[4].split(',')
                        area = '%s,%s' % (a, b.ljust(2, '0'))
                        break
                break
            if area:
                index.setdefault(area, []).append((base, path, no))
    return index


def pick(sheets, blocks):
    """Лист, у которого схема этажа отвечает первому названному блоку."""
    for want in blocks:
        for base, path, no in sheets:
            if want in SHEET_BLOCKS.get(base, []):
                return base, path, no
    return sheets[0]


def plan_box(page, im, scale):
    """Габарит чертежа квартиры на листе.

    Раскладка листов плавает: роза инсоляции и схемы стоят то справа от чертежа,
    то под ним, шапка есть не на всех. Поэтому границы не угадываются по
    процентам страницы: лист размечается на связные пятна чернил и берётся самое
    крупное — это всегда сам чертёж. Считаем по отрисованной странице, а не по
    прямоугольникам путей: габарит пути охватывает и пустоту, из-за чего чертёж
    склеивался с розой в одно пятно.

    page  — страница PDF (по словам берём границы шапки и экспликации),
    im    — та же страница, уже отрисованная,
    scale — пикселей на пункт.
    """
    W, H = page.rect.width, page.rect.height
    words = page.get_text('words')

    top = 0.0
    for w in words:
        if 'КВАРТИРА' in w[4]:
            near = [q[3] for q in words if q[1] > w[1] - 2 and q[1] < w[3] + H * 0.02]
            top = (max(near) if near else w[3]) + H * 0.006
            break
    bottom = H
    for w in words:
        if w[4] == 'Экспликация':
            bottom = min(bottom, w[1] - H * 0.008)

    SW = 420
    k = SW / im.width
    small = im.convert('L').resize((SW, max(1, round(im.height * k))), Image.BILINEAR)
    small = small.filter(ImageFilter.MinFilter(3))      # утолщаем штрихи: линия не рвётся
    a = np.asarray(small)
    sh = a.shape[0]
    ink = a < 210
    ink[:max(0, int(top * scale * k)), :] = False
    ink[min(sh, int(bottom * scale * k)):, :] = False
    ink[:, :3] = False
    ink[:, -3:] = False

    boxes = _components(ink)
    if not boxes:
        return None
    # самое крупное пятно — сам чертёж. Соседние пятна не приклеиваем: рядом
    # стоит роза инсоляции, её лучи распадаются на такие же отдельные пятна.
    main = max(boxes, key=lambda key: boxes[key][4])
    x0, y0, x1, y1, _ = boxes[main]

    # Подписи комнат стоят вплотную и держатся на выносных линиях. Сравниваем
    # с исходным габаритом, а не с растущим: иначе подпись подтягивает соседнюю,
    # та — следующую, и в кадр цепочкой заезжает вся правая колонка схем.
    reach = SW * 0.015
    base = (x0, y0, x1, y1)
    for w in words:
        if w[1] < top or w[3] > bottom:
            continue
        wx0, wy0 = w[0] * scale * k, w[1] * scale * k
        wx1, wy1 = w[2] * scale * k, w[3] * scale * k
        if (wx0 > base[2] + reach or wx1 < base[0] - reach
                or wy0 > base[3] + reach or wy1 < base[1] - reach):
            continue
        x0, y0 = min(x0, wx0), min(y0, wy0)
        x1, y1 = max(x1, wx1), max(y1, wy1)

    pad = SW * 0.02
    px = 1 / k                                        # обратно в пиксели картинки
    return (max(0, (x0 - pad) * px), max(0, (y0 - pad) * px),
            min(im.width, (x1 + pad) * px), min(im.height, (y1 + pad) * px))


def _components(ink):
    """Связные пятна на булевой сетке: две строки меток с объединением."""
    h, w = ink.shape
    lab = np.zeros(ink.shape, dtype=np.int32)
    parent = [0]

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    def union(i, j):
        ri, rj = find(i), find(j)
        if ri != rj:
            parent[max(ri, rj)] = min(ri, rj)

    nxt = 1
    for y in range(h):
        row, prev = ink[y], ink[y - 1] if y else None
        for x in np.flatnonzero(row):
            near = []
            if y:
                for dx in (-1, 0, 1):
                    nx2 = x + dx
                    if 0 <= nx2 < w and prev[nx2]:
                        near.append(lab[y - 1, nx2])
            if x and row[x - 1]:
                near.append(lab[y, x - 1])
            near = [v for v in near if v]
            if near:
                m = min(near)
                lab[y, x] = m
                for v in near:
                    union(m, v)
            else:
                lab[y, x] = nxt
                parent.append(nxt)
                nxt += 1

    roots = np.array([find(i) for i in range(nxt)], dtype=np.int32)
    lab = roots[lab]
    boxes = {}
    ys, xs = np.nonzero(lab)
    for y, x in zip(ys, xs):
        v = lab[y, x]
        b = boxes.get(v)
        if b is None:
            boxes[v] = (x, y, x, y, 1)
        else:
            boxes[v] = (min(b[0], x), min(b[1], y), max(b[2], x), max(b[3], y), b[4] + 1)
    return boxes


def sheet_box(page):
    """Содержимое листа без рамки, шапки и номера страницы.

    Шапка обрезается намеренно: на листе блока 1 стр. 1 она противоречит
    экспликации (45,34 против 27,21), а подпись под планом на сайте берётся
    из проверенного списка. Заодно чертёж занимает больше места."""
    W, H = page.rect.width, page.rect.height
    words = page.get_text('words')

    top = 0.0
    for w in words:
        if 'КВАРТИРА' in w[4]:
            near = [q[3] for q in words if q[1] > w[1] - 2 and q[1] < w[3] + H * 0.02]
            top = (max(near) if near else w[3]) + H * 0.022
            break

    items = []
    for d in page.get_drawings():
        r = d['rect']
        if r.width > W * 0.9 and r.height > H * 0.9:          # рамка листа целиком
            continue
        if r.width > W * 0.85 and r.height < 3:               # её горизонтальные стороны
            continue
        if r.height > H * 0.85 and r.width < 3:               # и вертикальные
            continue
        if r.x0 > W * 0.88 and r.y0 > H * 0.93:               # номер страницы
            continue
        items.append((r.x0, r.y0, r.x1, r.y1))
    for w in words:
        if w[0] > W * 0.88 and w[1] > H * 0.93:
            continue
        items.append((w[0], w[1], w[2], w[3]))
    items = [it for it in items if it[3] > top]
    if not items:
        return (0, top, W, H)

    x0 = min(i[0] for i in items); y0 = max(top, min(i[1] for i in items))
    x1 = max(i[2] for i in items); y1 = max(i[3] for i in items)
    # отступ небольшой: рамка листа стоит близко, широкое поле её захватывает
    pad = W * 0.012
    return (max(0, x0 - pad), max(0, y0 - pad), min(W, x1 + pad), min(H, y1 + pad))


def save(im, path, width, quality):
    out = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    out.save(path, quality=quality, method=6)
    return out


def from_book(pid, pno, side, book):
    """Запасной путь для планировок, которых нет в векторных листах.

    Буклет — растр, поэтому лист блока 4 выглядит мягче остальных. Хотя бы
    убираем кремовый фон страницы и подчёркиваем штрих, чтобы карточка не
    выбивалась из ряда."""
    pix = book[pno - 1].get_pixmap(dpi=260)
    page = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    hw = page.width // 2
    x = 0 if side == 'L' else hw
    card = page.crop((x, 0, x + hw, page.height))

    bg = card.getpixel((4, 4))                      # кремовый фон буклета
    card = card.point([min(255, round(i * 255 / max(1, bg[c]))) for c in range(3) for i in range(256)])
    card = card.filter(ImageFilter.UnsharpMask(radius=1.4, percent=110, threshold=3))

    full = save(card, os.path.join(OUT, pid + '-1400.webp'), FULL_W, 84)

    # чертёж ищем тем же способом, что и на векторных листах: самое крупное
    # связное пятно чернил выше подписи с площадью
    SW = 420
    k = SW / card.width
    small = card.convert('L').resize((SW, round(card.height * k)), Image.BILINEAR)
    small = small.filter(ImageFilter.MinFilter(3))
    ink = np.asarray(small) < 210
    ink[:int(ink.shape[0] * 0.05), :] = False
    ink[int(ink.shape[0] * 0.66):, :] = False
    boxes = _components(ink)
    if boxes:
        x0, y0, x1, y1, _ = max(boxes.values(), key=lambda b: b[4])
        pad = SW * 0.06          # подписи комнат тут не размечены — берём поле пошире
        box = ((x0 - pad) / k, (y0 - pad) / k, (x1 + pad) / k, (y1 + pad) / k)
    else:
        box = (hw * 0.04, card.height * 0.10, hw * 0.72, card.height * 0.66)
    draw = save(card.crop(tuple(round(v) for v in box)),
                os.path.join(OUT, pid + '-800.webp'), CARD_W, 86)
    return full, draw, 'буклет'


def main():
    os.makedirs(OUT, exist_ok=True)
    index = sheet_index()
    book = pymupdf.open(BOOK)
    docs = {}
    missing = []

    for pid, rooms, area, blocks in PLANS:
        sheets = index.get(area)
        if not sheets:
            if pid in FROM_BOOK:
                full, draw, src = from_book(pid, *FROM_BOOK[pid], book=book)
                print('%-10s %-7s %-22s из буклета  лист %dx%d  чертёж %dx%d'
                      % (pid, area, '/'.join(blocks), full.width, full.height, draw.width, draw.height))
                continue
            missing.append((pid, area))
            continue

        base, path, no = pick(sheets, blocks)
        if path not in docs:
            docs[path] = pymupdf.open(path)
        page = docs[path][no]

        pix = page.get_pixmap(dpi=RENDER_DPI)
        im = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
        scale = pix.width / page.rect.width

        sheet = sheet_box(page)
        full = save(im.crop(tuple(round(v * scale) for v in sheet)),
                    os.path.join(OUT, pid + '-1400.webp'), FULL_W, 84)

        box = plan_box(page, im, scale)
        if box is None:
            box = (im.width * 0.05, im.height * 0.12, im.width * 0.68, im.height * 0.70)
        crop = im.crop(tuple(round(v) for v in box))
        draw = save(crop, os.path.join(OUT, pid + '-800.webp'), CARD_W, 86)

        print('%-10s %-7s %-22s %-24s лист %dx%d  чертёж %dx%d'
              % (pid, area, '/'.join(blocks), base[:24], full.width, full.height, draw.width, draw.height))

    if missing:
        print('\nНЕ НАЙДЕНЫ в листах и без запасного варианта:')
        for pid, area in missing:
            print('  ', pid, area)
    print('\nГотово →', OUT)
    print('Список planItems в src/content.js правится вручную: id должны совпадать.')


if __name__ == '__main__':
    main()
