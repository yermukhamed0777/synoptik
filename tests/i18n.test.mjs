import test from 'node:test';
import assert from 'node:assert/strict';
import { DICTS, LANGS, extraKeys, missingKeys } from '../src/i18n/index.js';

test('all three locales define exactly the same keys', () => {
  assert.deepEqual(missingKeys(), []);
  assert.deepEqual(extraKeys(), []);
});

test('no string is empty in any locale', () => {
  DICTS.forEach((dictionary, index) => {
    Object.entries(dictionary).forEach(([key, value]) => {
      assert.equal(typeof value, 'string', `${LANGS[index].code}:${key} must be a string`);
      assert.ok(value.trim().length > 0, `${LANGS[index].code}:${key} is empty`);
    });
  });
});

test('placeholders match across locales', () => {
  const base = DICTS[0];
  const placeholders = value => [...String(value).matchAll(/\{(\d)\}/g)].map(match => match[1]).sort().join(',');
  Object.keys(base).forEach(key => {
    DICTS.slice(1).forEach(dictionary => {
      assert.equal(placeholders(dictionary[key]), placeholders(base[key]), `placeholder mismatch in ${key}`);
    });
  });
});
