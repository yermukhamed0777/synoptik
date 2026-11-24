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

test('stemming canonicalises price concepts across languages', () => {
  assert.equal(stem('prices'), 'price');
  assert.equal(stem('цены'), 'price');
  assert.equal(stem('баға'), 'price');
});

test('units collapse so 10 L and 10 литров are the same quantity', () => {
  const english = tokenize('10 litre pack').map(token => token.s);
  const russian = tokenize('10 литров').map(token => token.s);
  assert.ok(english.includes('l'));
  assert.ok(russian.includes('l'));
  assert.ok(english.includes('10') && russian.includes('10'));
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

test('a transliterated brand name still retrieves the price line', () => {
  const result = search(index, 'Цена ТерраШилд X5', { threshold: 0.6 });
  assert.equal(result.status, 'answer');
  assert.equal(result.hits[0].chunk.id, 'price1');
});

test('a typo in a product name is tolerated when the question has context', () => {
  const result = search(index, 'TerraShiled X5 price', { threshold: 0.6 });
  assert.equal(result.status, 'answer');
  assert.equal(result.hits[0].chunk.id, 'price1');
});

test('a unit variant retrieves the same pack price', () => {
  const result = search(index, 'What does a 10 litre can of TerraShield X5 cost?', { threshold: 0.6 });
  assert.equal(result.status, 'answer');
  assert.equal(result.hits[0].chunk.id, 'price1');
});

test('the engine surfaces a price conflict and prefers the price list', () => {
  const named = CHUNKS.map(chunk => ({
    ...chunk,
    docName: { cat: 'Product_Catalog_2025.pdf', price: 'Price_List_2026.xlsx' }[chunk.doc] || chunk.doc,
  }));
  const namedIndex = buildIndex(named);
  const result = search(namedIndex, 'How much does TerraShield X5 cost?', { threshold: 0.6 });
  assert.equal(result.status, 'answer');
  assert.ok(result.conflict, 'expected a conflict');
  assert.equal(result.conflict.used.value, 42800);
  assert.equal(result.conflict.other.value, 40900);
  assert.match(result.conflict.used.docName, /Price_List/);
});

test('comparison questions are refused rather than answered with one side', () => {
  const result = search(index, 'What is the difference between TerraShield X5 and SilkWall Interior Matt?', { threshold: 0.6 });
  assert.equal(result.status, 'abstain');
  assert.equal(result.reason, 'comparison');
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
