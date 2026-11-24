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
    'long take takes need use used get have has offer company product products please tell me give show should would may might must go goes going gone using uses under file between window recommend recommended recommendation ' +
    'что какой какая какие какое каков каковы как где есть ли для на в и с по это у вы мне нужно можно из о об же или ' +
    'какова чём чем между при также адрес адреса address какого какую каким каких какому находится находятся расположен расположена расположены имеется подскажите скажите сколько идёт идет подача подачи подать ' +
    'қандай не қалай қайда бар ма ме па пе бе ба үшін және мен бойынша бұл ол қанша керек болады алады бола болу өнім қолдану қолдануға басқан арасында арасындағы ұсынылатын'
  ).split(/\s+/)
);

/* Domain concepts. Mapping to one canonical concept across languages is what
   lets a Russian question retrieve an English passage (and vice versa) without
   an embedding model. Kept explicit and small on purpose. */
const CANON = {
  cost: 'price', costs: 'price', pricing: 'price', prices: 'price',
  guarantee: 'warranty', refund: 'return', refunds: 'return',
  shipping: 'delivery', ship: 'delivery', shipped: 'delivery', deliver: 'delivery', delivers: 'delivery',
  цена: 'price', цены: 'price', ценам: 'price', цене: 'price', цену: 'price', ценой: 'price',
  стоимости: 'price', стоимость: 'price', стоят: 'price', стоит: 'price',
  баға: 'price', бағасы: 'price', бағалар: 'price', құны: 'price', тұрады: 'price',
  доставка: 'delivery', доставки: 'delivery', доставку: 'delivery', жеткізу: 'delivery', жеткізеді: 'delivery',
  гарантия: 'warranty', гарантии: 'warranty', гарантию: 'warranty', кепілдік: 'warranty',
  возврат: 'return', возврата: 'return', қайтару: 'return',
  скидка: 'discount', скидки: 'discount', жеңілдік: 'discount',
  колеровать: 'колер', колеруем: 'колер', колеровка: 'колер', колеровку: 'колер', колеровки: 'колер', колеруете: 'колер',
  tint: 'tint', tints: 'tint', tinted: 'tint', tinting: 'tint', colouring: 'tint', coloring: 'tint',
  primer: 'prime', primers: 'prime', priming: 'prime', primed: 'prime', primes: 'prime',
  rusty: 'rust', rusted: 'rust', rusting: 'rust',
  painted: 'paint', painting: 'paint', paints: 'paint',
  claims: 'claim', cans: 'can', damaged: 'damage',
  steel: 'metal', iron: 'metal',
  сталь: 'metal', стали: 'metal', железо: 'metal', металл: 'metal', металла: 'metal', металға: 'metal',
  болат: 'metal', темір: 'metal', темірге: 'metal',
  ржавчина: 'rust', ржавого: 'rust', ржавый: 'rust', тот: 'rust', тоттану: 'rust', тоттанған: 'rust', тат: 'rust',
  bathroom: 'bath', ванной: 'bath', ванная: 'bath', ванных: 'bath', жуынатын: 'bath',
  room: 'room', бөлме: 'room', бөлмеде: 'room', бөлмелерде: 'room',
  айырмашылық: 'айырма', тәсілі: 'тәсіл', жағудың: 'жағу',
};

/* Measurement units and currencies collapse to one token so that
   "10 литров", "10 litre" and "10 L" are the same quantity. */
const UNITS = new Map(
  Object.entries({
    л: 'l', литр: 'l', литра: 'l', литров: 'l', литре: 'l', литры: 'l',
    litre: 'l', litres: 'l', liter: 'l', liters: 'l',
    кг: 'kg', килограмм: 'kg', килограмма: 'kg', килограммов: 'kg',
    kilogram: 'kg', kilograms: 'kg', kilo: 'kg', kilos: 'kg',
    м2: 'm2', 'м²': 'm2', m2: 'm2', 'm²': 'm2',
    тг: 'tenge', тенге: 'tenge', kzt: 'tenge',
    руб: 'rub', рубль: 'rub', рублей: 'rub', ruble: 'rub', rubles: 'rub',
  })
);

/* Cyrillic inflection stripping. Kazakh is agglutinative, so after removing a
   case ending we also cap the root length; Russian works the same way in
   practice for the vocabulary this product sees. */
const CYR_SUFFIXES = [
  'иями', 'ями', 'ами', 'ыми', 'ими', 'ого', 'его', 'ому', 'ему', 'ыми',
  'ов', 'ев', 'ий', 'ый', 'ая', 'ое', 'ые', 'ие', 'ую', 'юю', 'ах', 'ях', 'ом', 'ем', 'ой', 'ей',
  'ді', 'ды', 'ге', 'ға', 'ке', 'қа', 'ны', 'ні', 'лы', 'лі', 'сы', 'сі', 'ын', 'ін',
  'а', 'я', 'ы', 'и', 'о', 'е', 'у', 'ю', 'ь', 'і',
].sort((a, b) => b.length - a.length);

const CYRILLIC = /[а-яёәіңғүұқөһ]/;
const TRANSLIT = {
  а: 'a', ә: 'a', б: 'b', в: 'v', г: 'g', ғ: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'i', к: 'k', қ: 'k', л: 'l', м: 'm', н: 'n', ң: 'n', о: 'o', ө: 'o', п: 'p',
  р: 'r', с: 's', т: 't', у: 'u', ү: 'u', ұ: 'u', ф: 'f', х: 'kh', һ: 'h', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', і: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

function cyrillicStem(word) {
  if (word.length <= 4) return word;
  for (const suffix of CYR_SUFFIXES) {
    if (word.endsWith(suffix) && word.length - suffix.length >= 4) {
      let root = word.slice(0, -suffix.length);
      /* бетонного -> бетонн -> бетон: collapse a doubled final consonant */
      if (/([бвгджзклмнпрстфхцчшщ])\1$/.test(root)) root = root.slice(0, -1);
      return root;
    }
  }
  return word;
}

export function transliterate(word) {
  let output = '';
  for (const char of word) output += TRANSLIT[char] ?? char;
  return output;
}

function englishStem(word) {
  if (word.length > 4 && word.endsWith('ies')) return word.slice(0, -3) + 'y';
  if (word.length > 5 && word.endsWith('ing')) {
    let base = word.slice(0, -3);
    if (/([b-df-hj-np-tv-z])\1$/.test(base)) base = base.slice(0, -1);
    return base;
  }
  if (word.length > 4 && word.endsWith('ed')) {
    let base = word.slice(0, -2);
    if (/([b-df-hj-np-tv-z])\1$/.test(base)) base = base.slice(0, -1);
    return base;
  }
  if (word.length > 4 && word.endsWith('es')) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

export function stem(word) {
  let value = String(word || '').toLowerCase();
  if (CANON[value]) value = CANON[value];
  if (/^[0-9]+$/.test(value)) return value;
  if (CYRILLIC.test(value)) {
    const root = cyrillicStem(value);
    return transliterate(root.length > 6 ? root.slice(0, 6) : root);
  }
  return englishStem(value);
}

export function tokenize(text, keepStop = false) {
  const raw = String(text || '')
    .toLowerCase()
    .replace(/[−–—]/g, ' ')
    .replace(/(\d)(?=\p{L})/gu, '$1 ')
    .match(/\d+[.,]\d+(?:-\d+(?:[.,]\d+)?)?|[\p{L}\p{N}]+(?:[.][0-9]+)?/gu) || [];
  return raw
    .filter(w => keepStop || ((!STOP.has(w) && w.length > 1) || /^[0-9]+$/.test(w)))
    .map(w => ({ raw: w, s: UNITS.get(w) || stem(w) }));
}

export const lineText = (chunk, index, lang = 0) => {
  const line = chunk.lines[index];
  return Array.isArray(line) ? line[lang] ?? line[0] : line;
};

const MONEY = /₸|\bтг\b|тенге|руб|\$|usd|eur|€/i;
const ADDRESS = /тракт|улиц|\bул\.|проспект|просп\.|шоссе|\bдом\b|\d+\/\d+|street|\bst\.|avenue|\broad\b|көше|даңғыл/i;

/* Generic question words carry little evidence. They still count, but less. */
const SOFT = new Set(
  (
    'срок сроки условия условие способ политика компания компании информация правила порядок процесс разница отличие отличия ' +
    'terms conditions policy process information difference way method шарт шарттар тәсіл ереже саясат айырма'
  )
    .split(/\s+/)
    .map(stem)
);

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
      term.keys.forEach((key, position) => {
        const frequency = doc.tf.get(key);
        if (!frequency) return;
        const aliasWeight = position === 0 ? 1 : 0.65;
        score += (aliasWeight * index.idf(key) * (frequency * (k1 + 1))) / (frequency + k1 * (1 - b + (b * doc.len) / index.avg));
      });
    });
    return { doc, score };
  });
}

/* Typo tolerance: only for query terms with no exact vocabulary match, only for
   words long enough to be informative, and only one or two edits. Candidates
   are scored at 65% in BM25 and can satisfy coverage, never the identifier
   guard. */
function editDistance(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 0; i < rows; i++) matrix[i][0] = i;
  for (let j = 0; j < cols; j++) matrix[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return matrix[a.length][b.length];
}

function fuzzyKeys(index, key) {
  if (index.df.has(key) || key.length < 5 || /^\d+$/.test(key)) return [];
  const limit = key.length >= 8 ? 2 : 1;
  const matches = [];
  for (const [candidate, frequency] of index.df) {
    if (!frequency) continue;
    if (candidate[0] !== key[0]) continue;
    const lengthDelta = Math.abs(candidate.length - key.length);
    const prefix = Math.min(candidate.length, key.length) >= 5 && lengthDelta <= 6 && (candidate.startsWith(key) || key.startsWith(candidate));
    if (lengthDelta > limit && !prefix) continue;
    const distance = editDistance(key, candidate);
    if ((distance > 0 && distance <= limit) || prefix) {
      matches.push({ candidate, distance: prefix ? 1 : distance, frequency });
    }
  }
  matches.sort((a, b) => a.distance - b.distance || b.frequency - a.frequency);
  return matches.slice(0, 2).map(match => match.candidate);
}

/* ---------- conflicting evidence ---------- */

const MONEY_VALUE = /(\d[\d\s.,]*)\s*(?:₸|тг\b|тенге\b|kzt\b)/i;

const parseAmount = text => {
  const match = text.match(MONEY_VALUE);
  if (!match) return null;
  const value = Number(match[1].replace(/[^\d]/g, ''));
  return Number.isFinite(value) && value > 0 ? value : null;
};

function documentAuthority(chunk) {
  const name = String(chunk.docName || '').toLowerCase();
  if (/price|прайс|баға/.test(name)) return 3;
  if (/catalog|каталог/.test(name)) return 2;
  if (/faq|policy|саясат|политик|warranty|delivery|return/.test(name)) return 1;
  return 2;
}

/** Document class inferred from its name; used to route an intent to the
 *  document that should own the answer (a delivery question goes to the
 *  delivery policy before a price list). */
export function documentKind(chunk) {
  const name = String(chunk.docName || '').toLowerCase();
  if (/price|прайс|баға/.test(name)) return 'price';
  if (/spec|техническ|сипаттама/.test(name)) return 'spec';
  if (/compat|совместим|үйлесім/.test(name)) return 'compat';
  if (/deliver|доставк|жеткіз/.test(name)) return 'delivery';
  if (/warrant|гарант|кепілдік/.test(name)) return 'warranty';
  if (/return|возврат|қайтару/.test(name)) return 'return';
  if (/faq/.test(name)) return 'faq';
  if (/catalog|каталог/.test(name)) return 'catalog';
  return 'other';
}

function queryIntent(query) {
  const checks = [
    ['price', /price|cost|how much|стоимост|цена|цены|баға|құны|тұрады/i],
    ['delivery', /deliver|shipping|доставк|жеткіз/i],
    ['warranty', /warrant|гарант|кепілдік/i],
    ['return', /return|возврат|қайтару/i],
    ['compat', /compat|совместим|үйлесім|primer|праймер/i],
    ['spec', /spec|coverage|расход|температур|application|нанесен|жағу|сипаттама/i],
    ['discount', /discount|скидк|жеңілдік/i],
  ];
  for (const [kind, pattern] of checks) if (pattern.test(query)) return kind;
  return null;
}

/**
 * For price questions, detect two documents quoting different amounts for the
 * same product. Prefer the price list over a catalog. This is deliberately
 * conservative: it needs a shared product term and an explicit currency.
 */
function detectPriceConflict(index, productTerms) {
  if (!productTerms.length) return null;
  const groups = new Map();

  index.docs.forEach(row => {
    const chunk = row.chunk;
    const chunkKeys = new Set(tokenize(allText(chunk), true).map(token => token.s));
    const productHits = productTerms.filter(term => term.keys.some(key => chunkKeys.has(key))).length;
    if (!productHits) return;

    const productLines = chunk.lines
      .map((_, index) => index)
      .filter(index => {
        const lineKeys = new Set(tokenize(lineAllText(chunk, index), true).map(token => token.s));
        return productTerms.some(term => term.keys.some(key => lineKeys.has(key)));
      });

    let best = null;
    chunk.lines.forEach((_, index) => {
      const value = parseAmount(lineAllText(chunk, index));
      if (value == null) return;
      const lineKeys = new Set(tokenize(lineAllText(chunk, index), true).map(token => token.s));
      const overlap = productTerms.filter(term => term.keys.some(key => lineKeys.has(key))).length;
      const distance = productLines.length ? Math.min(...productLines.map(productLine => Math.abs(productLine - index))) : 9;
      const score = overlap * 10 - distance;
      if (!best || score > best.score) best = { line: index, value, score };
    });
    if (!best) return;

    const previous = groups.get(chunk.doc);
    if (!previous || best.score > previous.score) {
      groups.set(chunk.doc, {
        chunk,
        line: best.line,
        value: best.value,
        score: best.score,
        authority: documentAuthority(chunk),
      });
    }
  });

  const candidates = [...groups.values()].filter(group => group.value > 0 && group.authority >= 2);
  if (candidates.length < 2) return null;
  candidates.sort((a, b) => b.authority - a.authority || b.score - a.score);
  const used = candidates[0];
  const other = candidates.find(group => group.value !== used.value);
  if (!other) return null;

  const describe = group => ({
    doc: group.chunk.doc,
    chunk: group.chunk.id,
    docName: group.chunk.docName,
    line: group.line,
    value: group.value,
  });

  return { used: describe(used), other: describe(other) };
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
  const opts = { threshold: 0.6, maxSources: 3, lang: 0, lineMin: 0.34, ...options };
  const tokens = tokenize(query);
  const baseUnique = [...new Map(tokens.map(token => [token.s, token])).values()];
  const unique = baseUnique.map(term => ({
    ...term,
    /* A one-word question has no context to disambiguate a fuzzy match.
       Exact vocabulary only, or refuse. */
    keys: [term.s, ...(baseUnique.length > 1 ? fuzzyKeys(index, term.s) : [])],
  }));

  if (!unique.length) {
    return { status: 'abstain', reason: 'empty', hits: [], coverage: 0, missing: [], ms: 0, scanned: index.N };
  }

  const scored = bm25(index, unique);
  const intent = queryIntent(query);
  if (intent) {
    scored.forEach(row => {
      if (documentKind(row.doc.chunk) === intent) row.score *= 1.4;
    });
  }
  scored.sort((a, b) => b.score - a.score);
  if (!scored.length) {
    return {
      status: 'abstain',
      reason: 'no-match',
      hits: [],
      related: [],
      coverage: 0,
      missing: unique.map(term => term.raw),
      ms: 0,
      scanned: 0,
    };
  }

  const top = scored[0];
  const idfOf = key => (index.df.get(key) ? index.idf(key) : 0);
  const weight = term => (Math.max(...term.keys.map(idfOf)) || index.maxIdf) * (SOFT.has(term.s) ? 0.3 : 1);
  const totalWeight = unique.reduce((sum, term) => sum + weight(term), 0);
  const pool = scored.filter(row => row.score > 0 && row.score >= top.score * 0.7).slice(0, 2);
  const matched = unique.filter(term => pool.some(row => term.keys.some(key => row.doc.tf.has(key))));
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

  const priceQuestion = /цен|стоит|стоим|price|cost|how much|баға|құны|тұрады/i.test(query);
  const comparisonQuestion = /difference|разниц|айырмашылық|compared?|versus|\bvs\.?\b/i.test(query);
  const whereQuestion = /(^|\s)(где|where|қайда)(\s|$)|адрес|address|мекенжай/i.test(query);
  const hasAny = (set, term) => term.keys.some(key => set.has(key));
  const productTerms = unique.filter(
    term => !SOFT.has(term.s) && !term.keys.includes('price') && !/^\d/.test(term.raw) && term.raw.length > 2
  );

  const hits = scored
    .filter(row => row.score >= top.score * 0.45)
    .slice(0, Math.max(6, opts.maxSources))
    .map(row => {
      const chunk = row.doc.chunk;
      const meta = new Set(tokenize(chunk.docName || '', true).map(token => token.s));
      const chunkKeys = new Set(tokenize(allText(chunk), true).map(token => token.s));
      const lineScores = chunk.lines
        .map((_, i) => {
          const line = lineAllText(chunk, i);
          const cut = line.includes(' | ') ? line.indexOf(' — ') : -1;
          const body = new Set(tokenize(cut > 0 ? line.slice(cut + 3) : line).map(token => token.s));
          const context = cut > 0 ? new Set(tokenize(line.slice(0, cut)).map(token => token.s)) : new Set();
          let score = 0;
          let matchedWeight = 0;

          unique.forEach(term => {
            const soft = SOFT.has(term.s) ? 0.3 : 1;
            const bodyKey = term.keys.find(key => body.has(key));
            const contextKey = term.keys.find(key => context.has(key));
            const chunkKey = term.keys.find(key => chunkKeys.has(key));

            if (bodyKey) {
              score += idfOf(bodyKey) * soft;
              matchedWeight += weight(term);
            } else if (contextKey) {
              score += 0.4 * idfOf(contextKey) * soft;
              matchedWeight += 0.4 * weight(term);
            } else if (chunkKey) {
              /* The passage is a multi-line answer: a term can live on a
                 sibling line. This counts for coverage, at a discount, but
                 does not by itself make this the winning line. */
              matchedWeight += 0.25 * weight(term);
            } else if (hasAny(meta, term)) {
              matchedWeight += weight(term);
            }
          });

          if (score > 0 && priceQuestion && MONEY.test(line)) {
            score += index.maxIdf * 0.5;
            const priceTerm = unique.find(term => term.keys.includes('price'));
            if (priceTerm && !hasAny(body, priceTerm) && !hasAny(context, priceTerm)) matchedWeight += weight(priceTerm);
          }
          if (score > 0 && /\d{2}\.\d{2}\.\d{4}/.test(line)) {
            const dateTerm = unique.find(term => /^(дат|date|когда|күн)/.test(term.raw));
            if (dateTerm && !hasAny(body, dateTerm) && !hasAny(context, dateTerm)) {
              score += idfOf(dateTerm.s) || index.maxIdf * 0.5;
              matchedWeight += weight(dateTerm);
            }
          }
          if (score > 0 && whereQuestion && ADDRESS.test(line)) score += index.maxIdf * 0.6;
          return { i, score, matchedWeight, length: line.length };
        })
        .sort((a, b) => {
          if (priceQuestion) {
            const aMoney = MONEY.test(lineAllText(chunk, a.i)) ? 1 : 0;
            const bMoney = MONEY.test(lineAllText(chunk, b.i)) ? 1 : 0;
            if (aMoney !== bMoney) return bMoney - aMoney;
          }
          return (Math.abs(b.score - a.score) > 1e-9 ? b.score - a.score : b.length - a.length) || a.i - b.i;
        });

      return { chunk, score: row.score, lines: lineScores };
    })
    .filter(hit => hit.lines[0].score > 0);

  hits.forEach(hit => {
    hit.lineCoverage = hit.lines[0].matchedWeight / totalWeight;
  });
  hits.sort((a, b) => {
    if (intent) {
      const aKind = documentKind(a.chunk) === intent ? 1 : 0;
      const bKind = documentKind(b.chunk) === intent ? 1 : 0;
      if (aKind !== bKind) return bKind - aKind;
    }
    if (priceQuestion) {
      const aMoney = MONEY.test(lineAllText(a.chunk, a.lines[0].i)) ? 1 : 0;
      const bMoney = MONEY.test(lineAllText(b.chunk, b.lines[0].i)) ? 1 : 0;
      if (aMoney !== bMoney) return bMoney - aMoney;
    }
    return Math.round(b.lineCoverage * 20) - Math.round(a.lineCoverage * 20) || b.score - a.score;
  });
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

  const lineCoverage = hits[0].lines[0].matchedWeight / totalWeight;
  const lineFloor = priceQuestion ? 0.6 : opts.lineMin;
  if (partial && lineCoverage < lineFloor) {
    const bestSet = new Set(tokenize(lineAllText(hits[0].chunk, hits[0].lines[0].i)).map(token => token.s));
    return {
      status: 'abstain',
      reason: priceQuestion ? 'price-partial' : 'weak-line',
      hits: [],
      related,
      coverage,
      missing: unique.filter(term => !hasAny(bestSet, term)).map(term => term.raw),
      ms: elapsed,
      scanned: index.N,
    };
  }

  /* Identifier guard: a number or code in the question must occur in the
     chosen line, or we are quoting a different item. Typos and aliases never
     satisfy this guard. */
  const identifiers = unique.filter(term => /\d/.test(term.raw));
  if (identifiers.length) {
    const best = hits[0];
    const chunkSet = new Set(tokenize(allText(best.chunk), true).map(token => token.s));
    const bad = identifiers.filter(term => !term.keys.some(key => chunkSet.has(key)));
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

  /* A single extracted line cannot honestly answer "what is the difference
     between A and B". Until comparison composition exists, refuse instead of
     quoting one side. Curated demo answers can still cover it. */
  if (comparisonQuestion) {
    return {
      status: 'abstain',
      reason: 'comparison',
      hits: [],
      related,
      coverage,
      missing,
      ms: elapsed,
      scanned: index.N,
    };
  }

  /* Conflicting prices: if a price list and a catalog quote different amounts
     for the same product, use the price list and expose the discrepancy. */
  let conflict = null;
  if (priceQuestion) {
    conflict = detectPriceConflict(index, productTerms);
    if (conflict) {
      [conflict.used, conflict.other].forEach(entry => {
        if (hits.some(hit => hit.chunk.id === entry.chunk)) return;
        const row = index.docs.find(item => item.chunk.id === entry.chunk);
        if (!row) return;
        hits.push({
          chunk: row.chunk,
          score: 0,
          lines: [{ i: entry.line, score: 1, matchedWeight: 0, length: 0 }],
          evidenceLines: [entry.line],
          best: { i: entry.line },
          lineCoverage: 0,
        });
      });
      const position = hits.findIndex(hit => hit.chunk.id === conflict.used.chunk);
      if (position > 0) hits.unshift(hits.splice(position, 1)[0]);
      const usedHit = hits[0];
      usedHit.best = { i: conflict.used.line, score: usedHit.best.score, matchedWeight: usedHit.best.matchedWeight };
      usedHit.evidenceLines = [...new Set([conflict.used.line, ...usedHit.evidenceLines])].sort((a, b) => a - b);
    }
  }

  /* Keep the evidence list honest: a passage that only shares a currency with
     the question is not a source. Conflict sources are always kept. */
  const conflictSources = new Set();
  if (conflict) {
    conflictSources.add(conflict.used.chunk);
    conflictSources.add(conflict.other.chunk);
  }
  for (let index = hits.length - 1; index >= 1; index--) {
    const hit = hits[index];
    if (conflictSources.has(hit.chunk.id)) continue;
    if (priceQuestion) {
      const lineKeys = new Set(tokenize(lineAllText(hit.chunk, hit.lines[0].i), true).map(token => token.s));
      const lineHasProduct = productTerms.some(term => term.keys.some(key => lineKeys.has(key)));
      const lineHasMoney = MONEY.test(lineAllText(hit.chunk, hit.lines[0].i));
      if (!lineHasProduct || !lineHasMoney) hits.splice(index, 1);
    } else if (hit.lineCoverage < 0.3) {
      hits.splice(index, 1);
    }
  }
  hits.length = Math.min(hits.length, Math.max(opts.maxSources, 2) + (conflict ? 1 : 0));

  const strength = partial ? 'limited' : coverage >= 0.85 && hits.length >= 2 ? 'strong' : coverage >= 0.7 ? 'moderate' : 'limited';
  return {
    status: 'answer',
    hits,
    coverage: round(coverage),
    missing,
    conflict,
    ms: Math.round((performance.now() - started) * 10) / 10,
    scanned: index.N,
    strength,
    partial,
    topScore: top.score,
    lineCov: round(lineCoverage),
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
