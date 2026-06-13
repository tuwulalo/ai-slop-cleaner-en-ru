#!/usr/bin/env node
// Validate SKILL.md against the Agent Skills spec (agentskills.io/specification).
// No dependencies. Usage:  node validate.mjs [skill-dir]   (defaults to ".")
import { readFileSync, existsSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';

const dir = resolve(process.argv[2] || '.');
let md;
try { md = readFileSync(join(dir, 'SKILL.md'), 'utf8').replace(/\r\n/g, '\n'); }
catch { console.log('FAIL: no SKILL.md in ' + dir); process.exit(1); }

const fm = md.match(/^---\n([\s\S]*?)\n---/);
if (!fm) { console.log('FAIL: no YAML frontmatter'); process.exit(1); }
const lines = fm[1].split('\n');

const fields = {}; let i = 0;
while (i < lines.length) {
  const km = lines[i].match(/^([A-Za-z0-9_-]+):(.*)$/);
  if (km) {
    const key = km[1]; const val = km[2].trim();
    if (['|', '>', '|-', '>-'].includes(val)) {            // block scalar
      const b = []; i++;
      while (i < lines.length && (lines[i].startsWith('  ') || lines[i].trim() === '')) { b.push(lines[i].replace(/^ {2}/, '')); i++; }
      while (b.length && b[b.length - 1].trim() === '') b.pop();
      fields[key] = b.join('\n'); continue;
    } else if (val === '') {                               // nested map (e.g. metadata)
      i++; while (i < lines.length && lines[i].startsWith('  ')) i++;
      fields[key] = ' MAP '; continue;
    } else { fields[key] = val; }
  }
  i++;
}

const R = []; const ck = (ok, n, d = '') => R.push([ok, n, d]);
const name = fields.name || '';
ck(!!name, 'name present', name);
ck(name.length <= 64, 'name <= 64 chars', name.length + '');
ck(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name), 'name pattern (lowercase, single hyphens, no edge)', name);
ck(name === basename(dir), 'name == directory', basename(dir));
const desc = fields.description || '';
ck(desc.trim().length > 0, 'description present & non-empty');
ck(desc.length >= 1 && desc.length <= 1024, 'description 1..1024 chars', desc.length + '');
if (fields.compatibility) ck(fields.compatibility.length <= 500, 'compatibility <= 500', fields.compatibility.length + '');
if (fields['allowed-tools'] !== undefined)
  ck(fields['allowed-tools'] !== ' MAP ' && !fields['allowed-tools'].includes('\n'),
     'allowed-tools is a space-separated string (not a YAML list)', fields['allowed-tools']);
const allowed = new Set(['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools']);
const unknown = Object.keys(fields).filter(k => !allowed.has(k));
ck(unknown.length === 0, 'no non-spec top-level keys', unknown.join(',') || 'none');
ck(md.split('\n').length <= 500, 'SKILL.md <= 500 lines', md.split('\n').length + '');
for (const r of ['reference/markers-ru.md', 'reference/markers-en.md', 'reference/markers-fiction.md',
                 'reference/markers-shortform.md', 'reference/structural-signals.md',
                 'reference/human-signals.md', 'reference/scoring.md', 'reference/rewrite.md'])
  ck(existsSync(join(dir, r)), 'referenced file exists: ' + r);

let pass = true;
for (const [ok, n, d] of R) { if (!ok) pass = false; console.log((ok ? 'PASS ' : 'FAIL ') + n + (d ? '  [' + d + ']' : '')); }
console.log('\n' + (pass ? 'RESULT: ALL CHECKS PASSED' : 'RESULT: SOME CHECKS FAILED'));
process.exit(pass ? 0 : 1);
