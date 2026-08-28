# -*- coding: utf-8 -*-
"""Просмотр собранного сайта.

Порт берём из переменной окружения PORT — иначе превью не может выбрать
свободный, и запуск падает, стоит занять порт чему-то постороннему.
Папку отдаём относительно самого репозитория, а не текущего каталога:
сервер запускают из разных мест, и относительный путь уводил не туда.

Запуск: python tools/serve.py   (порт: $PORT, по умолчанию 5173)
"""
import functools
import http.server
import os
import socketserver

ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dist')
PORT = int(os.environ.get('PORT') or 5173)


class Handler(http.server.SimpleHTTPRequestHandler):
    """Отдаём свежую сборку: кэш браузера при проверке правок только мешает."""

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

    def log_message(self, fmt, *args):
        pass                                   # тихий лог: в консоли нужны ошибки, а не каждая картинка


def main():
    if not os.path.isdir(ROOT):
        raise SystemExit('Нет папки dist — сначала `node build.js`')
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(('127.0.0.1', PORT),
                                         functools.partial(Handler, directory=ROOT)) as srv:
        print('Сайт: http://localhost:%d/  (папка %s)' % (PORT, ROOT), flush=True)
        srv.serve_forever()


if __name__ == '__main__':
    main()
