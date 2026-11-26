import { qaById, questionText } from '../../app/ask.js';
import { docById, state, t } from '../../app/state.js';
import { esc, ficon, fmtDate } from '../format.js';
import { emptyState, pageHead, topicName } from '../components.js';
import { icon } from '../icons.js';
import { view } from '../view-state.js';

const gapQuestion = gap => gap.q || (gap.qa ? questionText(qaById(gap.qa)) : '');

const gapReason = gap => {
  const qa = gap.qa ? qaById(gap.qa) : null;
  if (qa && qa.why) return qa.why;
  if (gap.missing && gap.missing.length) return gap.missing.slice(0, 5).join(', ');
  return t('abst.generic');
};

export function spotsPage() {
  const gaps = state.gaps
    .filter(gap => view.spotsTab === 'all' || gap.status === view.spotsTab)
    .sort((a, b) => b.ts - a.ts);
  const open = state.gaps.filter(gap => gap.status === 'open');
  const clusters = {};
  open.forEach(gap => {
    const topic = (gap.qa && qaById(gap.qa)?.topic) || 'other';
    clusters[topic] = (clusters[topic] || 0) + gap.count;
  });
  const clusterList = Object.entries(clusters).sort((a, b) => b[1] - a[1]);

  return `<div class="page">
    ${pageHead(
      t('app.description'),
      t('spots.title'),
      t('spots.sub'),
      `<span class="badge warn lg">${open.length} ${esc(t('spots.open')).toLowerCase()}</span>`
    )}

    ${clusterList.length ? `<section class="panel clusters">
      <header class="panel-head"><h2>${icon('spots', 'sm')}${esc(t('spots.clusters'))}</h2><span class="muted small">${esc(t('spots.clusters.note'))}</span></header>
      <div class="bd cluster-row">
        ${clusterList.map(([topic, count]) => `<span class="cluster"><b>${esc(topicName(topic))}</b><span class="badge warn">${count}×</span></span>`).join('')}
      </div>
    </section>` : ''}

    <div class="tabs" role="tablist">
      ${['open', 'resolved', 'all'].map(tab => `<button type="button" role="tab" data-act="spots-tab" data-v="${tab}" aria-selected="${view.spotsTab === tab}">${esc(t('spots.tab.' + tab))}${tab === 'open' && open.length ? ` <span class="badge warn">${open.length}</span>` : ''}</button>`).join('')}
    </div>

    ${gaps.length ? `<section class="panel flush">
      <div class="table-wrap"><table class="table">
        <thead><tr>
          <th>${esc(t('spots.q'))}</th>
          <th class="hide-md">${esc(t('spots.reason'))}</th>
          <th class="hide-sm">${esc(t('spots.docs'))}</th>
          <th class="hide-md">${esc(t('spots.date'))}</th>
          <th>${esc(t('spots.status'))}</th>
          <th class="col-actions"><span class="sr">${esc(t('common.actions'))}</span></th>
        </tr></thead>
        <tbody>${gaps.map(gap => {
          const reason = gapReason(gap);
          const docs = ((gap.qa ? qaById(gap.qa)?.related : gap.related) || []).map(docById).filter(Boolean);
          return `<tr>
            <td>
              <b class="gap-question">${esc(gapQuestion(gap))}</b>
              ${gap.count > 1 ? `<div><span class="badge warn">${esc(t('spots.times', gap.count))}</span></div>` : ''}
            </td>
            <td class="hide-md"><div class="dim clamp-2">${esc(Array.isArray(reason) ? reason[state.lang] ?? reason[0] : reason)}</div></td>
            <td class="hide-sm">${docs.length ? docs.map(doc => `<button type="button" class="chip tiny" data-act="document" data-id="${esc(doc.id)}">${ficon(doc.type)}${esc(doc.name)}</button>`).join(' ') : '<span class="muted">—</span>'}</td>
            <td class="hide-md muted nowrap">${esc(fmtDate(gap.ts))}</td>
            <td>${gap.status === 'open' ? `<span class="badge warn">${esc(t('spots.open'))}</span>` : `<span class="badge ok">${esc(t('spots.resolved'))}</span>`}</td>
            <td class="col-actions"><div class="row-actions">
              <button type="button" class="btn sm" data-act="rerun" data-id="${esc(gap.id)}">${icon('refresh', 'xs')}${esc(t('spots.rerun'))}</button>
              <button type="button" class="btn sm ${gap.status === 'open' ? 'ghost' : ''}" data-act="resolve" data-id="${esc(gap.id)}">${icon(gap.status === 'open' ? 'check' : 'refresh', 'xs')}${esc(t(gap.status === 'open' ? 'spots.resolve' : 'spots.reopen'))}</button>
            </div></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>
    </section>
    <p class="page-note">${icon('info', 'xs')}${esc(t('spots.hint'))}</p>`
    : `<section class="panel">${emptyState('spots', t('spots.empty'), t('spots.empty.sub'), `<button type="button" class="btn" data-act="goto" data-route="/ask">${icon('ask', 'xs')}${esc(t('nav.ask'))}</button>`)}</section>`}
  </div>`;
}
