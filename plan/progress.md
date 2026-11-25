# Progress log

Append one entry per work session. Format:

```
### YYYY-MM-DD — short title

- What changed (files / surfaces).
- What was verified (commands and results).
- What is still open, and which backlog item it maps to.
```

---

### 2026-11-25 — M1 measurement layer (historical)

- Built `scripts/evaluate.mjs`: per-question scoring, tag breakdown, calibration, JSON/Markdown scorecards, thresholds that fail CI, real-corpus directory support.
- Added 110 demo-corpus questions across EN/RU/KK, including typos, transliteration, unit variants, identifier traps, unanswerable questions and price conflicts.
- Rewrote tokenisation: cross-language concept mapping (price/delivery/warranty/return), Cyrillic inflection stripping, transliteration, unit/currency normalisation, English light stemming, typo/prefix aliases, stopword expansion.
- Added document-intent routing, money-line selection for price questions, and a comparison refusal guard.
- Added generic price-conflict detection with source links and price-list-over-catalog precedence.
- Fixed the scorecard to grade the displayed answer line; this exposed 12 hidden wrong answers that the previous "any evidence hit" grading had masked.
- Result: 95.4% answered-correct, 1.2% wrong, 100% refusals on the authored demo suite; 33 tests green.
- Remaining known failures: three live comparison questions (refused by design) and one primer question that quotes the wrong compatibility line. Both are on the M1 real-corpus list.

### 2026-11-25 — Repository publication and planning setup

- Created the public GitHub repository `yermukhamed0777/synoptik` and connected `origin`.
- Reorganised planning docs: `PLAN.md` → `plan/strategy.md`; decision and progress logs split into `plan/decisions.md` and `plan/progress.md`; executable work moved to `plan/backlog.md`.
- Fixed `npm test` (explicit test-file list), added `.github/workflows/ci.yml` (tests → benchmark → build), added `LICENSE` and a CI badge, and updated README/SECURITY wording for a public repository.
- Verified locally: 33/33 tests pass, benchmark 95.4% answered-correct / 1.2% wrong / 100% refusals, `node build.mjs` produces `dist/` (2.11 MB, zero dependencies).
- Open: all real-corpus, extraction, comparison-composition, server/audit and workflow items in `backlog.md`; CI has not yet run on GitHub.

### 2026-11-25 — Full inspection folded into the backlog

- Completed a read-only audit of all 33 source modules plus tests, eval, scripts, docs and the two generated HTML shells. `dist/assets/*` is byte-identical to `src/*` — no stale build.
- Added to `backlog.md`: P0-7 (WCAG AA contrast failures on `--muted` and the dark primary button), P0-8 (no focus trap / inert / Escape for drawers, mobile nav and tour; tour timer never ends), P0-9 (English literals outside the dictionaries), P0-10 (false "re-checks the answer" copy, wrong demo document count, artificial loading delay), and P1-6…P1-10 (ARIA completeness, localized shell metadata and CSP tightening, explicit demo-mode framing, dead code and UI tests, small display defects).
- i18n finding: EN/RU/KK dictionaries are at exact structural parity (440 keys each, 0 missing, 0 placeholder mismatches); the gaps are UI strings that bypass them, not missing translations.
- Verified again after the plan edits: 33/33 tests pass; `node build.mjs` produces a 2.11 MB `dist/`; benchmark unchanged at 95.4% / 1.2% / 100%. CI run `45591322698` started on the pushed commit.
- Open: P0-1…P0-10 are all still unchecked; none of the code fixes have been made yet — this session produced the plan only.
