#!/usr/bin/env python3
"""Картинка для превью ссылок.

Telegram, ВКонтакте и часть почтовых клиентов не показывают WebP в og:image —
вместо кадра выходит пустой прямоугольник. А в Узбекистане ссылку чаще всего
пересылают именно в Telegram. Поэтому рядом с WebP кладём JPEG ровно
1200×630 — размер, который все читатели превью понимают без пересчёта.

Кадр берём тот же, что человек видит первым на сайте (opening-shot), и
обрезаем по центру до соотношения 1,91:1.

Запуск: python tools/make-og.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "img" / "opening-shot-2560.webp"
OUT = ROOT / "assets" / "img" / "og-cover.jpg"
W, H = 1200, 630

img = Image.open(SRC).convert("RGB")
scale = max(W / img.width, H / img.height)
img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
left = (img.width - W) // 2
top = (img.height - H) // 2
img.crop((left, top, left + W, top + H)).save(OUT, "JPEG", quality=86, optimize=True, progressive=True)
print(f"{OUT.relative_to(ROOT)}  {W}x{H}  {OUT.stat().st_size // 1024} КБ")
