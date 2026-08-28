# -*- coding: utf-8 -*-
"""Первый экран v3: кадры из аэро-рендера квартала.

Исходник — PhysCamera039(2)-03 (1).png, 13210x7430 (дневной свет, вид сверху).
Из него делаются три ширины для широких экранов и вертикальный кроп для телефона.
Запуск: python tools/make-hero-aerial.py
"""
import os
from PIL import Image

Image.MAX_IMAGE_PIXELS = None

SRC = r'D:\Claude Code\_materials\new\PhysCamera039(2)-03 (1).png'
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'img')

def save(im, name, w, quality=82):
    h = round(im.height * w / im.width)
    im.resize((w, h), Image.LANCZOS).save(os.path.join(OUT, name), 'WEBP', quality=quality, method=6)
    print(f'  {name}  {w}x{h}')

def main():
    src = Image.open(SRC).convert('RGB')
    print('исходник', src.size)

    # широкий кадр: исходник уже 16:9, режем только лишние поля сверху
    wide = src.crop((0, 0, src.width, round(src.width * 9 / 16)))
    for w in (1280, 1920, 2560):
        save(wide, f'hero-aerial-{w}.webp', w)

    # телефон: вертикальный кроп по центру двора
    ph_w = round(src.height * 9 / 16)
    x0 = (src.width - ph_w) // 2
    save(src.crop((x0, 0, x0 + ph_w, src.height)), 'hero-aerial-portrait-1080.webp', 1080)

if __name__ == '__main__':
    main()
