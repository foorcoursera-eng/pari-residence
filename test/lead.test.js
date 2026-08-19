#!/usr/bin/env node
/* ==========================================================================
   Проверка приёма заявки: валидация, ловушка для ботов, нормализация телефона,
   передача источника, лимит запросов. Сеть подменяется — наружу ничего не уходит.
   Запуск: node test/lead.test.js
   ========================================================================== */

'use strict';

process.env.TG_BOT_TOKEN = 'test-token';
process.env.TG_CHAT_ID = '-100500';
delete process.env.MACRO_API_URL;              /* CRM не настроена — путь «пропускаем» */

const assert = require('assert');
const path = require('path');

const handler = require(path.join(__dirname, '..', 'api', 'lead.js'));
const { normalizePhone } = require(path.join(__dirname, '..', 'lib', 'crm', 'normalize.js'));

/* ---------- заглушки ---------- */
const sent = [];
global.fetch = async (url, opts) => {
  sent.push({ url, body: JSON.parse(opts.body) });
  return { ok: true, status: 200, text: async () => 'ok', json: async () => ({ ok: true }) };
};

const call = async (body, ip) => {
  const req = { method: 'POST', body, headers: { 'x-forwarded-for': ip || '10.0.0.1' }, socket: {} };
  let code = 0; let payload = null;
  const res = {
    status(c) { code = c; return this; },
    json(p) { payload = p; return this; },
    setHeader() { return this; },
  };
  await handler(req, res);
  return { code, payload };
};

const quiet = console.info;
console.info = () => {};

(async () => {
  /* 1. нормализация номера */
  assert.strictEqual(normalizePhone('90 123 45 67'), '+998901234567');
  assert.strictEqual(normalizePhone('+998 90 123 45 67'), '+998901234567');
  assert.strictEqual(normalizePhone('998901234567'), '+998901234567');
  console.log('✓ телефон приводится к единому виду');

  /* 2. валидация */
  assert.strictEqual((await call({ name: 'А', phone: '901234567' })).code, 400);
  assert.strictEqual((await call({ name: 'Азиз', phone: '123' })).code, 400);
  console.log('✓ короткое имя и неполный номер отклоняются');

  /* 3. ловушка для ботов: отвечаем 200, но ничего не отправляем */
  sent.length = 0;
  const bot = await call({ name: 'Bot', phone: '901234567', company: 'spam' });
  assert.strictEqual(bot.code, 200);
  assert.strictEqual(sent.length, 0);
  console.log('✓ бот получает 200, заявка никуда не уходит');

  /* 4. нормальная заявка: уходит в Telegram вместе с источником */
  sent.length = 0;
  const ok = await call({
    name: 'Азиз', phone: '90 123 45 67', page: '/apartments/',
    utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'pari_august',
    landing_page: '/', referrer: 'https://google.com', device: 'mobile', language: 'ru',
  }, '10.0.0.2');
  assert.strictEqual(ok.code, 200);
  assert.strictEqual(sent.length, 1);
  const text = sent[0].body.text;
  assert.ok(text.includes('+998901234567'), 'в сообщении нормализованный номер');
  assert.ok(text.includes('google / cpc / pari_august'), 'в сообщении источник');
  assert.ok(text.includes('/apartments/'), 'в сообщении страница');
  console.log('✓ заявка уходит с нормализованным номером и источником');

  /* 5. лимит: шестая заявка с того же адреса отклоняется */
  const ip = '10.0.0.3';
  for (let i = 0; i < 5; i++) {
    assert.strictEqual((await call({ name: 'Азиз', phone: '901234567' }, ip)).code, 200);
  }
  assert.strictEqual((await call({ name: 'Азиз', phone: '901234567' }, ip)).code, 429);
  console.log('✓ перебор запросов останавливается на шестой попытке');

  /* 6. канал недоступен — человек видит ошибку, а не 500 */
  global.fetch = async () => ({ ok: false, status: 500, text: async () => 'boom' });
  const down = await call({ name: 'Азиз', phone: '901234567' }, '10.0.0.9');
  assert.strictEqual(down.code, 502);
  assert.strictEqual(down.payload.ok, false);
  assert.ok(!JSON.stringify(down.payload).includes('boom'), 'наружу не уходит техническая причина');
  console.log('✓ при недоступном канале отдаётся аккуратная ошибка без внутренних деталей');

  console.info = quiet;
  console.log('\nВсе проверки пройдены.');
})().catch((err) => {
  console.info = quiet;
  console.error('\n✗ Проверка не прошла:', err && err.message);
  process.exit(1);
});
