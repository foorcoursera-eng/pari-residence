# -*- coding: utf-8 -*-
"""
Готовит анимацию письма для логотипа PARI.

СЕЙЧАС НЕ ИСПОЛЬЗУЕТСЯ: анимацию логотипа сняли по решению заказчика, на первом
экране стоит обычная картинка. Скрипт оставлен на случай, если решение изменится.

Берёт векторный логотип из фирменного PDF, растрирует каждую букву, вытягивает
из неё осевую линию (скелет) и превращает в набор путей — по ним на странице
движется «перо»: обводка растёт, а логотип проявляется маской.

Результат — самодостаточный SVG в assets/img/pari-logo-write.svg: контуры букв
плюс маска с осевыми линиями. Никаких зависимостей, кроме PyMuPDF, Pillow и numpy.

Запуск (нужен только при смене логотипа):
    python tools/make-logo-write.py
"""

import json
import math
import os
import re

import numpy as np
import pymupdf
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.environ.get(
    'PARI_LOGO_PDF',
    r'C:\Users\User\Downloads\PARI_extracted\PARI\LOGO\PARI_LOGO.pdf',
)
PAGE = 2                     # горизонтальный логотип «PARI SAMARKAND»
SCRIPT_PATHS = 5             # первые пять фигур — буквы P, A, R, стойка i и точка над i
OUT_SVG = os.path.join(ROOT, 'assets', 'img', 'pari-logo-write.svg')
SCALE = 6                    # растр для скелета: столько пикселей на единицу PDF
SEG_LEN = 4                  # длина звена пера в единицах PDF: чем короче, тем точнее ширина


# ─────────────────────────── разбор путей ───────────────────────────

NUM = re.compile(r'[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?')


def tokens(d):
    """Команды пути в виде (буква, [числа])."""
    out = []
    for letter, chunk in re.findall(r'([MmLlHhVvCcSsQqTtZz])([^MmLlHhVvCcSsQqTtZz]*)', d):
        out.append((letter, [float(x) for x in NUM.findall(chunk)]))
    return out


def bezier(p0, p1, p2, p3, steps):
    ts = np.linspace(0, 1, steps)[:, None]
    return ((1 - ts) ** 3 * np.array(p0) + 3 * (1 - ts) ** 2 * ts * np.array(p1)
            + 3 * (1 - ts) * ts ** 2 * np.array(p2) + ts ** 3 * np.array(p3))


def flatten(d, steps=18):
    """Путь → список замкнутых контуров (списков точек)."""
    subpaths, cur = [], []
    pos = (0.0, 0.0)
    start = (0.0, 0.0)
    prev_ctrl = None
    for cmd, nums in tokens(d):
        rel = cmd.islower()
        c = cmd.upper()
        i = 0
        while True:
            if c == 'Z':
                if cur:
                    subpaths.append(cur)
                    cur = []
                pos = start
                break
            if i >= len(nums):
                break
            if c == 'M':
                x, y = nums[i], nums[i + 1]; i += 2
                if rel: x, y = pos[0] + x, pos[1] + y
                if cur: subpaths.append(cur)
                cur = [(x, y)]
                pos = start = (x, y)
                c = 'L'                      # последующие пары в M — это линии
            elif c == 'L':
                x, y = nums[i], nums[i + 1]; i += 2
                if rel: x, y = pos[0] + x, pos[1] + y
                cur.append((x, y)); pos = (x, y)
            elif c == 'H':
                x = nums[i]; i += 1
                if rel: x = pos[0] + x
                cur.append((x, pos[1])); pos = (x, pos[1])
            elif c == 'V':
                y = nums[i]; i += 1
                if rel: y = pos[1] + y
                cur.append((pos[0], y)); pos = (pos[0], y)
            elif c in 'CS':
                if c == 'C':
                    x1, y1, x2, y2, x, y = nums[i:i + 6]; i += 6
                    if rel:
                        x1, y1 = pos[0] + x1, pos[1] + y1
                        x2, y2 = pos[0] + x2, pos[1] + y2
                        x, y = pos[0] + x, pos[1] + y
                else:
                    x2, y2, x, y = nums[i:i + 4]; i += 4
                    if rel:
                        x2, y2 = pos[0] + x2, pos[1] + y2
                        x, y = pos[0] + x, pos[1] + y
                    x1, y1 = (2 * pos[0] - prev_ctrl[0], 2 * pos[1] - prev_ctrl[1]) if prev_ctrl else pos
                pts = bezier(pos, (x1, y1), (x2, y2), (x, y), steps)
                cur.extend([tuple(p) for p in pts[1:]])
                prev_ctrl = (x2, y2)
                pos = (x, y)
                continue
            else:                              # квадратичные в этом логотипе не встречаются
                i = len(nums)
            prev_ctrl = None
        if c == 'Z':
            continue
    if cur:
        subpaths.append(cur)
    return subpaths


def apply_matrix(pts, m):
    a, b, c, d, e, f = m
    return [(a * x + c * y + e, b * x + d * y + f) for x, y in pts]


# ─────────────────────────── растр и скелет ───────────────────────────

def raster(subpaths, box, scale):
    """Заливка контуров с учётом дырок (чётно-нечётное правило)."""
    x0, y0, x1, y1 = box
    w = max(1, int(math.ceil((x1 - x0) * scale)) + 4)
    h = max(1, int(math.ceil((y1 - y0) * scale)) + 4)
    acc = np.zeros((h, w), dtype=bool)
    for sp in subpaths:
        if len(sp) < 3:
            continue
        img = Image.new('1', (w, h), 0)
        pts = [((x - x0) * scale + 2, (y - y0) * scale + 2) for x, y in sp]
        ImageDraw.Draw(img).polygon(pts, fill=1)
        acc ^= np.array(img, dtype=bool)
    return acc


def thin(mask):
    """Утоньшение Чжана—Суня: из залитой буквы остаётся линия в один пиксель."""
    img = mask.astype(np.uint8)
    changed = True
    while changed:
        changed = False
        for step in (0, 1):
            p = np.pad(img, 1)
            n = [p[0:-2, 1:-1], p[0:-2, 2:], p[1:-1, 2:], p[2:, 2:],
                 p[2:, 1:-1], p[2:, 0:-2], p[1:-1, 0:-2], p[0:-2, 0:-2]]  # P2..P9
            b = sum(n)
            seq = n + [n[0]]
            a = sum(((seq[k] == 0) & (seq[k + 1] == 1)).astype(np.uint8) for k in range(8))
            if step == 0:
                cond = (n[0] * n[2] * n[4] == 0) & (n[2] * n[4] * n[6] == 0)
            else:
                cond = (n[0] * n[2] * n[6] == 0) & (n[0] * n[4] * n[6] == 0)
            kill = (img == 1) & (b >= 2) & (b <= 6) & (a == 1) & cond
            if kill.any():
                img[kill] = 0
                changed = True
    return img.astype(bool)


def thickness(mask):
    """Половина толщины штриха: сколько раз букву можно «обточить» до исчезновения."""
    cur = mask.copy()
    dist = np.zeros(mask.shape, dtype=np.float32)
    step = 0
    while cur.any() and step < 200:
        step += 1
        dist[cur] = step
        p = np.pad(cur, 1, constant_values=False)
        cur = (p[0:-2, 1:-1] & p[2:, 1:-1] & p[1:-1, 0:-2] & p[1:-1, 2:]
               & p[0:-2, 0:-2] & p[0:-2, 2:] & p[2:, 0:-2] & p[2:, 2:] & cur)
    return dist


# ─────────────────────────── скелет → линии ───────────────────────────

NB = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]


def trace(skel):
    """Скелет → список ломаных, начиная с концов линий."""
    pts = {(y, x) for y, x in zip(*np.nonzero(skel))}
    nbrs = {p: [q for q in ((p[0] + dy, p[1] + dx) for dy, dx in NB) if q in pts] for p in pts}
    ends = [p for p in pts if len(nbrs[p]) == 1]
    used = set()
    lines = []

    def walk(start):
        line = [start]
        used.add(start)
        cur = start
        while True:
            nxt = [q for q in nbrs[cur] if q not in used]
            if not nxt:
                break
            nxt.sort(key=lambda q: (q[0] - cur[0]) ** 2 + (q[1] - cur[1]) ** 2)
            cur = nxt[0]
            used.add(cur)
            line.append(cur)
        return line

    for p in sorted(ends, key=lambda p: (p[1], p[0])):        # слева направо
        if p not in used:
            lines.append(walk(p))
    for p in sorted(pts, key=lambda p: (p[1], p[0])):         # замкнутые петли
        if p not in used:
            lines.append(walk(p))
    return [l for l in lines if len(l) > 4]


def simplify(line, eps):
    """Рамер—Дуглас—Пойкер: точек меньше, форма та же."""
    if len(line) < 3:
        return line
    a, b = np.array(line[0]), np.array(line[-1])
    pts = np.array(line)
    ab = b - a
    norm = np.hypot(*ab)
    if norm == 0:
        d = np.hypot(*(pts - a).T)
    else:
        rel = pts - a
        d = np.abs(ab[0] * rel[:, 1] - ab[1] * rel[:, 0]) / norm
    i = int(np.argmax(d))
    if d[i] > eps:
        return simplify(line[:i + 1], eps)[:-1] + simplify(line[i:], eps)
    return [line[0], line[-1]]


def smooth_path(points):
    """Ломаная → сглаженный путь SVG (квадратичные сегменты по серединам)."""
    if len(points) == 2:
        return 'M%.1f %.1fL%.1f %.1f' % (points[0][0], points[0][1], points[1][0], points[1][1])
    d = ['M%.1f %.1f' % points[0]]
    for i in range(1, len(points) - 1):
        mx = (points[i][0] + points[i + 1][0]) / 2
        my = (points[i][1] + points[i + 1][1]) / 2
        d.append('Q%.1f %.1f %.1f %.1f' % (points[i][0], points[i][1], mx, my))
    d.append('L%.1f %.1f' % points[-1])
    return ''.join(d)


def polyline_length(points):
    return sum(math.dist(points[i], points[i + 1]) for i in range(len(points) - 1))


# ─────────────────────────── сборка ───────────────────────────

def main():
    doc = pymupdf.open(SRC)
    page = doc[PAGE]
    svg = page.get_svg_image()
    raw = re.findall(r'<path\s+transform="matrix\(([^)]*)\)"\s+d="([^"]*)"', svg)
    if not raw:
        raw = [(m.group(1), m.group(2)) for m in
               re.finditer(r'<path[^>]*transform="matrix\(([^)]*)\)"[^>]*\sd="([^"]*)"', svg)]

    shapes = []
    for mat, d in raw:
        m = [float(x) for x in NUM.findall(mat)]
        subpaths = [apply_matrix(sp, m) for sp in flatten(d)]
        pts = [p for sp in subpaths for p in sp]
        if not pts:
            continue
        xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
        shapes.append({'d': d, 'm': m, 'sub': subpaths,
                       'box': (min(xs), min(ys), max(xs), max(ys))})

    W, H = page.rect.width, page.rect.height

    def is_rect(sh):
        """Служебный прямоугольник обрезки: один контур из четырёх углов рамки."""
        if len(sh['sub']) != 1:
            return False
        pts = sh['sub'][0]
        if len(pts) > 6:
            return False
        x0, y0, x1, y1 = sh['box']
        if (x1 - x0) < W * 0.5 and (y1 - y0) < H * 0.5:
            return False          # маленький прямоугольник — это стойка буквы «i», а не рамка
        return all(abs(x - x0) < .5 or abs(x - x1) < .5 for x, _ in pts) and                all(abs(y - y0) < .5 or abs(y - y1) < .5 for _, y in pts)

    shapes = [s for s in shapes if (s['box'][2] - s['box'][0]) < W * 0.95 and not is_rect(s)]
    script = shapes[:SCRIPT_PATHS]
    caption = shapes[SCRIPT_PATHS:]

    strokes = []
    for idx, sh in enumerate(script):
        mask = raster(sh['sub'], sh['box'], SCALE)
        if mask.sum() < 40:
            continue
        thick = thickness(mask)
        skel = thin(mask)

        # Ветки скелета сами по себе идут вразнобой. Собираем их в один ход:
        # начинаем с самой левой, дальше каждый раз берём ближайшую к тому месту,
        # где перо остановилось, и разворачиваем её нужным концом.
        raw = [l for l in trace(skel) if len(l) >= 6]
        ordered, cur = [], None
        while raw:
            if cur is None:
                nxt = min(raw, key=lambda l: min(l[0][1], l[-1][1]))
                if nxt[-1][1] < nxt[0][1]:
                    nxt = nxt[::-1]
            else:
                best, flip, dist = None, False, None
                for l in raw:
                    for f, end in ((False, l[0]), (True, l[-1])):
                        d = (end[0] - cur[0]) ** 2 + (end[1] - cur[1]) ** 2
                        if dist is None or d < dist:
                            best, flip, dist = l, f, d
                nxt = best[::-1] if flip else best
            raw.remove(nxt[::-1] if nxt[::-1] in raw else nxt)
            ordered.append(nxt)
            cur = nxt[-1]

        for line in ordered:
            # Штрих режется на короткие звенья, и у каждого своя ширина пера:
            # у волосяных линий тонкая, у нажимных широкая. Одна ширина на весь
            # штрих раздувала тонкие места в «колбасу».
            pts_all = [((x - 2) / SCALE + sh['box'][0], (y - 2) / SCALE + sh['box'][1])
                       for y, x in line]
            rad_all = [max(float(thick[y, x]) / SCALE, 0.5) for y, x in line]
            seg_pts, seg_rad, acc = [pts_all[0]], [rad_all[0]], 0.0
            pieces = []
            for k in range(1, len(pts_all)):
                acc += math.dist(pts_all[k - 1], pts_all[k])
                seg_pts.append(pts_all[k]); seg_rad.append(rad_all[k])
                if acc >= SEG_LEN or k == len(pts_all) - 1:
                    simple = simplify(seg_pts, 0.25)
                    # звено нулевой длины браузер рисует круглой точкой независимо
                    # от анимации — такие «конфетти» висят на экране всё время
                    if len(simple) > 1 and polyline_length(simple) > 1.0                             and math.dist(simple[0], simple[-1]) > 0.3:
                        pieces.append((simple, float(np.median(seg_rad))))
                    seg_pts, seg_rad, acc = [pts_all[k]], [rad_all[k]], 0.0
            if not pieces:
                continue
            strokes.append({'letter': idx, 'order': len(strokes), 'pieces': pieces,
                            'len': polyline_length(pts_all)})

    # порядок письма: буква за буквой, внутри буквы — слева направо
    strokes.sort(key=lambda s: (s['letter'], s['order']))

    total = sum(s['len'] for s in strokes)
    print('букв в подписи: %d, штрихов пера: %d, общая длина: %.0f'
          % (len(caption), len(strokes), total))

    # раскладка по времени: каждый штрих пишется пропорционально своей длине,
    # соседние слегка перекрываются — иначе перо «дёргается» между буквами
    TOTAL = 2.6          # секунды на всё слово
    OVERLAP = 0.88
    # Время идёт строго по пройденному пути: где перо ведёт длинную линию —
    # дольше, где ставит точку — мгновенно. Соседние звенья перекрываются,
    # иначе на стыках видны ступеньки.
    # Внутри буквы перо идёт слева направо и не возвращается: иначе на экране
    # впереди пера появляются оторванные точки — они читаются как брак.
    by_letter = {}
    for s in strokes:
        by_letter.setdefault(s['letter'], []).extend(s['pieces'])
    plan = []
    for letter in sorted(by_letter):
        pieces = sorted(by_letter[letter], key=lambda pr: min(p[0] for p in pr[0]))
        plan.append((letter, pieces))

    pen, done = [], 0.0
    prev_letter = None
    for letter, pieces in plan:
        # между буквами рука отрывается — крошечная пауза читается как письмо
        if prev_letter is not None:
            done += total * 0.035
        prev_letter = letter
        for seg, rad in pieces:
            seg_len = polyline_length(seg)
            delay = TOTAL * done / total
            dur = TOTAL * seg_len / total * 1.7          # перекрытие звеньев
            pen.append({'d': smooth_path(seg), 'len': round(seg_len, 1),
                        'w': round(rad * 2.15, 1),
                        'dur': round(max(dur, 0.03), 3), 'delay': round(delay, 3)})
            done += seg_len
    span = round((pen[-1]['delay'] + pen[-1]['dur'] + 0.15) if pen else TOTAL, 2)

    def group(items, cls):
        out = []
        for sh in items:
            out.append('<path class="%s" transform="matrix(%s)" d="%s"/>'
                       % (cls, ','.join('%g' % v for v in sh['m']), sh['d']))
        return '\n    '.join(out)

    brush = '\n      '.join(
        '<path d="%s" stroke-width="%.1f" pathLength="100" style="--dur:%ss;--delay:%ss"/>'
        % (p['d'], p['w'], p['dur'], p['delay']) for p in pen)

    out = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %g %g" role="img" aria-label="PARI Samarkand" style="--span:%ss">
  <defs>
    <mask id="pariWrite" maskUnits="userSpaceOnUse" x="0" y="0" width="%g" height="%g">
      <g class="pen" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">
      %s
      </g>
    </mask>
  </defs>
  <g class="script" mask="url(#pariWrite)" fill="currentColor">
    %s
  </g>
  <g class="caption" fill="currentColor">
    %s
  </g>
</svg>
''' % (W, H, span, W, H, brush, group(script, 'ltr'), group(caption, 'cap'))

    os.makedirs(os.path.dirname(OUT_SVG), exist_ok=True)
    open(OUT_SVG, 'w', encoding='utf-8').write(out)
    print('готово:', os.path.relpath(OUT_SVG, ROOT), '%.1f КБ' % (len(out) / 1024))
    json.dump([{'len': p['len'], 'w': p['w']} for p in pen],
              open(os.path.join(ROOT, 'assets', 'img', 'pari-logo-write.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()
