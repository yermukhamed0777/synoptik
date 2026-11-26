/**
 * Document parsing, entirely client-side.
 *
 * TXT/MD, CSV, DOCX (mini ZIP reader + OOXML), XLSX (sheets, merges, dates,
 * header detection) and PDF (pdf.js layout analysis, with a lightweight
 * stream parser as fallback). No upload endpoint exists.
 *
 * Every chunk keeps a locator taken from the file: page, sheet + rows, section,
 * or line range. Nothing is invented.
 */
import { AI } from '../ai/local.js';

export const MAX_BYTES = 30 * 1048576;

async function inflate(bytes, raw, budget = MAX_BYTES) {
  const stream = new DecompressionStream(raw ? 'deflate-raw' : 'deflate');
  const reader = new Blob([bytes]).stream().pipeThrough(stream).getReader();
  const parts = [];
  let length = 0;
  while (true) {
    const {done,value} = await reader.read();
    if (done) break;
    length += value.length;
    if (length > budget) { await reader.cancel(); throw Error('decompression-limit'); }
    parts.push(value);
  }
  return new Uint8Array(await new Blob(parts).arrayBuffer());
}

async function unzip(buffer) {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 66000); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (end < 0) throw new Error('zip');
  const length = view.getUint16(end + 10, true);
  let pointer = view.getUint32(end + 16, true);
  if (length > 4096) throw Error("archive-limit");
  let remaining = MAX_BYTES;
  const entries = Object.create(null);
  for (let i = 0; i < length; i++) {
    const method = view.getUint16(pointer + 10, true);
    const compressedSize = view.getUint32(pointer + 20, true);
    const nameLength = view.getUint16(pointer + 28, true);
    const extraLength = view.getUint16(pointer + 30, true);
    const commentLength = view.getUint16(pointer + 32, true);
    const offset = view.getUint32(pointer + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(pointer + 46, pointer + 46 + nameLength));
    entries[name] = async () => {
      const localNameLength = view.getUint16(offset + 26, true);
      const localExtraLength = view.getUint16(offset + 28, true);
      const start = offset + 30 + localNameLength + localExtraLength;
      const data = bytes.subarray(start, start + compressedSize);
      if (![0,8].includes(method) || start + compressedSize > bytes.length) throw Error('zip');
      const output = method === 0 ? data : await inflate(data,true,remaining);
      remaining -= output.length;
      if (remaining < 0) throw Error('archive-limit');
      return new TextDecoder().decode(output);
    };
    pointer += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

const xmlText = value =>
  value
    .replace(/<[^>]+>/g, '')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

export function parseCSV(text) {
  const rows = [];
  let row = [];
  let current = '';
  let quoted = false;
  const firstLine = text.split('\n')[0];
  const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          current += '"';
          i++;
        } else quoted = false;
      } else current += char;
    } else if (char === '"') quoted = true;
    else if (char === delimiter) {
      row.push(current);
      current = '';
    } else if (char === '\n') {
      row.push(current.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      current = '';
    } else current += char;
  }
  if (current || row.length) {
    row.push(current);
    rows.push(row);
  }
  return rows.filter(cells => cells.some(cell => cell.trim()));
}

const columnIndex = ref => ref.split('').reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1;

function excelDate(value) {
  const date = new Date(Math.round((Number(value) - 25569) * 864e5));
  if (isNaN(date)) return String(value);
  const pad = n => String(n).padStart(2, '0');
  const text = `${pad(date.getUTCDate())}.${pad(date.getUTCMonth() + 1)}.${date.getUTCFullYear()}`;
  return Number(value) % 1 ? `${text} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}` : text;
}

/* Header = first row (within the first 15) that is mostly text and nearly as
   wide as the widest row. Single-cell rows afterwards are section titles. */
function sheetChunks(rows, sheet) {
  const countCells = row => row.cells.filter(Boolean).length;
  const headSample = rows.slice(0, 15);
  const widest = Math.max(0, ...headSample.map(countCells));
  const headerIndex = headSample.findIndex(
    row =>
      countCells(row) >= Math.max(2, Math.ceil(0.6 * widest)) &&
      row.cells.filter(cell => cell && isNaN(Number(cell.replace(',', '.')))).length >= 0.6 * countCells(row)
  );
  if (headerIndex < 0) return [];

  const header = rows[headerIndex].cells.map((cell, i) => cell || 'Col' + (i + 1));
  const records = [];
  let section = '';

  rows.slice(0, headerIndex).forEach(row => {
    const text = row.cells.filter(Boolean).join(' ');
    if (text) records.push({ n: row.n, text });
  });

  rows.slice(headerIndex + 1).forEach(row => {
    if (countCells(row) === 1 && header.length >= 3) {
      section = row.cells.find(Boolean);
      return;
    }
    const body = header.map((label, i) => (row.cells[i] ? `${label}: ${row.cells[i]}` : '')).filter(Boolean);
    row.cells.slice(header.length).forEach(cell => cell && body.push(cell));
    if (body.length) records.push({ n: row.n, text: (section ? section + ' — ' : '') + (body.length > 1 ? body.join(' | ') : body[0] + ' | ') });
  });

  const chunks = [];
  for (let i = 0; i < records.length; i += 8) {
    const group = records.slice(i, i + 8);
    const from = group[0].n;
    const to = group[group.length - 1].n;
    chunks.push({ loc: { sheet, rows: from === to ? String(from) : `${from}–${to}` }, lines: group.map(record => record.text) });
  }
  return chunks;
}

async function parseXlsx(buffer) {
  const zip = await unzip(buffer);
  if (!zip['xl/workbook.xml']) throw new Error('xlsx');
  const read = async name => (zip[name] ? await zip[name]() : '');
  const sharedStrings = [...(await read('xl/sharedStrings.xml')).matchAll(/<si>([\s\S]*?)<\/si>/g)].map(match =>
    xmlText(match[1].replace(/<rPh[\s\S]*?<\/rPh>/g, ''))
  );

  const styles = await read('xl/styles.xml');
  const customFormats = {};
  [...styles.matchAll(/<numFmt [^>]*numFmtId="(\d+)"[^>]*formatCode="([^"]*)"/g)].forEach(match => {
    customFormats[match[1]] = xmlText(match[2]);
  });
  const cellFormats = (styles.match(/<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/) || [])[1] || '';
  const dateFormat = [...cellFormats.matchAll(/<xf [^>]*?numFmtId="(\d+)"/g)].map(match => {
    const id = Number(match[1]);
    if ((id >= 14 && id <= 22) || (id >= 45 && id <= 47)) return true;
    const format = customFormats[id];
    return !!format && /[dmyh]/i.test(format.replace(/"[^"]*"|\[[^\]]*\]|\\./g, ''));
  });

  const workbook = await read('xl/workbook.xml');
  const relationships = {};
  [...(await read('xl/_rels/workbook.xml.rels')).matchAll(/<Relationship [^>]*>/g)].forEach(match => {
    const id = (match[0].match(/Id="([^"]*)"/) || [])[1];
    const target = (match[0].match(/Target="([^"]*)"/) || [])[1];
    if (id && target) relationships[id] = target.replace(/^\/?(xl\/)?/, 'xl/');
  });
  const sheets = [...workbook.matchAll(/<sheet [^>]*>/g)].map((match, i) => ({
    name: xmlText((match[0].match(/name="([^"]*)"/) || [])[1] || 'Sheet' + (i + 1)),
    path: relationships[(match[0].match(/r:id="([^"]*)"/) || [])[1]] || `xl/worksheets/sheet${i + 1}.xml`,
  }));

  let chunks = [];
  let totalRows = 0;
  for (const sheet of sheets) {
    const xml = await read(sheet.path);
    if (!xml) continue;
    const grid = new Map();
    for (const rowMatch of xml.matchAll(/<row ([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
      const rowNumber = Number((rowMatch[1].match(/\br="(\d+)"/) || [])[1] || 0) || grid.size + 1;
      const cells = grid.get(rowNumber) || [];
      for (const cellMatch of (rowMatch[2] || '').matchAll(/<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const column = columnIndex((cellMatch[1].match(/\br="([A-Z]+)/) || [])[1] || 'A');
        const type = (cellMatch[1].match(/\bt="(\w+)"/) || [])[1];
        const styleIndex = Number((cellMatch[1].match(/\bs="(\d+)"/) || [])[1] || 0);
        const body = cellMatch[2] || '';
        const value = (body.match(/<v>([^<]*)/) || [])[1];
        let text = '';
        if (type === 's') text = sharedStrings[Number(value)] ?? '';
        else if (type === 'inlineStr') text = xmlText(body);
        else if (type === 'b') text = value === '1' ? 'TRUE' : 'FALSE';
        else if (type === 'e') text = '';
        else if (type === 'str') text = xmlText(value || '');
        else if (value !== undefined && value !== '') {
          text = dateFormat[styleIndex] && isFinite(Number(value)) ? excelDate(value) : isFinite(Number(value)) ? String(Number(Number(value).toFixed(10))) : xmlText(value);
        }
        cells[column] = String(text).replace(/\s+/g, ' ').trim();
      }
      grid.set(rowNumber, cells);
    }

    let mergeBudget = 100000;
    for (const merge of xml.matchAll(/<mergeCell ref="([A-Z]+)(\d+):([A-Z]+)(\d+)"/g)) {
      const startColumn = columnIndex(merge[1]);
      const startRow = Number(merge[2]);
      const endColumn = columnIndex(merge[3]);
      const endRow = Number(merge[4]);
      if (endRow <= startRow) continue;
      mergeBudget -= (endRow - startRow) * (endColumn - startColumn + 1);
      if (mergeBudget < 0 || endColumn >= 16384 || endRow > 1048576) throw Error("merge-limit");
      const value = (grid.get(startRow) || [])[startColumn];
      if (!value) continue;
      for (let row = startRow + 1; row <= endRow; row++) {
        for (let column = startColumn; column <= endColumn; column++) {
          const cells = grid.get(row) || [];
          if (!cells[column]) cells[column] = value;
          grid.set(row, cells);
        }
      }
    }

    const rows = [...grid.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([n, cells]) => ({ n, cells: Array.from(cells, cell => cell ?? '') }))
      .filter(row => row.cells.some(Boolean));
    totalRows += rows.length;
    chunks = chunks.concat(sheetChunks(rows, sheet.name));
  }
  return { chunks, info: { sheets: sheets.length, rows: totalRows } };
}

export function textChunks(paragraphs, kind) {
  const chunks = [];
  let buffer = [];
  let length = 0;
  let start = 1;
  const flush = end => {
    if (!buffer.length) return;
    const lines = buffer
      .flatMap(paragraph => paragraph.split(/(?<=[.!?。])\s+/).map(sentence => sentence.trim()).filter(Boolean).map(sentence => sentence.slice(0, 500)));
    chunks.push({ loc: kind === 'lines' ? { lines: `${start}–${end}` } : { para: `${start}–${end}` }, lines });
    buffer = [];
    length = 0;
  };
  paragraphs.forEach((paragraph, i) => {
    if (length + paragraph.length > 650 && buffer.length) {
      flush(i);
      start = i + 1;
    }
    buffer.push(paragraph);
    length += paragraph.length;
  });
  flush(paragraphs.length);
  return chunks;
}

function ascii85(text) {
  let value = text.replace(/\s+/g, '').replace(/^<~/, '');
  const end = value.indexOf('~>');
  if (end >= 0) value = value.slice(0, end);
  const output = [];
  let group = [];
  for (const char of value) {
    if (char === 'z' && !group.length) {
      output.push(0, 0, 0, 0);
      continue;
    }
    group.push(char.charCodeAt(0) - 33);
    if (group.length === 5) {
      let word = 0;
      group.forEach(item => (word = word * 85 + item));
      output.push((word >>> 24) & 255, (word >>> 16) & 255, (word >>> 8) & 255, word & 255);
      group = [];
    }
  }
  if (group.length > 1) {
    const count = group.length;
    while (group.length < 5) group.push(84);
    let word = 0;
    group.forEach(item => (word = word * 85 + item));
    const bytes = [(word >>> 24) & 255, (word >>> 16) & 255, (word >>> 8) & 255, word & 255];
    output.push(...bytes.slice(0, count - 1));
  }
  return Uint8Array.from(output);
}

async function extractPdfStreams(buffer) {
  const text = new TextDecoder('latin1').decode(buffer);
  const pages = [];
  const pattern = /<<([^>]*?)>>\s*stream\r?\n/g;
  let match;
  while ((match = pattern.exec(text))) {
    const start = match.index + match[0].length;
    const end = text.indexOf('endstream', start);
    if (end < 0) continue;
    const raw = text.slice(start, end);
    let decoded;
    try {
      const data = /ASCII85Decode/.test(match[1]) ? ascii85(raw) : Uint8Array.from(raw, char => char.charCodeAt(0));
      decoded = /FlateDecode/.test(match[1]) ? new TextDecoder('latin1').decode(await inflate(data, false)) : new TextDecoder('latin1').decode(data);
    } catch {
      continue;
    }
    if (!/BT[\s\S]*ET/.test(decoded)) continue;
    const parts = [];
    const tokens = /\[((?:[^\]\\]|\\.)*)\]\s*TJ|\(((?:[^()\\]|\\.)*)\)\s*(?:Tj|'|")|(T\*|\sT[dD]\s)/g;
    const unescape = value =>
      value.replace(/\\([nrtbf()\\]|[0-7]{1,3})/g, (_, group) => ({ n: '\n', r: '', t: ' ', b: '', f: '', '(': '(', ')': ')', '\\': '\\' }[group] ?? String.fromCharCode(parseInt(group, 8))));
    let token;
    while ((token = tokens.exec(decoded))) {
      if (token[1] != null) {
        parts.push(
          [...token[1].matchAll(/\(((?:[^()\\]|\\.)*)\)|(-?\d+\.?\d*)/g)]
            .map(item => (item[1] != null ? unescape(item[1]) : Number(item[2]) < -200 ? ' ' : ''))
            .join('')
        );
      } else if (token[2] != null) parts.push(unescape(token[2]));
      else parts.push('\n');
    }
    const page = parts.join('').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    if (page) pages.push(page);
  }
  const all = pages.join('\n');
  const good = (all.match(/[\p{L}\p{N}\s.,;:()%₸€$/\-–]/gu) || []).length;
  if (all.length < 30 || good / all.length < 0.85) throw new Error('pdf-text');
  const pageCount = (text.match(/\/Type\s*\/Page(?![s\w])/g) || []).length;
  return { texts: pages, pageCount };
}

/* ---------- pdf.js layout ---------- */

let pdfLibraryPromise = null;

export async function loadPdfLibrary() {
  if (!pdfLibraryPromise) {
    const library = await import(/* webpackIgnore: true */ new URL('../../vendor/pdf.min.mjs', import.meta.url).href);
    library.GlobalWorkerOptions.workerSrc = new URL('../../vendor/pdf.worker.min.mjs', import.meta.url).href;
    pdfLibraryPromise = library;
  }
  return pdfLibraryPromise;
}

const NUMBER_ONLY = /^\d[\d\s.,\-–]*$/;

function joinItems(items, height) {
  let output = '';
  items.forEach((item, index) => {
    const previous = items[index - 1];
    if (previous && !/\s$/.test(previous.s) && !/^[\s.,;:)%!?]/.test(item.s) && (Math.abs(previous.y - item.y) > height * 0.5 || item.x - (previous.x + previous.w) > height * 0.12)) output += ' ';
    output += item.s;
  });
  return output.replace(/\s+/g, ' ').trim();
}

/* One PDF page: text items -> either reconstructed table rows or paragraphs. */
function layoutPage(items) {
  items = items.filter(item => item.s.trim());
  if (!items.length) return { kind: 'text', recs: [], paras: [] };
  const heights = items.map(item => item.h).filter(h => h > 0).sort((a, b) => a - b);
  const height = heights[heights.length >> 1] || 8;
  const sorted = items.slice().sort((a, b) => b.y - a.y || a.x - b.x);
  const lines = [];
  for (const item of sorted) {
    const line = lines[lines.length - 1];
    if (line && Math.abs(line.y - item.y) <= height * 0.5) line.items.push(item);
    else lines.push({ y: item.y, items: [item] });
  }
  lines.forEach(line => line.items.sort((a, b) => a.x - b.x));

  const groups = [];
  let group = null;
  lines.forEach((line, index) => {
    if (!group || lines[index - 1].y - line.y > height * 2) {
      group = { lines: [] };
      groups.push(group);
    }
    group.lines.push(line);
  });

  const isIndexLine = line =>
    line.items.length > 1 &&
    /^\d{1,3}$/.test(line.items[0].s.trim()) &&
    line.items[1].x - (line.items[0].x + line.items[0].w) < height * 4;
  const indexLines = lines.filter(isIndexLine);

  if (indexLines.length >= 6) {
    const firstY = indexLines[0].y;
    const headerItems = lines.filter(line => line.y > firstY + height * 2.3).flatMap(line => line.items);
    const cells = [];
    indexLines.forEach((line, groupIndex) =>
      line.items.forEach((item, itemIndex) => {
        if (itemIndex > 0 && NUMBER_ONLY.test(item.s.trim())) cells.push({ center: item.x + item.w / 2, group: groupIndex, item });
      })
    );
    cells.sort((a, b) => a.center - b.center);
    const columns = [];
    cells.forEach(cell => {
      const last = columns[columns.length - 1];
      if (last && Math.abs(cell.center - last.mean) <= 6) {
        last.cells.push(cell);
        last.mean = last.cells.reduce((sum, item) => sum + item.center, 0) / last.cells.length;
      } else columns.push({ mean: cell.center, cells: [cell] });
    });
    const needed = Math.max(3, Math.round(indexLines.length * 0.35));
    const keep = columns.filter(column => new Set(column.cells.map(cell => cell.group)).size >= needed);
    keep.forEach(column => (column.head = []));
    const isHeader = new Set();
    headerItems.forEach(item => {
      const center = item.x + item.w / 2;
      let best = null;
      let distance = 22;
      keep.forEach(column => {
        const delta = Math.abs(center - column.mean);
        if (delta < distance) {
          distance = delta;
          best = column;
        }
      });
      if (best) {
        best.head.push(item);
        isHeader.add(item);
      }
    });
    keep.forEach(column => {
      column.label = joinItems(column.head.sort((a, b) => b.y - a.y || a.x - b.x), height).split(/[,(]/)[0].trim();
    });

    const records = indexLines.map(line => ({ indexLine: line, lines: [], section: '' }));
    let section = '';
    lines
      .filter(line => line.y > firstY + height * 2.3 && !line.items.some(item => isHeader.has(item)))
      .forEach(line => {
        const text = joinItems(line.items, height);
        if (text.length > 8 && text.length <= 120 && !/^\d/.test(text)) section = text;
      });

    lines.forEach(line => {
      if (line.y > firstY + height * 2.3) return;
      let best = null;
      let distance = 1e9;
      records.forEach(record => {
        const delta = Math.abs(record.indexLine.y - line.y);
        if (delta < distance) {
          distance = delta;
          best = record;
        }
      });
      if (distance <= height * 1.6) {
        if (!best.lines.length) best.section = section;
        best.lines.push(line);
      } else {
        const text = joinItems(line.items, height);
        if (text.length > 2 && text.length <= 120) section = text;
      }
    });

    const recs = [];
    records.forEach(record => {
      const values = [];
      const nameItems = [];
      record.lines.forEach(line =>
        line.items.forEach(item => {
          if (item === record.indexLine.items[0]) return;
          const center = item.x + item.w / 2;
          const column = NUMBER_ONLY.test(item.s.trim()) ? keep.find(entry => Math.abs(center - entry.mean) <= 6) : null;
          if (column) values.push([column, item.s.trim()]);
          else nameItems.push(item);
        })
      );
      const name = joinItems(nameItems, height);
      if (!name) return;
      const cells = keep
        .map(column => {
          const value = values.find(entry => entry[0] === column);
          return value && value[1] ? `${column.label || '#' + (keep.indexOf(column) + 1)}: ${value[1]}` : '';
        })
        .filter(Boolean);
      recs.push((record.section ? record.section + ' — ' : '') + [name, ...cells].join(' | '));
    });
    if (recs.length >= 6) return { kind: 'table', recs, paras: [] };
  }

  const paras = [];
  groups.forEach(groupLines => {
    const segments = groupLines.lines.map(line => {
      const output = [];
      let current = [];
      line.items.forEach((item, index) => {
        const previous = line.items[index - 1];
        if (previous && item.x - (previous.x + previous.w) > height * 3) {
          output.push(current);
          current = [];
        }
        current.push(item);
      });
      output.push(current);
      return output;
    });
    if (segments.every(segment => segment.length === 1)) {
      const text = joinItems(groupLines.lines.flatMap(line => line.items), height);
      if (text.length > 1) paras.push(text);
      return;
    }
    const columns = [];
    segments.forEach(segment =>
      segment.forEach(items => {
        const x = items[0].x;
        let column = columns.find(entry => Math.abs(entry.x - x) <= 14);
        if (!column) {
          column = { x, parts: [] };
          columns.push(column);
        }
        column.parts.push(items);
      })
    );
    columns.sort((a, b) => a.x - b.x).forEach(column => {
      const text = joinItems(column.parts.flat(), height);
      if (text.length > 1) paras.push(text);
    });
  });

  const isStat = text => /^[\d+%\s]{1,8}$/.test(text) && /\d/.test(text);
  for (let i = 0; i < paras.length; i++) {
    if (!isStat(paras[i])) continue;
    let j = i;
    while (j < paras.length && isStat(paras[j])) j++;
    const count = j - i;
    const labels = [];
    for (let k = j; k < paras.length && labels.length < count && !isStat(paras[k]) && paras[k].length < 45; k++) labels.push(k);
    if (labels.length === count) {
      for (let k = 0; k < count; k++) {
        paras[labels[k]] = paras[i + k].trim() + ' ' + paras[labels[k]];
        paras[i + k] = '';
      }
    }
    i = j - 1;
  }
  return { kind: 'text', recs: [], paras: paras.filter(Boolean) };
}

async function extractPdfLayout(buffer) {
  const library = await loadPdfLibrary();
  const doc = await library.getDocument({ data: new Uint8Array(buffer), verbosity: 0, isEvalSupported: false, useSystemFonts: false }).promise;
  const pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const content = await (await doc.getPage(n)).getTextContent();
    const layout = layoutPage(
      content.items.map(item => ({
        s: item.str,
        x: item.transform[4],
        y: item.transform[5],
        w: item.width,
        h: Math.abs(item.height || item.transform[3] || 0),
      }))
    );
    pages.push({ n, ...layout });
  }
  return { pages, pageCount: doc.numPages };
}

function pagesToChunks(pages, pageCount) {
  const chunks = [];
  pages.forEach((page, index) => {
    if (page.kind === 'table') {
      for (let i = 0; i < page.recs.length; i += 6) {
        chunks.push({ loc: { page: page.n }, lines: page.recs.slice(i, i + 6).map(line => line.slice(0, 600)) });
      }
    } else {
      textChunks(page.paras, 'para').forEach(chunk => {
        chunk.loc = { page: page.n };
        chunks.push(chunk);
      });
    }
  });
  return { chunks, pages: pageCount };
}

export async function ocrExtract(file, type, onPage) {
  if (type === 'img') {
    const text = await AI.ocrImage(file);
    const chunks = textChunks([text], 'para').map(chunk => ({ ...chunk, loc: { page: 1 } }));
    if (!chunks.length) throw new Error('ocr-empty');
    return { chunks, info: { ocr: true, pages: 1 } };
  }
  const { texts, pageCount } = await AI.ocrPDF(await file.arrayBuffer(), onPage);
  const chunks = texts.flatMap((text, index) => textChunks([text], 'para').map(chunk => ({ ...chunk, loc: { page: index + 1 } })));
  if (!chunks.length) throw new Error('ocr-empty');
  return { chunks, info: { ocr: true, pages: pageCount } };
}

export async function parseFile(file, type) {
  if (file.size > MAX_BYTES) throw Error('file-limit');
  if (type === 'txt') {
    const text = await file.text();
    const paragraphs = text.split(/\n\s*\n|\r\n\s*\r\n/).map(part => part.replace(/\s+/g, ' ').trim()).filter(Boolean);
    return { chunks: textChunks(paragraphs, 'para'), info: {} };
  }

  if (type === 'csv') {
    const rows = parseCSV(await file.text());
    const chunks = [];
    if (rows.length) {
      const header = rows[0];
      for (let i = 1; i < rows.length; i += 8) {
        const group = rows.slice(i, i + 8);
        const from = i + 1;
        const to = i + group.length;
        chunks.push({
          loc: { rows: `${from}–${to}` },
          lines: group.map(row => header.map((label, j) => (row[j] ? `${label.trim()}: ${row[j].trim()}` : '')).filter(Boolean).join(' | ')).filter(Boolean),
        });
      }
    }
    return { chunks, info: { rows: rows.length } };
  }

  if (type === 'docx') {
    const zip = await unzip(await file.arrayBuffer());
    if (!zip['word/document.xml']) throw new Error('docx');
    const xml = await zip['word/document.xml']();
    const paragraphs = [...xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)]
      .map(match => xmlText(match[0].replace(/<w:tab\/>/g, ' ').replace(/<\/w:t>/g, '</w:t> ')))
      .map(part => part.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    return { chunks: textChunks(paragraphs, 'para'), info: {} };
  }

  if (type === 'xlsx') return parseXlsx(await file.arrayBuffer());
  if (type === 'img') throw new Error('pdf-text');

  if (type === 'pdf') {
    const buffer = await file.arrayBuffer();
    try {
      const { pages, pageCount } = await extractPdfLayout(buffer.slice(0));
      const { chunks } = pagesToChunks(pages, pageCount);
      const characters = chunks.reduce((sum, chunk) => sum + chunk.lines.join(' ').length, 0);
      if (characters >= 30) return { chunks, info: { pages: pageCount || undefined } };
    } catch {
      /* fall through to the stream parser */
    }
    const { texts, pageCount } = await extractPdfStreams(buffer);
    const perPage = texts.length === pageCount;
    const chunks = [];
    texts.forEach((text, index) => {
      const paragraphs = text.split(/\n{2,}|\n/).map(part => part.replace(/\s+/g, ' ').trim()).filter(Boolean);
      textChunks(paragraphs, 'para').forEach(chunk => {
        chunk.loc = perPage ? { page: index + 1 } : { section: String(index + 1) + '.' + (chunks.length + 1) };
        chunks.push(chunk);
      });
    });
    return { chunks, info: { pages: pageCount || undefined } };
  }

  throw new Error('type');
}
