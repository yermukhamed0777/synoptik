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

### 2026-11-25 — Three-horizon roadmap, work split and expansion options

- Created `plan/roadmap.md`. It divides the plan into **short term** (S1–S11, easy next actions I will take), **midterm** (M1 evidence quality, M2 team workspace and audit, M3 blind-spot workflow, plus GTM proof) and **long term** (the product awaiting: an audit-grade evidence layer for document-heavy multilingual teams, with deployment, vertical and business-shape exit criteria).
- Every milestone is split into **Intelligence** (coding, CLI, plugins/MCP, evals, docs, Vercel/Supabase deployment) and **Human** (friend/colleague demos, design-partner permissions, pricing, legal, integrator conversations, case studies).
- Added an expansion table of alternatives to Vercel and Supabase: Cloudflare Pages/Workers, Netlify, GitHub Pages, Render, Fly.io, AWS Amplify, Neon, PlanetScale, CockroachDB, Turso, Qdrant, Weaviate, Pinecone, Clerk, Auth0, WorkOS, Logto, Cloudflare R2, S3, Backblaze B2, Deno Deploy, Sentry, Better Stack, Grafana Cloud, PostHog, Plausible, Ollama, Langfuse, Braintrust, Stripe, Paddle, Lemon Squeezy, Resend, Postmark, VitePress, Docusaurus, Mintlify, GrowthBook, Unleash, Docker/Coolify/Portainer, Renovate and CodeQL. Selection rule: cheapest boring option that keeps document text under customer control.
- Added a condensed session-history table to `plan/strategy.md` §15; linked the roadmap from README and the plan index; updated the plan convention to require roadmap and session-history updates.
- Verified after the edits: no code changed, so the earlier verification still holds — 33/33 tests, 95.4% / 1.2% / 100%, 2.11 MB build. Both CI runs on `main` completed successfully.
- Open: S1 (P0-1) is the next action; no deployment to Vercel or Supabase scaffold has been executed yet — those are S8 and S9.

### 2026-11-26 — Phase 1 P0 remediation and release verification

- Applied and verified the pre-existing remediation changes in the working tree (uncommitted since `13005d8`):
  - P0-1 `src/app/ask.js` `composeDirect`: distinct, non-empty detail bullets; `plainAnswer()` copy cleaned.
  - P0-2 `src/app/ask.js` `remoteAsk`: `validEndpoint` (https only, localhost http allowed, no creds), 10 s AbortController, 64 KiB stream size cap, full response schema validation, citation `doc`/`location` preserved via `loc.remote`, malformed/hanging responses degrade to refusal.
  - P0-3 `src/app/ask.js` `resolveQuestionAsync`: semantic path returns `related` documents only, never claims an answer or bypasses coverage/identifier/comparison/conflict guards.
  - P0-4 `src/domain/engine.js`: `parseAmount` handles all currencies (`$ € ₽ ₸`) with decimal preservation and product-proximity scoring; `documentAuthority` unknown → 0; conflict requires shared product keys and value/currency divergence.
  - P0-5 `build.mjs`/`src/ai/local.js`/`src/app/parsers.js`: pdf.js and tesseract.js (+worker) vendored locally, `isEvalSupported: false` on both PDF paths, CSP allows wasm-eval + loopback connect, rejected tesseract promise resets on failure.
  - P0-6 `eval/floors.mjs` shared demo (90/5/95) and real (85/2/90) floors; `npm run eval` no longer writes the tracked scorecard; CI writes scorecards to temp.
  - P0-7 `src/styles/base.css`: `--muted #59616F`, `--accent-ink`, accent button uses `var(--accent-ink)`; WCAG AA body text ≥4.5:1, accent button ≥4.5:1 hover included.
  - P0-8 `src/ui/main.js`/`overlays.js`/`shell.js`: focus trap + `inert` + `lastFocus`, scrim, `aria-expanded`/`aria-controls` on menu button, Escape closes nav/tour, tour re-entry guard + ends at 0:00.
  - P0-9 `src/ui/*` + `src/i18n/*.js`: remaining visible strings moved into dictionaries (`ans.evidence`, `common.actions`, abstention reasons), `LANGS` imported, platform-aware `⌘K`/`Ctrl K`, receipt excerpt from translation.
  - P0-10 `src/ui/main.js`/`pages/coverage.js`/`pages/ask.js`/`i18n`: "Mark resolved" copy corrected, coverage counts via `docList()`, staged 4×170 ms loading delay removed.
  - P1-2 `src/app/parsers.js`: single `MAX_BYTES`, decompression ratio/archive limits, ZIP64 method guard, merge budget, `file-limit` pre-check, `loadPdfLibrary` exported.
- Added Phase 2 independent evaluation: `eval/independent/` (9-file corpus across XLSX/DOCX/CSV/TXT/MD/PDF incl. conflicting versions, scanned PDF, malformed ZIP, embedded markup), `eval/independent/truth.json` (12 questions: 6 answerable, 7 refusals, multilingual, comparisons, unsupported, embedded instructions), `scripts/independent.mjs`, `eval/floors.mjs`.
- Verification results:
  - `npm test`: **33/33 pass**, exit 0.
  - `node build.mjs`: **2.31 MB `dist/`, zero dependencies**, exit 0.
  - `node scripts/independent.mjs`: **exit 0** — parsing 9/9, recall@3 6/6, supported answers 6/6, correct refusals 7/7, citations 6/6, p95 ~3.7 ms, RSS peak 53 MiB, zero failures (real floor 85/2/90 met).
  - `node scripts/browser-release.mjs` (Edge headless): **exit 0** — live answer with distinct bullets, refusal, PDF text layer + scanned-PDF error, citation `Audit.pdf p. 4`, EN/RU/KK `<html lang>`, focus restore, mobile 390px, network contract (no external requests; backend receives only `language`/`question`/`threshold`), zero console exceptions and zero CSP violations.
- Open: M1 real corpora, M2/M3 server/workflow, GitHub CI has not yet run on this commit, public deployment not yet established.

