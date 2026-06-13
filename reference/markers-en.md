# English AI-text markers

Source: Wikipedia "Signs of AI writing" (WikiProject AI Cleanup), distilled into
detection signals. Each marker is a **signal, not proof** — weigh density and
co-occurrence (see `scoring.md`). Weight noted per category.

---

## 1. Inflated significance / legacy puffery — WEIGHT HIGH

- "stands as / serves as a testament", "plays a vital/crucial/pivotal/key role"
- "marks a turning point", "represents a shift", "underscores its importance"
- "leaves a lasting/indelible mark", "in the ever-evolving landscape of"
- "reflects a broader", "setting the stage for", "deeply rooted"
- transition/scaffolding clichés: "when it comes to", "in conclusion",
  "let's dive in / let's explore", "in the realm of"

> Why: pads importance instead of stating the fact.

---

## 2. Negative parallelism — WEIGHT HIGH

- "It's not just X, it's Y", "not only… but also…", "isn't merely… it's…"

> The single stickiest AI tell. One is fine; two-plus per piece is damning.

---

## 3. AI vocabulary cluster — WEIGHT HIGH (in clusters)

High-frequency post-2023 words that co-occur:

> Additionally, Moreover, Furthermore, delve, intricate, intricacies, tapestry,
> testament, underscore, leverage, foster, garner, robust, seamless, vibrant,
> pivotal, crucial, realm, landscape (abstract), navigate (figurative),
> elevate, harness, unlock, embark, showcase, resonate, holistic.

> Why: one is nothing; five different ones in a short passage is a strong cluster.

---

## 4. Superficial "-ing" tails — WEIGHT MEDIUM

- "…, highlighting the importance of…", "…, ensuring…", "…, reflecting…",
  "…, fostering…", "…, ultimately contributing to…"

> Test: delete the tail — meaning unchanged. Fake depth.

---

## 5. Rule of three — WEIGHT MEDIUM

- "fast, reliable, and scalable", "innovation, inspiration, and insight"

> AI forces triads to feel "complete." Count consecutive ones.

---

## 6. Vague attribution / weasel + hedging — WEIGHT MEDIUM

- "experts believe", "studies show" (no cite), "it is widely regarded",
  "some critics argue", "industry reports suggest"
- hedge pileups: "may potentially", "could arguably", "in some cases"

---

## 7. Formulaic structure & conclusions — WEIGHT MEDIUM

- "Challenges and Future Prospects", "Despite its… faces several challenges…
  Despite these challenges…"
- empty upbeat endings: "The future looks bright", "exciting times lie ahead",
  "a journey toward excellence"

---

## 8. Chatbot correspondence artifacts — WEIGHT HIGH (near-proof)

- "Certainly!", "Of course!", "You're absolutely right!", "Great question!"
- "I hope this helps", "Let me know if…", "Here's a…"
- "As an AI language model", "As of my last training update", "as of [date]"
- "While specific details are limited…"

> Direct evidence the text was pasted from a chat and never edited.

---

## 9. Typography & formatting — WEIGHT LOW (only in sum)

- em dash "—" well above normal density, used for "punchy" pauses
- mechanical **bold** on scattered phrases
- inline-header bullet lists: "**Performance:** …" throughout
- **decorative emoji markers** prefixing headings/list items (🚀 Launch,
  💡 Key insight, ✅ Next steps) — one "corporate" emoji per bullet, in neat rows
- Title Case In Every Heading
- curly quotes "…" instead of straight quotes

> Weak alone — many humans format this way. Count only alongside categories 1–8.

> **Emoji, specifically:** only the *decorative structural* pattern above
> (emoji as section/bullet markers from the 🚀💡✅🔥⚡🎯 set) is an AI tell.
> Emoji used **inline, reactively, emotionally** ("this is peak 🔥", "I'm dead
> 💀😂") are a *human* signal (Reddit/social) and count toward the person, not
> against. Never penalize a text for emoji as such. Full rule: SKILL.md, "Правило: ИИ-эмодзи".

---

## 10. Encyclopedic parenthetical glosses — WEIGHT MEDIUM

A bracketed aside that spells out a nickname / common name / synonym like a
dictionary entry. Reads AI-ish, especially in a formal piece — real people either
just use the nickname or drop it casually, without a bookish "(commonly known as)".

- "(commonly known as X)", "(also known as / a.k.a. X)", "(colloquially X)"
- "(or simply X)", "(for short, X)", "(often called X)"
- "(as the community calls it)"
- general template: `(<filler> + name/nickname)` added for "completeness", not need

> Why: an encyclopedic reflex — gloss every name. One in a news/official post
> already shows. **Register nuance:** strong tell in formal/news text; a light
> casual aside in a blog/forum ("everyone just calls it kimi") is fine — don't
> penalize. It's the stiff bookish "(commonly known as …)" that's the tell, not
> the nickname itself. When cleaning, drop it or introduce the nickname naturally.

---

## Quick Grep hooks (batch triage, not verdict)

```
\bnot just\b.{1,40}\bit'?s\b|not only\b.{1,40}\bbut also\b
\b(testament|pivotal|crucial|delve|intricate|tapestry|seamless|robust)\b
\b(moreover|furthermore|additionally)\b
stands as|serves as|plays a (vital|crucial|key|pivotal) role
when it comes to|in conclusion|let'?s (dive|explore)|in the realm of
experts believe|studies show|it is widely regarded
\b(certainly|of course)!|i hope this helps|great question
ever-evolving|lasting (impact|legacy)|future looks bright
\((commonly|also|otherwise) known as|\(a\.?k\.?a\.?|\(or simply|\(for short
```
