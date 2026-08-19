/* ==========================================================================
   Приведение заявки к единому виду перед отправкой в CRM.
   ========================================================================== */

'use strict';

/**
 * Узбекский номер к виду +998XXXXXXXXX.
 * «90 123 45 67», «+998 90 123 45 67», «998901234567» → +998901234567.
 * Если формат непонятен — возвращаем исходную строку с плюсом, ничего не выдумывая.
 * @param {string} raw
 * @returns {string}
 */
function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 9) { return '+998' + digits; }
  if (digits.length === 12 && digits.startsWith('998')) { return '+' + digits; }
  if (digits.length === 13 && digits.startsWith('9998')) { return '+' + digits.slice(1); }
  return digits ? '+' + digits : '';
}

/**
 * @typedef {Object} Lead
 * @property {string} name
 * @property {string} phone            нормализованный, +998XXXXXXXXX
 * @property {string} phoneRaw         как ввёл человек
 * @property {string} source           utm_source или 'direct'
 * @property {string} medium
 * @property {string} campaign
 * @property {string} content
 * @property {string} term
 * @property {string} landingPage      первая страница визита
 * @property {string} page             страница, с которой отправлена форма
 * @property {string} referrer
 * @property {string} device
 * @property {string} language
 * @property {string} createdAt        ISO-8601
 */

const clip = (v, n) => String(v == null ? '' : v).trim().slice(0, n);

/**
 * @param {Object} body тело запроса
 * @returns {Lead}
 */
function toLead(body) {
  return {
    name: clip(body.name, 120),
    phone: normalizePhone(body.phone),
    phoneRaw: clip(body.phone, 40),
    source: clip(body.utm_source, 120) || 'direct',
    medium: clip(body.utm_medium, 120),
    campaign: clip(body.utm_campaign, 120),
    content: clip(body.utm_content, 120),
    term: clip(body.utm_term, 120),
    landingPage: clip(body.landing_page, 200),
    page: clip(body.page, 200),
    referrer: clip(body.referrer, 200),
    device: clip(body.device, 20),
    language: clip(body.language, 5),
    createdAt: new Date().toISOString(),
  };
}

module.exports = { normalizePhone, toLead };
