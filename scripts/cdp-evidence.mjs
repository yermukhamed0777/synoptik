/** Verify live price-conflict handling and comparison refusal in the browser. */
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
const shot = async name => {
  await evaluate('window.scrollTo(0,0)');
  await sleep(100);
  const image = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1440, height: 1000, scale: 1 } });
  fs.writeFileSync(path.join(out, name), Buffer.from(image.data, 'base64'));
  console.log('  screenshot', name);
};

await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', { url: `${BASE}/app.html` });
await sleep(700);

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
  settings: { threshold: 0.6, maxSources: 4, details: true, endpoint: '', useDemo: true, scripted: false, ai: false, semThreshold: 0.86 },
};
await evaluate(`localStorage.setItem('synoptik.state.v1', ${JSON.stringify(JSON.stringify(seed))}); location.reload();`);
await sleep(1200);

console.log('Live price conflict');
await evaluate(`document.querySelector('[data-qa="q-price-x5"]')?.click()`);
await sleep(2600);
console.log('  answer:', await evaluate(`document.querySelector('.answer-direct')?.textContent?.slice(0,120)`));
console.log('  conflict:', await evaluate(`document.querySelector('.conflict-grid')?.innerText || 'none'`));
console.log('  provenance:', await evaluate(`document.querySelector('.provenance')?.textContent`));
await evaluate(`document.querySelector('.turn').scrollIntoView({block:'start'}); window.scrollBy(0,-64)`);
await shot('app-conflict.png');

console.log('Comparison refusal');
await evaluate(`document.querySelector('[data-act="clear-thread"]')?.click()`);
await sleep(300);
await evaluate(`document.querySelector('[data-qa="q-diff"]')?.click()`);
await sleep(2600);
console.log('  refusal:', await evaluate(`document.querySelector('.answer.refused .answer-direct')?.textContent`));
console.log('  reason:', await evaluate(`document.querySelector('.answer.refused .dim')?.textContent?.slice(0,140)`));
await evaluate(`document.querySelector('.turn').scrollIntoView({block:'start'}); window.scrollBy(0,-64)`);
await shot('app-comparison-refusal.png');

console.log('Errors:', errors.length ? '\n' + errors.join('\n') : 'none');
process.exit(errors.length ? 1 : 0);
