# -*- coding: utf-8 -*-
"""Самарканд для разворота «Париж × Самарканд → PARI».

Единственный официальный источник Самарканда — открывающий план бренд-фильма
PARI_2400x1200_2.mp4 (0,0–3,6 с): рассвет над Регистаном, стая птиц. Это
видео, а не фотография: дымка, движение и сжатие делают стоп-кадр мягким,
и на телефоне во всю ширину экрана это видно. Поэтому:

  * на сайте план идёт коротким живым отрезком (3,2 с, петля) — в движении
    птицы читаются как замысел, а не как мыло;
  * постер и запасной кадр — самый резкий кадр отрезка в родных 2096 px,
    с лёгким снятием дымки и повышением резкости (без дорисовки).

Файлы:
  assets/video/samarkand-dawn-1280.{mp4,webm}     — отрезок 1280×640
  assets/img/samarkand-dawn-{1280,1920,2096}.webp — постер/запасной кадр

Запуск: python tools/make-concept-clip.py
Требует: imageio-ffmpeg (ffmpeg-бинарь), pillow, numpy.
"""
import os
import subprocess

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIDEO = os.path.join(ROOT, 'assets', 'video')
IMG = os.path.join(ROOT, 'assets', 'img')
SRC = os.environ.get('PARI_FILM', r'C:\Users\User\Downloads\PARI_2400x1200_2.mp4')

START, END = 0.40, 3.60        # до 0,4 с — вход из затемнения; 3,6 — до склейки
FPS = 30


def run(args):
    r = subprocess.run(args, capture_output=True, text=True, errors='replace')
    if r.returncode:
        raise SystemExit(r.stderr[-2500:])


def sharpness(im):
    """Дисперсия лапласиана по полосе с куполами — небо и птицы не считаем."""
    band = im.crop((0, int(im.height * 0.42), im.width, int(im.height * 0.7)))
    g = np.asarray(band.convert('L'), dtype=float)
    lap = np.abs(4 * g[1:-1, 1:-1] - g[:-2, 1:-1] - g[2:, 1:-1] - g[1:-1, :-2] - g[1:-1, 2:])
    return lap.var()


def frame_at(t):
    tmp = os.path.join(VIDEO, '_frame.png')
    run([FFMPEG, '-y', '-ss', str(t), '-i', SRC, '-frames:v', '1', tmp])
    im = Image.open(tmp).convert('RGB')
    os.remove(tmp)
    return im


def main():
    os.makedirs(VIDEO, exist_ok=True)

    # ── отрезок ──
    vf = 'trim=start=%s:end=%s,setpts=PTS-STARTPTS,fps=%d,scale=1280:640:flags=lanczos' % (START, END, FPS)
    mp4 = os.path.join(VIDEO, 'samarkand-dawn-1280.mp4')
    run([FFMPEG, '-y', '-i', SRC, '-an', '-vf', vf, '-c:v', 'libx264', '-profile:v', 'high',
         '-crf', '22', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4])
    webm = os.path.join(VIDEO, 'samarkand-dawn-1280.webm')
    run([FFMPEG, '-y', '-i', SRC, '-an', '-vf', vf, '-c:v', 'libvpx-vp9', '-crf', '31', '-b:v', '0',
         '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', webm])
    for f in (mp4, webm):
        print('  %-28s %.1f МБ' % (os.path.basename(f), os.path.getsize(f) / 1048576.0))

    # ── постер: самый резкий кадр отрезка ──
    best = None
    t = START
    while t <= END:
        im = frame_at(t)
        s = sharpness(im)
        if best is None or s > best[0]:
            best = (s, t, im)
        t += 0.4
    s, t, im = best
    print('  постер — кадр %.1f с, резкость %.0f' % (t, s))
    # дымка: чуть глубже тени и чуть больше контраста; резкость — нерезкая маска
    im = ImageEnhance.Contrast(im).enhance(1.12)
    im = ImageEnhance.Color(im).enhance(1.06)
    im = im.filter(ImageFilter.UnsharpMask(radius=1.6, percent=90, threshold=2))
    for w in (2096, 1920, 1280):
        out = im if w == im.width else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        path = os.path.join(IMG, 'samarkand-dawn-%d.webp' % w)
        out.save(path, 'WEBP', quality=84, method=6)
        print('  %-28s %d×%d %4d КБ' % (os.path.basename(path), out.width, out.height, os.path.getsize(path) // 1024))


if __name__ == '__main__':
    main()
