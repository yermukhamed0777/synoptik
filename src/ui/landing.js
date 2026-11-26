/* Synoptik marketing site. Small, dependency-free, trilingual. */
import { BRAND } from '../brand.js';
import { DICTS, LANGS } from '../i18n/index.js';
import { icon, LOGO } from './icons.js';

const STORE_KEY = 'synoptik.state.v1';
const site = document.getElementById('site');

let lang = 0;
let theme = 'system';

function loadPreferences() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if ([0, 1, 2].includes(parsed.lang)) lang = parsed.lang;
    if (['light', 'dark', 'system'].includes(parsed.theme)) theme = parsed.theme;
  } catch {
    /* first visit */
  }
}

function persist(patch) {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    localStorage.setItem(STORE_KEY, JSON.stringify({ ...parsed, ...patch }));
  } catch {
    /* storage can be unavailable; the site still works */
  }
}

const t = (key, ...args) => {
  const row = DICTS[lang]?.[key] ?? DICTS[0][key] ?? key;
  return args.length ? String(row).replace(/\{(\d)\}/g, (_, index) => args[Number(index)] ?? '') : row;
};

const esc = value =>
  String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function applyTheme() {
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.lang = LANGS[lang].code;
  document.title = `${BRAND.name} — ${t('app.tagline')}`;
}

const langSwitch = () => `
  <div class="lang-switch" role="group" aria-label="${esc(t('lang.label'))}">
    ${LANGS.map((item, index) => `<button type="button" class="lang-btn" data-lang="${index}" aria-pressed="${index === lang}" lang="${item.code}">${item.short}</button>`).join('')}
  </div>`;

const themeButton = () => `
  <button type="button" class="icon-btn" data-theme-toggle aria-label="${esc(t('set.theme'))}" title="${esc(t('set.theme'))}">
    ${icon(theme === 'dark' ? 'sun' : 'moon', 'sm')}
  </button>`;

const receipt = () => `
  <div class="receipt" role="figure" aria-label="${esc(t('lp.receipt.title'))}">
    <div class="receipt-head">
      <span class="receipt-index">${esc(t('ans.evidence'))} / 01</span>
      <span class="badge ok">${icon('check', 'xs')}${esc(t('lp.receipt.conf'))}</span>
    </div>
    <p class="receipt-question">${esc(t('lp.receipt.q'))}</p>
    <p class="receipt-answer">${esc(t('lp.receipt.a'))}</p>
    <div class="receipt-source">
      ${icon('file', 'xs')}
      <span>${esc(t('lp.receipt.src'))}</span>
    </div>
    <div class="receipt-excerpt"><mark>${esc(t('lp.receipt.a'))}</mark></div>
    <p class="receipt-note">${esc(t('lp.receipt.note'))}</p>
    <div class="receipt-foot">
      <span>${esc(t('lp.receipt.caption'))}</span>
      <a class="text-link" href="./app.html">${esc(t('lp.cta'))}${icon('arrow', 'xs')}</a>
    </div>
  </div>`;

const problem = () => `
  <section class="section" id="problem">
    <div class="wrap">
      <div class="section-head">
        <div class="eyebrow">${esc(t('lp.problem.eyebrow'))}</div>
        <h2>${esc(t('lp.problem.h'))}</h2>
        <p class="section-sub">${esc(t('lp.problem.sub'))}</p>
      </div>
      <div class="three-col">
        ${[1, 2, 3].map(index => `
          <article class="feature">
            <span class="feature-index">0${index}</span>
            <h3>${esc(t(`lp.problem.${index}.t`))}</h3>
            <p>${esc(t(`lp.problem.${index}.d`))}</p>
          </article>`).join('')}
      </div>
    </div>
  </section>`;

const how = () => `
  <section class="section band" id="how">
    <div class="wrap">
      <div class="section-head">
        <div class="eyebrow">${esc(t('lp.how.eyebrow'))}</div>
        <h2>${esc(t('lp.how.h'))}</h2>
        <p class="section-sub">${esc(t('lp.how.sub'))}</p>
      </div>
      <ol class="steps">
        ${[1, 2, 3, 4].map(index => `
          <li class="step-card">
            <span class="step-number">0${index}</span>
            <span class="step-icon">${icon(['upload', 'search', 'check', 'quote'][index - 1], 'sm')}</span>
            <h3>${esc(t(`lp.how.${index}.t`))}</h3>
            <p>${esc(t(`lp.how.${index}.d`))}</p>
          </li>`).join('')}
      </ol>
    </div>
  </section>`;

const spots = () => `
  <section class="section" id="spots">
    <div class="wrap split">
      <div class="split-copy">
        <div class="eyebrow">${esc(t('lp.spots.eyebrow'))}</div>
        <h2>${esc(t('lp.spots.h'))}</h2>
        <p class="section-sub">${esc(t('lp.spots.sub'))}</p>
        <ul class="check-list">
          ${[1, 2, 3].map(index => `<li>${icon('check', 'xs')}<span>${esc(t(`lp.spots.${index}`))}</span></li>`).join('')}
        </ul>
      </div>
      <aside class="ledger" aria-label="${esc(t('lp.spots.card.title'))}">
        <div class="ledger-head">
          <span class="eyebrow">${esc(t('lp.spots.card.title'))}</span>
          <span class="badge warn">3</span>
        </div>
        ${[1, 2, 3].map(index => `
          <div class="ledger-row">
            <span class="ledger-num">0${index}</span>
            <span class="grow">${esc(t(`lp.spots.card.${index}`))}</span>
            <span class="ledger-status">${icon('spots', 'xs')}</span>
          </div>`).join('')}
        <p class="ledger-note">${esc(t('lp.spots.card.note'))}</p>
      </aside>
    </div>
  </section>`;

const compare = () => `
  <section class="section band">
    <div class="wrap">
      <div class="section-head">
        <div class="eyebrow">${esc(t('lp.compare.eyebrow'))}</div>
        <h2>${esc(t('lp.compare.h'))}</h2>
      </div>
      <div class="table-wrap">
        <table class="compare">
          <thead>
            <tr><th></th><th>${esc(t('lp.compare.col1'))}</th><th class="ours">${esc(t('lp.compare.col2'))}</th></tr>
          </thead>
          <tbody>
            ${[1, 2, 3, 4, 5].map(index => `
              <tr>
                <th scope="row">${esc(t(`lp.compare.r${index}`))}</th>
                <td>${esc(t(`lp.compare.r${index}a`))}</td>
                <td class="ours">${icon('check', 'xs')}${esc(t(`lp.compare.r${index}b`))}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </section>`;

const security = () => `
  <section class="section" id="privacy">
    <div class="wrap">
      <div class="section-head">
        <div class="eyebrow">${esc(t('lp.secure.eyebrow'))}</div>
        <h2>${esc(t('lp.secure.h'))}</h2>
      </div>
      <div class="four-col">
        ${[
          ['lock', 1],
          ['info', 2],
          ['eye', 3],
          ['layers', 4],
        ].map(([iconName, index]) => `
          <article class="feature small">
            <span class="feature-icon">${icon(iconName, 'sm')}</span>
            <h3>${esc(t(`lp.secure.${index}.t`))}</h3>
            <p>${esc(t(`lp.secure.${index}.d`))}</p>
          </article>`).join('')}
      </div>
    </div>
  </section>`;

const useCases = () => `
  <section class="section band">
    <div class="wrap">
      <div class="section-head">
        <div class="eyebrow">${esc(t('lp.use.eyebrow'))}</div>
        <h2>${esc(t('lp.use.h'))}</h2>
      </div>
      <div class="three-col">
        ${[1, 2, 3].map(index => `
          <article class="feature">
            <span class="feature-icon">${icon(['book', 'target', 'globe'][index - 1], 'sm')}</span>
            <h3>${esc(t(`lp.use.${index}.t`))}</h3>
            <p>${esc(t(`lp.use.${index}.d`))}</p>
          </article>`).join('')}
      </div>
    </div>
  </section>`;

const cta = () => `
  <section class="cta-section">
    <div class="wrap cta-inner">
      <div>
        <h2>${esc(t('lp.cta.h'))}</h2>
        <p>${esc(t('lp.cta.sub'))}</p>
      </div>
      <a class="btn accent lg" href="./app.html">${icon('play', 'sm')}${esc(t('lp.cta'))}</a>
    </div>
  </section>`;

const header = () => `
  <header class="site-header">
    <div class="wrap header-inner">
      <a class="brand" href="./index.html" aria-label="${esc(BRAND.name)}">
        ${LOGO}<span class="brand-word">${esc(BRAND.name)}</span>
      </a>
      <nav class="site-nav" aria-label="${esc(t('nav.main'))}">
        <a href="#how">${esc(t('lp.nav.how'))}</a>
        <a href="#spots">${esc(t('lp.nav.idk'))}</a>
        <a href="#privacy">${esc(t('lp.nav.sec'))}</a>
      </nav>
      <div class="header-actions">
        ${langSwitch()}
        ${themeButton()}
        <a class="btn accent" href="./app.html">${esc(t('lp.cta'))}</a>
      </div>
    </div>
  </header>`;

const footer = () => `
  <footer class="site-footer">
    <div class="wrap footer-inner">
      <div class="footer-brand">
        ${LOGO}
        <div><b>${esc(BRAND.name)}</b><span>${esc(t('app.tagline'))}</span></div>
      </div>
      <p class="footer-note">${esc(t('lp.foot.demo'))}</p>
      <p class="footer-meta">${esc(t('lp.foot.terms'))} · © ${BRAND.year} ${esc(BRAND.name)}</p>
    </div>
  </footer>`;

function page() {
  return `${header()}
    <main>
      <section class="hero">
        <svg class="contours" viewBox="0 0 900 700" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
          <g fill="none" stroke="currentColor" stroke-width="1">
            <path d="M-40 560C140 470 220 300 420 250s300-40 520 80"/>
            <path d="M-40 620C160 540 260 370 450 320s320-30 540 100"/>
            <path d="M-40 680C180 610 300 440 480 390s340-20 560 120"/>
            <path d="M620-40C560 120 640 220 780 260s160 40 200 140"/>
            <path d="M690-40C640 110 710 190 830 230s130 30 170 120"/>
          </g>
        </svg>
        <div class="wrap hero-grid">
          <div class="hero-copy">
            <div class="eyebrow">${esc(t('lp.eyebrow'))}</div>
            <h1>${esc(t('lp.h1a'))}<br><em>${esc(t('lp.h1b'))}</em></h1>
            <p class="lead">${esc(t('lp.lead'))}</p>
            <div class="hero-actions">
              <a class="btn accent lg" href="./app.html">${icon('play', 'sm')}${esc(t('lp.cta'))}</a>
              <a class="btn lg" href="./app.html#/ask">${esc(t('lp.cta2'))}${icon('arrow', 'xs')}</a>
            </div>
            <p class="hero-note">${icon('lock', 'xs')}${esc(t('lp.note'))}</p>
          </div>
          <div class="hero-visual">${receipt()}</div>
        </div>
      </section>
      ${problem()}
      ${how()}
      ${spots()}
      ${compare()}
      ${security()}
      ${useCases()}
      ${cta()}
    </main>
    ${footer()}`;
}

function render() {
  applyTheme();
  site.innerHTML = page();
}

site.addEventListener('click', event => {
  const langButton = event.target.closest('[data-lang]');
  if (langButton) {
    lang = Number(langButton.dataset.lang);
    persist({ lang });
    render();
    return;
  }
  if (event.target.closest('[data-theme-toggle]')) {
    const dark = document.documentElement.dataset.theme === 'dark';
    theme = dark ? 'light' : 'dark';
    persist({ theme });
    render();
  }
});

matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
  if (theme === 'system') render();
});

loadPreferences();
render();
