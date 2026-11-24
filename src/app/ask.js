/**
 * The answer pipeline.
 *
 * Curated demo answers and live retrieval share one result shape. Live answers
 * are extractive: the sentence shown is a line from a document, never a
 * generation. When coverage is below the configured threshold, the result is
 * an abstention with the missing terms, not a softer answer.
 */
import { lineAllText, matchCurated, search } from '../domain/engine.js';
import { CORPUS } from '../domain/corpus.js';
import { AI } from '../ai/local.js';
import { allChunks, chunkById, getIndex, pick, state } from './state.js';

export const qaById = id => CORPUS.QA.find(item => item.id === id);
export const questionText = qa => pick(qa.q);

function evidenceFrom(pairs) {
  return pairs.map(([chunkId, lines]) => ({ chunk: chunkById(chunkId), lines })).filter(entry => entry.chunk);
}

export function resolveQuestion(question, qaId) {
  const started = performance.now();
  const qa =
    !state.settings.scripted ? null : qaId ? qaById(qaId) : matchCurated(question, CORPUS.QA);
  const hasUploads = state.uploads.some(upload => upload.status === 'processed');

  if (qa) {
    const evidence = evidenceFrom(qa.ev || []);
    const intact = evidence.length === (qa.ev || []).length;
    const hasDocuments = (qa.ev || []).every(([chunkId]) => chunkById(chunkId));

    if (!qa.abstain && hasDocuments && intact) {
      return {
        kind: 'curated',
        qa,
        evidence,
        strength: qa.strength,
        conflict: qa.conflict,
        ms: performance.now() - started,
        scanned: getIndex().N,
        coverage: 1,
        topic: qa.topic,
      };
    }

    if (qa.abstain && !hasUploads) {
      return {
        kind: 'abstain',
        qa,
        reason: 'curated',
        related: qa.related,
        evidence: [],
        ms: performance.now() - started,
        scanned: getIndex().N,
        coverage: 0,
        topic: qa.topic,
      };
    }
    /* Otherwise the demo document was removed or a file was added: fall through
       to live retrieval, which is the honest thing to do. */
  }

  const result = search(getIndex(), question, {
    threshold: state.settings.threshold,
    maxSources: state.settings.maxSources,
    lang: state.lang,
  });

  if (result.status === 'answer') {
    const best = result.hits[0];
    return {
      kind: 'extractive',
      q: question,
      lineCov: result.lineCov,
      partial: result.partial,
      hits: result.hits,
      evidence: result.hits.map(hit => ({ chunk: hit.chunk, lines: hit.evidenceLines })),
      strength: result.strength,
      coverage: result.coverage,
      ms: result.ms,
      scanned: result.scanned,
      missing: result.missing,
      topic: best.chunk.topic,
    };
  }

  const relatedDocuments = [...new Set((result.related || []).map(chunk => chunk.doc))];
  return {
    kind: 'abstain',
    reason: result.reason,
    related: qa?.abstain ? qa.related : relatedDocuments,
    qa: qa && qa.abstain ? qa : null,
    missing: result.missing,
    coverage: result.coverage,
    ms: result.ms,
    scanned: result.scanned,
    evidence: [],
    topic: qa?.topic || 'general',
  };
}

export async function resolveQuestionAsync(question, qaId) {
  const result = resolveQuestion(question, qaId);
  if (!(state.settings.ai && AI.ready())) return result;
  if (result.kind !== 'abstain' || result.reason === 'curated') return result;

  const started = performance.now();
  const threshold = state.settings.semThreshold;
  const chunks = allChunks();
  await AI.indexChunks(chunks, state.lang);
  const top = await AI.search(question, chunks, state.lang, 3);
  if (!top.length) return result;

  result.sem = { similarity: top[0].similarity, threshold };
  const good = top.filter(item => item.similarity >= threshold && item.lines && item.lines.length);
  if (!good.length) {
    result.ms += performance.now() - started;
    return result;
  }

  const hits = good.map(item => ({
    chunk: item.chunk,
    lines: item.lines,
    score: item.similarity,
    best: { i: item.bestLine ?? item.lines[0] },
  }));
  return {
    kind: 'extractive',
    q: question,
    partial: true,
    semantic: true,
    hits,
    evidence: hits.map(hit => ({ chunk: hit.chunk, lines: hit.lines })),
    strength: 'limited',
    coverage: top[0].similarity,
    ms: result.ms + performance.now() - started,
    scanned: chunks.length,
    missing: [],
    topic: good[0].chunk.topic,
    sem: result.sem,
  };
}

/** Build the short answer shown in the card. For live answers this is verbatim. */
export function composeDirect(result) {
  if (result.kind === 'curated') {
    return { direct: pick(result.qa.direct), details: (result.qa.details || []).map(pick) };
  }
  if (result.kind === 'extractive') {
    const first = result.hits[0];
    const lineIndex = first.best?.i ?? first.lines[0];
    let direct = lineAllText(first.chunk, lineIndex).trim();
    if (direct.length > 460) direct = direct.slice(0, 457).replace(/\s+\S*$/, '') + '…';
    const details = [];
    result.hits.forEach(hit => {
      hit.lines.forEach(index => {
        if (hit === first && index === lineIndex) return;
        if (details.length < 2) details.push(lineAllText(hit.chunk, index));
      });
    });
    return { direct, details };
  }
  if (result.kind === 'remote') return { direct: result.direct, details: result.details || [] };
  return { direct: '', details: [] };
}

export function plainAnswer(turn, t, cite) {
  const result = turn.result;
  const composed = composeDirect(result);
  if (result.kind === 'abstain') {
    return `${turn.q}\n\n${t('abst.title')}\n${result.qa ? pick(result.qa.why) : t('abst.generic')}`;
  }
  return [
    turn.q,
    '',
    composed.direct,
    ...composed.details.map(detail => '• ' + detail),
    '',
    t('ans.evidence') + ':',
    ...result.evidence.map((evidence, index) => `[${index + 1}] ${cite(evidence.chunk)}`),
  ].join('\n');
}

export async function remoteAsk(question) {
  const response = await fetch(state.settings.endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question, language: ['en', 'ru', 'kk'][state.lang], threshold: state.settings.threshold }),
  });
  if (!response.ok) throw new Error('HTTP ' + response.status);
  const payload = await response.json();
  const citations = Array.isArray(payload.citations) ? payload.citations : [];
  if (payload.status === 'abstain' || !payload.answer || !citations.length) {
    return {
      kind: 'abstain',
      reason: 'remote',
      related: [],
      evidence: [],
      ms: payload.ms || 0,
      scanned: payload.scanned,
      coverage: 0,
      topic: 'general',
      qa: null,
      missing: [],
    };
  }
  const evidence = citations.map((citation, index) => ({
    chunk: { id: 'r' + index, doc: 'r' + index, loc: {}, lines: [citation.excerpt || ''], topic: 'remote', remote: citation },
    lines: [0],
  }));
  return {
    kind: 'remote',
    direct: payload.answer,
    details: payload.details || [],
    evidence,
    strength: payload.strength || 'moderate',
    ms: payload.ms || 0,
    scanned: payload.scanned,
    coverage: payload.coverage ?? 1,
    topic: 'general',
  };
}
