import en from './en.js';
import ru from './ru.js';
import kk from './kk.js';

export const LANGS = [
  { code: 'en', short: 'EN', name: 'English', locale: 'en-GB' },
  { code: 'ru', short: 'RU', name: 'Русский', locale: 'ru-RU' },
  { code: 'kk', short: 'KK', name: 'Қазақша', locale: 'kk-KZ' },
];

export const DICTS = [en, ru, kk];

export function missingKeys() {
  const base = Object.keys(en);
  return DICTS.slice(1).flatMap((dict, i) => base.filter(k => !(k in dict)).map(k => `${LANGS[i + 1].code}:${k}`));
}

export function extraKeys() {
  const base = new Set(Object.keys(en));
  return DICTS.slice(1).flatMap((dict, i) => Object.keys(dict).filter(k => !base.has(k)).map(k => `${LANGS[i + 1].code}:${k}`));
}
