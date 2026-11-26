import { entities, keyTerms, lineText, tokenize } from '../domain/engine.js';
import { CORPUS } from '../domain/corpus.js';
import { qaById, questionText } from '../app/ask.js';
import { docById, docChunks, docList, locLabel, pick, state, t } from '../app/state.js';
import { esc, ficon, fmtDate, fmtNum, fmtSize, statusBadge } from './format.js';
import { icon } from './icons.js';
import { view } from './view-state.js';

const lineOf = (chunk, index) => lineText(chunk, index, state.lang);

function highlighted(chunk, lines) {
  return chunk.lines
    .map((_, index) => (lines.includes(index) ? `<mark>${esc(lineOf(chunk, index))}</mark>` : esc(lineOf(chunk, index))))
    .join(' … ');
}

function metaRows(doc, extra = []) {
  const rows = [
    [t('lib.type'), String(doc.type || '').toUpperCase()],
    [t('meta.size'), fmtSize(doc.size || 0)],
    [t('meta.added'), fmtDate(doc.ts || Date.now())],
  ];
  if (doc.pages) rows.push([t('meta.pages'), doc.pages]);
  if (doc.sheets) rows.push([t('meta.sheets'), doc.sheets]);
  if (doc.rows) rows.push([t('meta.rows'), fmtNum(doc.rows)]);
  return `<dl class="meta-grid">${rows.concat(extra).map(([key, value]) => `<dt>${esc(key)}</dt><dd>${esc(value)}</dd>`).join('')}</dl>`;
}

/* ---------- evidence drawer ---------- */

function sourceDrawer() {
  const turn = view.thread.find(item => item.id === view.drawer.turn);
  if (!turn || !turn.result) return '';
  const evidence = turn.result.evidence[view.drawer.index];
  if (!evidence) return '';
  const chunk = evidence.chunk;
  const doc = docById(chunk.doc);
  const loc = locLabel(chunk.loc);
  const siblings = doc ? docChunks(doc.id) : [];
  const position = siblings.findIndex(item => item.id === chunk.id);

  return `<div class="scrim" data-act="close"></div>
    <aside class="drawer" role="dialog" aria-modal="true" aria-label="${esc(t('src.title'))}">
      <header class="drawer-head">
        <span class="evidence-num">${view.drawer.index + 1}</span>
        <div class="grow">
          <div class="eyebrow">${esc(t('src.title'))}</div>
          <b>${esc(doc?.name || chunk.docName || '')}</b>
        </div>
        <button type="button" class="btn ghost icon" data-act="close" aria-label="${esc(t('common.close'))}">${icon('x', 'sm')}</button>
      </header>
      <div class="drawer-body">
        <div class="row wrap">
          ${loc ? `<span class="badge info">${esc(loc)}</span>` : ''}
          ${turn.result.evidence.length > 1 ? `<span class="muted small">${esc(t('src.of', view.drawer.index + 1, turn.result.evidence.length))}</span>` : ''}
        </div>
        <section>
          <div class="eyebrow">${esc(t('src.passage'))}</div>
          <div class="passage">${highlighted(chunk, evidence.lines)}</div>
          <p class="muted tiny">${icon('info', 'xs')}${esc(t('src.highlight'))}</p>
        </section>
        ${doc ? `<section>
          <div class="eyebrow">${esc(t('src.meta'))}</div>
          ${metaRows(doc, [
            [t('src.location'), loc],
            [t('src.chunk'), position >= 0 ? `${position + 1} / ${siblings.length}` : '—'],
          ])}
        </section>` : ''}
        ${turn.result.evidence.length > 1 ? `<section>
          <div class="eyebrow">${esc(t('src.all'))}</div>
          <div class="drawer-evidence">
            ${turn.result.evidence.map((entry, index) => {
              const entryDoc = docById(entry.chunk.doc);
              return `<button type="button" class="evidence-mini ${index === view.drawer.index ? 'active' : ''}" data-act="source" data-turn="${turn.id}" data-i="${index}">
                <span class="evidence-num">${index + 1}</span>
                <span class="grow"><b>${esc(entryDoc?.name || entry.chunk.docName || '')}</b><span class="badge">${esc(locLabel(entry.chunk.loc))}</span></span>
              </button>`;
            }).join('')}
          </div>
        </section>` : ''}
      </div>
      <footer class="drawer-foot">
        <button type="button" class="btn sm" data-act="copy-evidence" data-turn="${turn.id}" data-i="${view.drawer.index}">${icon('copy', 'xs')}${esc(t('src.copy'))}</button>
        ${doc ? `<button type="button" class="btn sm ghost" data-act="document" data-id="${esc(doc.id)}">${esc(t('src.opendoc'))}</button>` : ''}
        <span class="grow"></span>
        <button type="button" class="btn icon sm" data-act="source" data-turn="${turn.id}" data-i="${(view.drawer.index - 1 + turn.result.evidence.length) % turn.result.evidence.length}" aria-label="${esc(t('common.prev'))}" ${turn.result.evidence.length < 2 ? 'disabled' : ''}>${icon('left', 'sm')}</button>
        <button type="button" class="btn icon sm" data-act="source" data-turn="${turn.id}" data-i="${(view.drawer.index + 1) % turn.result.evidence.length}" aria-label="${esc(t('common.next'))}" ${turn.result.evidence.length < 2 ? 'disabled' : ''}>${icon('right', 'sm')}</button>
      </footer>
    </aside>`;
}

/* ---------- document drawer ---------- */

function documentDrawer() {
  const doc = docById(view.drawer.id);
  if (!doc) return '';
  const full = docList().find(item => item.id === doc.id) || doc;
  const chunks = docChunks(doc.id);
  const extracted = entities(chunks);
  const terms = doc.demo ? [] : keyTerms(chunks, 8);

  return `<div class="scrim" data-act="close"></div>
    <aside class="drawer" role="dialog" aria-modal="true" aria-label="${esc(t('doc.title'))}">
      <header class="drawer-head">
        ${ficon(doc.type)}
        <div class="grow">
          <div class="eyebrow">${esc(t('doc.title'))}</div>
          <b>${esc(doc.name)}</b>
        </div>
        <button type="button" class="btn ghost icon" data-act="close" aria-label="${esc(t('common.close'))}">${icon('x', 'sm')}</button>
      </header>
      <div class="drawer-body">
        <div class="row wrap">
          ${statusBadge(full)}
          <span class="badge">${esc(pick(doc.category || [t('lib.uploaded')]))}</span>
          ${doc.demo ? `<span class="badge info">${esc(t('lib.demo'))}</span>` : ''}
        </div>
        ${doc.status === 'failed' ? `<div class="callout warn">${icon('warn', 'sm')}<div><b>${esc(t('doc.notproc'))}</b><div>${esc(t('err.' + (doc.error || 'parse')))}</div></div></div>` : ''}
        ${metaRows(full, [[t('lib.chunks'), full.chunks || 0], ...(doc.chars ? [[t('meta.chars'), fmtNum(doc.chars)]] : [])])}

        ${chunks.length ? `
          <section>
            <div class="eyebrow">${esc(t('doc.entities'))}</div>
            <dl class="meta-grid">
              <dt>${esc(t('doc.products'))}</dt><dd>${extracted.products.map(value => `<span class="badge">${esc(value)}</span>`).join(' ') || '—'}</dd>
              <dt>${esc(t('doc.amounts'))}</dt><dd>${extracted.amounts.map(value => `<span class="badge">${esc(value)}</span>`).join(' ') || '—'}</dd>
              <dt>${esc(t('doc.percents'))}</dt><dd>${extracted.percents.map(value => `<span class="badge">${esc(value)}</span>`).join(' ') || '—'}</dd>
              ${terms.length ? `<dt>${esc(t('doc.terms'))}</dt><dd>${terms.map(value => `<span class="badge">${esc(value)}</span>`).join(' ')}</dd>` : ''}
            </dl>
          </section>
          <section>
            <div class="eyebrow">${esc(t('doc.extracted'))} · ${chunks.length}</div>
            <div class="chunk-list">
              ${chunks.slice(0, 20).map(chunk => `<div class="chunk"><span class="badge info">${esc(locLabel(chunk.loc))}</span>${chunk.lines.map((_, index) => `<p>${esc(lineOf(chunk, index))}</p>`).join('')}</div>`).join('')}
              ${chunks.length > 20 ? `<p class="muted small">… +${chunks.length - 20}</p>` : ''}
            </div>
          </section>` : `<p class="muted">${esc(t('doc.nochunks'))}</p>`}
      </div>
      <footer class="drawer-foot">
        ${full.status === 'failed' ? `<button type="button" class="btn sm" data-act="retry" data-id="${esc(doc.id)}">${icon('refresh', 'xs')}${esc(t('common.retry'))}</button>` : ''}
        <button type="button" class="btn danger sm" data-act="remove" data-id="${esc(doc.id)}">${icon('trash', 'xs')}${esc(t('lib.remove'))}</button>
      </footer>
    </aside>`;
}

/* ---------- confirm ---------- */

function confirmModal() {
  const reset = view.confirm.reset;
  const doc = reset ? null : docById(view.confirm.id);
  return `<div class="scrim" data-act="close-confirm"></div>
    <div class="modal small" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
      <div class="modal-body">
        <h2 id="confirm-title">${esc(reset ? t('reset.title') : t('rm.title', doc ? doc.name : ''))}</h2>
        <p class="dim">${esc(reset ? t('reset.body') : doc && doc.demo ? t('rm.demo') : t('rm.body'))}</p>
      </div>
      <footer class="modal-foot">
        <button type="button" class="btn" data-act="close-confirm">${esc(t('common.cancel'))}</button>
        <button type="button" class="btn danger" data-act="confirm-run" data-id="${esc(reset ? '__reset' : view.confirm.id)}">${esc(reset ? t('set.reset.btn') : t('lib.remove'))}</button>
      </footer>
    </div>`;
}

/* ---------- quick search ---------- */

function quickItems() {
  const query = (view.quick?.q || '').trim().toLowerCase();
  const queryTerms = new Set(tokenize(query).map(token => token.s));
  const matches = text => {
    if (!query) return true;
    if (text.toLowerCase().includes(query)) return true;
    return tokenize(text).some(token => queryTerms.has(token.s));
  };
  const items = [];
  if (query) items.push({ group: t('qs.ask'), icon: 'search', label: view.quick.q.trim(), action: { act: 'ask', q: view.quick.q.trim() } });
  CORPUS.QA.filter(qa => matches(qa.q.join(' ')))
    .slice(0, query ? 5 : 6)
    .forEach(qa => items.push({ group: t('qs.questions'), icon: qa.abstain ? 'warn' : 'ask', label: questionText(qa), action: { act: 'ask', q: questionText(qa), qa: qa.id } }));
  docList()
    .filter(doc => matches(doc.name))
    .slice(0, 4)
    .forEach(doc => items.push({ group: t('qs.docs'), icon: 'file', label: doc.name, sub: fmtSize(doc.size), action: { act: 'document', id: doc.id } }));
  [['/ask', 'ask', 'nav.ask'], ['/library', 'file', 'nav.library'], ['/spots', 'spots', 'nav.spots'], ['/coverage', 'coverage', 'nav.coverage'], ['/settings', 'settings', 'nav.settings']]
    .filter(([, , label]) => !query || t(label).toLowerCase().includes(query))
    .forEach(([route, iconName, label]) => items.push({ group: t('qs.pages'), icon: iconName, label: t(label), action: { act: 'goto', route } }));
  return items;
}

function quickModal() {
  const items = quickItems();
  view.quick.sel = Math.min(view.quick.sel, Math.max(0, items.length - 1));
  let lastGroup = '';
  return `<div class="scrim" data-act="close-quick"></div>
    <div class="modal quick" role="dialog" aria-modal="true" aria-label="${esc(t('qs.btn'))}">
      <div class="quick-input">
        ${icon('search', 'sm')}
        <input id="quick-input" type="text" placeholder="${esc(t('qs.ph'))}" value="${esc(view.quick.q)}" autocomplete="off" aria-label="${esc(t('qs.btn'))}" role="combobox" aria-expanded="true" aria-controls="quick-results" ${items.length ? 'aria-activedescendant="quick-option-' + view.quick.sel + '"' : ''}>
        <kbd>Esc</kbd>
      </div>
      <div class="quick-results" id="quick-results" role="listbox">
        ${items.map((item, index) => {
          const header = item.group !== lastGroup ? `<div class="quick-group">${esc(item.group)}</div>` : '';
          lastGroup = item.group;
          return `${header}<button type="button" id="quick-option-${index}" class="quick-item" data-act="quick-run" data-i="${index}" role="option" aria-selected="${index === view.quick.sel}">
            ${icon(item.icon, 'sm')}<span class="grow">${esc(item.label)}</span>${item.sub ? `<span class="muted small">${esc(item.sub)}</span>` : ''}
          </button>`;
        }).join('') || `<div class="quick-empty">${esc(t('qs.none'))}</div>`}
      </div>
    </div>`;
}

/* ---------- onboarding ---------- */

function onboardingModal() {
  const step = view.onboard;
  const icons = ['ask', 'eye', 'warn'];
  return `<div class="scrim" data-act="onboard-skip"></div>
    <div class="modal onboarding" role="dialog" aria-modal="true" aria-labelledby="onboard-title">
      <div class="onboard-dots">${[0, 1, 2].map(index => `<i class="${index <= step ? 'on' : ''}"></i>`).join('')}</div>
      <div class="onboard-body">
        <span class="onboard-icon">${icon(icons[step], 'lg')}</span>
        <h2 id="onboard-title">${esc(t(`ob.${step}.t`))}</h2>
        <p class="dim">${esc(t(`ob.${step}.d`))}</p>
      </div>
      <footer class="modal-foot">
        <button type="button" class="btn ghost" data-act="onboard-skip">${esc(t('common.skip'))}</button>
        <button type="button" class="btn accent" data-act="onboard-next" id="onboard-next">${esc(step >= 2 ? t('ob.start') : t('common.next'))}${icon('arrow', 'xs')}</button>
      </footer>
    </div>`;
}

/* ---------- guided demo ---------- */

const TOUR_LENGTH = 6;

function tourClock() {
  const elapsed = Math.floor((Date.now() - (view.tourStarted || Date.now())) / 1000);
  const remaining = Math.max(0, 180 - elapsed);
  return Math.floor(remaining / 60) + ':' + String(remaining % 60).padStart(2, '0');
}

function tourCard() {
  const step = view.tour;
  return `<div class="coach" role="dialog" aria-label="${esc(t('tour.clock'))}" aria-live="polite">
    <div class="coach-progress">${Array.from({ length: TOUR_LENGTH }, (_, index) => `<i class="${index <= step ? 'on' : ''}"></i>`).join('')}</div>
    <div class="coach-head"><span class="eyebrow">${esc(t('tour.step', step + 1, TOUR_LENGTH))}</span><span class="coach-clock" id="tour-clock">${tourClock()}</span></div>
    <h3>${esc(t(`tour.${step}.t`))}</h3>
    <p>${esc(t(`tour.${step}.d`))}</p>
    <div class="coach-actions">
      <button type="button" class="btn ghost sm" data-act="tour-end">${esc(t('tour.skip'))}</button>
      <button type="button" class="btn sm accent" data-act="tour-next" id="tour-next" ${view.tourBusy ? 'disabled' : ''}>${esc(step >= TOUR_LENGTH - 1 ? t('tour.done') : t('common.next'))}${icon('arrow', 'xs')}</button>
    </div>
  </div>`;
}

export function overlays() {
  let html = '';
  if (view.drawer?.type === 'source') html += sourceDrawer();
  else if (view.drawer?.type === 'document') html += documentDrawer();
  if (view.confirm) html += confirmModal();
  if (view.quick) html += quickModal();
  if (view.onboard != null) html += onboardingModal();
  if (view.tour != null) html += tourCard();
  return html;
}

export { quickItems, TOUR_LENGTH, tourClock };
