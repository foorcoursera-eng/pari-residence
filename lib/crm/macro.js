/* ==========================================================================
   MacroCRM — адаптер.

   ВНИМАНИЕ: официальная документация и доступы от администратора CRM пока
   не переданы. Ничего не выдумываем: адаптер включается только когда в
   переменных окружения появятся реальные значения, до этого молча пропускается.

   Переменные окружения (задаются в настройках проекта на Vercel, не в коде):
     MACRO_API_URL     — адрес метода создания заявки
     MACRO_DOMAIN      — домен аккаунта в CRM
     MACRO_APP_SECRET  — секрет приложения
     MACRO_AUTH        — способ авторизации: 'md5' (домен+время+секрет) или 'bearer'

   TODO для администратора CRM (см. README, раздел «Что нужно от CRM»):
     1. точные адрес и версия API;
     2. способ авторизации и формат токена;
     3. обязательные поля заявки и их названия;
     4. формат ответа и id созданной заявки;
     5. поддержка UTM и поля «источник»;
     6. правила дедупликации по номеру телефона;
     7. лимиты запросов и тестовый контур.
   ========================================================================== */

'use strict';

const crypto = require('crypto');

const isConfigured = () => Boolean(process.env.MACRO_API_URL && process.env.MACRO_DOMAIN && process.env.MACRO_APP_SECRET);

/**
 * Создать заявку в MacroCRM.
 * @param {import('./normalize').Lead} lead
 * @returns {Promise<{skipped: boolean, id?: string}>}
 */
async function createLead(lead) {
  if (!isConfigured()) { return { skipped: true }; }

  const url = process.env.MACRO_API_URL;
  const domain = process.env.MACRO_DOMAIN;
  const secret = process.env.MACRO_APP_SECRET;
  const auth = process.env.MACRO_AUTH || 'md5';

  const comment = [
    lead.source && `source: ${lead.source}`,
    lead.medium && `medium: ${lead.medium}`,
    lead.campaign && `campaign: ${lead.campaign}`,
    lead.content && `content: ${lead.content}`,
    lead.term && `term: ${lead.term}`,
    lead.landingPage && `landing: ${lead.landingPage}`,
    lead.page && `page: ${lead.page}`,
    lead.device && `device: ${lead.device}`,
  ].filter(Boolean).join('; ');

  const params = new URLSearchParams({
    domain,
    name: lead.name,
    phone: lead.phone,
    comment,
    action: 'question',
  });

  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
  if (auth === 'bearer') {
    headers.Authorization = `Bearer ${secret}`;
  } else {
    const time = Math.floor(Date.now() / 1000);
    params.set('time', String(time));
    params.set('token', crypto.createHash('md5').update(`${domain}${time}${secret}`).digest('hex'));
  }

  const res = await fetch(url, { method: 'POST', headers, body: params.toString() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MacroCRM ${res.status}: ${text.slice(0, 300)}`);
  }

  let id;
  try {
    const data = await res.json();
    id = data && (data.id || data.request_id || (data.data && data.data.id));
  } catch (e) { /* ответ не JSON — id узнаем после уточнения формата у администратора */ }
  return { skipped: false, id: id ? String(id) : undefined };
}

module.exports = { createLead, isConfigured };
