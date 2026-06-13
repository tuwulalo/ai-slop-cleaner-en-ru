<!-- Language: **English** · [Русский](README.ru.md) -->
**English** · [Русский](README.ru.md)

# ai-slop-cleaner-en-ru

**An AI-slop cleaner and detector for Claude Code / the Claude Agent SDK.**
A bilingual (EN + RU) skill: above all it **cleans the AI out of text**, rewriting
clichés into natural prose while preserving meaning, facts and terms — and it also
diagnoses "AI-likeness" (how machine-written a passage is, by which markers, with
what confidence).

## What it does

Give it an article, forum post, PR description, essay or comment and it:

- **rewrites the slop out** into natural human prose, preserving every fact, number,
  term, quote and code block — it never invents content;
- or, on request, just **screens** the text: rates its "AI-likeness", lists the exact
  markers it found, and honestly reports confidence. AI detection is unreliable —
  translation, editing and plain good writers all cause false positives, and the
  skill says so instead of pretending otherwise.

It works in both languages. English tells follow Wikipedia's "Signs of AI writing";
Russian tells cover everyday clichés plus the Habr/vc.ru tech-blog style ("под
капотом", "давайте разберёмся").

**It detects the register first and rewrites within it.** Official press post,
news, blog or forum comment — the skill figures out the tone up front and keeps it
consistent: it won't leave casual slang in a formal announcement ("выкатила" →
"представила"), and it won't flatten a lively forum comment into stiff officialese.
Register consistency is treated as its own axis, separate from the AI-vs-human one.

It also tells **decorative AI emoji** apart from **genuine human emoji**:

- AI emoji = cold section markers prefixing headings/bullets (🚀 Launch, 💡 Key idea,
  ✅ Next steps), one "corporate" emoji per item — that's a tell, and it gets stripped
  when cleaning;
- human emoji = hot, reactive, in-sentence ("this is peak 🔥", "I'm dead 💀😂") — that
  counts *toward* a human author.

Emoji on their own are never treated as slop. Scoring is a calibrated judgment, not
rigid point-math — the skill is deliberately not boxed into a fixed template.

## What it catches

- Russian clichés: «важно отметить», «не просто X, а Y», «в современном мире»,
  «играет ключевую роль», vague «эксперты считают»;
- Russian tech-blog slop (Habr/vc.ru): **«под капотом»**, «давайте разберёмся»,
  «разложим по полочкам», «и вот тут на сцену выходит»;
- English tells (Wikipedia AI Cleanup): "not just… it's a testament", "delve",
  "pivotal role", AI-vocabulary clusters;
- structure: the rule of three, uniform rhythm, boilerplate
  "Intro / Conclusion / Future prospects" sections, decorative emoji markers,
  empty upbeat endings;
- and **human counter-signals** (typos, slang, personal numbers, argument, replies
  to other people, live reactive emoji) that lower the score.

## What the output looks like

There is no fixed form — the skill answers in plain language and adapts to the text
and the question (a yes/no gets a one-liner; "break it down" gets a full pass).
Roughly:

> **Almost certainly AI (~95/100), medium confidence.**
> Decisive: "the cache isn't just storage, it's a whole acceleration mechanism"
> (negative parallelism) + a double "under the hood" with zero specifics. Plus
> "hard to overstate the role of" and a 🚀 emoji heading. Nothing human: no numbers,
> no first-hand experience. No counter-signals.

The number is a ballpark, not a precise figure, and confidence is stated honestly
(short text → low confidence).

## Install

### Claude Code (as a user skill)

```bash
git clone https://github.com/tuwulalo/ai-slop-cleaner-en-ru.git ~/.claude/skills/ai-slop-cleaner-en-ru
```

On Windows:

```powershell
git clone https://github.com/tuwulalo/ai-slop-cleaner-en-ru.git "$env:USERPROFILE\.claude\skills\ai-slop-cleaner-en-ru"
```

Restart Claude Code — the skill is picked up automatically and triggers when you ask
to clean AI out of a text or to check a text for AI.

### As a project skill (for a team/repo)

Drop the folder into `.claude/skills/ai-slop-cleaner-en-ru` inside your project and
commit it — the skill becomes available to everyone working in the repository.

## Usage

Just ask in plain language:

- "Was this written by a neural network?" + paste a passage
- "Clean the AI out of this" / "rewrite this like a human, kill the slop"
- "Is this AI?" + a link to an article
- "Screen every .md in docs/ for slop and give me a table"
- «Вычисти ИИ из этого текста» / «проверь, не нейросеть ли это писала»

Modes: diagnose one text (full report), **clean** (rewrite + change log + new score),
batch over files (table + breakdown of the worst), quick yes/no, or by URL (via
WebFetch).

## Layout

```
ai-slop-cleaner-en-ru/
├── SKILL.md                  # skill instructions (detect + clean), the emoji rule
├── reference/
│   ├── markers-ru.md         # Russian markers (general + tech-blog)
│   ├── markers-en.md         # English markers (Wikipedia AI Cleanup)
│   ├── human-signals.md      # human counter-signals
│   ├── scoring.md            # scoring anchors and verdict bands
│   └── rewrite.md            # cleaning mode: "cliché → natural replacement" tables
└── examples/
    └── examples.md           # annotated samples for calibration
```

## What it does NOT do

- It doesn't "prove" authorship — it gives a probabilistic verdict with a confidence level.
- When cleaning it invents no facts and doesn't touch numbers, terms, quotes or code —
  it removes clichés, not content.
- It doesn't replace judgment: on short text (<120 words) confidence is always low.

## Sources of the patterns

- [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) (WikiProject AI Cleanup)
- [Википедия: Признаки сгенерированности текста](https://ru.wikipedia.org/wiki/Википедия:Признаки_сгенерированности_текста)
- Breakdowns of ChatGPT/DeepSeek clichés on vc.ru, otzyvmarketing, Skillbox; observations of the Habr/vc.ru style.

## License

MIT — see [LICENSE](LICENSE).
