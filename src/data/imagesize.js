/* ==========================================================================
   Размер картинки WebP по заголовку файла — при сборке, для width/height у <img>:
   браузер заранее знает пропорции и оставляет место, страница не прыгает, когда
   картинка догрузилась (на странице планировки чертёж без размеров давал CLS 0,2).
   ========================================================================== */
import { openSync, readSync, closeSync } from 'node:fs';
import { join } from 'node:path';

const cache = new Map();
export function webpSize(publicPath) {
  if (cache.has(publicPath)) return cache.get(publicPath);
  let size = null;
  try {
    const fd = openSync(join(process.cwd(), 'public', publicPath), 'r');
    const b = Buffer.alloc(30);
    readSync(fd, b, 0, 30, 0);
    closeSync(fd);
    if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
      const kind = b.toString('ascii', 12, 16);
      if (kind === 'VP8X') size = { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
      else if (kind === 'VP8L') { const v = b.readUInt32LE(21); size = { w: 1 + (v & 0x3fff), h: 1 + ((v >> 14) & 0x3fff) }; }
      else if (kind === 'VP8 ') size = { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    }
  } catch (e) { size = null; }
  cache.set(publicPath, size);
  return size;
}
