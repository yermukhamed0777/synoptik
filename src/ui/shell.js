import { state, t } from '../app/state.js';
import { esc, langSwitch, logo } from './format.js';
import { icon } from './icons.js';
import { modeChip, NAV, routeTitle } from './components.js';
import { view } from './view-state.js';

export function shell(content) {
  const openSpots = state.gaps.filter(gap => gap.status === 'open').length;
  return `<div class="shell">
    <aside class="rail ${view.navOpen ? 'open' : ''}" aria-label="${esc(t('nav.main'))}">
      ${logo('./index.html')}
      <nav class="rail-nav">
        ${NAV.map(([route, iconName, label]) => `<a class="rail-link" href="#${route}" ${view.route === route ? 'aria-current="page"' : ''}>
          ${icon(iconName, 'sm')}<span>${esc(t(label))}</span>
          ${route === '/spots' && openSpots ? `<span class="badge warn">${openSpots}</span>` : ''}
        </a>`).join('')}
      </nav>
      <div class="rail-spacer"></div>
      <button type="button" class="btn rail-demo" data-act="tour">${icon('play', 'xs')}${esc(t('set.tour.start'))}</button>
      <div class="rail-foot">
        ${langSwitch()}
        <a class="rail-site" href="./index.html">${esc(t('nav.site'))}${icon('arrow', 'xs')}</a>
      </div>
    </aside>

    <div class="main">
      <header class="topbar">
        <button type="button" class="btn ghost icon menu-btn" data-act="menu" aria-label="${esc(t('nav.menu'))}">${icon('menu', 'sm')}</button>
        <span class="topbar-title">${esc(t(routeTitle(view.route)))}</span>
        <span class="grow"></span>
        <button type="button" class="search-btn" data-act="quick">${icon('search', 'xs')}<span>${esc(t('common.search'))}</span><kbd>Ctrl K</kbd></button>
        ${modeChip()}
      </header>
      ${content}
    </div>
  </div>`;
}
