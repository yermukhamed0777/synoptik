import { lineText } from '../../domain/engine.js';
import { CORPUS } from '../../domain/corpus.js';
import { composeDirect, qaById, questionText } from '../../app/ask.js';
import {
  docById,
  genSuggestions,
  indexSize,
  locLabel,
  pick,
  state,
  t,
} from '../../app/state.js';
import { esc, ficon, fmtNum, strengthMeter } from '../format.js';
import { composer, emptyState, pageHead, topicName } from '../components.js';
import { icon } from '../icons.js';
import { view } from '../view-state.js';

const SUGGEST_GROUPS = [
  ['pricing', ['q-price-x5', 'q-price-silk', 'q-tint']],
  ['compat', ['q-facade', 'q-compat-x5-aqua', 'q-bath', 'q-diff']],
  ['delivery', ['q-deliv-alm', 'q-deliv-astana']],
  ['warranty', ['q-warr-x5', 'q-return', 'q-disc']],
];
const UNANSWERABLE = ['x-intl', 'x-20l', 'x-voc', 'x-install', 'x-pool'];

const questionChip = id => {
  const qa = qaById(id);
  if (!qa) return '';
  return `<button type="button" class="chip" data-act="ask" data-qa="${qa.id}" data-q="${esc(questionText(qa))}">${esc(questionText(qa))}</button>`;
};

const recentRows = () => {
  if (!state.history.length) return '';
  return `
    <section class="panel recent-panel">
      <header class="panel-head"><h2>${esc(t('ask.recent'))}</h2><a class="text-link" href="#/coverage">${esc(t('nav.coverage'))}${icon('arrow', 'xs')}</a></header>
      <div class="list">
        ${state.history.slice(0, 5).map(entry => {
          const text = entry.q || (entry.qa ? questionText(qaById(entry.qa)) : '');
          return `<button type="button" class="list-row" data-act="ask" data-qa="${esc(entry.qa || '')}" data-q="${esc(text)}">
            <span class="status-dot ${entry.status === 'abstain' ? 'warn' : 'ok'}"></span>
            <span class="grow">${esc(text)}</span>
            ${entry.status === 'abstain' ? `<span class="badge warn">${esc(t('abst.badge'))}</span>` : `<span class="badge ok">${esc(t('ans.verified'))}</span>`}
          </button>`;
        }).join('')}
      </div>
    </section>`;
};

const suggestionPanel = () => {
  if (state.settings.useDemo) {
    return `
      <section class="panel suggestions">
        <header class="panel-head">
          <h2>${esc(t('ask.suggested'))}</h2>
          <span class="muted">${esc(t('ask.suggested.sub'))}</span>
        </header>
        <div class="suggest-groups">
          ${SUGGEST_GROUPS.map(([topic, ids]) => `
            <div class="suggest-group">
              <div class="eyebrow">${esc(topicName(topic))}</div>
              <div class="chip-row">${ids.map(questionChip).join('')}</div>
            </div>`).join('')}
          <div class="suggest-group warn-group">
            <div class="eyebrow">${esc(t('abst.badge'))}</div>
            <div class="chip-row">${UNANSWERABLE.map(questionChip).join('')}</div>
          </div>
        </div>
      </section>`;
  }

  const suggestions = genSuggestions();
  return `
    <section class="panel suggestions">
      <header class="panel-head"><h2>${esc(t('ask.suggested'))}</h2></header>
      <div class="bd">
        ${suggestions.length
          ? `<div class="chip-row">${suggestions.map(text => `<button type="button" class="chip" data-act="ask" data-q="${esc(text)}">${esc(text)}</button>`).join('')}</div>`
          : `<p class="muted">${esc(t('ask.noask'))}</p>`}
      </div>
    </section>`;
};

function evidenceCard(turn, evidence, index) {
  const chunk = evidence.chunk;
  const doc = docById(chunk.doc);
  const compact = chunk.lines.length > 4;
  const shown = compact ? evidence.lines.slice(0, 3) : chunk.lines.map((_, lineIndex) => lineIndex);
  const highlighted = shown
    .map(lineIndex =>
      evidence.lines.includes(lineIndex)
        ? `<mark>${esc(lineText(chunk, lineIndex, state.lang))}</mark>`
        : esc(lineText(chunk, lineIndex, state.lang))
    )
    .join(' … ');

  return `
    <button type="button" class="evidence" data-act="source" data-turn="${turn.id}" data-i="${index}">
      <span class="evidence-num">${index + 1}</span>
      <span class="evidence-body">
        <span class="evidence-doc">${ficon(doc ? doc.type : 'txt')}<b>${esc(doc ? doc.name : '?')}</b><span class="badge">${esc(locLabel(chunk.loc))}</span></span>
        <span class="evidence-text">${highlighted}</span>
      </span>
      <span class="evidence-open">${icon('eye', 'sm')}</span>
    </button>`;
}

function conflictBlock(result, turn) {
  if (!result.conflict) return '';
  const conflict = result.conflict;

  if (conflict.used && conflict.other) {
    const usedIndex = result.evidence.findIndex(evidence => evidence.chunk.id === conflict.used.chunk);
    const otherIndex = result.evidence.findIndex(evidence => evidence.chunk.id === conflict.other.chunk);
    const usedName = docById(conflict.used.doc)?.name || conflict.used.docName;
    const otherName = docById(conflict.other.doc)?.name || conflict.other.docName;
    const value = (index, entry, name) => {
      const body = `<b>${fmtNum(entry.value)} ₸</b> — ${esc(name)}`;
      return index >= 0
        ? `<button type="button" class="link-button" data-act="source" data-turn="${turn.id}" data-i="${index}">${body}</button>`
        : `<p>${body}</p>`;
    };
    return `
      <div class="callout warn">
        ${icon('layers', 'sm')}
        <div>
          <b>${esc(t('cmp.title'))}</b>
          <div class="conflict-grid">
            <div><span class="eyebrow">${esc(t('cmp.live.used'))}</span>${value(usedIndex, conflict.used, usedName)}</div>
            <div><span class="eyebrow">${esc(t('cmp.live.other'))}</span>${value(otherIndex, conflict.other, otherName)}</div>
          </div>
          <p class="muted small">${esc(t('cmp.live.note'))}</p>
        </div>
      </div>`;
  }

  const used = docById(conflict.a?.[0]);
  const older = docById(conflict.b?.[0]);
  const rule = docById(conflict.rule?.[0]);
  if (!used || !older) return '';
  return `
    <div class="callout warn">
      ${icon('layers', 'sm')}
      <div>
        <b>${esc(pick(conflict.note))}</b> — ${esc(t('cmp.rule'))}.
        <div class="conflict-grid">
          <div><span class="eyebrow">${esc(t('cmp.used'))}</span><p>${esc(used.name)}</p></div>
          <div><span class="eyebrow">${esc(t('cmp.older'))}</span><p>${esc(older.name)}</p></div>
        </div>
        <p class="muted small">${esc(t('cmp.why'))} <b>${esc(rule ? rule.name : '')}</b></p>
      </div>
    </div>`;
}

function howBuilt(result) {
  if (!state.settings.details) return '';
  const abstained = result.kind === 'abstain';
  const threshold = Math.round((result.semantic ? state.settings.semThreshold : state.settings.threshold) * 100);
  const coverage = abstained ? Math.round((result.coverage || 0) * 100) : result.kind === 'curated' ? 100 : Math.round(result.coverage * 100);
  const provenance = result.kind === 'curated' ? t('ans.curated') : result.kind === 'remote' ? t('ans.remote') : t('ans.extractive');
  return `
    <details class="how">
      <summary>${icon('layers', 'sm')}${esc(t('ans.how'))}</summary>
      <div class="how-grid">
        <div><span>${esc(t('ans.how.mode'))}</span><b>${esc(provenance)}</b></div>
        <div><span>${esc(t('ans.how.scanned'))}</span><b>${fmtNum(result.scanned ?? indexSize())}</b></div>
        <div><span>${esc(t('ans.how.coverage'))}</span><b>${coverage}%${abstained ? ' &lt; ' + threshold + '%' : ' ≥ ' + threshold + '%'}</b></div>
        <div><span>${esc(t('ans.how.time'))}</span><b>${(result.ms ?? 0).toFixed(1)} ms</b></div>
      </div>
    </details>`;
}

function verifiedAnswer(turn) {
  const result = turn.result;
  const composed = composeDirect(result);
  const provenance = result.kind === 'curated' ? t('ans.curated') : result.kind === 'remote' ? t('ans.remote') : t('ans.extractive');
  const cites = result.evidence
    .map((_, index) => `<button type="button" class="cite" data-act="source" data-turn="${turn.id}" data-i="${index}" aria-label="${esc(t('src.title'))} ${index + 1}">${index + 1}</button>`)
    .join('');
  const seenDocs = new Set();
  const docChips = result.evidence
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      if (seenDocs.has(item.chunk.doc)) return false;
      seenDocs.add(item.chunk.doc);
      return true;
    })
    .map(({ item, index }) => {
      const doc = docById(item.chunk.doc);
      if (!doc) return '';
      return `<button type="button" class="chip source-chip" data-act="source" data-turn="${turn.id}" data-i="${index}">
        ${ficon(doc.type)}<b>${esc(doc.name)}</b><span class="muted">${esc(locLabel(item.chunk.loc))}</span>
      </button>`;
    })
    .join('');

  const feedback = state.feedback[turn.id];
  const follows = (result.kind === 'curated' ? result.qa.follow : CORPUS.QA.filter(q => !q.abstain && q.topic === result.topic).map(q => q.id)).slice(0, 3);

  return `
    <article class="answer" aria-label="${esc(t('ans.verified'))}">
      <header class="answer-head">
        <span class="badge ok">${icon('check', 'xs')}${esc(t('ans.verified'))}</span>
        ${strengthMeter(result.strength)}
        <span class="grow"></span>
        <span class="provenance">${esc(provenance)}</span>
      </header>
      <div class="answer-body">
        ${result.partial || result.semantic
          ? `<div class="callout warn">${icon('warn', 'sm')}<div><b>${esc(t(result.semantic ? 'ans.sem' : 'ans.partial'))}</b> ${esc(t(result.semantic ? 'ans.sem.d' : 'ans.partial.d', result.semantic ? Math.round((result.sem.similarity || 0) * 100) + '%' : ''))}</div></div>`
          : ''}
        <p class="answer-direct">${esc(composed.direct)}<span class="cite-group">${cites}</span></p>
        <div class="source-row"><span class="eyebrow">${esc(t('ans.source'))}</span>${docChips}</div>
        ${composed.details.length ? `<ul class="answer-details">${composed.details.map(detail => `<li>${esc(detail)}</li>`).join('')}</ul>` : ''}
        ${conflictBlock(result, turn)}
        <div class="evidence-list">
          <div class="eyebrow">${esc(t('ans.evidence'))} · ${result.evidence.length}</div>
          ${result.evidence.map((evidence, index) => evidenceCard(turn, evidence, index)).join('')}
        </div>
        ${howBuilt(result)}
      </div>
      <footer class="answer-actions">
        <button type="button" class="btn ghost sm" data-act="copy" data-turn="${turn.id}">${icon('copy', 'xs')}${esc(t('ans.copy'))}</button>
        <button type="button" class="btn ghost sm" data-act="copy-cites" data-turn="${turn.id}">${icon('link', 'xs')}${esc(t('ans.cite'))}</button>
        <button type="button" class="btn ghost sm" data-act="share" data-turn="${turn.id}">${icon('share', 'xs')}${esc(t('ans.share'))}</button>
        <span class="grow"></span>
        <button type="button" class="btn ghost sm icon ${feedback === 'up' ? 'on' : ''}" data-act="feedback" data-v="up" data-turn="${turn.id}" title="${esc(t('ans.helpful'))}" aria-label="${esc(t('ans.helpful'))}" aria-pressed="${feedback === 'up'}">${icon('up', 'sm')}</button>
        <button type="button" class="btn ghost sm icon ${feedback === 'down' ? 'on' : ''}" data-act="feedback" data-v="down" data-turn="${turn.id}" title="${esc(t('ans.nothelpful'))}" aria-label="${esc(t('ans.nothelpful'))}" aria-pressed="${feedback === 'down'}">${icon('down', 'sm')}</button>
        <button type="button" class="btn ghost sm ${feedback === 'report' ? 'on' : ''}" data-act="feedback" data-v="report" data-turn="${turn.id}">${icon('flag', 'xs')}${esc(t('ans.report'))}</button>
      </footer>
      ${follows.length ? `<div class="follow-row"><span class="eyebrow">${esc(t('ans.follow'))}</span>${follows.map(questionChip).join('')}</div>` : ''}
    </article>`;
}

function refusedAnswer(turn) {
  const result = turn.result;
  const comparison = result.reason === 'comparison';
  const related = comparison ? [] : (result.related || []).map(docById).filter(Boolean);
  const why = result.qa
    ? pick(result.qa.why)
    : result.reason === 'comparison'
      ? t('abst.comparison')
      : result.missing && result.missing.length
        ? t('abst.terms', result.missing.slice(0, 4).join(', '))
        : t('abst.generic');
  return `
    <article class="answer refused">
      <header class="answer-head">
        <span class="badge warn">${icon('warn', 'xs')}${esc(t('abst.badge'))}</span>
        <span class="grow"></span>
        <span class="provenance">${esc(result.reason === 'remote' ? t('ans.remote') : t('abst.rule'))}</span>
      </header>
      <div class="answer-body">
        <p class="answer-direct">${esc(t('abst.title'))}</p>
        <p class="dim">${esc(why)}</p>
        <ul class="refusal-list">
          ${comparison ? '' : `<li>${esc(t('abst.missing'))}</li>`}
          ${result.qa ? `<li>${esc(pick(result.qa.missing))}</li>` : ''}
          <li>${esc(t('abst.rule'))}</li>
        </ul>
        ${related.length ? `<div class="related"><span class="eyebrow">${esc(t('abst.related'))}</span><div class="chip-row">${related.map(doc => `<button type="button" class="chip" data-act="document" data-id="${esc(doc.id)}">${ficon(doc.type)}${esc(doc.name)}</button>`).join('')}</div></div>` : ''}
        ${comparison ? '' : `<div class="callout info">${icon('spots', 'sm')}<div>${esc(t('abst.logged'))} <a href="#/spots">${esc(t('nav.spots'))}</a></div></div>`}
        ${howBuilt(result)}
      </div>
      <footer class="answer-actions">
        <button type="button" class="btn sm" data-act="document-add">${icon('upload', 'xs')}${esc(t('abst.add'))}</button>
        <button type="button" class="btn ghost sm" data-act="ask" data-qa="q-price-x5" data-q="${esc(questionText(qaById('q-price-x5')))}">${esc(t('abst.try'))}</button>
      </footer>
    </article>`;
}

function loadingTurn(turn) {
  const labels = [
    t('step.search', fmtNum(indexSize())),
    t('step.rank'),
    t('step.check'),
    t('step.compose'),
  ];
  return `
    <div class="answer loading" role="status" aria-busy="true">
      <div class="steps">
        ${labels.map((label, index) => `<div class="step ${index < turn.step ? 'done' : index === turn.step ? 'active' : ''}">
          <span class="step-dot">${index < turn.step ? icon('check', 'xs') : ''}</span>${esc(label)}
        </div>`).join('')}
      </div>
    </div>`;
}

function turnView(turn) {
  return `
    <section class="turn" data-turn="${turn.id}">
      <div class="turn-question">
        <span class="you">${esc(t('common.you'))}</span>
        <h2>${esc(turn.q)}</h2>
      </div>
      ${turn.state === 'loading'
        ? loadingTurn(turn)
        : turn.state === 'error'
          ? `<div class="answer refused"><div class="answer-body"><div class="callout warn">${icon('warn', 'sm')}<div><b>${esc(t('ask.error'))}</b><div>${esc(turn.error || '')}</div></div></div></div></div>`
          : turn.result.kind === 'abstain'
            ? refusedAnswer(turn)
            : verifiedAnswer(turn)}
    </section>`;
}

export function askPage() {
  const hasThread = view.thread.length > 0;
  const libraryEmpty = !state.settings.useDemo && !state.uploads.some(upload => upload.status === 'processed');

  if (libraryEmpty) {
    return `<div class="page narrow">
      ${pageHead(t('mode.empty.short'), t('ask.title'), t('ask.sub'))}
      <div class="panel">${emptyState(
        'file',
        t('ask.empty.title'),
        t('ask.empty.sub'),
        `<div class="chip-row" style="justify-content:center">
          <button type="button" class="btn accent" data-act="document-add">${icon('upload', 'xs')}${esc(t('ask.empty.cta'))}</button>
          <button type="button" class="btn" data-act="demo-on">${icon('play', 'xs')}${esc(t('ask.empty.demo'))}</button>
        </div>`
      )}</div>
    </div>`;
  }

  if (!hasThread) {
    return `<div class="page">
      <section class="ask-hero">
        <div class="eyebrow">${esc(t('app.description'))}</div>
        <h1>${esc(t('ask.title'))}</h1>
        <p class="lead">${esc(t('ask.sub'))}</p>
        ${composer('ask-in', true)}
        <p class="hero-note">${icon('lock', 'xs')}${esc(t('lp.note'))}</p>
      </section>
      <div class="ask-grid">
        <div class="ask-main">${suggestionPanel()}</div>
        <div class="ask-side">${recentRows()}
          <section class="panel principles">
            <div class="principle">${icon('quote', 'sm')}<div><b>${esc(t('lp.how.4.t'))}</b><span>${esc(t('lp.how.4.d'))}</span></div></div>
            <div class="principle">${icon('warn', 'sm')}<div><b>${esc(t('abst.badge'))}</b><span>${esc(t('lp.how.3.d'))}</span></div></div>
            <div class="principle">${icon('spots', 'sm')}<div><b>${esc(t('nav.spots'))}</b><span>${esc(t('lp.spots.sub'))}</span></div></div>
          </section>
        </div>
      </div>
    </div>`;
  }

  return `<div class="page narrow">
    <header class="thread-head">
      <div>
        <div class="eyebrow">${esc(t('app.tagline'))}</div>
        <h1>${esc(t('ask.title'))}</h1>
      </div>
      <div class="page-actions">
        <button type="button" class="btn" data-act="demo-toggle">${icon('play', 'xs')}${esc(state.settings.useDemo ? t('toast.demo.off') : t('toast.demo.on'))}</button>
        <button type="button" class="btn" data-act="clear-thread">${icon('plus', 'xs')}${esc(t('ask.new'))}</button>
      </div>
    </header>
    <div class="thread">${view.thread.map(turnView).join('')}</div>
    <div class="dock"><div class="dock-inner">${composer('ask-in')}</div></div>
  </div>`;
}

export { turnView, questionChip, evidenceCard };
