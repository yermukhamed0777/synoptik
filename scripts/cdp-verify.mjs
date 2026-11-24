/**
 * Local visual/QA harness. Drives headless Chrome over the DevTools protocol,
 * exercises the main flows and writes screenshots to artifacts/.
 *
 * Usage:
 *   1. node scripts/serve.mjs
 *   2. chrome --headless=new --remote-debugging-port=9222 about:blank
 *   3. node scripts/cdp-verify.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://127.0.0.1:4173';
const CDP = 'http://127.0.0.1:9222';
const outDir = path.resolve('artifacts');
fs.mkdirSync(outDir, { recursive: true });

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const errors = [];

async function newTarget(url) {
  const response = await fetch(`${CDP}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  if (!response.ok) throw new Error('Cannot open target: ' + response.status);
  return response.json();
}

function connect(wsUrl) {
  const socket = new WebSocket(wsUrl);
  const pending = new Map();
  let id = 0;
  const ready = new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    if (message.method === 'Runtime.exceptionThrown') {
      const detail = message.params.exceptionDetails;
      errors.push('EXCEPTION ' + (detail.exception?.description || detail.text));
    }
    if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
      errors.push('LOG ' + message.params.entry.text);
    }
  };
  const send = (method, params = {}) => {
    const messageId = ++id;
    return new Promise((resolve, reject) => {
      pending.set(messageId, { resolve, reject });
      socket.send(JSON.stringify({ id: messageId, method, params }));
    });
  };
  return { ready, send, socket };
}

async function screenshot(session, name, { fullPage = true, height = 1000 } = {}) {
  let clip;
  if (fullPage) {
    await session.send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' });
    await sleep(150);
    const metrics = await session.send('Page.getLayoutMetrics');
    const size = metrics.cssContentSize;
    clip = { x: 0, y: 0, width: Math.min(size.width, 1440), height: Math.min(size.height, 8000), scale: 1 };
  } else {
    const scroll = await session.send('Runtime.evaluate', { expression: 'window.scrollY', returnByValue: true });
    clip = { x: 0, y: scroll.result.value || 0, width: 1440, height, scale: 1 };
  }
  const shot = await session.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: fullPage, clip });
  fs.writeFileSync(path.join(outDir, name), Buffer.from(shot.data, 'base64'));
  console.log('  screenshot', name, `${Math.round(shot.data.length * 0.75 / 1024)} KB`);
}

async function evaluate(session, expression) {
  const result = await session.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  return result.result?.value;
}

async function openPage(url) {
  const target = await newTarget(url);
  const session = connect(target.webSocketDebuggerUrl);
  await session.ready;
  await session.send('Page.enable');
  await session.send('Runtime.enable');
  await session.send('Log.enable');
  await sleep(1200);
  return session;
}

const SEED = {
  lang: 0,
  theme: 'light',
  onboarded: true,
  history: [],
  gaps: [],
  feedback: {},
  removed: [],
  uploads: [],
  liveTop: {},
  settings: {
    threshold: 0.6,
    maxSources: 3,
    details: true,
    endpoint: '',
    useDemo: true,
    scripted: true,
    ai: false,
    semThreshold: 0.86,
  },
};

console.log('Landing');
const landing = await openPage(`${BASE}/`);
await evaluate(landing, `localStorage.setItem('synoptik.state.v1', ${JSON.stringify(JSON.stringify(SEED))}); location.reload();`);
await sleep(1400);
await screenshot(landing, 'landing-light.png');
await evaluate(landing, `document.querySelector('[data-theme-toggle]').click()`);
await sleep(400);
await screenshot(landing, 'landing-dark.png');

console.log('Workspace');
const app = await openPage(`${BASE}/app.html`);
await evaluate(app, `localStorage.setItem('synoptik.state.v1', ${JSON.stringify(JSON.stringify(SEED))}); location.reload();`);
await sleep(1400);
await screenshot(app, 'app-ask.png');

const suggestion = await evaluate(app, `(() => { const el = document.querySelector('[data-qa="q-price-x5"]'); if (!el) return null; el.click(); return el.textContent.trim(); })()`);
console.log('  clicked suggestion:', suggestion);
await sleep(2600);
const answer = await evaluate(app, `document.querySelector('.answer-direct')?.textContent || ''`);
console.log('  answer:', answer.slice(0, 140));
await evaluate(app, `document.querySelector('.turn').scrollIntoView({block:'start'}); window.scrollBy(0,-64)`);
await sleep(300);
await screenshot(app, 'app-answer.png', { fullPage: false, height: 1200 });
await evaluate(app, `document.querySelector('.answer-actions').scrollIntoView({block:'end'})`);
await sleep(200);
await screenshot(app, 'app-answer-footer.png', { fullPage: false });

await evaluate(app, `document.querySelector('.cite')?.click()`);
await sleep(500);
const drawer = await evaluate(app, `document.querySelector('.drawer .passage')?.textContent || ''`);
console.log('  passage:', drawer.slice(0, 120));
await screenshot(app, 'app-evidence.png', { fullPage: false });
await evaluate(app, `document.querySelector('.drawer [data-act="close"]')?.click()`);
await sleep(200);

for (const [route, name] of [['/spots', 'app-spots.png'], ['/coverage', 'app-coverage.png'], ['/library', 'app-library.png'], ['/settings', 'app-settings.png']]) {
  await evaluate(app, `location.hash = '#${route}'`);
  await sleep(600);
  await screenshot(app, name);
}

console.log('Errors:', errors.length ? '\n' + errors.join('\n') : 'none');
process.exit(errors.length ? 1 : 0);
