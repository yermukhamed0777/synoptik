/**
 * Client state and corpus bookkeeping.
 *
 * Everything lives in localStorage under a single versioned key. There is no
 * server, no account and no telemetry. Uploaded files never leave the tab.
 */
import { buildIndex, tokenize, keyTerms } from '../domain/engine.js';
import { CORPUS } from '../domain/corpus.js';
import { DICTS, LANGS } from '../i18n/index.js';
import { BRAND } from '../brand.js';
import { AI } from '../ai/local.js';

export { LANGS };

export const STORE_KEY = 'synoptik.state.v1';
export const DAY = 864e5;

const DEFAULTS = () => ({
  lang: 0,
  theme: 'system',
  onboarded: false,
  history: [],
  gaps: [],
  feedback: {},
  removed: [],
  uploads: [],
  liveTop: {},
  settings: {
    threshold: 0.6,
    maxSources: 3,
    details: true,
    endpoint: '',
    useDemo: true,
    scripted: true,
    ai: false,
    semThreshold: 0.86,
  },
});

function readStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return DEFAULTS();
    const parsed = JSON.parse(raw);
    const base = DEFAULTS();
    return {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...(parsed.settings || {}) },
    };
  } catch {
    return DEFAULTS();
  }
}

export const state = readStore();
if (![0, 1, 2].includes(state.lang)) state.lang = 0;

/** Small surface the UI registers at boot, so state never imports the DOM. */
export const hooks = {
  refresh() {},
  toast() {},
};

export function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/* ---------- translation ---------- */

export function t(key, ...args) {
  const row = DICTS[state.lang]?.[key] ?? DICTS[0][key];
  if (row == null) return key;
  return args.length ? String(row).replace(/\{(\d)\}/g, (_, index) => args[Number(index)] ?? '') : row;
}

export const pick = row => (Array.isArray(row) ? row[state.lang] ?? row[0] : row);

export function setLang(index) {
  state.lang = index;
  save();
}

/* ---------- derived lists ---------- */

let index = null;

export const demoDocs = () => CORPUS.DOCS;
export const curatedQuestions = () => CORPUS.QA;

export function docList() {
  const demo = CORPUS.DOCS.filter(doc => state.settings.useDemo && !state.removed.includes(doc.id)).map(doc => ({
    id: doc.id,
    name: doc.name,
    type: doc.type,
    size: doc.size,
    ts: Date.now() - doc.ago * DAY,
    status: 'processed',
    progress: 100,
    demo: true,
    pages: doc.pages,
    sheets: doc.sheets,
    rows: doc.rows,
    category: doc.cat,
    chunks: CORPUS.CHUNKS.filter(chunk => chunk.doc === doc.id).length,
  }));
  const uploads = state.uploads.map(upload => ({ ...upload, chunks: upload.chunks ? upload.chunks.length : 0 }));
  return [...uploads.slice().reverse(), ...demo];
}

export function docById(id) {
  const demo = CORPUS.DOCS.find(doc => doc.id === id);
  if (demo) {
    return {
      id: demo.id,
      name: demo.name,
      type: demo.type,
      size: demo.size,
      ts: Date.now() - demo.ago * DAY,
      pages: demo.pages,
      sheets: demo.sheets,
      rows: demo.rows,
      demo: true,
      category: demo.cat,
    };
  }
  return state.uploads.find(upload => upload.id === id);
}

export function allChunks() {
  const chunks = [];
  if (state.settings.useDemo) {
    CORPUS.CHUNKS.forEach(chunk => {
      if (!state.removed.includes(chunk.doc)) chunks.push(chunk);
    });
  }
  state.uploads.forEach(upload => {
    if (upload.status === 'processed') (upload.chunks || []).forEach(chunk => chunks.push(chunk));
  });

  chunks.forEach(chunk => {
    if (chunk.docName === undefined) {
      const doc = docById(chunk.doc);
      chunk.docName = doc ? doc.name.replace(/[_.]/g, ' ') + ' ' + (chunk.loc?.sheet || '') : '';
    }
  });
  return chunks;
}

export function chunkById(id) {
  return allChunks().find(chunk => chunk.id === id);
}

export function docChunks(id) {
  return allChunks().filter(chunk => chunk.doc === id);
}

export function rebuild() {
  index = buildIndex(allChunks());
  if (state.settings.ai && AI.ready()) {
    AI.indexChunks(allChunks(), state.lang);
  }
}

export const getIndex = () => index;
export const indexSize = () => (index ? index.N : 0);

export function locLabel(loc) {
  if (!loc) return '';
  if (loc.page) return t('loc.page', loc.page);
  if (loc.sheet) return t('loc.sheet', loc.sheet, loc.rows);
  if (loc.section) return t('loc.section', loc.section);
  if (loc.rows) return t('loc.rows', loc.rows);
  if (loc.lines) return t('loc.lines', loc.lines);
  if (loc.para) return t('loc.para', loc.para);
  return '';
}

export function citeStr(chunk) {
  const doc = docById(chunk.doc);
  return `${doc ? doc.name : '?'} — ${locLabel(chunk.loc)}`;
}

/* ---------- ask bookkeeping ---------- */

export function normKey(question) {
  return tokenize(question).map(token => token.s).sort().join(' ');
}

export function logResult(turn) {
  const result = turn.result;
  const abstained = result.kind === 'abstain';
  const entry = {
    id: 'h' + Date.now() + Math.random().toString(36).slice(2, 5),
    ts: Date.now(),
    q: turn.q,
    qa: result.qa ? result.qa.id : null,
    status: abstained ? 'abstain' : 'answer',
    ms: Math.round(result.ms * 10) / 10,
  };
  state.history.unshift(entry);
  state.history = state.history.slice(0, 200);

  const key = result.qa ? result.qa.id : normKey(turn.q);
  if (!abstained) {
    const previous = state.liveTop[key] || { n: 0 };
    state.liveTop[key] = { n: previous.n + 1, q: turn.q, qa: result.qa ? result.qa.id : null };
  } else if (result.reason !== 'comparison') {
    const existing = state.gaps.find(gap => (gap.qa && gap.qa === entry.qa) || (!gap.qa && gap.key === key));
    if (existing) {
      existing.count += 1;
      existing.ts = Date.now();
      existing.missing = result.missing;
      existing.reasonKind = result.reason;
      existing.related = result.related;
      if (existing.status === 'resolved') existing.status = 'open';
    } else {
      state.gaps.unshift({
        id: 'g' + Date.now(),
        qa: entry.qa,
        key,
        q: entry.qa ? null : turn.q,
        ts: Date.now(),
        count: 1,
        status: 'open',
        missing: result.missing,
        reasonKind: result.reason,
        related: result.related,
      });
    }
  }
  save();
}

/* ---------- uploads ---------- */

export const MAX_BYTES = 30 * 1048576;
export const files = new Map();

const SAMPLE = [
  `International shipping. ${BRAND.demoCompany} delivers to Russia, Uzbekistan and other countries by road freight. Delivery to other countries takes 10–14 business days. Customs duties are paid by the buyer.`,
  `Международная доставка. ${BRAND.demoCompany} доставляет в Россию, Узбекистан и другие страны автотранспортом. Доставка в другие страны занимает 10–14 рабочих дней. Таможенные пошлины оплачивает покупатель.`,
  `Халықаралық жеткізу. ${BRAND.demoCompany} Ресейге, Өзбекстанға және басқа елдерге автокөлікпен жеткізеді. Басқа елдерге жеткізу 10–14 жұмыс күнін алады. Кедендік алымдарды сатып алушы төлейді.`,
].join('\n\n');

export function addSample() {
  const file = new File([SAMPLE], 'International_Shipping.txt', { type: 'text/plain' });
  return processUpload(file);
}

const EXT = { pdf: 'pdf', docx: 'docx', txt: 'txt', csv: 'csv', xlsx: 'xlsx', md: 'txt', png: 'img', jpg: 'img', jpeg: 'img', webp: 'img' };

export async function processUpload(file, existingId) {
  const { parseFile, ocrExtract } = await import('./parsers.js');
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const type = EXT[ext];
  let doc = existingId && state.uploads.find(upload => upload.id === existingId);

  if (!doc) {
    doc = {
      id: 'u' + Date.now() + Math.random().toString(36).slice(2, 5),
      name: file.name,
      type: type || ext || 'file',
      size: file.size,
      ts: Date.now(),
      status: 'processing',
      progress: 5,
      stage: 'validate',
      demo: false,
      category: [t('lib.uploaded'), t('lib.uploaded'), t('lib.uploaded')],
      chunks: [],
    };
    state.uploads.push(doc);
  }

  Object.assign(doc, { status: 'processing', progress: 5, stage: 'validate', error: null });
  files.set(doc.id, file);
  hooks.refresh();

  const step = async (progress, stage) => {
    doc.progress = progress;
    doc.stage = stage;
    hooks.refresh();
    await new Promise(resolve => setTimeout(resolve, 180));
  };

  try {
    await step(12, 'validate');
    if (!type) throw { code: 'unsupported' };
    if (!file.size) throw { code: 'empty' };
    if (file.size > MAX_BYTES) throw { code: 'toobig' };

    await step(35, 'extract');
    let parsed;
    try {
      parsed = await parseFile(file, type);
    } catch (error) {
      if (error.message !== 'pdf-text') throw { code: 'parse' };
      if (!state.settings.ai) throw { code: type === 'img' ? 'needocr' : 'pdftext' };
      doc.stage = 'ocr';
      hooks.refresh();
      try {
        parsed = await ocrExtract(file, type, (done, total) => {
          doc.progress = 35 + Math.round((25 * done) / total);
          hooks.refresh();
        });
      } catch (inner) {
        throw { code: inner.message === 'ocr-empty' ? 'ocrempty' : 'ocrfail' };
      }
    }

    await step(65, 'chunk');
    if (!parsed.chunks.length) throw { code: 'nochunks' };

    doc.chunks = parsed.chunks.map((chunk, i) => ({
      ...chunk,
      id: `${doc.id}-${i + 1}`,
      doc: doc.id,
      topic: 'uploaded',
    }));
    Object.assign(doc, parsed.info);
    doc.chars = doc.chunks.reduce((sum, chunk) => sum + chunk.lines.join(' ').length, 0);

    await step(88, 'index');
    doc.status = 'processed';
    doc.progress = 100;
    doc.stage = 'done';
    rebuild();
    hooks.toast(t('toast.processed', doc.name, doc.chunks.length));
  } catch (error) {
    doc.status = 'failed';
    doc.progress = 100;
    doc.error = error.code || 'parse';
    doc.chunks = [];
    hooks.toast(t('toast.failed', doc.name), 'error');
  }

  if (!save()) hooks.toast(t('toast.storage'), 'error');
  hooks.refresh();
}

/* ---------- suggestions ---------- */

export function genSuggestions() {
  const uploaded = allChunks().filter(chunk => chunk.topic === 'uploaded');
  if (!uploaded.length) return [];
  const headers = new Set();
  uploaded.forEach(chunk =>
    (chunk.lines || []).forEach(line => {
      const text = Array.isArray(line) ? line.join(' ') : line;
      (text.match(/(?:^|\| )([^:|]{2,30}):/g) || []).forEach(match =>
        match
          .replace(/[|:]/g, '')
          .toLowerCase()
          .split(/[^\p{L}\d]+/u)
          .forEach(word => word && headers.add(word))
      );
    })
  );
  return keyTerms(uploaded, 14)
    .filter(word => !headers.has(String(word).toLowerCase()))
    .slice(0, 4)
    .map(word => t('ask.sug', word));
}

/* ---------- reset ---------- */

export function resetWorkspace() {
  const fresh = DEFAULTS();
  fresh.onboarded = true;
  Object.keys(state).forEach(key => delete state[key]);
  Object.assign(state, fresh);
  save();
  rebuild();
}

rebuild();
