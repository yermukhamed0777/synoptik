#!/usr/bin/env node
/**
 * Evidence benchmark.
 *
 * Runs questions against the retrieval engine (not the curated demo answers),
 * grades each one against expected evidence and expected refusals, and writes
 * a scorecard. This is the instrument that decides whether a release is better.
 *
 * Usage:
 *   node scripts/evaluate.mjs --all
 *   node scripts/evaluate.mjs --set eval/sets/demo-paraphrase.json
 *   node scripts/evaluate.mjs --corpus eval/corpora/acme --set eval/sets/acme.json
 *   node scripts/evaluate.mjs --all --json artifacts/scorecard.json --md artifacts/scorecard.md
 *
 * Exit code is non-zero when the scorecard misses the thresholds.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildIndex, lineText, search } from '../src/domain/engine.js';
import { CORPUS } from '../src/domain/corpus.js';
import { parseFile } from '../src/app/parsers.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ---------- arguments ---------- */

const argv = process.argv.slice(2);
import {demoFloor, realFloor} from "../eval/floors.mjs";
const args = { sets: [], thresholds: {...(process.argv.includes("--corpus") ? realFloor : demoFloor)} };
for (let i = 0; i < argv.length; i++) {
  const token = argv[i];
  const next = () => argv[++i];
  if (token === '--set') args.sets.push(next());
  else if (token === '--all') args.all = true;
  else if (token === '--corpus') args.corpus = next();
  else if (token === '--json') args.json = next();
  else if (token === '--md') args.md = next();
  else if (token === '--verbose') args.verbose = true;
  else if (token === '--min-answered') args.thresholds.answered = Number(next());
  else if (token === '--max-wrong') args.thresholds.wrong = Number(next());
  else if (token === '--min-refusal') args.thresholds.refusal = Number(next());
  else if (token === '--help' || token === '-h') {
    console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]);
    process.exit(0);
  } else {
    console.error('Unknown argument:', token);
    process.exit(2);
  }
}

if (!args.sets.length && !args.all) {
  console.error('Pass --all or --set <file>. See --help.');
  process.exit(2);
}

const setPaths = args.sets.length ? args.sets : listSets();
if (!setPaths.length) {
  console.error('No evaluation sets found in eval/sets/.');
  process.exit(2);
}

function listSets() {
  const dir = path.join(root, 'eval', 'sets');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(name => name.endsWith('.json')).sort().map(name => path.join(dir, name));
}

/* ---------- corpus ---------- */

const EXT = { '.pdf': 'pdf', '.docx': 'docx', '.xlsx': 'xlsx', '.csv': 'csv', '.txt': 'txt', '.md': 'txt' };

async function loadCorpus(dir) {
  const chunks = [];
  const files = [];
  const walk = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (EXT[path.extname(entry.name).toLowerCase()]) files.push(full);
    }
  };
  walk(dir);

  for (const file of files) {
    const extension = path.extname(file).toLowerCase();
    const type = EXT[extension];
    const name = path.basename(file);
    try {
      const buffer = fs.readFileSync(file);
      const parsed = await parseFile(new File([buffer], name), type);
      parsed.chunks.forEach((chunk, index) => {
        chunks.push({ ...chunk, id: `${name}#${index + 1}`, doc: name, docName: name, topic: 'file' });
      });
      console.log(`  loaded ${name}: ${parsed.chunks.length} passages`);
    } catch (error) {
      console.error(`  failed ${name}: ${error.message || error}`);
    }
  }
  return chunks;
}

function demoChunks() {
  return CORPUS.CHUNKS.map(chunk => {
    const doc = CORPUS.DOCS.find(item => item.id === chunk.doc);
    return { ...chunk, docName: doc ? doc.name : chunk.doc };
  });
}

/* ---------- grading ---------- */

const normalize = value =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, '');

function grade(question, result) {
  const answered = result.status === 'answer';
  const hits = answered ? result.hits : [];
  const answerText = hits.length ? lineText(hits[0].chunk, hits[0].best.i, question.lang ?? 0) : '';
  const haystack = normalize(answerText);
  const expected = question.expect || {};

  const chunkOk = !expected.chunks || expected.chunks.length === 0 || expected.chunks.includes(hits[0]?.chunk.id);
  const containsOk = !expected.contains || expected.contains.length === 0 || expected.contains.every(needle => haystack.includes(normalize(needle)));

  if (question.answerable === false) {
    return {
      outcome: answered ? 'wrong-answer' : 'correct-refusal',
      answered,
      answer: answerText,
      reason: answered ? 'answered an unanswerable question' : 'refused',
      strength: result.strength || null,
    };
  }

  if (!answered) {
    return { outcome: 'missed', answered: false, answer: '', reason: result.reason || 'abstained', strength: null };
  }
  if (chunkOk && containsOk) {
    return { outcome: 'correct', answered: true, answer: answerText, reason: '', strength: result.strength || null };
  }
  return {
    outcome: 'wrong-answer',
    answered: true,
    answer: answerText,
    reason: !chunkOk ? 'wrong passage' : 'missing expected value',
    strength: result.strength || null,
  };
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

/* ---------- run ---------- */

const loadedSets = setPaths.map(file => {
  const set = JSON.parse(fs.readFileSync(path.resolve(root, file), 'utf8'));
  set.file = path.relative(root, path.resolve(root, file));
  return set;
});

let corpusCache = null;
let corpusSource = 'demo';
if (args.corpus) {
  console.log(`Loading corpus from ${args.corpus}`);
  corpusCache = await loadCorpus(path.resolve(root, args.corpus));
  corpusSource = path.basename(args.corpus);
  if (!corpusCache.length) {
    console.error('No readable documents in the corpus directory.');
    process.exit(2);
  }
}

const allResults = [];
const reports = [];

for (const set of loadedSets) {
  const chunks = corpusCache || demoChunks();
  const index = buildIndex(chunks);
  const threshold = set.threshold ?? 0.6;
  const questions = set.questions || [];
  const results = questions.map(question => {
    const started = performance.now();
    const result = search(index, question.q, { threshold, maxSources: set.maxSources ?? 3, lang: question.lang ?? 0 });
    const elapsed = performance.now() - started;
    return {
      id: question.id,
      q: question.q,
      lang: question.lang ?? 0,
      tags: question.tags || [],
      expected: question.answerable === false ? 'refusal' : 'answer',
      ...grade(question, result),
      coverage: result.coverage ?? 0,
      ms: Math.round(elapsed * 100) / 100,
      hits: result.hits?.map(hit => hit.chunk.id) || [],
      reasonDetail: result.reason || '',
    };
  });

  const answerable = results.filter(item => item.expected === 'answer');
  const unanswerable = results.filter(item => item.expected === 'refusal');
  const correct = answerable.filter(item => item.outcome === 'correct');
  const wrong = results.filter(item => item.outcome === 'wrong-answer');
  const correctRefusals = unanswerable.filter(item => item.outcome === 'correct-refusal');
  const answered = results.filter(item => item.answered);

  const metrics = {
    total: results.length,
    answerable: answerable.length,
    unanswerable: unanswerable.length,
    correct: correct.length,
    wrong: wrong.length,
    missed: results.filter(item => item.outcome === 'missed').length,
    correctRefusals: correctRefusals.length,
    answeredCorrectRate: answerable.length ? correct.length / answerable.length : 0,
    wrongRate: answered.length ? wrong.length / answered.length : 0,
    refusalAccuracy: unanswerable.length ? correctRefusals.length / unanswerable.length : 0,
    accuracy: results.length ? (correct.length + correctRefusals.length) / results.length : 0,
    p50: percentile(results.map(item => item.ms), 50),
    p95: percentile(results.map(item => item.ms), 95),
    coverageMean: results.length ? results.reduce((sum, item) => sum + item.coverage, 0) / results.length : 0,
  };

  const calibration = ['strong', 'moderate', 'limited'].map(strength => {
    const group = results.filter(item => item.strength === strength && item.expected === 'answer');
    return {
      strength,
      n: group.length,
      correct: group.filter(item => item.outcome === 'correct').length,
      accuracy: group.length ? group.filter(item => item.outcome === 'correct').length / group.length : 0,
    };
  });

  const byTag = {};
  results.forEach(item => {
    (item.tags.length ? item.tags : ['untagged']).forEach(tag => {
      byTag[tag] = byTag[tag] || { total: 0, correct: 0 };
      byTag[tag].total += 1;
      if (item.outcome === 'correct' || item.outcome === 'correct-refusal') byTag[tag].correct += 1;
    });
  });

  reports.push({ name: set.name || set.file, source: set.corpus || corpusSource, threshold, metrics, calibration, byTag, results });
  allResults.push(...results.map(item => ({ set: set.name || set.file, ...item })));

  console.log(`\n${set.name || set.file}  (${questions.length} questions, threshold ${threshold})`);
  console.log(`  answered-correct ${(metrics.answeredCorrectRate * 100).toFixed(1)}%  wrong ${wrong.length}  missed ${metrics.missed}  refusals ${(metrics.refusalAccuracy * 100).toFixed(1)}%`);
  if (args.verbose) {
    results.forEach(item => {
      if (item.outcome !== 'correct' && item.outcome !== 'correct-refusal') {
        console.log(`   ✗ ${item.id} [${item.outcome}] ${item.q}\n     → ${item.answer || item.reasonDetail} ${item.reason ? '(' + item.reason + ')' : ''}`);
      }
    });
  }
}

const totals = allResults.reduce(
  (acc, item) => {
    acc.total += 1;
    if (item.expected === 'answer') acc.answerable += 1;
    else acc.unanswerable += 1;
    if (item.outcome === 'correct') acc.correct += 1;
    if (item.outcome === 'wrong-answer') acc.wrong += 1;
    if (item.outcome === 'missed') acc.missed += 1;
    if (item.outcome === 'correct-refusal') acc.correctRefusals += 1;
    return acc;
  },
  { total: 0, answerable: 0, unanswerable: 0, correct: 0, wrong: 0, missed: 0, correctRefusals: 0 }
);

const overall = {
  answeredCorrectRate: totals.answerable ? totals.correct / totals.answerable : 0,
  wrongRate: totals.correct + totals.wrong ? totals.wrong / (totals.correct + totals.wrong) : 0,
  refusalAccuracy: totals.unanswerable ? totals.correctRefusals / totals.unanswerable : 0,
  accuracy: totals.total ? (totals.correct + totals.correctRefusals) / totals.total : 0,
};

console.log('\nTOTAL');
console.log(`  answerable correct ${totals.correct}/${totals.answerable}  (${(overall.answeredCorrectRate * 100).toFixed(1)}%)`);
console.log(`  wrong answers      ${totals.wrong}  (${(overall.wrongRate * 100).toFixed(1)}% of answered)`);
console.log(`  correct refusals   ${totals.correctRefusals}/${totals.unanswerable}  (${(overall.refusalAccuracy * 100).toFixed(1)}%)`);
console.log(`  overall accuracy   ${(overall.accuracy * 100).toFixed(1)}%`);

const report = {
  generatedAt: new Date().toISOString(),
  corpus: corpusSource,
  thresholds: args.thresholds,
  overall,
  totals,
  sets: reports,
  results: allResults,
};

if (args.json) {
  const target = path.resolve(root, args.json);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(report, null, 2));
  console.log(`\nJSON scorecard: ${path.relative(root, target)}`);
}

if (args.md) {
  const target = path.resolve(root, args.md);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const lines = [
    '# Synoptik evidence scorecard',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Corpus: ${corpusSource}`,
    '',
    `| Metric | Value |`,
    `| --- | --- |`,
    `| Answerable correct | ${totals.correct}/${totals.answerable} (${(overall.answeredCorrectRate * 100).toFixed(1)}%) |`,
    `| Wrong answers | ${totals.wrong} (${(overall.wrongRate * 100).toFixed(1)}% of answered) |`,
    `| Correct refusals | ${totals.correctRefusals}/${totals.unanswerable} (${(overall.refusalAccuracy * 100).toFixed(1)}%) |`,
    `| Overall accuracy | ${(overall.accuracy * 100).toFixed(1)}% |`,
    '',
    '| Set | Answered-correct | Wrong | Missed | Refusals | p95 |',
    '| --- | --- | --- | --- | --- | --- |',
    ...reports.map(
      report =>
        `| ${report.name} | ${(report.metrics.answeredCorrectRate * 100).toFixed(1)}% | ${report.metrics.wrong} | ${report.metrics.missed} | ${(report.metrics.refusalAccuracy * 100).toFixed(1)}% | ${report.metrics.p95} ms |`
    ),
    '',
    '## Failures',
    '',
    '| Set | Question | Outcome | Reason |',
    '| --- | --- | --- | --- |',
    ...allResults
      .filter(item => item.outcome !== 'correct' && item.outcome !== 'correct-refusal')
      .map(item => `| ${item.set} | ${item.q.replace(/\|/g, '\\|')} | ${item.outcome} | ${(item.reason || item.reasonDetail || '').replace(/\|/g, '\\|')} |`),
    '',
  ];
  fs.writeFileSync(target, lines.join('\n'));
  console.log(`Markdown scorecard: ${path.relative(root, target)}`);
}

const passed =
  overall.answeredCorrectRate >= args.thresholds.answered &&
  overall.wrongRate <= args.thresholds.wrong &&
  overall.refusalAccuracy >= args.thresholds.refusal;

console.log(
  `\nThresholds: answered ≥ ${(args.thresholds.answered * 100).toFixed(0)}%, wrong ≤ ${(args.thresholds.wrong * 100).toFixed(0)}%, refusals ≥ ${(args.thresholds.refusal * 100).toFixed(0)}% → ${passed ? 'PASS' : 'FAIL'}`
);
process.exit(passed ? 0 : 1);
