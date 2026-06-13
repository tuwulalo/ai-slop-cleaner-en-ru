# ai-slop-cleaner-en-ru

**Чистильщик и детектор ИИ-сгенерированного текста для Claude Code / Claude Agent SDK.**
Двуязычный (EN + RU) скилл: главное — **вычищает ИИ из текста**, переписывая штампы
на живой язык с сохранением смысла, фактов и терминов; а также ставит диагноз
«иишности» (насколько похож на нейро-слоп, по каким маркерам, с какой уверенностью).

## English

A bilingual (English + Russian) Claude skill that **cleans the AI out of text** —
and detects it. Give it an article, forum post, PR description, essay or comment and it:

- **rewrites the slop out** into natural human prose, preserving every fact, number,
  term, quote and code block (it never invents content);
- or, on request, just **screens** the text: rates its "AI-likeness", lists the exact
  markers it found, and honestly reports confidence (AI detection is unreliable —
  translation, editing and good writers all cause false positives).

It works in both languages — English tells follow Wikipedia's "Signs of AI writing",
Russian tells cover everyday clichés plus the Habr/vc.ru tech-blog style ("под капотом",
"давайте разберёмся"). It also tells **decorative AI emoji** (🚀 / 💡 / ✅ as heading
and bullet markers) apart from **genuine human emoji** (reactive, in-sentence — "this
is peak 🔥", "I'm dead 💀"): the former is a tell and gets stripped when cleaning, the
latter counts toward a human author. Scoring is a calibrated judgment, not rigid
point-math — the skill is deliberately not boxed into a fixed template.

```bash
git clone https://github.com/tuwulalo/ai-slop-cleaner-en-ru.git ~/.claude/skills/ai-slop-cleaner-en-ru
```

Then ask in plain language: "clean the AI slop out of this", "rewrite this like a
human", or "was this written by a neural network?".

---

## Зачем

ИИ-текст выдаёт не отдельное слово, а **плотность штампов + однородность + полное
отсутствие живого**. `ai-slop-cleaner-en-ru` ищет именно связку сигналов, а не одну фразу,
и честно сообщает уверенность — потому что детекторы ИИ в принципе ненадёжны
(перевод, вычитка и хороший редактор дают ложные срабатывания).

Ловит, среди прочего:

- русские штампы: «важно отметить», «не просто X, а Y», «в современном мире»,
  «играет ключевую роль», обтекаемое «эксперты считают»;
- техно-блоговый слоп (Habr/vc.ru): **«под капотом»**, «давайте разберёмся»,
  «разложим по полочкам», «и вот тут на сцену выходит»;
- английские tells по гайду Wikipedia: "not just… it's a testament", "delve",
  "pivotal role", AI-vocabulary кластеры;
- структуру: правило трёх, ровный ритм, шаблонные «Введение/Заключение/Перспективы»,
  **декоративные эмодзи-маркеры** в заголовках/буллетах (🚀 Запуск, 💡 Идея),
  восторженные концовки;
- и **контр-сигналы** живого человека (опечатки, сленг, личные числа, спор,
  обращения к собеседнику, **живые реактивные эмодзи** внутри фраз), которые
  снижают оценку.

Важно про эмодзи: скилл различает **ИИ-эмодзи** (холодный декор-маркер в начале
заголовка/пункта) и **человеческие** (горячие, реактивные, внутри фразы — «это
база 🔥», «я в голос 💀»). Первое — улика ИИ и вырезается при чистке; второе —
наоборот, признак живого автора. Эмодзи сами по себе никогда не считаются слопом.
Оценка — это **взвешенное суждение, а не арифметика по баллам**: никаких жёстких
шаблонов, которые загоняют модель в рамки.

А потом, если попросишь, **переписывает** помеченные места: «важно отметить» →
факт, «не просто X, а Y» → нормальная фраза, «под капотом» → объяснение по делу —
и возвращает живой голос в меру жанра (док сухо, блог с характером).

## Что на выходе

Жёсткого бланка нет — скилл отвечает живым языком и подстраивается под текст и
вопрос (просят «да/нет» — коротко, просят разбор — подробно). Примерно так:

> **Почти точно ИИ (~95/100), уверенность средняя.**
> Решающее: связка «кэш — это не просто хранилище, а целый механизм» (негативный
> параллелизм) + двойной «под капотом» при полном отсутствии конкретики. Плюс
> «сложно переоценить роль» и эмодзи-заголовок 🚀. Живого — ноль: ни чисел, ни
> личного опыта. Контр-сигналов нет.

Форма свободная: число даётся как ориентир-вилка, а не точная цифра, и скилл
честно оговаривает уверенность (на коротком тексте — низкая).

## Установка

### Claude Code (как пользовательский скилл)

```bash
git clone https://github.com/tuwulalo/ai-slop-cleaner-en-ru.git ~/.claude/skills/ai-slop-cleaner-en-ru
```

На Windows:

```powershell
git clone https://github.com/tuwulalo/ai-slop-cleaner-en-ru.git "$env:USERPROFILE\.claude\skills\ai-slop-cleaner-en-ru"
```

Перезапусти Claude Code — скилл подхватится автоматически и будет срабатывать,
когда ты просишь вычистить ИИ из текста или проверить текст на ИИ.

### Как проект-скилл (для команды/репозитория)

Положи папку в `.claude/skills/ai-slop-cleaner-en-ru` внутри своего проекта и закоммить —
скилл станет доступен всем, кто работает с репозиторием.

## Использование

Просто попроси на естественном языке:

- «Проверь этот текст на ИИ» + вставь отрывок
- «Это писала нейросеть?» + ссылка на статью
- «Вычисти ИИ из этого текста» / «перепиши по-человечески, убери слоп»
- «Прогони все .md в docs/ на слоп, дай таблицу»
- “Screen this PR description for AI slop, then clean it”

Режимы: диагноз одного текста (полный отчёт), **чистка** (переписать + лог правок +
новая оценка), пакетно по файлам (таблица + разбор худших), быстрый «да/нет»,
по URL (через WebFetch).

## Структура

```
ai-slop-cleaner-en-ru/
├── SKILL.md                  # инструкция скилла (детект + чистка), правило про эмодзи
├── reference/
│   ├── markers-ru.md         # русские маркеры (общие + техно-блог)
│   ├── markers-en.md         # английские маркеры (Wikipedia AI Cleanup)
│   ├── human-signals.md      # контр-сигналы живого человека
│   ├── scoring.md            # рубрика оценки и пороги вердиктов
│   └── rewrite.md            # режим чистки: таблицы «штамп → живая замена»
└── examples/
    └── examples.md           # размеченные образцы для калибровки
```

## Чего скилл НЕ делает

- Не «доказывает» авторство — даёт вероятностный вердикт с уверенностью.
- При чистке не выдумывает фактов и не трогает числа, термины, цитаты и код —
  убирает штампы, а не содержание.
- Не заменяет здравый смысл: на коротком тексте (<120 слов) уверенность всегда низкая.

## Источники паттернов

- [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) (WikiProject AI Cleanup)
- [Википедия: Признаки сгенерированности текста](https://ru.wikipedia.org/wiki/Википедия:Признаки_сгенерированности_текста)
- Разборы клише ChatGPT/DeepSeek на vc.ru, otzyvmarketing, Skillbox; наблюдения за стилем Habr/vc.ru.

## Лицензия

MIT — см. [LICENSE](LICENSE).
