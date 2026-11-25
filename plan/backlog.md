# Backlog — concrete next actions

Ordered by risk, not by convenience. Every item has a **Done when** line; do not mark it complete otherwise. IDs are stable so progress entries can reference them.

Status legend: `[ ]` open · `[~]` in progress · `[x]` done.

Horizon map: **P0 / P1 = short term** (see S1–S11 in [roadmap.md](roadmap.md)), **M1 / M2 = midterm**, **M3 and the business milestones = long term**. Every item here is Intelligence work unless the roadmap's Human column says otherwise. The human-only actions live in the roadmap, not here.

---

## P0 — release blockers (fix before asking anyone to trust a real answer)

### [ ] P0-1 — Live answers render empty detail bullets
- **Where:** `src/app/ask.js:146–166` (`composeDirect`), rendered at `src/ui/pages/ask.js:214`.
- **Problem:** the detail loop treats `hit.lines` objects as numeric indices, so `lineText()` returns `undefined`. Live lexical answers show empty `<li>` items and "• undefined" when copied. Eval misses it because it grades `hits[0].best.i` directly, and the default demo is scripted.
- **Do:** normalise `hits` into one display shape (numeric `lines` plus `best`), or map `hit.lines.map(l => l.i)` in `composeDirect`; keep the best line out of the detail list.
- **Done when:** a test with `scripted = false` asserts non-empty, distinct detail strings and a clean `plainAnswer()` copy; CDP live-answer screenshot shows real bullets.

### [ ] P0-2 — Custom backend contract is broken and unhardened
- **Where:** `src/app/ask.js:185–223` (`remoteAsk`), `src/app/state.js:184–187` (`citeStr`), `README.md:177–196`.
- **Problem:** backend `doc`/`location` are dropped, so citations render as `? — `; no timeout, no schema/size validation; `details` as a string throws in `plainAnswer()`; `http://` endpoints are accepted.
- **Do:** carry `doc`/`location` into a `citation.remote` field and teach `locLabel`/`citeStr` and the evidence card to render it; add `AbortController` (~10 s); validate `status`, `answer`, `details[]`, `citations[]` and require HTTPS for remote endpoints (allow `http://127.0.0.1`/localhost for local development).
- **Done when:** a contract test feeds the README example payload and asserts the rendered citation shows the backend's doc and location; malformed and hanging responses degrade to a refusal instead of throwing.

### [ ] P0-3 — Semantic fallback bypasses every abstention guard
- **Where:** `src/app/ask.js:103–143` (`resolveQuestionAsync`), `src/ai/local.js`.
- **Problem:** when AI is enabled, all abstentions except `reason === 'curated'` are retried with embeddings. That path applies no coverage, identifier, comparison or conflict check, so "20 L" can be answered with the 10 L line and comparisons get a single quoted side. The product promise is only true with the optional model off.
- **Do:** run the same guards on semantic best lines; refuse comparisons unconditionally; never override a detected conflict. If a guard fails, keep the abstention and record why.
- **Done when:** tests cover identifier trap, comparison and low-coverage questions with `ai` enabled and assert abstention; README/SECURITY wording updated to match the new behaviour.

### [ ] P0-4 — Price-conflict detector over- and under-matches
- **Where:** `src/domain/engine.js:254–269`, `306–363` (`parseAmount`, `documentAuthority`, `detectPriceConflict`).
- **Problem:** only tenge amounts parse; decimals are corrupted (`42,800.50` → `4280050`); arbitrary uploaded documents get authority 2 (catalog-level); two different products named in one query can be reported as a "conflict" because the code only checks that each line shares *some* query term.
- **Do:** parse all currencies in `MONEY`, preserve decimals, pick the amount nearest the product; require a non-empty intersection of product keys between both lines; only classify documents by recognisable filename classes, otherwise treat as unknown/low authority.
- **Done when:** regression tests cover (a) two different products → no conflict, (b) `$`/`₽` amounts, (c) decimals, (d) unknown filename → no silent authority boost.

### [ ] P0-5 — CSP and OCR path are inconsistent; CDN scripts are unpinned
- **Where:** `build.mjs:18–29`, `src/ai/local.js:150–170, 213–216`, `src/app/parsers.js:343–350, 552`, `SECURITY.md:21–26`.
- **Problem:** `worker-src 'self' blob:` does not allow the jsDelivr worker URL set by the OCR path; `isEvalSupported: false` is set only on the primary PDF path, contradicting SECURITY.md; `connect-src 'self' https:` permits arbitrary HTTPS origins; CDN `<script>` injection has no SRI; a rejected `tesseractPromise` is cached forever (`local.js:161`).
- **Do:** use the vendored pdf.js worker for OCR; set `isEvalSupported: false` in both paths; pin CDN assets with SRI or self-host them; narrow `connect-src` to the configured endpoint at runtime where feasible; reset the cached promise on failure; document the real CSP in SECURITY.md.
- **Done when:** a browser run with OCR enabled produces no CSP violations, both PDF paths use the local worker, and SECURITY.md matches the generated headers.

### [ ] P0-6 — One benchmark threshold, CI that actually fails
- **Where:** `scripts/evaluate.mjs:29`, `tests/retrieval-quality.test.mjs:62–64`, `plan/strategy.md:131`, `eval/README.md:14`, `.github/workflows/ci.yml`.
- **Problem:** three different floors (75/5/85, 90/5/95, 85/2/90); the test harness hardcodes two set filenames while `--all` discovers every set; the generated scorecard is tracked and is dirty after every eval run.
- **Do:** pick one floor per corpus class (demo regression vs. real-corpus exit gate), read it from one shared config, make the test discover sets the same way as the evaluator, and write CI scorecards to `$RUNNER_TEMP`. Unify the p95 numbers in README with the committed scorecard.
- **Done when:** `npm test` and CI enforce the same thresholds; `npm run eval` either leaves the tree clean or is documented as an explicit regen step; README numbers match `eval/scorecard.md`.

### [ ] P0-7 — Text and button contrast fails WCAG AA
- **Where:** `src/styles/base.css:9` (`--muted: #6E7685` → 4.05:1 on paper, used at 10.5–12 px), `:44–45, 124–125` (dark primary button `#FFF8F2` on `#E47B4F` → 2.76:1, hover 2.30:1).
- **Do:** introduce `--accent-ink` / `--accent-hover-ink`, darken light `--muted` to ≈`#5A6270`, and darken the primary button background (or switch to dark text on the light accent) until body text ≥4.5:1 and the accent button (including hover) ≥4.5:1 in both themes.
- **Done when:** computed contrast for every token pair used for text passes AA; verified in light and dark via screenshot.

### [ ] P0-8 — Overlays, mobile nav and tour have no focus management
- **Where:** `src/ui/main.js:47–51, 160–171, 188–216, 311–314, 670–677`, `src/ui/view-state.js:16`, `src/ui/shell.js:28`, `src/ui/overlays.js`.
- **Problem:** modals declare `role="dialog" aria-modal="true"` but have no focus trap and no background `inert`; `view.lastFocus` is never used; closing destroys focus; Escape does not dismiss the mobile nav or tour; the off-canvas rail stays focusable; the tour has no re-entry guard, overwrites the demo/scripted backup and never ends at 0:00.
- **Do:** trap and restore focus, set `inert` on the app root while an overlay is open, wire `lastFocus`, add `aria-expanded`/`aria-controls` plus a scrim to the menu button, handle Escape for nav and tour, guard re-entry, stop overwriting user toggles, and end the coach when the countdown expires (share one countdown function with `overlays.js:236–240`).
- **Done when:** keyboard-only run can open/close every overlay and return focus to the trigger; tour cannot be double-started and ends on its own.

### [ ] P0-9 — Visible strings bypass the translation dictionaries
- **Where:** `src/ui/pages/library.js:32`, `src/ui/pages/spots.js:56` (`Actions`), `src/ui/landing.js:62, 71`, `src/ui/shell.js:31` (`Ctrl K`), `src/ui/main.js:43, 300` (duplicated language arrays).
- **Problem:** dictionaries are at exact structural parity (440 keys, 0 missing, 0 placeholder mismatches) but the receipt card hard-codes `42,800 ₸ — TerraShield X5, 10 L` and `EVIDENCE / 01`, the shortcut hint is macOS-blind, and language codes/autonyms duplicate `i18n/index.js`.
- **Do:** move every remaining visible string into EN/RU/KK, derive the receipt excerpt from corpus/translations, use platform-aware `⌘K` / `Ctrl K`, and import `LANGS`.
- **Done when:** a scan of rendered UI text finds no English literal outside the dictionaries; `tests/i18n.test.mjs` still passes.

### [ ] P0-10 — UI copy and counts contradict behaviour
- **Where:** `src/ui/main.js:134–138, 430–438`, `src/ui/pages/spots.js:78`, `src/i18n/en.js:368`, `src/ui/pages/coverage.js:53–54`.
- **Problem:** "Mark resolved" only flips `gap.status` — it does not re-check the answer as the copy promises; coverage counts all demo docs even after removal from the Library; a fixed 4×170 ms artificial delay slows every answer.
- **Do:** either implement re-verification or change the copy to "manual annotation"; compute demo counts from the same filtered document list as the Library; make the staged loading delay demo-only (or remove it).
- **Done when:** copy matches behaviour; coverage and library agree on document count; live answers are not artificially delayed.

---

## P1 — robustness and data integrity (before design partners)

### [ ] P1-1 — Persisted state has no schema, no migration and no quota policy
- **Where:** `src/app/state.js:15, 40–56, 146–151, 258–345`.
- **Problem:** `readStore()` shallow-merges arbitrary JSON (a corrupted `uploads` breaks `docList`); `allChunks()` mutates shared corpus objects; up to 30 MB of extracted text is written into a ~5 MB localStorage; `save()` failures are silent on most paths; `theme-init.js:4` duplicates the storage key.
- **Do:** validate/normalise loaded state with a versioned migration; clone rather than mutate corpus chunks; cap persisted passage text and prune history on quota errors; surface a persistent storage warning; import `STORE_KEY` in `theme-init.js`.
- **Done when:** tests feed corrupt/legacy/oversized stores and assert recovery, no corpus mutation, and a visible quota warning.

### [ ] P1-2 — Parser hardening and real fixtures
- **Where:** `src/app/parsers.js:13, 21–53, 66–98, 112–150, 296–337, 343–548`, `src/ai/local.js:161, 165–188`.
- **Problem:** `MAX_BYTES` duplicated; no ZIP64 detection or decompression budget (zip-bomb exposure acknowledged in SECURITY.md); CSV delimiter sniffed from first line only; 500-char sentence truncation is silent; a sheet without a detectable header is dropped; table heuristics are untuned magic numbers; no PDF test fixture because `cdp-pdf.mjs` generates an ignored one; OCR silently skips pages 13+; failed Tesseract load is cached as a rejected promise.
- **Do:** export one `MAX_BYTES`; add a decompression ratio cap and clear failure codes; sniff CSV over the first N non-empty lines; make truncation visible in chunk `info`; expose table constants; commit a small text-layer PDF fixture and test both PDF paths; report the OCR page cap in `info`; clear the failed CDN promise.
- **Done when:** parser tests cover malformed ZIP, over-budget decompression, the committed PDF fixture, and OCR cap reporting.

### [ ] P1-3 — Identifier guard hole and hit-shape separation
- **Where:** `src/domain/engine.js:203, 211–250, 582–601`.
- **Problem:** fuzzy aliases live in `term.keys`, which the identifier guard checks, so alphanumeric codes ≥5 chars can satisfy the guard via a near miss despite the comment claiming otherwise. Scoring objects and display objects are the same `hits` array (root cause of P0-1).
- **Do:** require the exact stem for digit-bearing query terms; split internal scoring results from the display shape at the `search()` boundary.
- **Done when:** a test with an alphanumeric code and a one-character typo abstains; no UI code reads score objects as line indices.

### [ ] P1-4 — Evaluator and QA harness honesty
- **Where:** `scripts/evaluate.mjs:62–98, 117–125, 160–184, 228–245, 298–339`, `scripts/cdp-*.mjs`, `scripts/serve.mjs:29`.
- **Problem:** unreadable corpus files are skipped; `basename#n` IDs collide across subdirectories; no set↔corpus validation; `--all --corpus` silently grades demo expectations against real chunk IDs; byTag/calibration are computed but only written to JSON; p95 is a single un-warmed Node measurement; CDP scripts duplicate ~40 lines of boilerplate, use fixed sleeps, make no assertions, and require Node 22+ global `WebSocket` while package.json claims Node 20+; `serve.mjs` uses a weak `startsWith(root)` traversal guard.
- **Do:** validate set schema and corpus compatibility, use stable collision-free IDs, fail loudly, publish tags in Markdown, document p95 as Node-only; extract a shared CDP helper, make `BASE`/`CDP`/artifacts configurable, poll instead of sleeping, assert visible outcomes, stop overwriting `tests/fixtures/sample.pdf`, document the Node requirement; harden the server path guard with `path.resolve` + `root + path.sep` and test traversal.
- **Done when:** an intentionally broken set fails eval with a clear message; CDP scripts assert at least one outcome each; a traversal request returns 403/404.

### [ ] P1-5 — Documentation accuracy sweep
- **Where:** `README.md`, `SECURITY.md`, `plan/strategy.md`, `eval/README.md`.
- **Problem (resolved in this session where marked):** private-project wording, stale p95, "three curated comparisons", "only jsDelivr", "fails the build", "strict CSP", legacy-name scan claim. Remaining: `eval/README.md:26` implies browser latency; `eval/README.md:28` implies tag groups in Markdown; `plan/strategy.md` open questions and §13 checklist are stale.
- **Done when:** a fresh read of every public doc matches the code; the open questions in `plan/strategy.md` are either answered with a dated decision or explicitly parked.

### [ ] P1-6 — ARIA completeness in quick search, blind-spot tabs and settings
- **Where:** `src/ui/overlays.js:197–207` (combobox without `listbox`, `aria-controls`, `aria-activedescendant`), `src/ui/pages/spots.js:44–45` (tabs without `tabpanel`, id linkage or arrow-key navigation), `src/ui/pages/settings.js:33, 34, 42` (unnamed `role="group"`).
- **Done when:** a screen-reader audit finds no orphaned ARIA roles; arrow keys switch tabs; every group has an accessible name.

### [ ] P1-7 — Localized HTML shell metadata and honest CSP copy
- **Where:** `build.mjs:31–55, 63–79`, `dist/index.html:8–22`, `dist/app.html:8–22`, `src/ui/format.js:20, 26`, `src/ui/pages/ask.js:168`, `src/ui/pages/coverage.js:112, 145`.
- **Problem:** generated `<title>`, meta description, OG tags, `<noscript>` and `<html lang>` stay English; inline `style=` attributes (`ask.js:317`, `library.js:46`, `coverage.js:109, 123, 134`) force `style-src 'unsafe-inline'`; unit labels `ms`, `B/KB/MB`, `OCR` are English.
- **Do:** generate localized or neutral brand-only metadata plus canonical/OG-image/theme-color; move inline styles to CSS classes and tighten to `style-src 'self'`; localize unit labels; keep `connect-src` narrowing coupled to P0-5.
- **Done when:** both shells render correct metadata in all three languages; CSP no longer needs `'unsafe-inline'` for styles.

### [ ] P1-8 — Demo framing vs. authentic product presentation
- **Where:** `src/ui/components.js:37–43` (DEMO CORPUS chip), `src/ui/shell.js:19` (rail tour), `src/ui/landing.js:59–77` (fictional TerraShield receipt), `src/i18n/{en,ru,kk}.js` (fictional-company copy), `src/brand.js:7–8`.
- **Do:** keep the fictional corpus as the default first-run experience, but make "Demo" an explicit, consistently labelled mode; keep the fictional-company disclaimer visible; do not present seeded demo answers as real customer evidence. Add a one-click path to switch to a real workspace.
- **Done when:** no surface implies the demo data is real; the README, landing page and app use the same terminology for demo vs. live.

### [ ] P1-9 — Remove dead code, wire or delete dead translations, add UI tests
- **Where:** 28 unused keys in each dictionary (`en.js`, `ru.js`, `kk.js`); `src/ui/components.js:53, 65`, `src/ui/format.js:38`, `src/ui/view-state.js:16`, `src/brand.js:4–5, 8`, unused icons `spark`/`clock`/`filter`; duplicated `esc`/`t`/countdown/language arrays; `src/ui/pages/library.js:79–86` (nested interactive dropzone).
- **Do:** wire or delete the dead keys (e.g. `nav.site.aria`, `ob.skip`, `toast.copied`), delete dead exports, consolidate the duplicated helpers, make the sample action a sibling of the dropzone, and add `tests/ui/*.test.mjs` smoke tests (route rendering, overlay focus, translation of previously hard-coded strings).
- **Done when:** no unused exports remain; UI modules have automated coverage; i18n tests stay green.

### [ ] P1-10 — Small data and display defects
- **Where:** `src/app/ask.js:101, 185–222` (remote citation naming — part of P0-2), `src/ui/format.js:20, 31–36` (`fmtSize` rounds 1,025 B to "1 KB"; unvalidated remote `strength` renders `strength.<unknown>`), `src/ui/pages/library.js:95` (missing `img` filter for uploaded images), `src/ui/overlays.js:21` (`Date.now()` fallback for missing `ts`).
- **Done when:** sizes are accurate, strength is validated against the known set, image uploads are filterable, and missing dates render as `—`.

---

## M1 — evidence quality in the wild (exit gate)

### [ ] M1-1 — Secure three real corpora with permission
20–40 questions each, EN/RU/KK, from design partners; store them under ignored `eval/corpora/` with a provenance note. **Done when:** three corpora and their question sets exist and are scoreable with `node scripts/evaluate.mjs --corpus ...`.

### [ ] M1-2 — Add a held-out set that was never used for tuning
**Done when:** a new set added after the current freeze is graded, and its score is reported separately from the authored 110.

### [ ] M1-3 — Fix the top failure classes found on real documents
Scanned PDFs, multi-column tables, merged headers, document-version conflicts, currency formats, stale price lists. **Done when:** the real-corpus scorecard reaches ≥85% answered-correct, ≤2% wrong, ≥90% correct refusals (the `plan/strategy.md` M1 exit criteria).

### [ ] M1-4 — Document-level freshness
Prefer the newer authoritative document for the same field, with a visible rule; extends the existing price-list-over-catalog precedence. **Done when:** a dated superseding price list wins and both the rule and the older source are shown.

### [ ] M1-5 — Confidence calibration
`strength` labels are currently thresholds, not measured accuracy. **Done when:** each label has a measured accuracy band from a real corpus, published in the scorecard.

### [ ] M1-6 — Comparison composition (or a documented decision to refuse)
Two cited lines instead of one; the current regex refuses every live comparison. **Done when:** either a comparison answer shows two evidence cards, or `plan/decisions.md` records that refusal is permanent and README/scorecard stop counting it as a failure.

---

## M2 — server, accounts, audit (not started)

- [ ] Server-side ingestion + index (Postgres + pgvector), per-workspace isolation.
- [ ] Auth (email magic link; SSO later), roles (owner/editor/viewer), invites.
- [ ] Immutable audit log: question, answer, evidence ids, user, timestamp, exportable.
- [ ] Document versioning with citation history and supersession markers.
- [ ] Retention/deletion controls, encryption at rest, DPA template.
- [ ] Migration path from `localStorage` to a workspace.
- **Exit:** 10 users for 2 weeks; audit export accepted by a compliance reviewer; p95 < 1.5 s on a 1,000-page corpus.

## M3 — workflow and distribution (not started)

- [ ] Blind-spot assignment, statuses, comments, request-document flow.
- [ ] Coverage trends with CSV/Notion/Jira export.
- [ ] Embeddable answer widget / API.
- [ ] One real connector (Drive or SharePoint first; 1C/Bitrix later).
- [ ] Admin analytics: top questions, refused topics, evidence opens.
- **Exit:** one pilot resolves ≥10 blind spots in-product; weekly active askers ≥60% of seats.

---

## Decisions to confirm (from `plan/strategy.md` §12)

1. Beachhead: industrial distributors (recommended) vs. compliance/ops vs. support desks.
2. First paying deployment: cloud or on-prem from day one.
3. Sales motion: founder-led design partners (recommended) vs. self-serve trial.
4. Price anchor a 30-person distributor will accept.
5. Which three companies can provide documents and 20 questions with permission.
6. Legacy repo cleanup and brand scope (studio vs. company).
7. Keep the zero-dependency static site; static-render the landing page at build time.

---

## Done

### [x] PUB-1 — Repository publication and plan setup (2026-11-25)
Created public `yermukhamed0777/synoptik`; added LICENSE, THIRD_PARTY_NOTICES, CONTRIBUTING, CHANGELOG, CI workflow, CI badge; fixed `npm test`; moved `PLAN.md` → `plan/strategy.md`; split logs into `plan/decisions.md` and `plan/progress.md`; created this backlog and the update convention; reconciled the obvious README/SECURITY contradictions. Verified: 33/33 tests, 95.4%/1.2%/100% benchmark, `node build.mjs` → 2.11 MB `dist/`.
