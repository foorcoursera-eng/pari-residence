/* ==========================================================================
   PARI Residence — языки сайта (документ «Этап 1»: RU / UZ / EN / FR).
   ru — основной, без префикса в адресе; остальные — /uz/, /en/, /fr/.
   ========================================================================== */
import * as ru from './ru.js';
import * as uz from './uz.js';
import * as en from './en.js';
import * as fr from './fr.js';

export const LANGS = ['ru', 'uz', 'en', 'fr'];
export const DEFAULT = 'ru';
const DICTS = { ru, uz, en, fr };

/* словарь языка */
export const t = (lang = DEFAULT) => DICTS[lang] || ru;

/* адрес страницы на языке: href('en', '/apartments/') → '/en/apartments/' */
export const href = (lang, path = '/') => (lang === DEFAULT ? '' : '/' + lang) + path;

/* путь без языкового префикса: '/en/apartments/' → '/apartments/' */
export const stripLang = (pathname) => {
  const m = pathname.match(/^\/(uz|en|fr)(\/.*)?$/);
  return m ? (m[2] || '/') : pathname;
};

/* подстановка {ключей} */
export const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));

/* число + существительное в нужной форме: plural('ru', 221, ['квартира','квартиры','квартир']) */
export const plural = (lang, n, forms) => {
  if (lang === 'ru') {
    const m10 = n % 10, m100 = n % 100;
    return forms[m10 === 1 && m100 !== 11 ? 0 : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 1 : 2];
  }
  if (lang === 'fr') return forms[n > 1 ? 1 : 0];
  if (lang === 'uz') return forms[0];                     /* в узбекском после числа — единственное число */
  return forms[n === 1 ? 0 : 1];
};

/* площадь по-местному: 67,08 (ru, uz, fr) / 67.08 (en) */
export const fmtArea = (lang, a) => {
  const s = (Math.round(Number(a) * 100) / 100).toFixed(2);
  return lang === 'en' ? s : s.replace('.', ',');
};
