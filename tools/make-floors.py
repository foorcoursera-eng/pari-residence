# -*- coding: utf-8 -*-
"""Поэтажные планы для выбора квартиры.

Источник — архив застройщика «Поэтажные планировки» (13 подъездов, этажи 3–16):
на каждый этаж лист JPG и SVG-схема, где каждая квартира обведена контуром и
подписана номером (data-num). Из них делаем:

  assets/img/floors/p<подъезд>-f<этаж>.webp   — сам план
  assets/floors/p<подъезд>.json               — контуры квартир по этажам

Контуры отдаём отдельным файлом на подъезд, а не одним общим: страница
подгружает только тот подъезд, который человек открыл.

Запуск: python tools/make-floors.py
"""
import io
import json
import os
import re

from PIL import Image

SRC = r'D:\Claude Code\_materials\floors'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, 'assets', 'img', 'floors')
DATA = os.path.join(ROOT, 'assets', 'floors')

NAME = re.compile(r'^Подъезд (\d+)\. Этаж (\d+)\.jpg$')
SCHEME = 'Подъезд %d. Этаж %d. Схема.svg'


def read_scheme(pod, floor):
    """Контуры квартир этажа: номер и путь. Кладовые и прочее пропускаем."""
    p = os.path.join(SRC, SCHEME % (pod, floor))
    if not os.path.exists(p):
        return None, []
    s = io.open(p, encoding='utf-8').read()
    box = re.search(r'viewBox="([^"]+)"', s)
    flats = []
    for tag in re.findall(r'<path[^>]*>', s):
        attrs = dict(re.findall(r'(data-[\w-]+)="([^"]*)"', tag))
        if attrs.get('data-category') != 'flat':
            continue
        d = re.search(r'\sd="([^"]*)"', tag)
        num = attrs.get('data-num')
        if not d or not num:
            continue
        # координаты с семью знаками после запятой раздувают файл втрое,
        # а на экране разницы нет
        path = re.sub(r'(\d+\.\d{2})\d+', r'\1', d.group(1))
        flats.append({'num': int(num), 'd': path})
    flats.sort(key=lambda x: x['num'])
    return (box.group(1) if box else None), flats


def main():
    os.makedirs(IMG, exist_ok=True)
    os.makedirs(DATA, exist_ok=True)

    plans = {}
    for f in sorted(os.listdir(SRC)):
        m = NAME.match(f)
        if m:
            plans.setdefault(int(m.group(1)), []).append(int(m.group(2)))

    total_img = 0
    for pod in sorted(plans):
        floors = sorted(plans[pod])
        entry = {'podil': pod, 'floors': {}}
        for fl in floors:
            im = Image.open(os.path.join(SRC, 'Подъезд %d. Этаж %d.jpg' % (pod, fl)))
            out = os.path.join(IMG, 'p%d-f%d.webp' % (pod, fl))
            im.convert('RGB').save(out, 'WEBP', quality=80, method=6)
            total_img += os.path.getsize(out)
            box, flats = read_scheme(pod, fl)
            entry['floors'][str(fl)] = {
                'w': im.width, 'h': im.height, 'box': box or '0 0 %d %d' % im.size,
                'flats': flats,
            }
        j = os.path.join(DATA, 'p%d.json' % pod)
        io.open(j, 'w', encoding='utf-8').write(json.dumps(entry, ensure_ascii=False, separators=(',', ':')))
        n = sum(len(v['flats']) for v in entry['floors'].values())
        print('подъезд %2d: этажи %2d–%2d, квартир %3d, данные %4d КБ'
              % (pod, floors[0], floors[-1], n, os.path.getsize(j) / 1024))

    print('\nпланов: %d, вес картинок %.1f МБ' % (sum(len(v) for v in plans.values()), total_img / 1e6))


if __name__ == '__main__':
    main()
