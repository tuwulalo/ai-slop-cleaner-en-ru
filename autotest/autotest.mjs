// Autotest harness for ai-slop-cleaner-en-ru.
// A deterministic measuring-stick that flags OBVIOUS AI marker patterns and scores
// "AI-likeness". NOT the skill's runtime detector (the skill stays principle-based) —
// this is dev tooling to track progress toward "zero obvious patterns" in generated text.
//
// Usage:
//   node autotest.mjs score <file>          score one file, list marker hits
//   node autotest.mjs scan  <dir>           score every .txt/.md in a dir (table)
//   node autotest.mjs gate  <file|dir>      exit 1 if any hard/strong marker remains
//   node autotest.mjs self                  discrimination check on the corpus
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(HERE);
const PATTERNS = JSON.parse(readFileSync(join(HERE, 'patterns.json'), 'utf8')).patterns
  .map((p) => ({ ...p, re: new RegExp(p.regex, p.flags || 'gi') }));

const WEIGHT = { hard: 12, strong: 5, weak: 1.2 };

export function analyze(text) {
  const words = (text.match(/[\p{L}\p{N}']+/gu) || []).length || 1;
  const hits = [];
  for (const p of PATTERNS) {
    p.re.lastIndex = 0;
    const m = text.match(p.re);
    if (m && m.length) hits.push({ id: p.id, lang: p.lang, severity: p.severity, count: m.length, sample: m[0].slice(0, 60) });
  }
  const raw = hits.reduce((s, h) => s + WEIGHT[h.severity] * h.count, 0);
  const per1k = (raw / words) * 1000;
  const score = Math.round(Math.min(100, per1k * 9));            // heuristic 0..100
  const hard = hits.filter((h) => h.severity === 'hard').reduce((s, h) => s + h.count, 0);
  const strong = hits.filter((h) => h.severity === 'strong').reduce((s, h) => s + h.count, 0);
  return { words, score, hard, strong, weak: hits.filter((h) => h.severity === 'weak').reduce((s, h) => s + h.count, 0), hits };
}

const listFiles = (dir) => readdirSync(dir).filter((f) => ['.txt', '.md'].includes(extname(f))).map((f) => join(dir, f));
const bar = (n) => '█'.repeat(Math.round(n / 5)).padEnd(20, '·');

function score(file) {
  const r = analyze(readFileSync(file, 'utf8'));
  console.log(`\n${file}`);
  console.log(`words=${r.words}  AI-likeness=${r.score}/100  [${bar(r.score)}]  (hard=${r.hard} strong=${r.strong} weak=${r.weak})`);
  if (r.hits.length) {
    console.log('markers:');
    for (const h of r.hits.sort((a, b) => WEIGHT[b.severity] - WEIGHT[a.severity]))
      console.log(`  [${h.severity}] ${h.id} ×${h.count}  «${h.sample}»`);
  } else console.log('markers: none');
  return r;
}

function scan(dir) {
  const rows = listFiles(dir).map((f) => ({ f, r: analyze(readFileSync(f, 'utf8')) }))
    .sort((a, b) => b.r.score - a.r.score);
  console.log(`\nAI-likeness scan: ${dir}\n`);
  for (const { f, r } of rows)
    console.log(`${String(r.score).padStart(3)}/100 [${bar(r.score)}] h${r.hard} s${r.strong}  ${f.split(/[\\/]/).pop()}`);
}

function gate(target) {
  const files = statSync(target).isDirectory() ? listFiles(target) : [target];
  let bad = 0;
  for (const f of files) {
    const r = analyze(readFileSync(f, 'utf8'));
    if (r.hard + r.strong > 0) {
      bad++;
      console.log(`FAIL ${f.split(/[\\/]/).pop()} — hard=${r.hard} strong=${r.strong}`);
      for (const h of r.hits.filter((x) => x.severity !== 'weak')) console.log(`     [${h.severity}] ${h.id} «${h.sample}»`);
    }
  }
  if (bad) { console.log(`\nGATE FAILED: ${bad} file(s) still contain obvious AI markers.`); process.exit(1); }
  console.log('\nGATE PASSED: no hard/strong AI markers found.');
}

function self() {
  const corpus = join(ROOT, 'corpus');
  const human = existsSync(corpus) ? listFiles(corpus) : [];
  const aiSample = `В современном мире нейросети играют ключевую роль. Важно отметить, что это не просто инструмент, а настоящий помощник. Давайте разберёмся, как это работает. In today's fast-paced world, it's important to note that AI is a testament to innovation. Let's dive in and delve into this rich tapestry of possibilities. 🚀 Ключевая идея`;
  console.log('--- AI-ish control sample ---');
  const a = analyze(aiSample); console.log(`AI-likeness=${a.score}/100 hard=${a.hard} strong=${a.strong}`);
  console.log('\n--- Human corpus (should score LOW) ---');
  let sum = 0, n = 0;
  for (const f of human) { const r = analyze(readFileSync(f, 'utf8')); sum += r.score; n++; console.log(`${String(r.score).padStart(3)}/100 ${f.split(/[\\/]/).pop()}`); }
  if (n) console.log(`\nmean human score = ${(sum / n).toFixed(1)}/100 (lower = better discrimination)`);
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'score' && arg) score(arg);
else if (cmd === 'scan' && arg) scan(arg);
else if (cmd === 'gate' && arg) gate(arg);
else if (cmd === 'self') self();
else console.log('usage: node autotest.mjs score|scan|gate <path>  |  self');
