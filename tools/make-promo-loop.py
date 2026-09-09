# -*- coding: utf-8 -*-
"""Петля первого экрана — монтаж из бренд-фильма PARI_2400x1200_2.mp4.

Источник горизонтальный, 2096×1048 (2:1), 2 мин 12 с, 30 к/с, со звуком.
Четырёх «кэ» в нём нет и взяться им неоткуда: 2096 — это и есть максимум,
растягивание до 3840 добавило бы вес и ни одной новой детали. Поэтому
верхняя ступень здесь 2096, родная.

── что в петле ──
Девять планов, каждый — отдельный непрерывный кадр исходника: портик с видом
на квартал, галерея с отражением в мокром камне, аркада со светом в конце,
двор с клумбами, пергола изнутри, двор с бабочками, входная группа с резными
дверями, лестница лобби и общий план квартала на закате.

Границы кадров сняты по четвертям секунды, чтобы:
  * ни один отрезок не заходил на соседний — иначе одни и те же кадры
    показывались бы в петле дважды (в прошлой версии «аркада» и «бабочки»
    накладывались на 0,8 с, и повтор было видно);
  * внутрь отрезка не попадала собственная склейка фильма — она жёсткая,
    и на первом экране читалась бы как рывок.

Крупных планов лица нет намеренно: под маркой стоит архитектура, а не
портрет. Кадры со слоганом, впечатанным в картинку (с 1:56), и финальную
заставку с логотипом не берём — на сайте своя марка.

── чтобы склеек не было видно ──
Между планами не резы, а растворения по 0,7 с: глаз читает их как движение
камеры, а не как монтаж. Стык петли убран тем же способом — хвост
растворяется во вступлении, поэтому «шва» на повторе нет вовсе. Чёрных
затемнений по концам больше нет: раньше петля моргала между повторами.

Звук снят: видео со звуком браузер сам не запустит.

Запуск: python tools/make-promo-loop.py
"""
import os
import subprocess
import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
SRC = r'C:\Users\User\Downloads\PARI_2400x1200_2.mp4'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'video')
CUT_MASTER = os.path.join(OUT, '_promo-cut.mp4')      # монтаж встык
LOOP_MASTER = os.path.join(OUT, '_promo-loop.mp4')    # он же, замкнутый в петлю

FPS = 30
# Растворение между планами. Было 0,7 — и два самых коротких плана (двор с
# клумбами и лестница лобби) целиком уходили в перетекание: чистыми они не
# показывались ни кадра, а ведь именно двор и лобби просили показать.
# 0,45 всё ещё читается как перетекание, а не как рез, но каждому плану
# остаётся хотя бы полсекунды на себя.
XFADE = 0.45
SEAM = 0.8           # растворение хвоста во вступление — стык петли
WIDTHS = (2096, 1920, 1280)

# (начало, длительность, что в кадре). Границы сняты по четвертям секунды и
# упираются в собственные склейки фильма: длиннее взять нельзя, иначе внутрь
# плана попадёт жёсткий рез. Диапазоны не пересекаются — проверяет check_cuts.
CUTS = [
    (87.45, 1.85, 'портик, за ним квартал'),
    (68.10, 2.15, 'галерея, отражение в мокром камне'),
    (89.50, 1.80, 'аркада со светом в конце'),
    (74.50, 1.45, 'двор: клумбы и дорожки'),
    (76.05, 1.80, 'пергола изнутри'),
    (91.55, 2.05, 'двор с бабочками'),
    (98.95, 2.20, 'входная группа: резные двери'),
    (101.25, 1.35, 'лестница лобби'),
    (93.95, 2.35, 'квартал общим планом на закате'),
]


def run(args):
    r = subprocess.run(args, capture_output=True, text=True, errors='replace')
    if r.returncode:
        raise SystemExit(r.stderr[-2500:])


def size(path):
    return '%.1f МБ' % (os.path.getsize(path) / 1048576.0)


def check_cuts():
    """Две вещи, которые ломают петлю незаметно для глаза при сборке, но
       заметно при просмотре: пересечение отрезков — это одни и те же кадры
       дважды в одной петле; план короче двух растворений — это план, который
       никогда не виден чистым."""
    spans = sorted((s, s + d) for s, d, _ in CUTS)
    for (_, prev_end), (nxt_start, _) in zip(spans, spans[1:]):
        if nxt_start < prev_end:
            raise SystemExit('отрезки пересекаются: %.2f < %.2f' % (nxt_start, prev_end))
    for start, dur, what in CUTS:
        if dur - 2 * XFADE < 0.3:
            raise SystemExit('план «%s» короче двух растворений: %.2f с' % (what, dur))


def build_cut():
    """Монтаж в родном разрешении и почти без потерь: тиражные версии
       кодируются из него, чтобы тяжёлый граф считался один раз.

       Куски вырезаются фильтром trim из одного входа, а не перемоткой -ss с
       отдельным входом на каждый: xfade требует от обоих входов постоянной
       частоты кадров, а у перемотанного потока она остаётся неизвестной
       (1/0) и склейка падает — что с -r на входе, что с fps в фильтре."""
    steps = []
    for i, (start, dur, _) in enumerate(CUTS):
        steps.append('[0:v]trim=start=%s:duration=%s,setpts=PTS-STARTPTS,'
                     'fps=%d,format=yuv420p,setsar=1[c%d]' % (start, dur, FPS, i))

    total = CUTS[0][1]
    prev = 'c0'
    for i in range(1, len(CUTS)):
        out = 'x%d' % i
        steps.append('[%s][c%d]xfade=transition=fade:duration=%s:offset=%s[%s]'
                     % (prev, i, XFADE, round(total - XFADE, 3), out))
        total = round(total + CUTS[i][1] - XFADE, 3)
        prev = out

    run([FFMPEG, '-y', '-hide_banner', '-loglevel', 'error', '-i', SRC,
         '-filter_complex', ';'.join(steps), '-map', '[%s]' % prev, '-an',
         '-c:v', 'libx264', '-crf', '12', '-preset', 'medium',
         '-pix_fmt', 'yuv420p', CUT_MASTER])
    return total


def close_loop(length):
    """Замыкание петли: хвост длиной SEAM растворяется во вступлении той же
       длины, дальше идёт середина. При повторе конец попадает ровно в тот
       кадр, с которого начинается растворение, — шва не видно."""
    mid_end = round(length - SEAM, 3)
    # fps после trim обязателен: без него частота на выходе ветки остаётся
    # неизвестной (1/0) и xfade отказывается работать — та же история, что и
    # с перемоткой в build_cut.
    branch = 'setpts=PTS-STARTPTS,fps=%d,format=yuv420p,setsar=1' % FPS
    graph = (
        '[0:v]split=3[a][b][c];'
        '[a]trim=0:%s,%s[head];'
        '[b]trim=%s:%s,%s[mid];'
        '[c]trim=%s:%s,%s[tail];'
        '[tail][head]xfade=transition=fade:duration=%s:offset=0[seam];'
        '[seam][mid]concat=n=2:v=1:a=0[v]'
        % (SEAM, branch, SEAM, mid_end, branch, mid_end, length, branch, SEAM)
    )
    run([FFMPEG, '-y', '-hide_banner', '-loglevel', 'error', '-i', CUT_MASTER,
         '-filter_complex', graph, '-map', '[v]', '-an',
         '-c:v', 'libx264', '-crf', '12', '-preset', 'medium',
         '-pix_fmt', 'yuv420p', LOOP_MASTER])
    return round(length - SEAM, 3)


check_cuts()
cut_len = build_cut()
loop_len = close_loop(cut_len)
print('монтаж %s с, петля %s с, мастер %s' % (cut_len, loop_len, size(LOOP_MASTER)))
for start, dur, what in CUTS:
    print('   %6.2f +%.2f  %s' % (start, dur, what))

for w in WIDTHS:
    mp4 = os.path.join(OUT, 'promo-hero-%d.mp4' % w)
    webm = os.path.join(OUT, 'promo-hero-%d.webm' % w)
    # -2 по высоте: округляется до чётной, иначе yuv420p не соберётся.
    # Резкость возвращаем только там, где уменьшение заметное. 1920 — это
    # 1,09 от родных 2096, lanczos там ничего не смазывает, а unsharp добавлял
    # высоких частот и делал файл тяжелее самой родной ступени.
    scale = 'scale=%d:-2:flags=lanczos' % w
    if WIDTHS[0] / float(w) >= 1.3:
        scale += ',unsharp=5:5:0.4:5:5:0.0'

    # H.264 — Safari и старые Android. faststart, чтобы начало проигрывалось
    # по мере загрузки, а не ждало конца файла.
    run([FFMPEG, '-y', '-hide_banner', '-loglevel', 'error', '-i', LOOP_MASTER,
         '-an', '-vf', scale,
         '-c:v', 'libx264', '-profile:v', 'high', '-crf', '18',
         '-preset', 'slow', '-tune', 'film',
         '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4])

    # VP9 — легче при той же картинке, отдаётся браузеру первым.
    run([FFMPEG, '-y', '-hide_banner', '-loglevel', 'error', '-i', LOOP_MASTER,
         '-an', '-vf', scale,
         '-c:v', 'libvpx-vp9', '-crf', '27', '-b:v', '0',
         '-row-mt', '1', '-cpu-used', '2', '-deadline', 'good', webm])

    print('promo-hero-%d: mp4 %s, webm %s' % (w, size(mp4), size(webm)))

os.remove(CUT_MASTER)
os.remove(LOOP_MASTER)
