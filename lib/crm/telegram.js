/* ==========================================================================
   Доставка заявки в Telegram — основной канал, пока не подключена CRM.
   Токен и chat_id живут только в переменных окружения проекта на Vercel.
   ========================================================================== */

'use strict';

const NAMES = {
  ru: { title: 'Новая заявка — PARI Residence', name: 'Имя', phone: 'Телефон', page: 'Страница',
        source: 'Источник', campaign: 'Кампания', landing: 'Точка входа', referrer: 'Переход с',
        device: 'Устройство', lang: 'Язык' },
};

/**
 * @param {import('./normalize').Lead} lead
 * @returns {Promise<void>}
 */
async function sendLead(lead) {
  const token = process.env.TG_BOT_TOKEN;
  const chatId = process.env.TG_CHAT_ID;
  if (!token || !chatId) {
    throw new Error('TG_BOT_TOKEN / TG_CHAT_ID не заданы в переменных окружения');
  }

  const L = NAMES.ru;
  const lines = [
    L.title,
    `${L.name}: ${lead.name}`,
    `${L.phone}: ${lead.phone}`,
    `${L.page}: ${lead.page || '/'}`,
  ];
  const src = [lead.source, lead.medium, lead.campaign].filter(Boolean).join(' / ');
  if (src) { lines.push(`${L.source}: ${src}`); }
  if (lead.content || lead.term) { lines.push(`${L.campaign}: ${[lead.content, lead.term].filter(Boolean).join(' / ')}`); }
  if (lead.landingPage && lead.landingPage !== lead.page) { lines.push(`${L.landing}: ${lead.landingPage}`); }
  if (lead.referrer) { lines.push(`${L.referrer}: ${lead.referrer}`); }
  if (lead.device) { lines.push(`${L.device}: ${lead.device}${lead.language ? ' · ' + lead.language : ''}`); }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: lines.join('\n'), disable_web_page_preview: true }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Telegram ${res.status}: ${text.slice(0, 300)}`);
  }
}

module.exports = { sendLead };
