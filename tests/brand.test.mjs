import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function filesUnder(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...filesUnder(full));
    else out.push(full);
  }
  return out;
}

const sources = filesUnder(path.join(root, 'src'));

test('shipped source contains no credential-shaped strings', () => {
  const patterns = [
    /sk-[A-Za-z0-9]{16,}/,
    /gh[pousr]_[A-Za-z0-9]{20,}/,
    /AIza[0-9A-Za-z_-]{20,}/,
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i,
  ];
  sources.forEach(file => {
    const text = fs.readFileSync(file, 'utf8');
    patterns.forEach(pattern => assert.ok(!pattern.test(text), `${pattern} found in ${path.relative(root, file)}`));
  });
});

test('the only email addresses in the source are the fictional demo address', () => {
  const emails = new Set();
  sources.forEach(file => {
    const text = fs.readFileSync(file, 'utf8');
    (text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || []).forEach(email => emails.add(email));
  });
  assert.deepEqual([...emails], ['support@zhaiyk-coatings.example']);
});
