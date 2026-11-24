import { esc, ficon } from './format.js';
import { icon } from './icons.js';
import { state, t } from '../app/state.js';
import { CORPUS } from '../domain/corpus.js';

export const NAV = [
  ['/ask', 'ask', 'nav.ask'],
  ['/library', 'file', 'nav.library'],
  ['/spots', 'spots', 'nav.spots'],
  ['/coverage', 'coverage', 'nav.coverage'],
  ['/settings', 'settings', 'nav.settings'],
];

export const routeTitle = route => {
  const found = NAV.find(([path]) => path === route);
  return found ? found[2] : 'nav.ask';
};

export const pageHead = (eyebrow, title, subtitle, actions = '') => `
  <header class="page-head">
    <div class="page-head-copy">
      ${eyebrow ? `<div class="eyebrow">${esc(eyebrow)}</div>` : ''}
      <h1>${esc(title)}</h1>
      ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
    </div>
    ${actions ? `<div class="page-actions">${actions}</div>` : ''}
  </header>`;

export const composer = (id, big = false) => `
  <form class="composer ${big ? 'big' : ''}" data-form="ask" role="search">
    ${icon('search', 'sm')}
    <label class="sr" for="${id}">${esc(t('ask.label'))}</label>
    <input id="${id}" name="q" autocomplete="off" placeholder="${esc(t('ask.ph'))}" ${big ? 'autofocus' : ''}>
    <button class="btn accent" type="submit">${esc(t('ask.btn'))}${icon('arrow', 'sm')}</button>
  </form>`;

export const modeChip = () => {
  const empty = !state.settings.useDemo && !state.uploads.some(upload => upload.status === 'processed');
  const key = empty ? 'mode.empty' : state.settings.useDemo ? 'mode.demo' : 'mode.live';
  return `<span class="mode-chip ${empty ? 'empty' : state.settings.useDemo ? 'demo' : 'live'}" title="${esc(t(key + '.long'))}">
    <i></i>${esc(t(key + '.short'))}
  </span>`;
};

export const emptyState = (iconName, title, subtitle, action = '') => `
  <div class="empty">
    <div class="empty-icon">${icon(iconName, 'lg')}</div>
    <h3>${esc(title)}</h3>
    <p>${esc(subtitle)}</p>
    ${action}
  </div>`;

export const documentChip = doc => `
  <button type="button" class="chip" data-act="document" data-id="${esc(doc.id)}">
    ${ficon(doc.type)}${esc(doc.name)}
  </button>`;

export const topicName = id => {
  if (id === 'other') return t('spots.other');
  if (id === 'uploaded') return t('lib.uploaded');
  const topic = CORPUS.TOPICS.find(item => item.id === id);
  return topic ? topic.n[state.lang] ?? topic.n[0] : id;
};

export const segmented = (name, options, current, act) => `
  <div class="segmented" role="group">
    ${options.map(([value, label]) => `<button type="button" data-act="${act}" data-v="${esc(value)}" aria-pressed="${current === value}">${esc(label)}</button>`).join('')}
  </div>`;
