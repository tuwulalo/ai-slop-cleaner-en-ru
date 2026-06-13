// Shared heuristic for the tooling (scan.mjs, eval/run.mjs).
//
// IMPORTANT: this is a DETERMINISTIC marker-density baseline, NOT the skill.
// The real skill is the model reading SKILL.md and exercising judgment. This
// module exists only so tooling can (a) triage files in bulk and (b) regression-
// guard the marker lists: if an edit to the reference markers breaks separation
// of AI vs human on the labeled eval set, eval/run.mjs catches it. Treat its
// band as a rough signal, never as a verdict.

const rx = (src, flags = 'gi') => ({ re: new RegExp(src, flags) });

// Strong AI tells (weight 3)
export const STRONG = [
  ['ru significance', rx('в современном мире|в наше время|не секрет, что')],
  ['ru vazhno', rx('важно отметить|стоит отметить|следует учитывать|нельзя не отметить')],
  ['ru key-role', rx('играет (ключевую|важную|значительную) роль|краеугольный камень')],
  ['ru not-just', rx('не просто .{1,40} а |не только .{1,40} но и')],
  ['ru tech-conf', rx('под капотом|давайте (разбер|погруз)|разлож(им|ить) по полочкам')],
  ['ru game-changer', rx('меняет правила игры|выходит на новый уровень|открывает новые возможности')],
  ['en not-just', rx("not just\\b.{1,40}\\bit'?s\\b|not only\\b.{1,40}\\bbut also\\b")],
  ['en vocab', rx('\\b(delve|tapestry|testament|pivotal|seamless)\\b')],
  ['en hood', rx('\\bunder the hood\\b|\\blet\'?s (dive|explore)\\b|\\bwhen it comes to\\b')],
  ['en landscape', rx("in today'?s .{0,30}(landscape|world)|ever-evolving")],
];

// Medium AI tells (weight 2)
export const MEDIUM = [
  ['ru vague-src', rx('эксперты считают|по мнению специалистов|исследования показывают')],
  ['ru mention', rx('стоит упомянуть|нельзя обойти стороной|как говорится')],
  ['ru gloss', rx('\\((в обиходе|в народе|в просторечии|он же|она же|также известн|или просто|сокращённо)')],
  ['en conj', rx('\\b(moreover|furthermore|additionally)\\b|\\bin conclusion\\b')],
  ['en vague-src', rx('experts believe|studies show|it is widely regarded')],
  ['en gloss', rx('\\((commonly|also|otherwise) known as|\\(a\\.?k\\.?a\\.?|\\(or simply|\\(for short')],
];

// Near-certain chatbot artifacts (forces "ai")
export const CHATBOT = [
  ['ru bot', rx('как языковая модель|надеюсь,? (это|эта статья).{0,20}(полезн|помог)|спасибо за внимание|отличный вопрос|вы абсолютно правы')],
  ['en bot', rx('as an ai language model|i hope this helps|great question|certainly!|of course!')],
];

// Human counter-signals (subtract)
export const COUNTER = [
  ['ru slang', rx('\\b(имхо|кмк|хз|лол|кек|блин|чел|короче|изи|оверкилл)\\b|такое себе|по факту|зашло|не зашло')],
  ['ru personal', rx('\\d+\\s?(фпс|мс|гб|мб|ключ|воркер|минут|секунд)')],
  ['ru reply', rx('@\\w+|как (писали|говорили) (выше|в треде)')],
  ['en slang', rx('\\b(imho|tbh|ngl|lol|lmao|kinda|gonna|dunno|meh)\\b|\\bthis is (peak|fire)\\b')],
  ['en personal', rx('\\d+\\s?(fps|ms|gb|mb|keys?|workers?|min|sec)\\b')],
];

const PICTO = /\p{Extended_Pictographic}/u;
const PICTO_G = /\p{Extended_Pictographic}/gu;
// emoji that leads a line / heading / bullet = decorative (AI tell)
const LEADING_EMOJI = /^\s*(?:[-*#>]|\d+[.)])?\s*\p{Extended_Pictographic}/u;

export function wordCount(t) { return (t.trim().match(/\S+/g) || []).length; }

function countSet(text, set) {
  let total = 0; const hits = [];
  for (const [label, { re }] of set) {
    const m = text.match(re);
    if (m) { total += m.length; hits.push(`${label}×${m.length}`); }
  }
  return { total, hits };
}

export function analyze(text) {
  const words = wordCount(text);
  const strong = countSet(text, STRONG);
  const medium = countSet(text, MEDIUM);
  const chatbot = countSet(text, CHATBOT);
  const counter = countSet(text, COUNTER);

  // emoji: decorative (leads a line) vs inline (human)
  let deco = 0, inline = 0;
  for (const line of text.split(/\n/)) {
    const n = (line.match(PICTO_G) || []).length;
    if (!n) continue;
    if (LEADING_EMOJI.test(line)) { deco += 1; inline += n - 1; }
    else inline += n;
  }
  let counterScore = counter.total + inline;

  const per100 = Math.max(1, words / 100);
  const density = (3 * strong.total + 2 * medium.total + 1.5 * deco) / per100;
  const net = density - 1.5 * counterScore;

  let band;
  if (chatbot.total > 0) band = 'ai';
  else if (net >= 6) band = 'ai';
  else if (net >= 2.5) band = 'mixed';
  else band = 'human';

  const lowConfidence = words < 120;
  const topHits = [...strong.hits, ...chatbot.hits, ...medium.hits].slice(0, 4);

  return {
    words, band, lowConfidence,
    density: +density.toFixed(1), net: +net.toFixed(1),
    strong: strong.total, medium: medium.total, chatbot: chatbot.total,
    counter: counterScore, decoEmoji: deco, inlineEmoji: inline,
    topHits,
  };
}
