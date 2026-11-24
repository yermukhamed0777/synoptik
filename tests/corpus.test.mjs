import test from 'node:test';
import assert from 'node:assert/strict';
import { CHUNKS, DOCS, QA, TOPICS } from '../src/domain/corpus.js';

test('the demo corpus has the expected shape', () => {
  assert.equal(DOCS.length, 7);
  assert.equal(CHUNKS.length, 28);
  assert.equal(QA.length, 27);
  assert.equal(TOPICS.length, 11);
});

test('every document and chunk id is unique', () => {
  assert.equal(new Set(DOCS.map(doc => doc.id)).size, DOCS.length);
  assert.equal(new Set(CHUNKS.map(chunk => chunk.id)).size, CHUNKS.length);
  assert.equal(new Set(QA.map(item => item.id)).size, QA.length);
});

test('every passage is trilingual and carries a locator', () => {
  const documents = new Set(DOCS.map(doc => doc.id));
  CHUNKS.forEach(chunk => {
    assert.ok(documents.has(chunk.doc), `unknown document ${chunk.doc}`);
    assert.ok(chunk.loc && Object.keys(chunk.loc).length > 0, `missing locator on ${chunk.id}`);
    chunk.lines.forEach((line, index) => {
      assert.equal(line.length, 3, `${chunk.id} line ${index} is not trilingual`);
      line.forEach(value => assert.ok(value.trim().length > 0));
    });
  });
});

test('every curated answer cites passages that exist', () => {
  const byId = new Map(CHUNKS.map(chunk => [chunk.id, chunk]));
  QA.forEach(item => {
    assert.ok(item.q.length === 3, `${item.id} needs three questions`);
    (item.ev || []).forEach(([chunkId, lines]) => {
      const chunk = byId.get(chunkId);
      assert.ok(chunk, `${item.id} cites missing chunk ${chunkId}`);
      lines.forEach(lineIndex => assert.ok(lineIndex >= 0 && lineIndex < chunk.lines.length, `${item.id} cites out-of-range line`));
    });
    if (item.abstain) {
      assert.ok(item.why?.length === 3, `${item.id} needs a trilingual refusal reason`);
      assert.ok(item.missing?.length === 3, `${item.id} needs trilingual missing evidence`);
    } else {
      assert.equal(item.direct.length, 3, `${item.id} needs three direct answers`);
      assert.ok((item.ev || []).length > 0, `${item.id} has no evidence`);
    }
  });
});

test('answerable questions carry the number they claim', () => {
  const textOf = item => item.ev.map(([chunkId, lines]) => {
    const chunk = CHUNKS.find(entry => entry.id === chunkId);
    return lines.map(line => chunk.lines[line][0]).join(' ');
  }).join(' ');
  QA.filter(item => !item.abstain && /₸|%|год|year|day|дн|күн|м²|m²/.test(item.direct[0]))
    .forEach(item => {
      const numbers = (item.direct[0].match(/\d[\d\s,.]*/g) || []).map(value => value.replace(/[\s,.]/g, '')).filter(Boolean);
      const evidence = textOf(item).replace(/[\s,.]/g, '');
      numbers.forEach(number => assert.ok(evidence.includes(number), `${item.id}: ${number} not found in cited evidence`));
    });
});
