import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildIndex, lineText, search } from '../src/domain/engine.js';
import { CHUNKS, DOCS } from '../src/domain/corpus.js';

/* Regression suite for retrieval quality on the demo corpus.
   This is not a generalisation benchmark: the questions were written against
   this corpus. It exists to stop a code change from silently making the demo
   worse. Real-corpus evidence belongs in eval/corpora and the scorecard. */

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
import {demoFloor} from '../eval/floors.mjs';
const sets = fs.readdirSync(path.join(root,'eval','sets')).filter(name => name.endsWith('.json')).sort().map(name =>
  JSON.parse(fs.readFileSync(path.join(root, 'eval', 'sets', name), 'utf8'))
);

const chunks = CHUNKS.map(chunk => ({
  ...chunk,
  docName: DOCS.find(doc => doc.id === chunk.doc)?.name || chunk.doc,
}));
const index = buildIndex(chunks);

const normalize = value =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, '');

const totals = { answerable: 0, correct: 0, wrong: 0, refused: 0, unanswerable: 0 };

for (const set of sets) {
  for (const question of set.questions) {
    const result = search(index, question.q, { threshold: set.threshold ?? 0.6, lang: question.lang ?? 0 });
    if (question.answerable === false) {
      totals.unanswerable += 1;
      if (result.status === 'abstain') totals.refused += 1;
      else totals.wrong += 1;
      continue;
    }
    totals.answerable += 1;
    if (result.status !== 'answer') continue;
    const answer = lineText(result.hits[0].chunk, result.hits[0].best.i, question.lang ?? 0);
    const expected = question.expect || {};
    const chunkOk = !expected.chunks || expected.chunks.includes(result.hits[0].chunk.id);
    const containsOk = !expected.contains || expected.contains.every(needle => normalize(answer).includes(normalize(needle)));
    if (chunkOk && containsOk) totals.correct += 1;
    else totals.wrong += 1;
  }
}

const answeredCorrectRate = totals.correct / totals.answerable;
const wrongRate = totals.wrong / (totals.correct + totals.wrong || 1);
const refusalAccuracy = totals.refused / totals.unanswerable;

test('demo-corpus retrieval stays above the regression floor', () => {
  console.log(
    `    answerable ${totals.correct}/${totals.answerable} (${(answeredCorrectRate * 100).toFixed(1)}%), ` +
      `wrong ${totals.wrong}, refusals ${totals.refused}/${totals.unanswerable}`
  );
  assert.ok(answeredCorrectRate >= demoFloor.answered, `answered-correct dropped to ${(answeredCorrectRate * 100).toFixed(1)}%`);
  assert.ok(wrongRate <= demoFloor.wrong, `wrong answers rose to ${(wrongRate * 100).toFixed(1)}%`);
  assert.ok(refusalAccuracy >= demoFloor.refusal, `refusal accuracy dropped to ${(refusalAccuracy * 100).toFixed(1)}%`);
});
