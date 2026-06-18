// Autotest harness for ai-slop-cleaner-en-ru.
// A deterministic measuring-stick that flags OBVIOUS AI marker patterns and scores
// "AI-likeness". NOT the skill's runtime detector (the skill stays principle-based) —
// this is dev tooling to track progress toward "zero obvious patterns" in cleaned text.
//
// Calibration philosophy (mirrors the skill): NEVER judge by a single weak pattern.
//  - weak markers alone are NOT evidence — capped low when no hard/strong co-occur;
//  - typographic norms (em dash, guillemets, en dash) count ONLY in casual register
//    (in formal/literary RU they are correct human typography);
//  - the gate fails on a hard tell or on >=2 distinct strong patterns (co-occurrence).
//
// Usage:
//   node autotest.mjs score <file>          score one file, list marker hits
//   node autotest.mjs scan  <dir>           score every .txt/.md in a dir (table)
//   node autotest.mjs gate  <file|dir>      exit 1 on hard OR >=2 distinct strong markers
//   node autotest.mjs self                  discrimination check on the corpus
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(HERE);
const PATTERNS = JSON.parse(readFileSync(join(HERE, 'patterns.json'), 'utf8')).patterns
  .map((p) => ({ ...p, re: new RegExp(p.regex, p.flags || 'gi') }));

// typographic patterns that are legitimate human norm in formal/literary RU —
// count them ONLY when the text reads as casual.
const CASUAL_ONLY = new Set([
  'ru_em_dash', 'ru_guillemets', 'ru_en_dash_range',
  'ru_clean_quote_in_lowercase_comment', 'ru_decorative_single_paren_emote',
]);

export function detectRegister(text) {
  const t = text.slice(0, 6000);
  const words = (text.match(/[\p{L}\p{N}']+/gu) || []).length || 1;
  const sents = (text.match(/[.!?]+/g) || []).length || 1;
  let casual = 0, formal = 0;
  if (/\)\){1,}|\(\(|:-?\)|:-?\(|\bлол\b|\bблин\b|\bхз\b|\bваще\b|\bкороч/i.test(t)) casual += 2; // рунет-скобки/смайлы/слэнг
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(t)) casual += 1;          // emoji
  const lc = (t.match(/(^|\n)\s*[a-zа-яё]/g) || []).length;
  if (lc > 3) casual += 1;                                                      // many lowercase line-starts
  if (words / sents > 17) formal += 1;                                          // long sentences
  if (/\b(we propose|we demonstrate|we introduce|мы предлагаем|мы показываем|по данным|сообщил[аи]?|outperforms|F1|BLEU|таким образом|следовательно|респонденты)\b/i.test(t)) formal += 2;
  if (words > 400 && !/[\u{1F300}-\u{1FAFF}]/u.test(t)) formal += 1;
  return casual > formal ? 'casual' : formal > casual ? 'formal' : 'mixed';
}

export function analyze(text, registerOverride) {
  const words = (text.match(/[\p{L}\p{N}']+/gu) || []).length || 1;
  const register = registerOverride || detectRegister(text);
  const hits = [];
  for (const p of PATTERNS) {
    if (register === 'formal' && CASUAL_ONLY.has(p.id)) continue;              // typographic norm in formal text
    p.re.lastIndex = 0;
    const m = text.match(p.re);
    if (m && m.length) hits.push({ id: p.id, severity: p.severity, count: m.length, sample: m[0].slice(0, 50) });
  }
  const hard = hits.filter((h) => h.severity === 'hard');
  const strong = hits.filter((h) => h.severity === 'strong');
  const weak = hits.filter((h) => h.severity === 'weak');
  const hardN = hard.reduce((s, h) => s + h.count, 0);
  const strongN = strong.reduce((s, h) => s + h.count, 0);
  const weakN = weak.reduce((s, h) => s + h.count, 0);
  const per1k = (n) => (n / words) * 1000;

  // Co-occurrence scoring: weak alone is NOT evidence.
  let score;
  if (hardN > 0) score = Math.min(100, 85 + (hardN - 1) * 5 + strong.length * 2);
  else if (strong.length > 0) score = Math.round(Math.min(80, 38 + strong.length * 8 + per1k(strongN) * 4));
  else score = Math.round(Math.min(15, per1k(weakN) * 1.2));                   // weak-only → capped low

  return { words, register, score, hard: hardN, strong: strongN, strongDistinct: strong.length, weak: weakN, hits };
}

const SEVW = { hard: 3, strong: 2, weak: 1 };
const listFiles = (dir) => readdirSync(dir).filter((f) => ['.txt', '.md'].includes(extname(f))).map((f) => join(dir, f));
const bar = (n) => '█'.repeat(Math.round(n / 5)).padEnd(20, '·');

function score(file) {
  const r = analyze(readFileSync(file, 'utf8'));
  console.log(`\n${file}`);
  console.log(`words=${r.words} register=${r.register}  AI-likeness=${r.score}/100  [${bar(r.score)}]  (hard=${r.hard} strong=${r.strong}/${r.strongDistinct} weak=${r.weak})`);
  if (r.hits.length) {
    console.log('markers:');
    for (const h of r.hits.sort((a, b) => SEVW[b.severity] - SEVW[a.severity]))
      console.log(`  [${h.severity}] ${h.id} ×${h.count}  «${h.sample}»`);
  } else console.log('markers: none');
  return r;
}

function scan(dir) {
  const rows = listFiles(dir).map((f) => ({ f, r: analyze(readFileSync(f, 'utf8')) })).sort((a, b) => b.r.score - a.r.score);
  console.log(`\nAI-likeness scan: ${dir}\n`);
  for (const { f, r } of rows)
    console.log(`${String(r.score).padStart(3)}/100 [${bar(r.score)}] ${r.register.padEnd(6)} h${r.hard} s${r.strongDistinct}  ${f.split(/[\\/]/).pop()}`);
}

function gate(target) {
  const files = statSync(target).isDirectory() ? listFiles(target) : [target];
  let bad = 0;
  for (const f of files) {
    const r = analyze(readFileSync(f, 'utf8'));
    if (r.hard > 0 || r.strongDistinct >= 2) {                                 // co-occurrence gate
      bad++;
      console.log(`FAIL ${f.split(/[\\/]/).pop()} — hard=${r.hard} strong(distinct)=${r.strongDistinct}`);
      for (const h of r.hits.filter((x) => x.severity !== 'weak')) console.log(`     [${h.severity}] ${h.id} «${h.sample}»`);
    }
  }
  if (bad) { console.log(`\nGATE FAILED: ${bad} file(s) carry a hard tell or >=2 distinct strong markers.`); process.exit(1); }
  console.log('\nGATE PASSED: no hard tell, no strong co-occurrence.');
}

function self() {
  const corpus = join(ROOT, 'corpus');
  const human = existsSync(corpus) ? listFiles(corpus) : [];
  const aiSample = `В современном мире нейросети играют ключевую роль. Важно отметить, что это не просто инструмент, а настоящий помощник. Давайте разберёмся, как это работает. In today's fast-paced world, it's important to note that AI is a testament to innovation. Let's dive in and delve into this rich tapestry of possibilities. 🚀 Ключевая идея`;
  const a = analyze(aiSample);
  console.log(`--- AI-ish control ---  score=${a.score}/100 register=${a.register} hard=${a.hard} strong=${a.strongDistinct}`);
  if (!human.length) { console.log('(no corpus/ in this checkout — score/scan/gate still work standalone)'); return; }
  console.log('\n--- Human corpus (should score LOW) ---');
  let sum = 0;
  for (const f of human) { const r = analyze(readFileSync(f, 'utf8')); sum += r.score; console.log(`${String(r.score).padStart(3)}/100 ${r.register.padEnd(6)} ${f.split(/[\\/]/).pop()}`); }
  console.log(`\nmean human score = ${(sum / human.length).toFixed(1)}/100 (lower = better discrimination)`);
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'score' && arg) score(arg);
else if (cmd === 'scan' && arg) scan(arg);
else if (cmd === 'gate' && arg) gate(arg);
else if (cmd === 'self') self();
else console.log('usage: node autotest.mjs score|scan|gate <path>  |  self');
