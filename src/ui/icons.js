/* Inline SVG icons. A small, fixed set keeps the bundle dependency-free. */
const PATHS = {
  search: '<circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4.2-4.2"/>',
  file: '<path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h5"/><path d="M9 13h6M9 17h4"/>',
  upload: '<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  ask: '<path d="M21 12a8 8 0 1 1-3.2-6.4"/><path d="M21 4v5h-5"/><path d="M12 8v4M12 16h.01"/>',
  spots: '<circle cx="12" cy="12" r="9" stroke-dasharray="3 3"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
  coverage: '<path d="M4 20V4"/><path d="M4 20h16"/><rect x="7" y="11" width="3" height="6"/><rect x="13" y="7" width="3" height="10"/><rect x="19" y="13" width="3" height="4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.7 9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  check: '<path d="m20 6-10 10-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2"/>',
  share: '<path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="m8 6 4-4 4 4"/><path d="M12 2v13"/>',
  arrow: '<path d="M5 12h14"/><path d="m13 5 7 7-7 7"/>',
  warn: '<path d="M10.3 4.3 2.7 17.6A2 2 0 0 0 4.4 21h15.2a2 2 0 0 0 1.7-3.4L13.7 4.3a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  spark: '<path d="m12 3-1.7 5.2a3 3 0 0 1-1.9 1.9L3 12l5.4 1.9a3 3 0 0 1 1.9 1.9L12 21l1.7-5.2a3 3 0 0 1 1.9-1.9L21 12l-5.4-1.9a3 3 0 0 1-1.9-1.9Z"/>',
  play: '<path d="M7 4.5v15l13-7.5Z"/>',
  trash: '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/><path d="M9 7V4h6v3"/>',
  refresh: '<path d="M3.5 12a8.5 8.5 0 0 1 14.6-5.9L21 9"/><path d="M21 4v5h-5"/><path d="M20.5 12a8.5 8.5 0 0 1-14.6 5.9L3 15"/><path d="M3 20v-5h5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  layers: '<path d="m12 2 9 4.5-9 4.5-9-4.5Z"/><path d="m3 12 9 4.5 9-4.5"/><path d="m3 17.5 9 4.5 9-4.5"/>',
  flag: '<path d="M4 21V4c3-2 6 2 9 0s6 0 6 0v9s-3 2-6 0-6 2-9 0"/>',
  up: '<path d="M7 11v10"/><path d="M15 4.7 14 9h6.3a2 2 0 0 1 1.9 2.6l-2.2 7.6A2 2 0 0 1 18 21H4V11h2.7a2 2 0 0 0 1.8-1.1L12 2a3 3 0 0 1 3 2.7Z"/>',
  down: '<path d="M17 13V3"/><path d="M9 19.3 10 15H3.7a2 2 0 0 1-1.9-2.6l2.2-7.6A2 2 0 0 1 6 3h12v10h-2.7a2 2 0 0 0-1.8 1.1L12 22a3 3 0 0 1-3-2.7Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8Z"/>',
  book: '<path d="M3 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H3Z"/><path d="M21 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7Z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  quote: '<path d="M9 7H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2v3a3 3 0 0 1-3 3"/><path d="M20 7h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2v3a3 3 0 0 1-3 3"/>',
};

export const icon = (name, size = '') =>
  `<svg class="i ${size}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${PATHS[name] || ''}</svg>`;

export const LOGO = `<svg class="mark" viewBox="0 0 32 32" aria-hidden="true">
  <rect width="32" height="32" rx="7" fill="var(--ink)"/>
  <circle cx="16" cy="16" r="8.4" fill="none" stroke="var(--paper)" stroke-width="1.6"/>
  <path d="M16 4.6v4.4M16 23v4.4M4.6 16H9M23 16h4.4" stroke="var(--paper)" stroke-width="1.6" stroke-linecap="round"/>
  <circle cx="16" cy="16" r="2.3" fill="var(--accent)"/>
</svg>`;
