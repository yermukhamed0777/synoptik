/** UI state checks: onboarding, guided demo, dark theme and mobile layout. */
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
const shot = async (name, { width = 1440, height = 1000, full = false } = {}) => {
  await evaluate('window.scrollTo(0,0)');
  await sleep(120);
  let clip;
  if (full) {
    const metrics = await send('Page.getLayoutMetrics');
    clip = { x: 0, y: 0, width, height: Math.min(metrics.cssContentSize.height, 6000), scale: 1 };
  } else {
    clip = { x: 0, y: 0, width, height, scale: 1 };
  }
  const image = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full, clip });
  fs.writeFileSync(path.join(out, name), Buffer.from(image.data, 'base64'));
  console.log('  screenshot', name);
};

await send('Page.enable');
await send('Runtime.enable');

const seed = onboarded => ({
  lang: 0,
  theme: 'light',
  onboarded,
  history: [],
  gaps: [],
  feedback: {},
  removed: [],
  uploads: [],
  liveTop: {},
  settings: { threshold: 0.6, maxSources: 3, details: true, endpoint: '', useDemo: true, scripted: true, ai: false, semThreshold: 0.86 },
});

await send('Page.navigate', { url: `${BASE}/app.html` });
await sleep(700);
await evaluate(`localStorage.setItem('synoptik.state.v1', ${JSON.stringify(JSON.stringify(seed(false)))}); location.reload();`);
await sleep(1200);
console.log('Onboarding step:', await evaluate(`document.querySelector('.onboard-body h2')?.textContent`));
await shot('ui-onboarding.png');
await evaluate(`document.querySelector('[data-act="onboard-skip"]')?.click()`);
await sleep(200);

console.log('Guided demo');
await evaluate(`document.querySelector('.rail-demo')?.click()`);
await sleep(500);
console.log('  coach:', await evaluate(`document.querySelector('.coach h3')?.textContent`));
await shot('ui-tour-start.png');
await evaluate(`document.querySelector('[data-act="tour-next"]')?.click()`);
await sleep(2200);
await evaluate(`document.querySelector('[data-act="tour-next"]')?.click()`);
await sleep(500);
console.log('  drawer open:', await evaluate(`!!document.querySelector('.drawer')`));
await shot('ui-tour-evidence.png');
await evaluate(`document.querySelector('[data-act="tour-next"]')?.click()`);
await sleep(2200);
await evaluate(`document.querySelector('[data-act="tour-next"]')?.click()`);
await sleep(2200);
await evaluate(`document.querySelector('[data-act="tour-next"]')?.click()`);
await sleep(600);
console.log('  spots route:', await evaluate(`location.hash`));
await shot('ui-tour-spots.png');

console.log('Dark theme');
await evaluate(`document.querySelector('[data-act="tour-end"]')?.click()`);
await sleep(300);
await evaluate(`localStorage.setItem('synoptik.state.v1', JSON.stringify({ ...JSON.parse(localStorage.getItem('synoptik.state.v1')), theme: 'dark' })); location.reload();`);
await sleep(1200);
await shot('ui-dark-ask.png', { full: true });

console.log('Mobile');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await send('Page.navigate', { url: `${BASE}/` });
await sleep(1200);
await shot('ui-mobile-landing.png', { width: 390, height: 844 });
await send('Page.navigate', { url: `${BASE}/app.html` });
await sleep(1200);
await shot('ui-mobile-ask.png', { width: 390, height: 844 });
await send('Emulation.clearDeviceMetricsOverride');

console.log('Errors:', errors.length ? '\n' + errors.join('\n') : 'none');
process.exit(errors.length ? 1 : 0);
