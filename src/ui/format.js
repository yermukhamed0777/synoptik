import { LANGS } from '../i18n/index.js';
import { icon, LOGO } from './icons.js';
import { pick, state, t } from '../app/state.js';

export const esc = value =>
  String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export const logo = (href = './index.html') =>
  `<a class="brand" href="${href}" aria-label="${esc(t('app.name'))} — ${esc(t('app.tagline'))}">${LOGO}<span class="brand-word">${esc(t('app.name'))}</span></a>`;

export const langSwitch = (extra = '') => `
  <div class="lang-switch ${extra}" role="group" aria-label="${esc(t('lang.label'))}">
    ${LANGS.map((lang, index) => `<button type="button" data-act="lang" data-i="${index}" aria-pressed="${index === state.lang}" lang="${lang.code}" title="${esc(lang.name)}">${lang.short}</button>`).join('')}
  </div>`;

export const fmtDate = timestamp => new Date(timestamp).toLocaleDateString(LANGS[state.lang].locale, { day: 'numeric', month: 'short', year: 'numeric' });
export const fmtTime = timestamp => new Date(timestamp).toLocaleTimeString(LANGS[state.lang].locale, { hour: '2-digit', minute: '2-digit' });
export const fmtNum = value => Number(value).toLocaleString(LANGS[state.lang].locale);
export const fmtSize = bytes =>
  bytes < 1024 ? bytes + ' B' : bytes < 1048576 ? (bytes / 1024).toFixed(0) + ' KB' : (bytes / 1048576).toFixed(1) + ' MB';

export const ficon = type =>
  `<span class="file-tag ${esc(type)}" aria-hidden="true">${esc(String(type).toUpperCase().slice(0, 3))}</span>`;

export function statusBadge(doc) {
  if (doc.status === 'processed') return `<span class="badge ok">${icon('check', 'xs')}${esc(t('st.processed'))}${doc.ocr ? ' · OCR' : ''}</span>`;
  if (doc.status === 'processing') return `<span class="badge info">${esc(t('st.processing'))} ${doc.progress}%</span>`;
  return `<span class="badge bad">${esc(t('st.failed'))}</span>`;
}

export function strengthMeter(strength) {
  const level = strength === 'strong' ? 3 : strength === 'moderate' ? 2 : 1;
  return `<span class="strength s${level}" title="${esc(t('ans.strength.hint'))}">
    <i></i><i></i><i></i><span>${esc(t('strength.' + strength))}</span>
  </span>`;
}

export const translationOf = question => pick(question.q);
