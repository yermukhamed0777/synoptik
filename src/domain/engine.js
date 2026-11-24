/**
 * Retrieval engine.
 *
 * Pure, DOM-free functions: tokenisation and stemming, a BM25 index,
 * evidence-scored passage search with abstention, and entity/key-term
 * extraction used by the library and analytics views.
 *
 * The contract is deliberately small so the same engine can run in a Worker
 * or on a server without changes.
 */

const STOP = new Set(
  (
    'a an the is are was were be of for to in on at what which how do does did can could i you we it this that with and or there any much many my your about from by as if where when who whom ' +
    'long take takes need use used get have has offer company product products please tell me give show ' +
    'что какой какая какие какое каков каковы как где есть ли для на в и с по это у вы мне нужно можно из о об же или ' +
    'какова чём чем между при также адрес адреса address какого какую каким каких какому находится находятся расположен расположена расположены имеется подскажите скажите сколько ' +
    'қандай не қалай қайда бар ма ме па пе бе ба үшін және мен бойынша бұл ол қанша керек болады'
  ).split(/\s+/)
);

/* Domain synonyms: map inflections that BM25 would otherwise treat as
   unrelated. Kept small and explicit; no statistical guessing. */
const CANON = {
  cost: 'price', costs: 'price', pricing: 'price', prices: 'price',
  guarantee: 'warranty', refund: 'return', refunds: 'return',
  shipping: 'delivery', ship: 'delivery', shipped: 'delivery', deliver: 'delivery', delivers: 'delivery',
  стоит: 'цена', стоят: 'цена', стоимости: 'цена', стоимость: 'цена', цены: 'цена', ценам: 'цена',
  колеровать: 'колер', колеруем: 'колер', колеровка: 'колер', колеровку: 'колер', колеровки: 'колер', колеруете: 'колер',
  тұрады: 'баға', ақысы: 'құны', құны: 'құны', бағасы: 'баға', бағалар: 'баға',
};

/* Generic question words carry little evidence. They still count, but less. */
const SUFFIX = /(ейся|аяся|ийся|ыйся|ого|его|ому|ему|ыми|ими|ами|ями|ой|ая|яя|ое|ее|ые|ие|ый|ий|ом|ем|ах|ях|ов|ев|ей|ую|юю|а|я|ы|и|о|е|у|ю|ь)$/;
const MONEY = /₸|\bтг\b|тенге|руб|\$|usd|eur|€/i;
const ADDRESS = /тракт|улиц|\bул\.|проспект|просп\.|шоссе|\bдом\b|\d+\/\d+|street|\bst\.|avenue|\broad\b|көше|даңғыл/i;

const SOFT = new Set(
  (
    'срок сроки условия условие способ политика компания компании информация правила порядок процесс разница отличие отличия ' +
    'terms conditions policy process information difference way method шарт шарттар тәсіл ереже саясат айырма'
  )
    .split(/\s+/)
    .map(stem)
);

export function stem(word) {
  if (CANON[word]) word = CANON[word];
  if (/^[0-9]+$/.test(word)) return word;
  if (word.length > 5 && /[а-яё]/.test(word)) word = word.replace(SUFFIX, '') || word;
  if (/[а-яәіңғүұқөһё]/.test(word)) return word.length > 5 ? word.slice(0, 5) : word;
  return word.length > 6 ? word.slice(0, 6) : word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word;
}

export function tokenize(text, keepStop = false) {
  const raw = String(text || '')
    .toLowerCase()
    .replace(/[−–—]/g, ' ')
    .replace(/(\d)(?=\p{L})/gu, '$1 ')
    .match(/\d+[.,]\d+(?:-\d+(?:[.,]\d+)?)?|[\p{L}\p{N}]+(?:[.][0-9]+)?/gu) || [];
  return raw
    .filter(w => keepStop || ((!STOP.has(w) && w.length > 1) || /^[0-9]+$/.test(w)))
    .map(w => ({ raw: w, s: stem(w) }));
}

export const lineText = (chunk, index, lang = 0) => {
  const line = chunk.lines[index];
  return Array.isArray(line) ? line[lang] ?? line[0] : line;
};

export const allText = chunk =>
  chunk.lines.map(line => (Array.isArray(line) ? line.join(' ') : line)).join(' ');

export const lineAllText = (chunk, index) => {
  const line = chunk.lines[index];
  return Array.isArray(line) ? line.join(' ') : line;
};

/* ---------- index ---------- */

export function buildIndex(chunks) {
  const N = chunks.length;
  const df = new Map();
  const docs = [];
  let total = 0;

  chunks.forEach(chunk => {
    const tf = new Map();
    const tokens = tokenize(allText(chunk) + ' ' + (chunk.docName || ''), true);
    tokens.forEach(tok => {
      if (!STOP.has(tok.raw)) tf.set(tok.s, (tf.get(tok.s) || 0) + 1);
    });
    total += tokens.length;
    tf.forEach((_, key) => df.set(key, (df.get(key) || 0) + 1));
    docs.push({ chunk, tf, len: tokens.length });
  });

  const avg = total / Math.max(1, N);
  const idf = term => {
    const n = df.get(term) || 0;
    return Math.log(1 + (N - n + 0.5) / (n + 0.5));
  };
  return { N, docs, avg, df, idf, maxIdf: Math.log(1 + (N + 0.5) / 0.5) };
}

function bm25(index, terms) {
  const k1 = 1.2;
  const b = 0.75;
  return index.docs.map(doc => {
    let score = 0;
    terms.forEach(term => {
      const f = doc.tf.get(term);
      if (f) score += (index.idf(term) * (f * (k1 + 1))) / (f + k1 * (1 - b + (b * doc.len) / index.avg));
    });
    return { doc, score };
  });
}

/* ---------- curated demo questions ---------- */

/** Jaccard-style match of a free question against curated demo questions. */
export function matchCurated(query, curated) {
  const asked = new Set(tokenize(query).map(t => t.s));
  if (!asked.size) return null;
  let best = null;
  curated.forEach(item => {
    item.q.forEach(question => {
      const target = new Set(tokenize(question).map(t => t.s));
      let intersection = 0;
      asked.forEach(term => target.has(term) && intersection++);
      const precision = intersection / asked.size;
      const recall = intersection / target.size;
      const jaccard = precision >= 0.99 && recall >= 0.6 ? precision * recall + 1 : 0;
      if (jaccard && (!best || jaccard > best.jaccard)) best = { item, jaccard };
    });
  });
  return best ? best.item : null;
}

/* ---------- search ---------- */

const round = (value, places = 3) => Math.round(value * 10 ** places) / 10 ** places;

/**
 * Search the index and validate evidence.
 * Returns either { status: 'answer', hits, ... } or { status: 'abstain', reason, ... }.
 */
export function search(index, query, options = {}) {
  const started = performance.now();
  const opts = { threshold: 0.6, maxSources: 3, lang: 0, lineMin: 0.55, ...options };
  const tokens = tokenize(query);
  const unique = [...new Map(tokens.map(t => [t.s, t])).values()];

  if (!unique.length) {
    return { status: 'abstain', reason: 'empty', hits: [], coverage: 0, missing: [], ms: 0, scanned: index.N };
  }

  const scored = bm25(index, unique.map(t => t.s)).sort((a, b) => b.score - a.score);
  if (!scored.length) {
    return {
      status: 'abstain',
      reason: 'no-match',
      hits: [],
      related: [],
      coverage: 0,
      missing: unique.map(t => t.raw),
      ms: 0,
      scanned: 0,
    };
  }

  const top = scored[0];
  const weight = term => (index.df.get(term.s) ? index.idf(term.s) : index.maxIdf) * (SOFT.has(term.s) ? 0.3 : 1);
  const totalWeight = unique.reduce((sum, term) => sum + weight(term), 0);
  const pool = scored.filter(row => row.score > 0 && row.score >= top.score * 0.7).slice(0, 2);
  const matched = unique.filter(term => pool.some(row => row.doc.tf.has(term.s)));
  const missing = unique.filter(term => !matched.includes(term)).map(term => term.raw);
  const coverage = totalWeight ? matched.reduce((sum, term) => sum + weight(term), 0) / totalWeight : 0;
  const elapsed = performance.now() - started;
  const related = scored.filter(row => row.score > 0).slice(0, 3).map(row => row.doc.chunk);

  if (!top || top.score <= 0 || coverage < opts.threshold) {
    return {
      status: 'abstain',
      reason: top && top.score > 0 ? 'low-coverage' : 'no-match',
      hits: [],
      related,
      coverage,
      missing,
      ms: elapsed,
      scanned: index.N,
      topScore: top ? top.score : 0,
    };
  }

  const priceQuestion = /цен|стоит|стоим|price|cost|how much|баға|құны|қанша/i.test(query);
  const whereQuestion = /(^|\s)(где|where|қайда)(\s|$)|адрес|address|мекенжай/i.test(query);

  const hits = scored
    .filter(row => row.score >= top.score * 0.45)
    .slice(0, Math.max(6, opts.maxSources))
    .map(row => {
      const chunk = row.doc.chunk;
      const meta = new Set(tokenize(chunk.docName || '', true).map(t => t.s));
      const lineScores = chunk.lines
        .map((_, i) => {
          const line = lineAllText(chunk, i);
          const cut = line.includes(' | ') ? line.indexOf(' — ') : -1;
          const body = new Set(tokenize(cut > 0 ? line.slice(cut + 3) : line).map(t => t.s));
          const context = cut > 0 ? new Set(tokenize(line.slice(0, cut)).map(t => t.s)) : new Set();
          let score = 0;
          let matchedWeight = 0;

          unique.forEach(term => {
            const idf = index.df.get(term.s) ? index.idf(term.s) : 0;
            const soft = SOFT.has(term.s) ? 0.3 : 1;
            if (body.has(term.s)) {
              score += idf * soft;
              matchedWeight += weight(term);
            } else if (context.has(term.s)) {
              score += 0.4 * idf * soft;
              matchedWeight += 0.4 * weight(term);
            } else if (meta.has(term.s)) {
              matchedWeight += weight(term);
            }
          });

          if (score > 0 && priceQuestion && MONEY.test(line)) {
            score += index.maxIdf * 0.5;
            const priceTerm = unique.find(term => term.s === 'цена' || term.s === 'price' || term.s === 'баға');
            if (priceTerm && !body.has(priceTerm.s) && !context.has(priceTerm.s)) matchedWeight += weight(priceTerm);
          }
          if (score > 0 && /\d{2}\.\d{2}\.\d{4}/.test(line)) {
            const dateTerm = unique.find(term => /^(дат|date|когда|күн)/.test(term.s));
            if (dateTerm && !body.has(dateTerm.s) && !context.has(dateTerm.s)) {
              score += index.df.get(dateTerm.s) ? index.idf(dateTerm.s) : index.maxIdf * 0.5;
              matchedWeight += weight(dateTerm);
            }
          }
          if (score > 0 && whereQuestion && ADDRESS.test(line)) score += index.maxIdf * 0.6;
          return { i, score, matchedWeight, length: line.length };
        })
        .sort((a, b) => (Math.abs(b.score - a.score) > 1e-9 ? b.score - a.score : b.length - a.length) || a.i - b.i);

      return { chunk, score: row.score, lines: lineScores };
    })
    .filter(hit => hit.lines[0].score > 0);

  hits.forEach(hit => {
    hit.lineCoverage = hit.lines[0].matchedWeight / totalWeight;
  });
  hits.sort((a, b) => Math.round(b.lineCoverage * 20) - Math.round(a.lineCoverage * 20) || b.score - a.score);
  hits.length = Math.min(hits.length, opts.maxSources);

  let partial = false;
  if (hits.length) {
    const leading = hits[0].lines[0].matchedWeight / totalWeight;
    partial = leading < 0.75;
    hits.forEach(hit => {
      hit.evidenceLines = hit.lines
        .filter(line => line.score > 0)
        .slice(0, partial ? 3 : 2)
        .sort((a, b) => a.i - b.i)
        .map(line => line.i);
      hit.best = hit.lines[0];
    });
  }

  if (!hits.length) {
    return { status: 'abstain', reason: 'no-line', hits: [], related, coverage, missing, ms: elapsed, scanned: index.N };
  }

  if (partial && (priceQuestion || hits[0].lines[0].matchedWeight / totalWeight < opts.lineMin)) {
    const bestSet = new Set(tokenize(lineAllText(hits[0].chunk, hits[0].lines[0].i)).map(t => t.s));
    return {
      status: 'abstain',
      reason: priceQuestion ? 'price-partial' : 'weak-line',
      hits: [],
      related,
      coverage,
      missing: unique.filter(term => !bestSet.has(term.s)).map(term => term.raw),
      ms: elapsed,
      scanned: index.N,
    };
  }

  /* Identifier guard: a number or code in the question must occur in the
     chosen line, or we are quoting a different item. */
  const identifiers = unique.filter(term => /\d/.test(term.raw));
  if (identifiers.length) {
    const best = hits[0];
    const lineSet = new Set(
      tokenize(lineAllText(best.chunk, best.lines[0].i), true).map(t => t.s)
    );
    const bad = identifiers.filter(term => !lineSet.has(term.s));
    if (bad.length) {
      return {
        status: 'abstain',
        reason: 'identifier-mismatch',
        hits: [],
        related,
        coverage,
        missing: bad.map(term => term.raw),
        ms: elapsed,
        scanned: index.N,
      };
    }
  }

  const strength = partial ? 'limited' : coverage >= 0.85 && hits.length >= 2 ? 'strong' : coverage >= 0.7 ? 'moderate' : 'limited';
  return {
    status: 'answer',
    hits,
    coverage: round(coverage),
    missing,
    ms: Math.round((performance.now() - started) * 10) / 10,
    scanned: index.N,
    strength,
    partial,
    topScore: top.score,
    lineCov: round(hits[0].lines[0].matchedWeight / totalWeight),
  };
}

/* ---------- extraction used by library / coverage ---------- */

export function entities(chunks) {
  const products = new Map();
  const amounts = new Set();
  const percents = new Set();

  chunks.forEach(chunk => {
    const text = allText(chunk);
    (text.match(/\b[A-Z][a-z]+[A-Z][A-Za-z0-9]*(?: [A-Z][A-Za-z0-9-]+){0,2}/g) || []).forEach(product =>
      products.set(product.split(' ').slice(0, 2).join(' '), 1)
    );
    (text.match(/\d[\d ,.]*\s?₸/g) || []).slice(0, 6).forEach(money => amounts.add(money.trim()));
    (text.match(/\d+%/g) || []).forEach(percent => percents.add(percent));
  });

  return {
    products: [...products.keys()].slice(0, 8),
    amounts: [...amounts].slice(0, 6),
    percents: [...percents].slice(0, 6),
  };
}

export function keyTerms(chunks, count = 8) {
  const index = buildIndex(chunks);
  const scores = new Map();
  const raw = new Map();
  chunks.forEach(chunk =>
    tokenize(allText(chunk)).forEach(term => {
      if (/^\d/.test(term.raw) || term.raw.length < 5) return;
      scores.set(term.s, (scores.get(term.s) || 0) + index.idf(term.s));
      raw.set(term.s, term.raw);
    })
  );
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([key]) => raw.get(key));
}
