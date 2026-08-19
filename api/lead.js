/* ==========================================================================
   Приём заявки с сайта.

   Задачи функции: проверить данные, отсечь ботов и перебор запросов,
   передать заявку в слой CRM (lib/crm) и вернуть человеку понятный ответ.
   Секреты живут только в переменных окружения проекта, в код не попадают.
   ========================================================================== */

'use strict';

const crm = require('../lib/crm');

/* Простой ограничитель: 5 заявок с адреса за 10 минут.
   Память живёт в пределах инстанса функции — этого достаточно, чтобы
   отсечь примитивный перебор; полноценный лимит появится вместе с CRM. */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;
const hits = new Map();

function tooMany(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 500) {                       /* не даём карте расти бесконечно */
    for (const [key, times] of hits) {
      if (!times.length || now - times[times.length - 1] > WINDOW_MS) { hits.delete(key); }
    }
  }
  return list.length > MAX_HITS;
}

const clientIp = (req) => String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
  || req.socket && req.socket.remoteAddress || 'unknown';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});

  /* honeypot: скрытое поле заполняют только боты — отвечаем как обычно, но никуда не шлём */
  if (typeof body.company === 'string' && body.company.trim() !== '') {
    return res.status(200).json({ ok: true });
  }

  if (typeof body.name !== 'string' || body.name.trim().length < 2) {
    return res.status(400).json({ ok: false, error: 'invalid_name' });
  }
  const digits = typeof body.phone === 'string' ? body.phone.replace(/\D/g, '') : '';
  if (digits.length < 9) {
    return res.status(400).json({ ok: false, error: 'invalid_phone' });
  }

  if (tooMany(clientIp(req))) {
    return res.status(429).json({ ok: false, error: 'too_many_requests' });
  }

  try {
    const result = await crm.createLead(body);
    if (result.status === 'failed') {
      /* техническую причину пишем в лог, наружу отдаём нейтральный код */
      return res.status(502).json({ ok: false, error: 'delivery_failed' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('lead: unexpected', err && err.stack);
    return res.status(500).json({ ok: false, error: 'unexpected' });
  }
};

function safeParse(text) {
  try { return JSON.parse(text); } catch (e) { return {}; }
}
