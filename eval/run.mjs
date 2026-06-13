#!/usr/bin/env node
// Regression guard for the marker set. Runs the deterministic heuristic
// (scripts/markers.mjs) over labeled cases and checks each lands in an expected
// band. This does NOT test the model's judgment — it guards the reference marker
// lists: if an edit breaks AI-vs-human separation on the labeled set, this fails.
// Usage: node eval/run.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { analyze } from '../scripts/markers.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const cases = JSON.parse(readFileSync(join(here, 'cases.json'), 'utf8'));
const THRESHOLD = 0.85;

let pass = 0;
const fails = [];
console.log('id'.padEnd(20) + 'expect'.padEnd(16) + 'got'.padEnd(8) + 'net'.padStart(6) + '  words');
console.log('-'.repeat(60));
for (const c of cases) {
  const expect = Array.isArray(c.expect) ? c.expect : [c.expect];
  const r = analyze(c.text);
  const ok = expect.includes(r.band);
  if (ok) pass++; else fails.push({ id: c.id, expect, got: r.band });
  const tag = (ok ? 'ok  ' : 'FAIL') + ' ';
  console.log(
    tag + c.id.padEnd(15) + expect.join('|').padEnd(16) +
    r.band.padEnd(8) + String(r.net).padStart(6) + '  ' + r.words + (r.lowConfidence ? ' (short)' : '')
  );
}
const acc = pass / cases.length;
console.log('-'.repeat(60));
console.log(`accuracy: ${pass}/${cases.length} = ${(acc * 100).toFixed(0)}%  (threshold ${(THRESHOLD * 100)}%)`);
if (fails.length) {
  console.log('\nmisses:');
  for (const f of fails) console.log(`  ${f.id}: expected ${f.expect.join('|')}, got ${f.got}`);
}
console.log('\nNote: this is a heuristic baseline over the marker lists, not the model.');
console.log('The subtle "mixed" class is hard for regex; clear AI vs human separation is what it guards.');
process.exit(acc >= THRESHOLD ? 0 : 1);
