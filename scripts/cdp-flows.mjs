/**
 * End-to-end flow check: a refusal becomes a blind spot, adding a document
 * resolves it, then language and quick search are exercised.
 *
 * Preconditions: `node scripts/serve.mjs` and a headless Chrome with
 * --remote-debugging-port=9222.
 */
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://127.0.0.1:4173';
const CDP = 'http://127.0.0.1:9222';
const out = path.resolve('artifacts');
fs.mkdirSync(out, { recursive: true });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const errors = [];

const target = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.onopen = resolve;
  socket.onerror = reject;
});
let id = 0;
const pending = new Map();
socket.onmessage = event => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  } else if (message.method === 'Runtime.exceptionThrown') {
    errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  }
};
const send = (method, params = {}) => {
  const messageId = ++id;
  return new Promise((resolve, reject) => {
    pending.set(messageId, { resolve, reject });
    socket.send(JSON.stringify({ id: messageId, method, params }));
  });
};
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  return result.result?.value;
};
const shot = async (name, height = 1000) => {
  const scroll = await evaluate('window.scrollY');
  const image = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
    clip: { x: 0, y: scroll, width: 1440, height, scale: 1 },
  });
  fs.writeFileSync(path.join(out, name), Buffer.from(image.data, 'base64'));
  console.log('  screenshot', name);
};
const nav = async route => {
  await evaluate(`location.hash = '#${route}'`);
  await sleep(500);
};

await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', { url: `${BASE}/app.html` });
await sleep(800);

const seed = {
  lang: 0,
  theme: 'light',
  onboarded: true,
  history: [],
  gaps: [],
  feedback: {},
  removed: [],
  uploads: [],
  liveTop: {},
  settings: { threshold: 0.6, maxSources: 3, details: true, endpoint: '', useDemo: true, scripted: true, ai: false, semThreshold: 0.86 },
};
await evaluate(`localStorage.setItem('synoptik.state.v1', ${JSON.stringify(JSON.stringify(seed))}); location.reload();`);
await sleep(1400);

console.log('Refusal');
await evaluate(`document.querySelector('[data-qa="x-intl"]')?.click()`);
await sleep(2400);
console.log('  refusal:', await evaluate(`document.querySelector('.answer-direct')?.textContent || ''`));
console.log('  gaps:', await evaluate(`JSON.parse(localStorage.getItem('synoptik.state.v1')).gaps.length`));
await shot('flow-refusal.png');

console.log('Blind spot');
await nav('/spots');
console.log('  rows:', await evaluate(`document.querySelectorAll('.table tbody tr').length`));
await shot('flow-spot.png');

console.log('Add evidence');
await nav('/library');
await evaluate(`document.querySelector('[data-act="sample"]')?.click()`);
await sleep(2200);
console.log('  documents:', await evaluate(`JSON.parse(localStorage.getItem('synoptik.state.v1')).uploads.map(u => ({ name: u.name, status: u.status, chunks: u.chunks?.length }))`));
await shot('flow-upload.png');

console.log('Re-ask');
await nav('/spots');
await evaluate(`document.querySelector('[data-act="rerun"]')?.click()`);
await sleep(2600);
console.log('  answers:', await evaluate(`[...document.querySelectorAll('.answer-direct')].map(el => el.textContent.slice(0, 120))`));
console.log('  last kind:', await evaluate(`(() => { const answers = [...document.querySelectorAll('.answer')]; return answers.length ? answers[answers.length - 1].className : 'none'; })()`));
await shot('flow-resolved.png');

console.log('Quick search');
await evaluate(`document.querySelector('[data-act="quick"]')?.click()`);
await sleep(300);
await evaluate(`(() => { const input = document.getElementById('quick-input'); input.value = 'цена'; input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
await sleep(400);
console.log('  results:', await evaluate(`document.querySelectorAll('.quick-item').length`));
await shot('flow-quick.png');
await evaluate(`document.querySelector('.scrim')?.click()`);

console.log('Russian');
await evaluate(`document.querySelector('.lang-switch [data-i="1"]')?.click()`);
await sleep(600);
console.log('  heading:', await evaluate(`document.querySelector('.ask-hero h1')?.textContent || document.querySelector('h1')?.textContent`));
await shot('flow-russian.png');

console.log('Errors:', errors.length ? '\n' + errors.join('\n') : 'none');
process.exit(errors.length ? 1 : 0);
