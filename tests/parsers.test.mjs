import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCSV, parseFile, textChunks } from '../src/app/parsers.js';

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const fileFrom = (name, type) => new File([fs.readFileSync(path.join(fixtures, name))], name, { type });

test('TXT is split into paragraphs with a paragraph locator', async () => {
  const text = 'First paragraph with a price of 42,800.\n\nSecond paragraph about delivery.';
  const parsed = await parseFile(new File([text], 'notes.txt', { type: 'text/plain' }), 'txt');
  assert.ok(parsed.chunks.length > 0);
  assert.match(parsed.chunks[0].loc.para, /\d+–\d+/);
  assert.match(parsed.chunks[0].lines.join(' '), /42,800/);
});

test('CSV headers are attached to each value', async () => {
  const csv = 'Product;Price\nTerraShield X5;42,800\nSilkWall;27,900';
  const parsed = await parseFile(new File([csv], 'prices.csv', { type: 'text/csv' }), 'csv');
  const text = parsed.chunks.map(chunk => chunk.lines.join(' ')).join(' ');
  assert.match(text, /Product: TerraShield X5/);
  assert.match(text, /Price: 42,800/);
  assert.equal(parsed.info.rows, 3);
});

test('CSV parser handles quoted delimiters', () => {
  const rows = parseCSV('name,note\n"A, B","line ""quoted"""');
  assert.deepEqual(rows[1], ['A, B', 'line "quoted"']);
});

test('XLSX parsing reads sheets, headers and row locations', async () => {
  const parsed = await parseFile(fileFrom('sample.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'), 'xlsx');
  assert.ok(parsed.chunks.length > 0);
  const all = parsed.chunks.map(chunk => chunk.lines.join(' ')).join(' ');
  assert.match(all, /TerraShield X5/);
  assert.match(all, /42800/);
  assert.match(all, /SilkWall Interior Matt/);
  assert.equal(parsed.info.sheets, 1);
  const first = parsed.chunks[0];
  assert.equal(first.loc.sheet, 'Prices 2026');
  assert.match(first.loc.rows, /^\d+–\d+$/);
});

test('DOCX parsing extracts paragraph text and preserves section locators', async () => {
  const parsed = await parseFile(fileFrom('sample.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'), 'docx');
  assert.ok(parsed.chunks.length > 0);
  const all = parsed.chunks.map(chunk => chunk.lines.join(' ')).join(' ');
  assert.match(all, /International shipping/);
  assert.match(all, /10-14 business days/);
  assert.ok(parsed.chunks[0].loc.para);
});

test('text chunking keeps sentences together and caps size', () => {
  const paragraphs = Array.from({ length: 8 }, (_, i) => `Paragraph ${i}. `.repeat(20));
  const chunks = textChunks(paragraphs, 'para');
  assert.ok(chunks.length > 1);
  chunks.forEach(chunk => {
    assert.ok(chunk.lines.length > 0);
    assert.ok(chunk.lines.join(' ').length <= 900);
  });
});

test('unsupported files are rejected instead of producing empty passages', async () => {
  await assert.rejects(() => parseFile(new File(['x'], 'thing.bin'), 'bin'), /type/);
});
