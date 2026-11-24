import test from 'node:test';
import assert from 'node:assert/strict';
import { buildIndex, entities, keyTerms, search, stem, tokenize } from '../src/domain/engine.js';
import { CHUNKS } from '../src/domain/corpus.js';

const index = buildIndex(CHUNKS);

test('tokenizer drops stopwords and keeps numbers', () => {
  const terms = tokenize('How much does the 10 L pack cost?').map(token => token.raw);
  assert.ok(terms.includes('10'));
  assert.ok(terms.includes('cost'));
  assert.ok(!terms.includes('the'));
  assert.ok(!terms.includes('how'));
});

test('stemming canonicalises price synonyms across languages', () => {
  assert.equal(stem('prices'), 'price');
  assert.equal(stem('стоимость'), 'цена');
  assert.equal(stem('тұрады'), 'баға');
});

test('a price question is answered from the price list with strong evidence', () => {
  const result = search(index, 'How much does TerraShield X5 cost?', { threshold: 0.6 });
  assert.equal(result.status, 'answer');
  assert.ok(result.hits.length >= 1);
  const text = result.hits[0].chunk.lines[result.hits[0].evidenceLines[0]].join(' ');
  assert.match(text, /42,\s?800/);
  assert.equal(result.strength, 'strong');
});

test('a Kazakh question finds the same passage', () => {
  const result = search(index, 'TerraShield X5 қанша тұрады?', { threshold: 0.6 });
  assert.equal(result.status, 'answer');
  const line = result.hits[0].chunk.lines[result.hits[0].evidenceLines[0]];
  assert.match(line.join(' '), /42[\s,]?800/);
});

test('an unknown topic is refused instead of guessed', () => {
  const result = search(index, 'Do you offer installment payment?', { threshold: 0.6 });
  assert.equal(result.status, 'abstain');
  assert.ok(['no-match', 'low-coverage'].includes(result.reason));
});

test('a different pack size is refused by the identifier guard', () => {
  const result = search(index, 'What is the coverage of MetalGuard 3-in-1 for a 5 kg pack?', { threshold: 0.6 });
  assert.equal(result.status, 'abstain');
  assert.equal(result.reason, 'identifier-mismatch');
  assert.deepEqual(result.missing, ['5']);
});

test('a pack size that does not exist is refused rather than extrapolated', () => {
  const result = search(index, 'How much is a 20 L pack of TerraShield X5?', { threshold: 0.6 });
  assert.equal(result.status, 'abstain');
  assert.ok(result.missing.includes('20'));
});

test('entities and key terms come from the text, never from a template', () => {
  const values = entities(CHUNKS);
  assert.ok(values.products.length > 0);
  assert.ok(values.amounts.some(amount => amount.includes('₸')));
  const terms = keyTerms(CHUNKS, 6);
  assert.equal(terms.length, 6);
  assert.ok(terms.every(term => typeof term === 'string' && term.length > 0));
});

test('an empty index refuses cleanly', () => {
  const empty = buildIndex([]);
  const result = search(empty, 'anything', {});
  assert.equal(result.status, 'abstain');
});
