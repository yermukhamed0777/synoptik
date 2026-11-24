import { AI } from '../../ai/local.js';
import { state, t } from '../../app/state.js';
import { LANGS } from '../../i18n/index.js';
import { esc } from '../format.js';
import { pageHead } from '../components.js';
import { icon } from '../icons.js';

const row = (title, description, control) => `
  <div class="setting-row">
    <div class="setting-copy"><b>${esc(title)}</b>${description ? `<p>${esc(description)}</p>` : ''}</div>
    <div class="setting-control">${control}</div>
  </div>`;

const toggle = (act, on, label) =>
  `<button type="button" class="switch" role="switch" aria-checked="${on}" aria-label="${esc(label)}" data-act="${act}"></button>`;

function aiStatus() {
  const runtime = AI.runtime;
  if (runtime.status === 'loading') return t('ai.loading', runtime.progress);
  if (runtime.status === 'ready') return runtime.indexing ? t('ai.indexing') : t('ai.ready');
  if (runtime.status === 'error') return t('ai.error');
  return t('ai.off');
}

export function settingsPage() {
  const settings = state.settings;
  return `<div class="page narrow">
    ${pageHead(t('app.description'), t('set.title'), t('set.sub'))}

    <section class="panel">
      <header class="panel-head"><h2>${esc(t('set.lang'))}</h2></header>
      <div class="panel-body">
        ${row(t('set.lang'), t('set.lang.d'), `<div class="segmented">${LANGS.map((lang, index) => `<button type="button" data-act="lang" data-i="${index}" aria-pressed="${state.lang === index}" lang="${lang.code}">${esc(lang.name)}</button>`).join('')}</div>`)}
        ${row(t('set.theme'), '', `<div class="segmented">${['light', 'dark', 'system'].map(theme => `<button type="button" data-act="theme" data-v="${theme}" aria-pressed="${state.theme === theme}">${esc(t('theme.' + theme))}</button>`).join('')}</div>`)}
      </div>
    </section>

    <section class="panel">
      <header class="panel-head"><h2>${esc(t('set.evidence'))}</h2></header>
      <div class="panel-body">
        ${row(t('set.threshold'), t('set.threshold.d'), `<div class="range-row"><input id="threshold" type="range" min="30" max="90" step="5" value="${Math.round(settings.threshold * 100)}" aria-label="${esc(t('set.threshold'))}"><b id="threshold-value">${Math.round(settings.threshold * 100)}%</b></div>`)}
        ${row(t('set.max'), t('set.max.d'), `<div class="segmented">${[2, 3, 4, 5].map(value => `<button type="button" data-act="max-sources" data-v="${value}" aria-pressed="${settings.maxSources === value}">${value}</button>`).join('')}</div>`)}
        ${row(t('set.details'), t('set.details.d'), toggle('details-toggle', settings.details, t('set.details')))}
      </div>
    </section>

    <section class="panel">
      <header class="panel-head"><h2>${esc(t('set.data'))}</h2></header>
      <div class="panel-body">
        ${row(t('set.usedemo'), t('set.usedemo.d'), toggle('demo-toggle', settings.useDemo, t('set.usedemo')))}
        ${row(t('set.scripted'), t('set.scripted.d'), toggle('scripted-toggle', settings.scripted, t('set.scripted')))}
        ${state.removed.length ? row(t('set.restore'), '', `<button type="button" class="btn sm" data-act="restore-demo">${icon('refresh', 'xs')}${esc(t('set.restore'))}</button>`) : ''}
      </div>
    </section>

    <section class="panel">
      <header class="panel-head"><h2>${esc(t('set.local'))}</h2><span class="muted small" id="ai-status">${esc(aiStatus())}</span></header>
      <div class="panel-body">
        ${row(t('set.ai'), t('set.ai.d'), toggle('ai-toggle', settings.ai, t('set.ai')))}
        ${settings.ai ? row(t('set.semthr'), t('set.semthr.d'), `<div class="range-row"><input id="sem-threshold" type="range" min="75" max="95" step="1" value="${Math.round(settings.semThreshold * 100)}" aria-label="${esc(t('set.semthr'))}"><b id="sem-threshold-value">${Math.round(settings.semThreshold * 100)}%</b></div>`) : ''}
      </div>
    </section>

    <section class="panel">
      <header class="panel-head"><h2>${esc(t('set.backend'))}</h2><span class="badge ${settings.endpoint ? 'info' : ''}">${esc(settings.endpoint ? t('set.be.on') : t('set.be.off'))}</span></header>
      <div class="panel-body">
        ${row(t('set.endpoint'), t('set.endpoint.d'), `<div class="endpoint-row"><input id="endpoint" class="input" type="url" inputmode="url" placeholder="${esc(t('set.endpoint.ph'))}" value="${esc(settings.endpoint)}" aria-label="${esc(t('set.endpoint'))}"><button type="button" class="btn" data-act="save-endpoint">${esc(t('set.saveurl'))}</button></div>`)}
      </div>
    </section>

    <section class="panel">
      <header class="panel-head"><h2>${esc(t('set.demo'))}</h2></header>
      <div class="panel-body">
        ${row(t('set.demo'), t('set.demo.d'), `<button type="button" class="btn" data-act="tour">${icon('play', 'xs')}${esc(t('set.tour.start'))}</button>`)}
      </div>
    </section>

    <section class="panel">
      <header class="panel-head"><h2>${esc(t('set.about'))}</h2></header>
      <div class="panel-body">
        <p class="dim">${esc(t('set.about.d'))}</p>
      </div>
    </section>

    <section class="panel danger-panel">
      <header class="panel-head"><h2>${esc(t('set.reset'))}</h2></header>
      <div class="panel-body">
        ${row(t('set.reset'), t('set.reset.d'), `<button type="button" class="btn danger" data-act="reset">${icon('trash', 'xs')}${esc(t('set.reset.btn'))}</button>`)}
      </div>
    </section>
  </div>`;
}
