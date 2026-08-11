// Vercel serverless function: принимает заявку с лендинга, пересылает в Telegram
// и (опционально, когда появятся ключи) — в CRM Macroserver / MACRO.
// Требует переменные окружения TG_BOT_TOKEN и TG_CHAT_ID (задаются в настройках проекта на Vercel,
// не в коде — см. README.md).

const crypto = require('crypto');

const TYPE_LABELS = {
  studio: 'Студия',
  '1': '1-комнатная',
  '2': '2-комнатная',
  '3': '3-комнатная',
  '4': '4-комнатная',
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const body = req.body || {};
  const { name, phone, type, company } = body;

  // honeypot: бот заполнил скрытое поле — молча "принимаем", ничего не отправляем
  if (typeof company === 'string' && company.trim() !== '') {
    return res.status(200).json({ ok: true });
  }

  if (typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ ok: false, error: 'invalid_name' });
  }
  const phoneDigits = typeof phone === 'string' ? phone.replace(/\D/g, '') : '';
  if (phoneDigits.length < 9) {
    return res.status(400).json({ ok: false, error: 'invalid_phone' });
  }

  const token = process.env.TG_BOT_TOKEN;
  const chatId = process.env.TG_CHAT_ID;
  if (!token || !chatId) {
    console.error('TG_BOT_TOKEN / TG_CHAT_ID не заданы в переменных окружения');
    return res.status(500).json({ ok: false, error: 'server_not_configured' });
  }

  const lines = [
    'Новая заявка — PARI Residence',
    `Имя: ${name.trim().slice(0, 120)}`,
    `Телефон: ${phone.trim().slice(0, 40)}`,
  ];
  if (type && TYPE_LABELS[type]) lines.push(`Формат: ${TYPE_LABELS[type]}`);

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: lines.join('\n') }),
    });
    if (!tgRes.ok) {
      const errText = await tgRes.text();
      console.error('Telegram API error:', errText);
      return res.status(502).json({ ok: false, error: 'telegram_failed' });
    }
  } catch (err) {
    console.error('lead.js Telegram error:', err);
    return res.status(500).json({ ok: false, error: 'unexpected' });
  }

  // Необязательная пересылка в Macroserver/MACRO CRM.
  // Активируется сама, как только на Vercel появятся переменные окружения
  // MACRO_APP_SECRET, MACRO_DOMAIN и (при необходимости) MACRO_API_BASE — их выдаёт
  // администратор аккаунта в разделе «Компания → Интеграции». До этого момента
  // блок ниже просто ничего не делает и не мешает основной отправке в Telegram.
  await forwardToMacro({ name, phone, type }).catch((err) => {
    console.error('lead.js MacroCRM forward error:', err);
  });

  return res.status(200).json({ ok: true });
};

async function forwardToMacro({ name, phone, type }) {
  const appSecret = process.env.MACRO_APP_SECRET;
  const domain = process.env.MACRO_DOMAIN;
  if (!appSecret || !domain) return; // интеграция ещё не настроена — тихо пропускаем

  // Регион по умолчанию — Узбекистан; можно переопределить MACRO_API_BASE, если
  // администратор подтвердит другой адрес API при подключении.
  const apiBase = process.env.MACRO_API_BASE || 'https://api.macroserver.uz/estate/request/';

  const time = Math.floor(Date.now() / 1000);
  const token = crypto.createHash('md5').update(`${domain}${time}${appSecret}`).digest('hex');

  const params = new URLSearchParams({
    domain,
    time: String(time),
    token,
    name: name.trim().slice(0, 120),
    phone: phone.trim().slice(0, 40),
    action: 'question',
  });
  if (type) params.set('comment', `Интересующий формат: ${TYPE_LABELS[type] || type}`);

  const res = await fetch(apiBase, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Macro API ${res.status}: ${text}`);
  }
}
