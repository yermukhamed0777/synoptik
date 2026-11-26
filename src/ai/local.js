/**
 * Optional on-device model: multilingual embeddings for semantic search and
 * Tesseract for OCR. Off by default. Nothing here requires an API key and
 * nothing is sent to a Synoptik server: the weights are fetched from a public
 * CDN on first use and cached by the browser.
 *
 * Best-effort by design. Any failure leaves the lexical (BM25) pipeline intact.
 */
import { lineText } from '../domain/engine.js';

const CDN = {
  transformers: 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1',
  model: 'Xenova/multilingual-e5-small',
  tesseract: new URL('../../vendor/tesseract.min.js', import.meta.url).href,
};

const runtime = {
  status: 'off',
  progress: 0,
  error: '',
  embedder: null,
  vectors: new Map(),
  indexing: false,
  ocr: 'idle',
};

const listeners = new Set();
const notify = () => listeners.forEach(listener => {
  try {
    listener();
  } catch {
    /* a listener must never break indexing */
  }
});

const dot = (a, b) => {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
};

async function enable() {
  if (runtime.status === 'ready' || runtime.status === 'loading') return runtime.status === 'ready';
  runtime.status = 'loading';
  runtime.progress = 0;
  runtime.error = '';
  notify();
  try {
    if (!runtime.embedder) {
      const transformers = await import(/* webpackIgnore: true */ CDN.transformers);
      const pipe = await transformers.pipeline('feature-extraction', CDN.model, {
        dtype: 'q8',
        progress_callback: progress => {
          if (progress && typeof progress.progress === 'number') {
            runtime.progress = Math.max(runtime.progress, Math.round(progress.progress));
            notify();
          }
        },
      });
      runtime.embedder = async texts => {
        const output = await pipe(texts, { pooling: 'mean', normalize: true });
        const dimensions = output.dims[output.dims.length - 1];
        return texts.map((_, i) => Float32Array.from(output.data.slice(i * dimensions, (i + 1) * dimensions)));
      };
    }
    runtime.status = 'ready';
    runtime.progress = 100;
    notify();
    return true;
  } catch (error) {
    runtime.status = 'error';
    runtime.error = String((error && error.message) || error);
    notify();
    return false;
  }
}

function disable() {
  runtime.status = 'off';
  notify();
}

const ready = () => runtime.status === 'ready' && !!runtime.embedder;

const chunkText = (chunk, lang) =>
  ((chunk.docName ? chunk.docName + '. ' : '') + (chunk.lines || []).map((_, i) => lineText(chunk, i, lang)).join(' ')).slice(0, 1400);
const cacheKey = (chunk, lang) => chunk.id + '|' + lang + '|' + (chunk.lines || []).length;

async function indexChunks(chunks, lang) {
  if (!ready() || runtime.indexing) return;
  runtime.indexing = true;
  notify();
  try {
    const todo = chunks.filter(chunk => !runtime.vectors.has(cacheKey(chunk, lang)));
    for (let i = 0; i < todo.length; i += 8) {
      const batch = todo.slice(i, i + 8);
      const vectors = await runtime.embedder(batch.map(chunk => 'passage: ' + chunkText(chunk, lang)));
      batch.forEach((chunk, j) => runtime.vectors.set(cacheKey(chunk, lang), vectors[j]));
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  } catch (error) {
    runtime.error = String((error && error.message) || error);
  }
  runtime.indexing = false;
  notify();
}

async function search(question, chunks, lang, topN = 3) {
  if (!ready()) return [];
  try {
    const [queryVector] = await runtime.embedder(['query: ' + question]);
    const rows = [];
    chunks.forEach(chunk => {
      const vector = runtime.vectors.get(cacheKey(chunk, lang));
      if (vector) rows.push({ chunk, similarity: dot(queryVector, vector) });
    });
    rows.sort((a, b) => b.similarity - a.similarity);
    const top = rows.slice(0, topN);

    for (const row of top) {
      const count = (row.chunk.lines || []).length;
      if (count <= 1) {
        row.lines = [0];
        row.bestLine = 0;
        continue;
      }
      const texts = row.chunk.lines.map((_, i) => 'passage: ' + lineText(row.chunk, i, lang));
      const vectors = await runtime.embedder(texts);
      const lineScores = vectors.map((vector, i) => ({ i, score: dot(queryVector, vector) })).sort((a, b) => b.score - a.score);
      row.bestLine = lineScores[0].i;
      row.lines = lineScores
        .filter(item => item.score >= lineScores[0].score - 0.04)
        .slice(0, 2)
        .map(item => item.i)
        .sort((a, b) => a - b);
    }
    return top;
  } catch (error) {
    runtime.error = String((error && error.message) || error);
    return [];
  }
}

/* ---------- OCR ---------- */

let tesseractPromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error('script-load'));
    document.head.appendChild(script);
  });
}

async function ocrWorker() {
  if (!window.Tesseract) await (tesseractPromise ||= loadScript(CDN.tesseract).catch(error => { tesseractPromise = null; throw error; }));
  return window.Tesseract.createWorker(['rus', 'kaz', 'eng'], 1, {
    workerPath: new URL('../../vendor/worker.min.js', import.meta.url).href, workerBlobURL: false,
    corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1',
  });
}

async function ocrPDF(buffer, onProgress, maxPages = 12) {
  runtime.ocr = 'run';
  notify();
  try {
    const pdfjs = await loadPdfJs();
    const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), isEvalSupported: false }).promise;
    const pages = Math.min(doc.numPages, maxPages);
    const worker = await ocrWorker();
    const texts = [];
    for (let pageNumber = 1; pageNumber <= pages; pageNumber++) {
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      const result = await worker.recognize(canvas);
      texts.push((result.data.text || '').trim());
      if (onProgress) onProgress(pageNumber, pages);
    }
    await worker.terminate();
    runtime.ocr = 'idle';
    notify();
    return { texts, pageCount: doc.numPages };
  } catch (error) {
    runtime.ocr = 'idle';
    notify();
    throw error;
  }
}

async function ocrImage(file) {
  runtime.ocr = 'run';
  notify();
  try {
    const worker = await ocrWorker();
    const result = await worker.recognize(file);
    await worker.terminate();
    runtime.ocr = 'idle';
    notify();
    return (result.data.text || '').trim();
  } catch (error) {
    runtime.ocr = 'idle';
    notify();
    throw error;
  }
}

export async function loadPdfJs() {
  const { loadPdfLibrary } = await import('../app/parsers.js');
  return loadPdfLibrary();
}

export const AI = {
  runtime,
  enable,
  disable,
  ready,
  indexChunks,
  search,
  ocrPDF,
  ocrImage,
  on: listener => listeners.add(listener),
  dot,
};
