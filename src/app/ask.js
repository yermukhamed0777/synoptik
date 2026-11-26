/**
 * The answer pipeline.
 *
 * Curated demo answers and live retrieval share one result shape. Live answers
 * are extractive: the sentence shown is a line from a document, never a
 * generation. When coverage is below the configured threshold, the result is
 * an abstention with the missing terms, not a softer answer.
 */
import { lineText, matchCurated, search } from '../domain/engine.js';
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
      hits: result.hits.map(({chunk, best, evidenceLines}) => ({chunk, best, lines: evidenceLines})),
      evidence: result.hits.map(hit => ({ chunk: hit.chunk, lines: hit.evidenceLines })),
      strength: result.strength,
      coverage: result.coverage,
      conflict: result.conflict,
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

  // Semantic neighbours can suggest related documents, but cannot certify an answer.
  result.related = [...new Set([...result.related, ...good.map(item => item.chunk.doc)])];
  result.ms += performance.now() - started;
  return result;
}

/** Build the short answer shown in the card. For live answers this is verbatim. */
export function composeDirect(result) {
  if (result.kind === 'curated') {
    return { direct: pick(result.qa.direct), details: (result.qa.details || []).map(pick) };
  }
  if (result.kind === 'extractive') {
    const first = result.hits[0];
    const lineIndex = first.best?.i ?? first.lines[0];
    let direct = lineText(first.chunk, lineIndex, state.lang).trim();
    if (direct.length > 460) direct = direct.slice(0, 457).replace(/\s+\S*$/, '') + '…';
    const details = [];
    result.hits.forEach(hit => {
      hit.lines.forEach(index => {
        if (hit === first && index === lineIndex) return;
        const text = lineText(hit.chunk, index, state.lang)?.trim();
        if (text && text !== lineText(first.chunk, lineIndex, state.lang).trim() && !details.includes(text) && details.length < 2) details.push(text);
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

export function validEndpoint(value) {
  try {
    const url = new URL(value);
    return !url.username && !url.password && !url.hash &&
      (url.protocol === 'https:' || (url.protocol === 'http:' && ['127.0.0.1','localhost'].includes(url.hostname)));
  } catch { return false; }
}

export async function remoteAsk(question) {
  const start = performance.now();
  const refusal = () => ({kind:'abstain', reason:'remote', related:[], evidence:[], missing:[], coverage:0, scanned:0, ms:performance.now()-start, topic:'general'});
  if (!validEndpoint(state.settings.endpoint) || question.length > 8192) return refusal();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(state.settings.endpoint, {
      method:'POST', credentials:'omit', redirect:'error', referrerPolicy:'no-referrer',
      signal:controller.signal, headers:{'content-type':'application/json'},
      body:JSON.stringify({question, language:['en','ru','kk'][state.lang], threshold:state.settings.threshold}),
    });
    if (!response.ok || Number(response.headers.get('content-length')) > 65536) return refusal();
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8',{fatal:true});
    let size = 0, body = '';
    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 65536) return refusal();
      body += decoder.decode(value,{stream:true});
    }
    const p = JSON.parse(body + decoder.decode());
    const valid = (s, limit) => typeof s === 'string' && s.trim().length > 0 && s.length <= limit;
    const {details = [], strength = 'moderate', scanned = 0, coverage = 1} = p;
    if (p.status !== 'answer' || !valid(p.answer,8192) || !Array.isArray(details) || details.length > 12 ||
      !details.every(s => valid(s,4096)) || !['strong','moderate','limited'].includes(strength) ||
      !Number.isSafeInteger(scanned) || scanned < 0 || !Number.isFinite(coverage) || coverage < 0 || coverage > 1 ||
      !Array.isArray(p.citations) || !p.citations.length || p.citations.length > 16 ||
      !p.citations.every(c => c && valid(c.doc,512) && valid(c.location,512) && valid(c.excerpt,8192))) return refusal();
    const evidence = p.citations.map((c,i) => ({
      chunk:{id:'remote-'+i, doc:'remote-'+i, docName:c.doc, loc:{remote:c.location}, lines:[c.excerpt], topic:'remote'}, lines:[0]
    }));
    return {kind:'remote', direct:p.answer, details, strength, scanned, coverage, evidence, ms:performance.now()-start, topic:'general'};
  } catch { return refusal(); }
  finally { clearTimeout(timeout); controller.abort(); }
}
