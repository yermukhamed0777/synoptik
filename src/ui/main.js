/**
 * Workspace controller: hash router, event delegation, the ask flow, quick
 * search, onboarding and the guided demo.
 */
import { AI } from '../ai/local.js';
import { LANGS, allChunks, citeStr, docById, files, hooks, logResult, rebuild, resetWorkspace, save, state, t } from '../app/state.js';
import { addSample, processUpload } from '../app/state.js';
import { plainAnswer, qaById, questionText, remoteAsk, validEndpoint, resolveQuestionAsync } from '../app/ask.js';
import { CORPUS } from '../domain/corpus.js';
import { esc } from './format.js';
import { icon } from './icons.js';
import { overlays, quickItems, TOUR_LENGTH } from './overlays.js';
import { view } from './view-state.js';
import { askPage } from './pages/ask.js';
import { libraryPage, libraryTable } from './pages/library.js';
import { spotsPage } from './pages/spots.js';
import { coveragePage } from './pages/coverage.js';
import { settingsPage } from './pages/settings.js';
import { shell } from './shell.js';

const ROUTES = ['/ask', '/library', '/spots', '/coverage', '/settings'];
const root = document.getElementById('app');
const overlayRoot = document.getElementById('overlays');
const toasts = document.getElementById('toasts');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/* ---------- rendering ---------- */

const pageFor = route => {
  switch (route) {
    case '/library': return libraryPage();
    case '/spots': return spotsPage();
    case '/coverage': return coveragePage();
    case '/settings': return settingsPage();
    default: return askPage();
  }
};

function applyTheme() {
  const dark = state.theme === 'dark' || (state.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.lang = LANGS[state.lang].code;
  document.title = `${t('app.name')} — ${t('app.tagline')}`;
}

function renderOverlays() {
  const active = document.activeElement;
  if (!view.lastFocus && !root.inert && root.contains(active)) view.lastFocus = active;
  overlayRoot.innerHTML = overlays();
  const dialogs = [...overlayRoot.querySelectorAll('[role="dialog"]')];
  const modal = dialogs.filter(d => d.getAttribute('aria-modal') === 'true').at(-1);
  root.inert = !!modal;
  dialogs.forEach(d => { d.inert = !!modal && d !== modal && !d.matches('.coach'); });
  if (modal) (modal.querySelector('#quick-input, #onboard-next') || modal.querySelector('button, input'))?.focus();
  else if (view.lastFocus?.isConnected) { view.lastFocus.focus(); view.lastFocus = null; }
}

function render({ preserveScroll = true } = {}) {
  const active = document.activeElement;
  const keep = active && active.id && root.contains(active) && active.tagName === 'INPUT'
    ? { id: active.id, value: active.value, caret: active.selectionStart }
    : null;
  const scrollY = window.scrollY;
  applyTheme();
  root.innerHTML = shell(pageFor(view.route));
  if (keep) {
    const element = document.getElementById(keep.id);
    if (element) {
      element.value = keep.value;
      element.focus();
      try {
        element.setSelectionRange(keep.caret, keep.caret);
      } catch {
        /* non-text inputs do not support selection */
      }
    }
  }
  if (preserveScroll) window.scrollTo(0, scrollY);
  renderOverlays();
}

function toast(message, kind = '') {
  if (!toasts) return;
  const element = document.createElement('div');
  element.className = 'toast ' + kind;
  element.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  element.innerHTML = `${icon(kind === 'error' ? 'warn' : 'check', 'xs')}<span>${esc(message)}</span>`;
  while (toasts.children.length > 3) toasts.firstChild.remove();
  toasts.appendChild(element);
  setTimeout(() => element.remove(), 3600);
}

function currentRoute() {
  const hash = location.hash.replace(/^#/, '');
  return ROUTES.includes(hash) ? hash : '/ask';
}

function go(route) {
  if (currentRoute() === route) {
    view.route = route;
    render();
    return;
  }
  location.hash = route;
}

function route() {
  view.route = currentRoute();
  view.navOpen = false;
  if (!state.onboarded && view.onboard == null && view.tour == null) view.onboard = 0;
  render({ preserveScroll: false });
  window.scrollTo(0, 0);
}

/* ---------- ask ---------- */

async function ask(question, qaId = null) {
  const text = (question || '').trim();
  if (!text) return;
  if (view.route !== '/ask') {
    view.drawer = null;
    go('/ask');
    await sleep(40);
  }
  const turn = { id: 't' + ++view.seq + Date.now(), q: text, qa: qaId, qaClick: !!qaId, state: 'loading', step: 0 };
  view.thread.push(turn);
  render();
  const section = () => document.querySelector(`[data-turn="${turn.id}"]`);
  section()?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  let result;
  let error;
  try {
    result = state.settings.endpoint ? await remoteAsk(text) : await resolveQuestionAsync(text, qaId);
  } catch (caught) {
    error = caught;
  }


  if (error) {
    turn.state = 'error';
    turn.error = String(error.message || error);
  } else {
    turn.result = result;
    turn.state = 'done';
    logResult(turn);
  }
  render();
  section()?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('ask-in')?.focus({ preventScroll: true });
}

/* ---------- quick search ---------- */

function openQuick() {
  view.quick = { q: '', sel: 0 };
  renderOverlays();
}

function closeOverlay() {
  if (view.quick) view.quick = null;
  else if (view.confirm) view.confirm = null;
  else if (view.drawer) view.drawer = null;
  else if (view.onboard != null) {
    view.onboard = null;
    state.onboarded = true;
    save();
  } else if (view.tour != null) { endTour(); return true; }
  else if (view.navOpen) { view.navOpen = false; render(); root.querySelector('.menu-btn')?.focus(); return true; }
  else return false;
  renderOverlays();
  return true;
}

function runQuickItem(index) {
  const item = quickItems()[index];
  if (!item) return;
  view.quick = null;
  if (item.action.act === 'ask') ask(item.action.q, item.action.qa || null);
  else if (item.action.act === 'document') {
    view.drawer = { type: 'document', id: item.action.id };
    renderOverlays();
  } else go(item.action.route);
}

/* ---------- guided demo ---------- */

let tourBackup = null;

function startTour() {
  if (view.tour != null) return;
  tourBackup = { useDemo: state.settings.useDemo, scripted: state.settings.scripted };
  state.settings.useDemo = true;
  state.settings.scripted = true;
  view.thread = [];
  view.drawer = null;
  view.onboard = null;
  view.quick = null;
  view.tour = 0;
  view.tourStarted = Date.now();
  state.onboarded = true;
  save();
  rebuild();
  go('/ask');
  render();
}

function endTour() {
  view.tour = null;
  view.tourBusy = false;
  if (tourBackup) {
    state.settings.useDemo = tourBackup.useDemo;
    state.settings.scripted = tourBackup.scripted;
    save();
  }
  tourBackup = null;
  rebuild();
  render();
}

async function tourNext() {
  const step = view.tour;
  if (step == null || view.tourBusy) return;
  view.tourBusy = true;
  renderOverlays();

  if (step === 0) await ask(questionText(qaById('q-price-x5')), 'q-price-x5');
  else if (step === 1) {
    const turn = view.thread[view.thread.length - 1];
    if (turn?.result?.evidence?.length) view.drawer = { type: 'source', turn: turn.id, index: 0 };
    renderOverlays();
  } else if (step === 2) {
    view.drawer = null;
    renderOverlays();
    await ask(questionText(qaById('q-facade')), 'q-facade');
  } else if (step === 3) {
    view.drawer = null;
    renderOverlays();
    await ask(questionText(qaById('x-intl')), 'x-intl');
  } else if (step === 4) go('/spots');
  else if (step === 5) go('/coverage');

  view.tourBusy = false;
  if (view.tour !== step) return;
  if (step >= TOUR_LENGTH - 1) endTour();
  else {
    view.tour = step + 1;
    renderOverlays();
  }
}

/* ---------- helpers ---------- */

async function copyText(text, message) {
  let ok = false;
  try {
    await navigator.clipboard.writeText(text);
    ok = true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    try {
      ok = document.execCommand('copy');
    } catch {
      /* clipboard unavailable */
    }
    area.remove();
  }
  toast(ok ? message : t('common.copyfailed'), ok ? '' : 'error');
}

const turnById = id => view.thread.find(turn => turn.id === id);

function evidenceText(turn, index) {
  const evidence = turn.result.evidence[index];
  const doc = docById(evidence.chunk.doc);
  const chunk = evidence.chunk;
  const lines = evidence.lines
    .map(lineIndex => (Array.isArray(chunk.lines[lineIndex]) ? chunk.lines[lineIndex][state.lang] : chunk.lines[lineIndex]))
    .join(' … ');
  return `${doc ? doc.name : ''} — ${citeStr(chunk)}\n"${lines}"`;
}

/* ---------- events ---------- */

document.addEventListener('click', async event => {
  const element = event.target.closest('[data-act]');
  if (!element) return;
  if (root.contains(element)) view.lastFocus = element;
  const action = element.dataset.act;
  const data = element.dataset;
  if (element.tagName === 'A' && ['goto', 'ask', 'document'].includes(action)) event.preventDefault();

  switch (action) {
    case 'lang':
      state.lang = Number(data.i);
      view.thread.forEach(turn => {
        if (turn.qaClick && turn.qa) turn.q = questionText(qaById(turn.qa));
      });
      save();
      if (state.settings.ai && AI.ready()) AI.indexChunks(allChunks(), state.lang);
      render();
      toast(t('toast.lang', LANGS[state.lang].name));
      break;
    case 'theme':
      state.theme = data.v;
      save();
      render();
      break;
    case 'goto':
      view.drawer = null;
      go(data.route || '/ask');
      break;
    case 'menu':
      view.navOpen = !view.navOpen;
      render();
      break;
    case 'quick':
      openQuick();
      break;
    case 'quick-run':
      runQuickItem(Number(data.i));
      break;
    case 'close':
      view.drawer = null;
      renderOverlays();
      break;
    case 'close-quick':
      view.quick = null;
      renderOverlays();
      break;
    case 'close-confirm':
      view.confirm = null;
      renderOverlays();
      break;
    case 'ask':
      view.quick = null;
      ask(data.q, data.qa || null);
      break;
    case 'source':
      view.drawer = { type: 'source', turn: data.turn, index: Number(data.i) };
      renderOverlays();
      break;
    case 'document':
      view.drawer = { type: 'document', id: data.id };
      view.quick = null;
      renderOverlays();
      break;
    case 'document-add':
      view.drawer = null;
      document.getElementById('file-input')?.click();
      break;
    case 'pick':
      document.getElementById('file-input')?.click();
      break;
    case 'sample':
      addSample();
      break;
    case 'retry': {
      const file = files.get(data.id);
      if (file) {
        view.drawer = null;
        processUpload(file, data.id);
      } else toast(t('toast.reupload'), 'error');
      break;
    }
    case 'remove':
      view.drawer = null;
      view.confirm = { id: data.id };
      renderOverlays();
      break;
    case 'confirm-run': {
      if (data.id === '__reset') {
        resetWorkspace();
        view.thread = [];
        view.confirm = null;
        view.drawer = null;
        save();
        render();
        toast(t('toast.reset'));
      } else {
        const name = (docById(data.id) || {}).name || '';
        if (CORPUS.DOCS.some(doc => doc.id === data.id)) state.removed.push(data.id);
        else state.uploads = state.uploads.filter(upload => upload.id !== data.id);
        view.confirm = null;
        save();
        rebuild();
        render();
        toast(t('toast.removed', name));
      }
      break;
    }
    case 'demo-toggle':
      state.settings.useDemo = !state.settings.useDemo;
      view.thread = [];
      save();
      rebuild();
      render();
      toast(t(state.settings.useDemo ? 'toast.demo.on' : 'toast.demo.off'));
      break;
    case 'demo-on':
      state.settings.useDemo = true;
      state.settings.scripted = true;
      save();
      rebuild();
      render();
      break;
    case 'restore-demo':
      state.removed = [];
      state.settings.useDemo = true;
      save();
      rebuild();
      render();
      toast(t('toast.restored'));
      break;
    case 'scripted-toggle':
      state.settings.scripted = !state.settings.scripted;
      view.thread = [];
      save();
      render();
      toast(t(state.settings.scripted ? 'toast.scripted.on' : 'toast.scripted.off'));
      break;
    case 'details-toggle':
      state.settings.details = !state.settings.details;
      save();
      render();
      break;
    case 'max-sources':
      state.settings.maxSources = Number(data.v);
      save();
      render();
      break;
    case 'resolve': {
      const gap = state.gaps.find(item => item.id === data.id);
      if (gap) {
        gap.status = gap.status === 'open' ? 'resolved' : 'open';
        save();
        render();
        toast(t(gap.status === 'resolved' ? 'toast.resolved' : 'toast.reopened'));
      }
      break;
    }
    case 'rerun': {
      const gap = state.gaps.find(item => item.id === data.id);
      if (gap) ask(gap.q || questionText(qaById(gap.qa)), gap.qa || null);
      break;
    }
    case 'ai-toggle': {
      if (state.settings.ai) {
        state.settings.ai = false;
        AI.disable();
        save();
        render();
        toast(t('toast.ai.off'));
        break;
      }
      state.settings.ai = true;
      save();
      render();
      toast(t('toast.ai.loading'));
      const ok = await AI.enable();
      if (ok) {
        rebuild();
        await AI.indexChunks(allChunks(), state.lang);
        toast(t('toast.ai.on'));
      } else {
        state.settings.ai = false;
        save();
        toast(t('toast.ai.fail'), 'error');
      }
      render();
      break;
    }
    case 'save-endpoint': {
      const value = document.getElementById('endpoint')?.value.trim() || '';
      if (value && !validEndpoint(value)) {
        toast(t('toast.badurl'), 'error');
        break;
      }
      state.settings.endpoint = value;
      save();
      render();
      toast(value ? t('toast.ep.on') : t('toast.ep.off'));
      break;
    }
    case 'reset':
      view.confirm = { reset: true };
      renderOverlays();
      break;
    case 'tour':
      startTour();
      break;
    case 'tour-next':
      tourNext();
      break;
    case 'tour-end':
      endTour();
      break;
    case 'onboard-next':
      if (view.onboard >= 2) {
        view.onboard = null;
        state.onboarded = true;
        save();
        renderOverlays();
      } else {
        view.onboard += 1;
        renderOverlays();
      }
      break;
    case 'onboard-skip':
      view.onboard = null;
      state.onboarded = true;
      save();
      renderOverlays();
      break;
    case 'clear-thread':
      view.thread = [];
      render();
      break;
    case 'lib-type':
      view.libType = data.v;
      render();
      break;
    case 'spots-tab':
      view.spotsTab = data.v;
      render();
      break;
    case 'feedback': {
      const current = state.feedback[data.turn];
      if (current === data.v) delete state.feedback[data.turn];
      else state.feedback[data.turn] = data.v;
      save();
      render();
      if (state.feedback[data.turn]) toast(t(data.v === 'report' ? 'ans.reported' : 'ans.thanks'));
      break;
    }
    case 'copy': {
      const turn = turnById(data.turn);
      if (turn?.result) copyText(plainAnswer(turn, t, citeStr), t('common.copied'));
      break;
    }
    case 'copy-cites': {
      const turn = turnById(data.turn);
      if (turn?.result) {
        copyText(
          turn.result.evidence.map((evidence, index) => `[${index + 1}] ${citeStr(evidence.chunk)}`).join('\n'),
          t('toast.citecopied')
        );
      }
      break;
    }
    case 'copy-evidence': {
      const turn = turnById(data.turn);
      if (turn?.result) copyText(evidenceText(turn, Number(data.i)), t('toast.citecopied'));
      break;
    }
    case 'share': {
      const turn = turnById(data.turn);
      if (turn?.result) copyText(`${t('app.name')}\n${plainAnswer(turn, t, citeStr)}`, t('toast.shared'));
      break;
    }
  }
});

document.addEventListener('submit', event => {
  const form = event.target.closest('[data-form="ask"]');
  if (!form) return;
  event.preventDefault();
  const input = form.querySelector('input');
  const value = input.value;
  input.value = '';
  ask(value, null);
});

document.addEventListener('input', event => {
  const id = event.target.id;
  if (id === 'library-search') {
    view.libQuery = event.target.value;
    const body = document.getElementById('library-body');
    if (body) body.innerHTML = libraryTable();
  } else if (id === 'threshold') {
    state.settings.threshold = event.target.value / 100;
    const label = document.getElementById('threshold-value');
    if (label) label.textContent = event.target.value + '%';
  } else if (id === 'sem-threshold') {
    state.settings.semThreshold = event.target.value / 100;
    const label = document.getElementById('sem-threshold-value');
    if (label) label.textContent = event.target.value + '%';
  } else if (id === 'quick-input') {
    view.quick.q = event.target.value;
    view.quick.sel = 0;
    const caret = event.target.selectionStart;
    renderOverlays();
    const input = document.getElementById('quick-input');
    if (input) {
      input.focus();
      input.setSelectionRange(caret, caret);
    }
  }
});

document.addEventListener('change', event => {
  const id = event.target.id;
  if (id === 'threshold' || id === 'sem-threshold') save();
  else if (id === 'library-status') {
    view.libStatus = event.target.value;
    render();
  } else if (id === 'file-input') {
    [...event.target.files].forEach(file => processUpload(file));
    event.target.value = '';
  }
});

document.addEventListener('keydown', event => {
  const dialog = [...overlayRoot.querySelectorAll('[aria-modal="true"]')].at(-1);
  if (dialog && event.key === 'Tab') {
    const controls = [...dialog.querySelectorAll('button:not(:disabled), input, a[href], select, textarea')].filter(el => el.getClientRects().length);
    const edge = event.shiftKey ? controls[0] : controls.at(-1);
    if (edge && document.activeElement === edge) { event.preventDefault(); (event.shiftKey ? controls.at(-1) : controls[0]).focus(); }
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    if (view.quick) view.quick = null;
    else view.quick = { q: '', sel: 0 };
    renderOverlays();
    return;
  }
  if (event.key === 'Escape' && closeOverlay()) {
    event.preventDefault();
    return;
  }
  if (view.quick) {
    const items = quickItems();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      view.quick.sel = (view.quick.sel + 1) % Math.max(1, items.length);
      renderOverlays();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      view.quick.sel = (view.quick.sel - 1 + items.length) % Math.max(1, items.length);
      renderOverlays();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      runQuickItem(view.quick.sel);
    }
  } else if ((event.key === 'Enter' || event.key === ' ') && event.target.id === 'dropzone') {
    event.preventDefault();
    document.getElementById('file-input')?.click();
  }
});

['dragover', 'drop'].forEach(type =>
  window.addEventListener(type, event => {
    if (!event.dataTransfer || ![...event.dataTransfer.types].includes('Files')) return;
    event.preventDefault();
    const zone = event.target.closest && event.target.closest('#dropzone');
    document.getElementById('dropzone')?.classList.toggle('over', type === 'dragover' && !!zone);
    if (type === 'drop' && zone) [...event.dataTransfer.files].forEach(file => processUpload(file));
  })
);

window.addEventListener('hashchange', route);
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => state.theme === 'system' && applyTheme());

/* ---------- boot ---------- */

hooks.refresh = () => render();
hooks.toast = toast;

state.uploads.forEach(upload => {
  if (upload.status === 'processing') {
    upload.status = 'failed';
    upload.error = 'interrupted';
  }
});

route();

setInterval(() => {
  const clock = document.getElementById('tour-clock');
  if (clock && view.tour != null) {
    const elapsed = Math.floor((Date.now() - (view.tourStarted || Date.now())) / 1000);
    const remaining = Math.max(0, 180 - elapsed);
    if (!remaining) { endTour(); return; }
    clock.textContent = Math.floor(remaining / 60) + ':' + String(remaining % 60).padStart(2, '0');
  }
}, 1000);

if (state.settings.ai) {
  AI.enable().then(ok => ok && AI.indexChunks(allChunks(), state.lang));
}

AI.on(() => {
  const status = document.getElementById('ai-status');
  if (!status) return;
  const runtime = AI.runtime;
  status.textContent =
    runtime.status === 'ready' ? t('ai.ready') : runtime.status === 'loading' ? t('ai.loading', runtime.progress) : runtime.status === 'error' ? t('ai.error') : t('ai.off');
});
