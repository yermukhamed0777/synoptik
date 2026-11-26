#!/usr/bin/env node
/**
 * Synoptik build.
 *
 * The product is intentionally dependency-free: the browser loads native ES
 * modules, so the "build" is a deterministic copy plus two static HTML shells.
 * No bundler, no node_modules, no postinstall scripts. `dist/` is the artifact.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, 'dist');

const ICON = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23121A26'/%3E%3Ccircle cx='16' cy='16' r='8.5' fill='none' stroke='%23F6F3EA' stroke-width='1.6'/%3E%3Cpath d='M16 4.5v5M16 22.5v5M4.5 16h5M22.5 16h5' stroke='%23F6F3EA' stroke-width='1.6' stroke-linecap='round'/%3E%3Ccircle cx='16' cy='16' r='2.4' fill='%23C0522B'/%3E%3C/svg%3E`;

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval' blob: https://cdn.jsdelivr.net",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https: http://localhost:* http://127.0.0.1:*",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const shell = ({ title, description, css, entry, bodyClass, noindex }) => `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="color-scheme" content="light dark">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:type" content="website">
<link rel="icon" href="${ICON}">
<link rel="stylesheet" href="./assets/styles/base.css">
<link rel="stylesheet" href="./assets/styles/${css}">
<script src="./assets/theme-init.js"></script>
</head>
<body class="${bodyClass}">
${entry}
<noscript>Synoptik needs JavaScript. The workspace runs entirely in your browser; nothing is sent to a server.</noscript>
</body>
</html>
`;

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

fs.cpSync(path.join(root, 'src'), path.join(dist, 'assets'), { recursive: true });
fs.cpSync(path.join(root, 'vendor'), path.join(dist, 'vendor'), { recursive: true });

const landing = shell({
  title: 'Synoptik — every answer, on the record',
  description:
    'Evidence-first answers from business documents. Ask in plain language; get the exact passage, page and file — or an honest refusal. EN / RU / KK. Runs in your browser.',
  css: 'landing.css',
  entry: '<div id="site"></div><script type="module" src="./assets/ui/landing.js"></script>',
  bodyClass: 'landing',
});

const app = shell({
  title: 'Synoptik — workspace',
  description: 'Evidence-first retrieval workspace for business documents.',
  css: 'app.css',
  entry: '<div id="app"></div><div id="overlays"></div><div class="toasts" id="toasts" aria-live="polite"></div><script type="module" src="./assets/ui/main.js"></script>',
  bodyClass: 'workspace',
  noindex: true,
});

fs.writeFileSync(path.join(dist, 'index.html'), landing);
fs.writeFileSync(path.join(dist, 'app.html'), app);

const size = dir => {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    total += entry.isDirectory() ? size(p) : fs.statSync(p).size;
  }
  return total;
};

console.log('Synoptik build complete');
console.log('  dist/index.html  landing');
console.log('  dist/app.html    workspace');
console.log(`  dist/            ${(size(dist) / 1048576).toFixed(2)} MB`);
console.log('  dependencies     0');
