# -*- coding: utf-8 -*-
"""Hero-монтаж первого экрана из официальных роликов PARI.

Два источника, оба — фирменные фильмы застройщика:
  * PARI_2400x1200_2.mp4 — горизонтальный бренд-фильм 2096×1048, 2 мин 12 с;
  * 4.mp4 — вертикальный ролик 1080×1920, 38 с (для телефона: горизонтальный
    кадр 2:1 в вертикальном окне показывал бы узкую полоску).

── что в монтаже ──
Пять планов встык, без растворений, ~9,7 с. Все — чистая архитектура, без
людей, без впечатанного текста (слоган в фильме появляется с 1:56, финальная
заставка с логотипом — с 2:02, их не берём):

  01  68,10–70,55  галерея вдоль фасада, отражение в мокром камне   (establishing)
  02  89,50–91,33  аркада со светом в конце                           (ритм фасада)
  03  74,55–75,85  двор: клумбы, дорожки, пергола                     (ландшафт)
  04  76,00–77,83  пергола изнутри, полосы света                      (деталь двора)
  05  94,20–96,50  квартал общим планом на закате                     (спокойный финал)

Границы отступают на 0,07 с от собственных склеек фильма (найдены детектором
сцен ffmpeg), чтобы внутрь плана не попал чужой кадр. Петля не бесшовная и не
должна такой быть: последний план — широкий и спокойный, возврат на галерею в
том же закатном свете читается как обычный монтажный рез, а не как рывок.

Телефон — четыре плана вертикального ролика, ~7,6 с. Текст на телефоне лежит
прямо на кадре в верхней трети, поэтому планы отобраны ещё и по спокойной
верхней части: план с солнечным бликом на латуни (12,85–15,20) снят —
блик стоял ровно под слоганом, и никакая вуаль его не гасила. Склейки
вертикального ролика — не резы, а вспышки в белое (21,15–21,5, 7,5–7,8,
23,7–24,0 с): границы планов отступают за вспышку, иначе петля (и постер —
её первый кадр) начиналась с белого экрана.
  01  21,55–23,60  квартал над цветущим лугом
  02   7,80–9,05   корпуса и двор с лавандой
  03  28,95–31,40  лобби вечером, тёплые светильники
  04  24,05–25,50  лобби днём

── файлы ──
  assets/video/pari-hero-1920.{mp4,webm}   1920×960   широкие экраны
  assets/video/pari-hero-1280.{mp4,webm}   1280×640   ноутбуки, планшеты
  assets/video/pari-hero-mobile.{mp4,webm}  720×1280  телефоны (≤ 700 px)
  assets/img/pari-hero-poster-{1920,1280}.webp — первый кадр монтажа: постер
  совпадает с началом ролика, подмена не видна;
  assets/img/pari-hero-poster-mobile.webp — то же для вертикали.

Звук снят: со звуком браузер автозапуск не даст.

Запуск: python tools/make-hero-edit.py   (--tall — только вертикальный монтаж)
Требует: imageio-ffmpeg (ffmpeg-бинарь), pillow.
"""
import os
import subprocess
import sys

import imageio_ffmpeg
from PIL import Image

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIDEO = os.path.join(ROOT, 'assets', 'video')
IMG = os.path.join(ROOT, 'assets', 'img')

WIDE_SRC = os.environ.get('PARI_FILM', r'C:\Users\User\Downloads\PARI_2400x1200_2.mp4')
TALL_SRC = os.environ.get('PARI_FILM_TALL', r'C:\Users\User\Downloads\4.mp4')

FPS = 30

WIDE_CUTS = [
    (68.10, 70.55, 'галерея вдоль фасада, отражение'),
    (89.50, 91.33, 'аркада со светом в конце'),
    (74.55, 75.85, 'двор: клумбы и пергола'),
    (76.00, 77.83, 'пергола изнутри'),
    (94.20, 96.50, 'квартал на закате'),
]
TALL_CUTS = [
    (21.55, 23.60, 'квартал над лугом'),
    (7.80, 9.05, 'корпуса и двор с лавандой'),
    (28.95, 31.40, 'лобби вечером'),
    (24.05, 25.50, 'лобби днём'),
]


def run(args):
    r = subprocess.run(args, capture_output=True, text=True, errors='replace')
    if r.returncode:
        raise SystemExit(r.stderr[-2500:])


def mb(path):
    return '%.1f МБ' % (os.path.getsize(path) / 1048576.0)


def concat_filter(cuts, size):
    """trim каждого плана → concat встык; fps выравнивает дорожки, иначе
    concat спотыкается на переменной частоте кадров исходника."""
    parts = []
    for i, (a, b, _) in enumerate(cuts):
        parts.append('[0:v]trim=start=%s:end=%s,setpts=PTS-STARTPTS,fps=%d,scale=%s:flags=lanczos[v%d]'
                     % (a, b, FPS, size, i))
    chain = ''.join('[v%d]' % i for i in range(len(cuts)))
    parts.append('%sconcat=n=%d:v=1:a=0[v]' % (chain, len(cuts)))
    return ';'.join(parts)


def encode(src, cuts, size, stem):
    fc = concat_filter(cuts, size)
    base = [FFMPEG, '-y', '-i', src, '-an', '-filter_complex', fc, '-map', '[v]']
    mp4 = os.path.join(VIDEO, stem + '.mp4')
    run(base + ['-c:v', 'libx264', '-profile:v', 'high', '-crf', '23', '-preset', 'slow',
                '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4])
    webm = os.path.join(VIDEO, stem + '.webm')
    run(base + ['-c:v', 'libvpx-vp9', '-crf', '32', '-b:v', '0', '-row-mt', '1',
                '-deadline', 'good', '-cpu-used', '2', webm])
    return mp4, webm


def poster(video, out, width):
    """Первый кадр готового монтажа — ровно то, с чего стартует ролик."""
    tmp = out + '.png'
    run([FFMPEG, '-y', '-i', video, '-frames:v', '1', tmp])
    im = Image.open(tmp).convert('RGB')
    if im.width != width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(out, 'WEBP', quality=84, method=6)
    os.remove(tmp)


def main():
    os.makedirs(VIDEO, exist_ok=True)
    only_tall = '--tall' in sys.argv
    total = sum(b - a for a, b, _ in WIDE_CUTS)
    print('широкий монтаж: %d планов, %.2f с' % (len(WIDE_CUTS), total))
    for w in (() if only_tall else (1920, 1280)):
        mp4, webm = encode(WIDE_SRC, WIDE_CUTS, '%d:%d' % (w, w // 2), 'pari-hero-%d' % w)
        poster(mp4, os.path.join(IMG, 'pari-hero-poster-%d.webp' % w), w)
        print('  %-22s %s   %-22s %s' % (os.path.basename(mp4), mb(mp4), os.path.basename(webm), mb(webm)))

    total = sum(b - a for a, b, _ in TALL_CUTS)
    print('вертикальный монтаж: %d плана, %.2f с' % (len(TALL_CUTS), total))
    mp4, webm = encode(TALL_SRC, TALL_CUTS, '720:1280', 'pari-hero-mobile')
    poster(mp4, os.path.join(IMG, 'pari-hero-poster-mobile.webp'), 720)
    print('  %-22s %s   %-22s %s' % (os.path.basename(mp4), mb(mp4), os.path.basename(webm), mb(webm)))


if __name__ == '__main__':
    main()
