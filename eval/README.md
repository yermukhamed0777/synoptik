# Evidence evaluation

This directory is the measurement layer. The engine is graded on **retrieval**, not on the curated demo answers: a question passes only when the line Synoptik would show is the right line and contains the expected value.

## Run

```bash
node scripts/evaluate.mjs --all
node scripts/evaluate.mjs --all --verbose
node scripts/evaluate.mjs --all --md eval/scorecard.md
node scripts/evaluate.mjs --set eval/sets/demo-paraphrase.json
```

The command exits non-zero if the thresholds are missed. Defaults: ≥75% answered-correct, ≤5% wrong, ≥85% correct refusals. Override with `--min-answered`, `--max-wrong`, `--min-refusal`.

Current scorecard: [scorecard.md](scorecard.md).

## What is measured

| Metric | Meaning |
|---|---|
| answered-correct | Answerable questions answered with the expected passage/value |
| wrong | Answered, but the displayed line is wrong or lacks the expected value. The most important number. |
| missed | Refused an answerable question |
| correct refusals | Unanswerable questions that were refused |
| p50 / p95 | Retrieval latency in the browser/Node process |

The scorecard also groups results by `tags`, so failure classes (unit, typo, transliteration, identifier, language) are visible instead of averaged away.

## Set format

```json
{
  "name": "acme-price-list",
  "corpus": "acme",
  "threshold": 0.6,
  "maxSources": 3,
  "questions": [
    {
      "id": "x5-10l-price",
      "lang": 0,
      "q": "How much is a 10 litre can of X5?",
      "tags": ["price", "unit", "en"],
      "expect": { "chunks": ["Price_List_2026.xlsx#3"], "contains": ["42,800"] }
    },
    {
      "id": "installment",
      "lang": 1,
      "q": "Есть ли рассрочка?",
      "tags": ["unanswerable", "ru"],
      "answerable": false
    }
  ]
}
```

- `lang`: 0 = English, 1 = Russian, 2 = Kazakh.
- `expect.chunks`: acceptable passage ids. Optional.
- `expect.contains`: every string must appear in the displayed answer line (punctuation and case are normalised). Optional but recommended for numeric answers.
- `answerable: false`: the expected behaviour is a refusal, with no answer.

## Grading a real corpus

Put documents in a directory and pass it with `--corpus`:

```bash
node scripts/evaluate.mjs --corpus ./eval/corpora/acme --set ./eval/sets/acme.json
```

The runner parses PDF/DOCX/XLSX/CSV/TXT/MD with the same parser the browser uses, assigns chunk ids of the form `filename#n`, and prints them in failures/verbose mode. Use `contains` for most real questions; use `chunks` when the exact passage matters.

Do not commit customer documents. `eval/corpora/` is ignored except for its README.

## Honesty note

`demo-curated.json` and `demo-paraphrase.json` were written against the demo corpus. They are a **regression suite**, not a generalisation benchmark. The paraphrase set was used during tuning in this milestone, so its score is optimistic. Real-corpus scorecards from design partners are the only signal that should be used in sales conversations.
