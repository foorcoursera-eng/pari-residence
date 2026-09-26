/* Статический сервер собранного сайта (dist/) для тестов — как Vercel: адреса со слешем на конце
   (308 на адрес со слешем), 404.html со статусом 404. /api/* никуда не пересылается (503):
   тесты подменяют ответ /api/lead/ сами, в отдел продаж ничего не уходит. */
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.env.DIST || fileURLToPath(new URL('../dist/', import.meta.url));   /* DIST — другая сборка для сравнения */
const PORT = +(process.env.PORT || 4399);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };

async function file(p) {
  try {
    const s = await stat(p);
    if (s.isFile()) return p;
    if (s.isDirectory()) { const i = join(p, 'index.html'); await stat(i); return i; }
  } catch { /* нет такого файла */ }
  return null;
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const path = decodeURIComponent(url.pathname);
  if (path.startsWith('/api/')) { res.writeHead(503, { 'Content-Type': 'application/json' }); return res.end('{"ok":false,"error":"test_stub"}'); }
  if (!extname(path) && !path.endsWith('/')) { res.writeHead(308, { Location: path + '/' + url.search }); return res.end(); }
  let f = await file(join(ROOT, normalize(path).replace(/^(\.\.[/\\])+/, '')));
  let status = 200;
  if (!f) { f = join(ROOT, '404.html'); status = 404; }
  const body = await readFile(f);
  const range = req.headers.range && extname(f) === '.mp4' ? /bytes=(\d*)-(\d*)/.exec(req.headers.range) : null;
  if (range) {
    const start = +range[1] || 0, end = range[2] ? +range[2] : body.length - 1;
    res.writeHead(206, { 'Content-Type': 'video/mp4', 'Content-Range': `bytes ${start}-${end}/${body.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
    return res.end(body.subarray(start, end + 1));
  }
  res.writeHead(status, { 'Content-Type': TYPES[extname(f)] || 'application/octet-stream', 'Content-Length': body.length });
  res.end(req.method === 'HEAD' ? undefined : body);
}).listen(PORT, () => console.log(`dist on http://localhost:${PORT}`));
