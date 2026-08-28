# -*- coding: utf-8 -*-
"""Проволочный чертёж корпусов — первый слой первого экрана.

Под ним лежит тот же самый рендер в красках (tools/make-opening-shot.py),
кадр в кадр: при листании линия растворяется, и рисунок «раскрашивается».
Поэтому оба слоя обязаны идти из одного исходника и без обрезки — любой
сдвиг кадра сразу видно на стыке.

Образец, который показал заказчик, рисует здание тонкой линией — это линейный
рендер из 3D-модели. Модели у нас нет, поэтому линию вытягиваем из готового
рендера: считаем градиент яркости (Собель) и оставляем только сильные
архитектурные рёбра — грани корпусов, межэтажные тяги, откосы окон.

Зелень и небо глушим отдельно: листва даёт мелкий шум, который в чертеже
читается как грязь, а небо — плавные градиенты без рёбер.

Запуск: python tools/make-wireframe.py
"""
import os
import numpy as np
from PIL import Image, ImageFilter

Image.MAX_IMAGE_PIXELS = None

SRC = r'C:\Users\User\Downloads\Рендер_фасад 1я линия.jpg'
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'img')
NAME = 'opening-line'

WORK_W = 2600          # в этом разрешении ищем рёбра
INK = (33, 26, 18)     # цвет линии: фирменный чёрный с тёплым уклоном

LO, HI = 0.06, 0.34    # порог силы ребра: ниже — фон, выше — линия в полную силу
GAMMA = 0.85           # мягкость набора плотности
LEAF_DROP = 0.97       # насколько глушим листву
SKY_DROP = 0.95        # насколько глушим небо
GROUND = 0.34          # доля кадра снизу, которая уходит в ничто: газон и кусты
                       # в чертеже читаются как грязь
SIDES = 0.07           # и столько же тает по бокам — чертёж не должен
                       # обрываться по линейке
STUD_STEP = 44         # шаг выносных вертикалей над корпусами
STUD_LEN = (120, 250)  # их длина


def sobel(a):
    kx = np.array([[1, 0, -1], [2, 0, -2], [1, 0, -1]], dtype=np.float32)
    ky = kx.T
    def conv(src, k):
        out = np.zeros_like(src)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                w = k[dy + 1, dx + 1]
                if w:
                    out += w * np.roll(np.roll(src, dy, 0), dx, 1)
        return out
    mag = np.hypot(conv(a, kx), conv(a, ky))
    # np.roll заворачивает картинку, поэтому на стыке краёв возникает ложное
    # ребро — та самая рамка по периметру. Срезаем её.
    mag[:2, :] = 0
    mag[-2:, :] = 0
    mag[:, :2] = 0
    mag[:, -2:] = 0
    return mag


def add_studs(alpha):
    """Тонкие вертикали над кровлями.

    Ставим их только там, где под линией действительно стоит корпус: у куста
    или у края кадра тоже находится «верхняя точка», и вертикаль над ней висит
    в пустом небе. Признаков два — под точкой должно быть много графики,
    а сама линия кровли должна быть ровной на несколько шагов вокруг.
    """
    h, w = alpha.shape
    strong = alpha > 0.30
    roof = np.where(strong.any(0), strong.argmax(0), -1)
    lens = (STUD_LEN[0], STUD_LEN[1], (STUD_LEN[0] + STUD_LEN[1]) // 2)
    edge = int(w * 0.05)                       # у самых краёв не ставим вовсе

    for i, x in enumerate(range(edge, w - edge, STUD_STEP)):
        y = roof[x]
        if y < 30 or y > h * 0.62:
            continue
        # под кровлей должен быть корпус, а не крона: считаем плотность графики
        body = alpha[y:min(h, y + 260), x]
        if body.mean() < 0.10:
            continue
        # и кровля должна быть ровной: у куста соседние точки скачут
        near = roof[max(0, x - 60):min(w, x + 60)]
        near = near[near >= 0]
        if near.size < 40 or abs(float(np.median(near)) - y) > 26:
            continue
        top = max(0, y - lens[i % 3])
        col = np.linspace(0, 0.42, y - top, dtype=np.float32)   # кверху тает
        alpha[top:y, x] = np.maximum(alpha[top:y, x], col)
    return alpha


def main():
    im = Image.open(SRC).convert('RGB')
    h = round(im.height * WORK_W / im.width)
    im = im.resize((WORK_W, h), Image.LANCZOS)
    print('рендер', im.size)

    rgb = np.asarray(im, dtype=np.float32) / 255.0
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]

    # листва: зелёный заметно сильнее остальных каналов
    leaf = ((g > r * 1.02) & (g > b * 1.06)).astype(np.float32)
    leaf = np.asarray(Image.fromarray((leaf * 255).astype(np.uint8))
                      .filter(ImageFilter.GaussianBlur(2)), dtype=np.float32) / 255.0

    # небо: светлое и малонасыщенное
    mx, mn = rgb.max(2), rgb.min(2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    sky = ((mx > 0.72) & (sat < 0.22)).astype(np.float32)
    sky = np.asarray(Image.fromarray((sky * 255).astype(np.uint8))
                     .filter(ImageFilter.GaussianBlur(3)), dtype=np.float32) / 255.0

    # рёбра ищем по слегка размытой яркости: иначе шум материалов лезет в линию
    luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
    soft = np.asarray(Image.fromarray((luma * 255).astype(np.uint8))
                      .filter(ImageFilter.GaussianBlur(1.1)), dtype=np.float32) / 255.0
    mag = sobel(soft)
    mag /= max(mag.max(), 1e-6)

    alpha = np.clip((mag - LO) / (HI - LO), 0, 1) ** GAMMA
    alpha *= (1 - LEAF_DROP * leaf)
    alpha *= (1 - SKY_DROP * sky)

    # передний план гасим: чертёж — про корпуса, а не про газон
    hgt = alpha.shape[0]
    fade = np.ones(hgt, dtype=np.float32)
    start = int(hgt * (1 - GROUND))
    fade[start:] = np.linspace(1, 0, hgt - start) ** 1.6
    alpha *= fade[:, None]

    wid = alpha.shape[1]
    side = np.ones(wid, dtype=np.float32)
    edge = int(wid * SIDES)
    ramp = np.linspace(0, 1, edge, dtype=np.float32) ** 1.4
    side[:edge] = ramp
    side[-edge:] = ramp[::-1]
    alpha *= side[None, :]

    # выносные вертикали над кровлями — то, что делает картинку чертежом,
    # а не обведённой фотографией
    alpha = add_studs(alpha)

    a_img = Image.fromarray((alpha * 255).astype(np.uint8), 'L')
    for w in (1600, 2400):
        hh = round(a_img.height * w / a_img.width)
        a = a_img.resize((w, hh), Image.LANCZOS)
        out = Image.new('RGBA', (w, hh), INK + (0,))
        out.putalpha(a)
        f = os.path.join(OUT, '%s-%d.webp' % (NAME, w))
        out.save(f, 'WEBP', quality=88, method=6)
        print('  %s-%d.webp  %dx%d  %d КБ' % (NAME, w, w, hh, os.path.getsize(f) / 1024))


if __name__ == '__main__':
    main()
