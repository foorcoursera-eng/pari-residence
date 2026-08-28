# -*- coding: utf-8 -*-
"""Вертикальная петля для телефонов — из фирменного ролика 4.mp4.

Исходник вертикальный (1080×1920, 38 с, со звуком), поэтому кадрировать ничего
не нужно: берём отрезок с прогулкой по двору и аркадой, снимаем звук, гасим
концы, чтобы стык петли читался как вдох, а не как рывок.

Раньше на телефоне играл центральный кроп из горизонтального ролика — этот
источник для вертикали родной и выигрывает по кадру.

Запуск: python tools/make-portrait-loop.py
"""
import os
import subprocess
import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
SRC = r'C:\Users\User\Downloads\4.mp4'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'video')
POSTER = os.path.join(ROOT, 'assets', 'img', 'hero-mobile-1080.webp')

START, LENGTH = 2.5, 18.0      # прогулка по двору, золотая деталь, аркада
FADE = 0.5                     # столько тают концы петли
SIZE = '720:1280'

VF = ('scale=%s:flags=lanczos,fade=t=in:st=0:d=%s,fade=t=out:st=%s:d=%s'
      % (SIZE, FADE, round(LENGTH - FADE, 2), FADE))


def run(args):
    r = subprocess.run(args, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if r.returncode:
        print(r.stderr[-1200:])
        raise SystemExit('ffmpeg вернул ошибку')


def main():
    base = ['-y', '-ss', str(START), '-i', SRC, '-t', str(LENGTH), '-an', '-vf', VF]

    mp4 = os.path.join(OUT, 'hero-portrait.mp4')
    run([FFMPEG] + base + ['-c:v', 'libx264', '-profile:v', 'high', '-crf', '27',
                           '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4])

    webm = os.path.join(OUT, 'hero-portrait.webm')
    run([FFMPEG] + base + ['-c:v', 'libvpx-vp9', '-crf', '36', '-b:v', '0',
                           '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', webm])

    # постер — первый кадр той же петли, подмена на видео незаметна
    run([FFMPEG, '-y', '-ss', str(START + FADE), '-i', SRC, '-frames:v', '1',
         '-vf', 'scale=1080:-1:flags=lanczos', '-q:v', '82', POSTER])

    for f in (mp4, webm, POSTER):
        print('  %-22s %6.1f МБ' % (os.path.basename(f), os.path.getsize(f) / 1e6))


if __name__ == '__main__':
    main()
