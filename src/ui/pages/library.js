import { allText } from '../../domain/engine.js';
import { docChunks, docList, state, t } from '../../app/state.js';
import { esc, ficon, fmtDate, fmtSize, statusBadge } from '../format.js';
import { emptyState, pageHead } from '../components.js';
import { icon } from '../icons.js';
import { view } from '../view-state.js';

export function libraryRows() {
  const query = view.libQuery.trim().toLowerCase();
  return docList().filter(doc => {
    if (view.libType !== 'all' && doc.type !== view.libType) return false;
    if (view.libStatus !== 'all' && doc.status !== view.libStatus) return false;
    if (!query) return true;
    if (doc.name.toLowerCase().includes(query)) return true;
    return docChunks(doc.id).some(chunk => allText(chunk).toLowerCase().includes(query));
  });
}

export function libraryTable() {
  const rows = libraryRows();
  if (!rows.length) {
    return emptyState('file', t('lib.empty'), t('lib.empty.sub'), `<button type="button" class="btn accent" data-act="pick">${icon('upload', 'xs')}${esc(t('lib.upload'))}</button>`);
  }

  return `<div class="table-wrap"><table class="table">
    <thead><tr>
      <th>${esc(t('lib.name'))}</th>
      <th class="hide-sm">${esc(t('lib.type'))}</th>
      <th class="hide-md">${esc(t('lib.date'))}</th>
      <th>${esc(t('lib.status'))}</th>
      <th class="hide-sm">${esc(t('lib.chunks'))}</th>
      <th class="col-actions"><span class="sr">Actions</span></th>
    </tr></thead>
    <tbody>
      ${rows.map(doc => `
        <tr>
          <td>
            <button type="button" class="doc-cell" data-act="document" data-id="${esc(doc.id)}">
              ${ficon(doc.type)}
              <span class="doc-cell-text"><b>${esc(doc.name)}</b><span class="muted">${fmtSize(doc.size)}${doc.demo ? ' · ' + esc(t('lib.demo')) : ''}</span></span>
            </button>
          </td>
          <td class="hide-sm"><span class="badge">${esc(doc.type.toUpperCase())}</span></td>
          <td class="hide-md muted">${esc(fmtDate(doc.ts))}</td>
          <td>${statusBadge(doc)}
            ${doc.status === 'processing' ? `<div class="progress"><i style="width:${doc.progress}%"></i></div><span class="muted tiny">${esc(t('stage.' + doc.stage))}</span>` : ''}
            ${doc.status === 'failed' ? `<div class="error-text">${esc(t('err.' + (doc.error || 'parse')))}</div>` : ''}
          </td>
          <td class="hide-sm muted">${doc.status === 'processed' ? doc.chunks : '—'}</td>
          <td class="col-actions">
            <div class="row-actions">
              <button type="button" class="btn ghost icon sm" data-act="document" data-id="${esc(doc.id)}" title="${esc(t('lib.view'))}" aria-label="${esc(t('lib.view'))}">${icon('eye', 'sm')}</button>
              ${doc.status === 'failed' ? `<button type="button" class="btn ghost icon sm" data-act="retry" data-id="${esc(doc.id)}" title="${esc(t('common.retry'))}" aria-label="${esc(t('common.retry'))}">${icon('refresh', 'sm')}</button>` : ''}
              <button type="button" class="btn ghost icon sm danger" data-act="remove" data-id="${esc(doc.id)}" title="${esc(t('lib.remove'))}" aria-label="${esc(t('lib.remove'))}">${icon('trash', 'sm')}</button>
            </div>
          </td>
        </tr>`).join('')}
    </tbody>
  </table></div>`;
}

export function libraryPage() {
  const rows = libraryRows();
  const totalChunks = docList().filter(doc => doc.status === 'processed').reduce((sum, doc) => sum + (doc.chunks || 0), 0);

  return `<div class="page">
    ${pageHead(
      t('app.description'),
      t('lib.title'),
      t('lib.sub'),
      `<label class="switch-label"><span>${esc(t('lib.usedemo'))}</span>
        <button type="button" class="switch" role="switch" aria-checked="${state.settings.useDemo}" aria-label="${esc(t('lib.usedemo'))}" data-act="demo-toggle"></button>
      </label>
      <button type="button" class="btn accent" data-act="pick">${icon('upload', 'xs')}${esc(t('lib.upload'))}</button>`
    )}

    <input type="file" id="file-input" multiple hidden accept=".pdf,.docx,.txt,.md,.csv,.xlsx,.png,.jpg,.jpeg,.webp">

    <div class="dropzone" id="dropzone" tabindex="0" role="button" aria-label="${esc(t('lib.drop'))}" data-act="pick">
      <div class="dropzone-icon">${icon('upload', 'lg')}</div>
      <div class="grow">
        <b>${esc(t('lib.drop'))}</b>
        <span class="muted">${esc(t('lib.formats'))}</span>
      </div>
      <button type="button" class="btn sm" data-act="sample" title="${esc(t('lib.sample.d'))}">${icon('plus', 'xs')}${esc(t('lib.sample'))}</button>
    </div>

    <div class="toolbar">
      <div class="search-field">
        ${icon('search', 'sm')}
        <label class="sr" for="library-search">${esc(t('lib.search'))}</label>
        <input id="library-search" type="search" placeholder="${esc(t('lib.search'))}" value="${esc(view.libQuery)}" autocomplete="off">
      </div>
      <div class="segmented" role="group" aria-label="${esc(t('lib.type'))}">
        ${['all', 'pdf', 'docx', 'xlsx', 'csv', 'txt'].map(type => `<button type="button" data-act="lib-type" data-v="${type}" aria-pressed="${view.libType === type}">${type === 'all' ? esc(t('common.all')) : type.toUpperCase()}</button>`).join('')}
      </div>
      <label class="sr" for="library-status">${esc(t('lib.status'))}</label>
      <select id="library-status" class="select">
        ${['all', 'processed', 'processing', 'failed'].map(status => `<option value="${status}" ${view.libStatus === status ? 'selected' : ''}>${status === 'all' ? esc(t('lib.status')) + ': ' + esc(t('common.all')) : esc(t('st.' + status))}</option>`).join('')}
      </select>
      <span class="toolbar-count muted">${esc(t('lib.count', rows.length, totalChunks))}</span>
    </div>

    <section class="panel flush" id="library-body">${libraryTable()}</section>
  </div>`;
}
