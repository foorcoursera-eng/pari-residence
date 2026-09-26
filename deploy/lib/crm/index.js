/* ==========================================================================
   Единая точка отправки заявки: сайт знает только про createLead().
   Каналы доставки подключаются здесь, страница о них ничего не знает.
   ========================================================================== */

'use strict';

const telegram = require('./telegram');
const macro = require('./macro');
const { toLead, normalizePhone } = require('./normalize');

/**
 * @param {Object} body тело запроса с формы
 * @returns {Promise<{status:'sent'|'failed', lead:import('./normalize').Lead, delivered:string[], failed:string[], crmId?:string}>}
 */
async function createLead(body) {
  const lead = toLead(body);
  const delivered = [];
  const failed = [];
  let crmId;

  /* Telegram — обязательный канал: менеджер видит заявку сразу */
  try {
    await telegram.sendLead(lead);
    delivered.push('telegram');
  } catch (err) {
    failed.push('telegram');
    console.error('crm: telegram error', err && err.message);
  }

  /* MacroCRM — необязательный, пока не переданы доступы */
  try {
    const result = await macro.createLead(lead);
    if (result.skipped) {
      console.info('crm: macro пропущен — доступы не заданы');
    } else {
      delivered.push('macro');
      crmId = result.id;
    }
  } catch (err) {
    failed.push('macro');
    console.error('crm: macro error', err && err.message);
  }

  /* Заявка считается принятой, если сработал хотя бы один канал.
     Если не сработал ни один — сообщаем об ошибке, чтобы человек мог позвонить. */
  const status = delivered.length ? 'sent' : 'failed';
  console.info('crm: lead', JSON.stringify({
    status, delivered, failed, crmId,
    phone: lead.phone, source: lead.source, page: lead.page, at: lead.createdAt,
  }));

  return { status, lead, delivered, failed, crmId };
}

module.exports = { createLead, normalizePhone };
