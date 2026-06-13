#!/usr/bin/env node
// Batch triage: scan files/folders for AI-slop marker density.
// No dependencies. Usage:
//   node scripts/scan.mjs <file|dir> [more...]
//   node scripts/scan.mjs docs/            (recurses, picks .md/.txt/.markdown)
//
// This is a TRIAGE tool, not a verdict — it surfaces candidates by marker
// density so you know which files to actually read with the skill. See
// scripts/markers.mjs for the caveat.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { analyze } from './markers.mjs';

const TEXT_EXT = new Set(['.md', '.markdown', '.txt']);
const args = process.argv.slice(2);
if (!args.length) { console.log('usage: node scripts/scan.mjs <file|dir> [more...]'); process.exit(2); }

function collect(p, out) {
  let s; try { s = statSync(p); } catch { console.error('skip (not found): ' + p); return; }
  if (s.isDirectory()) {
    for (const e of readdirSync(p)) {
      if (e === 'node_modules' || e === '.git') continue;
      collect(join(p, e), out);
    }
  } else if (TEXT_EXT.has(extname(p).toLowerCase())) out.push(p);
}

const files = [];
for (const a of args) collect(a, files);
if (!files.length) { console.log('no .md/.txt/.markdown files found'); process.exit(0); }

const rows = files.map(f => {
  const r = analyze(readFileSync(f, 'utf8').replace(/\r\n/g, '\n'));
  return { f, ...r };
}).sort((a, b) => b.net - a.net);

const pad = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);
const BAND = { ai: 'AI', mixed: 'MIXED', human: 'human' };

console.log(pad('band', 7) + padL('net', 6) + padL('words', 7) + '  ' + pad('top markers', 34) + 'file');
console.log('-'.repeat(96));
for (const r of rows) {
  const band = BAND[r.band] + (r.lowConfidence ? '?' : '');
  console.log(
    pad(band, 7) + padL(r.net, 6) + padL(r.words, 7) + '  ' +
    pad((r.topHits.join(' ') || '-').slice(0, 32), 34) + r.f
  );
}
const ai = rows.filter(r => r.band === 'ai').length;
const mixed = rows.filter(r => r.band === 'mixed').length;
console.log('-'.repeat(96));
console.log(`${rows.length} files | AI: ${ai} | mixed: ${mixed} | human: ${rows.length - ai - mixed}`);
console.log('"?" = short text (<120 words), low confidence. Triage only — read flagged files with the skill.');
