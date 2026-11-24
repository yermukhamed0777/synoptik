/** Generate a small PDF with Chrome, upload it through the real file input,
 *  and verify that Synoptik extracts passages and locators. */
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://127.0.0.1:4173';
const CDP = 'http://127.0.0.1:9222';
const fixture = path.resolve('tests/fixtures/sample.pdf');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

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

await send('Page.enable');
await send('Runtime.enable');
await send('DOM.enable');

// 1. Build a PDF with a real text layer.
const html = encodeURIComponent(`<!doctype html><html><head><meta charset="utf-8"></head><body style="font:16px Georgia;padding:40px">
<h1>Price List 2026</h1>
<p>TerraShield X5, 10 L — 42,800 ₸</p>
<p>SilkWall Interior Matt, 9 L — 27,900 ₸</p>
<p>All prices include VAT 12%.</p>
</body></html>`);
await send('Page.navigate', { url: `data:text/html;charset=utf-8,${html}` });
await sleep(500);
const pdf = await send('Page.printToPDF', { printBackground: true });
fs.writeFileSync(fixture, Buffer.from(pdf.data, 'base64'));
console.log('PDF fixture:', fs.statSync(fixture).size, 'bytes');

// 2. Load the app with a clean, onboarded state.
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
  settings: { threshold: 0.6, maxSources: 3, details: true, endpoint: '', useDemo: false, scripted: false, ai: false, semThreshold: 0.86 },
};
await evaluate(`localStorage.setItem('synoptik.state.v1', ${JSON.stringify(JSON.stringify(seed))}); location.reload();`);
await sleep(1200);
await evaluate(`location.hash = '#/library'`);
await sleep(500);

// 3. Upload through the actual <input type=file>.
const { root } = await send('DOM.getDocument', { depth: -1 });
const { nodeId } = await send('DOM.querySelector', { nodeId: root.nodeId, selector: '#file-input' });
await send('DOM.setFileInputFiles', { nodeId, files: [fixture] });
await sleep(4500);

const uploads = await evaluate(`JSON.parse(localStorage.getItem('synoptik.state.v1')).uploads.map(u => ({ name: u.name, type: u.type, status: u.status, pages: u.pages, chunks: u.chunks?.length, error: u.error, sample: u.chunks?.[0]?.lines?.slice(0,3) }))`);
console.log('Uploads:', JSON.stringify(uploads, null, 2));
console.log('Rows rendered:', await evaluate(`document.querySelectorAll('.table tbody tr').length`));
console.log('Error text:', await evaluate(`document.querySelector('.error-text')?.textContent || 'none'`));

const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1440, height: 1000, scale: 1 } });
fs.writeFileSync(path.resolve('artifacts/flow-pdf.png'), Buffer.from(shot.data, 'base64'));
process.exit(uploads[0]?.status === 'processed' ? 0 : 1);
