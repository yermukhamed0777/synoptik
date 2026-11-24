# Synoptik — product plan

Owner: founder / lead
Status: v0.1 + M1 measurement layer, pre-pilot
Last updated: 25 November 2026

---

## 1. One paragraph

Synoptik is an evidence-first answer layer for business documents. It reads price lists, policies, specifications and contracts, answers in plain language, and attaches the exact passage, file and location to every answer. When the evidence is not there, it refuses and files the question as a blind spot. The product is trilingual (EN/RU/KK), runs locally in the browser today, and is designed to become a server-side workspace with an audit trail for teams that cannot send documents to a general-purpose chatbot.

## 2. What exists now (v0.1 + M1)

- A rebuilt codebase at `~/Documents/Projects/Synoptik`, new history, new name, no legacy references.
- A working retrieval engine: BM25, RU/KK morphology, Cyrillic transliteration, unit normalisation, typo tolerance, document-intent routing, evidence coverage, abstention, identifier guard, price/date/address boosts.
- **Evidence quality instrument:** an evaluation harness (`scripts/evaluate.mjs`), curated and held-out paraphrase sets, a committed scorecard, and a CI regression floor. Current demo-corpus result: **95.4% answered-correct, 1.2% wrong, 100% correct refusals** (110 questions, three languages).
- **Price-conflict handling:** when a price list and a catalog quote different amounts for the same product, the price list is used and both values are shown with sources. Comparison questions are refused in live retrieval until comparison composition exists.
- Real client-side parsing for TXT/MD, CSV, DOCX, XLSX (sheets, merges, dates, headers), PDF (pdf.js layout + tables), optional OCR.
- A workspace: Ask, Library, Blind spots, Coverage, Settings, evidence drawer, document drawer, quick search, guided demo, onboarding.
- A marketing site with a new visual identity: paper/ink/burnt-sienna, editorial serif, "receipt" motif, no stock SaaS gradients.
- Trilingual interface and demo corpus; 27 curated demo questions, including 5 deliberate refusals.
- Tests: engine, retrieval floor, corpus integrity, parser fixtures, translation parity, credential scan (33 tests).
- Zero dependencies, zero API keys, static `dist/` build.
- Verified in headless Chrome: refusal → blind spot → add evidence → cited answer; PDF upload; mobile; dark theme; guided demo.

## 3. My read on relevance

**Verdict: relevant as a focused vertical product, weak as a horizontal document-answer product.**

The demo is a credible wedge asset. The underlying retrieval stack is not a moat — BM25, citations and abstention are replicable in a quarter by any competent team, and every foundation-model vendor is moving toward grounded answers with citations. What can become a moat is narrower and less glamorous:

1. **The evidence workflow, not the chat.** Refusal → blind spot → document owner → resolution → coverage trend is a loop that creates operational data and switching costs. A chat box does not.
2. **Trilingual RU/KK/EN retrieval as a first-class requirement.** This is real in Kazakhstan and Central Asia, and it is poorly served by US/EU products. It is also a credible reason for a local buyer to choose a local vendor.
3. **Deployment posture.** No-key, local-first, static, auditable code is attractive to regulated buyers and to companies that will not upload price lists to a US vendor. On-prem later is a sales feature, not an engineering compromise.
4. **Vertical corpus semantics.** Prices, pack sizes, compatibility matrices, warranty exceptions, conflicting document versions. Generic RAG demos are bad at exactly these. A product that handles them is meaningfully better for distributors and industrial suppliers.

Reasons to be cautious:

- "PDF Q&A" is a feature, not a company. Without the blind-spot workflow and a system of record around documents, it is a demo that gets copied.
- SMB willingness to pay for knowledge tools is low; enterprise sales cycles are long. The buyer must see revenue impact — faster quotes, fewer wrong commitments, fewer support escalations.
- Real documents are messier than the demo. Table extraction, scans, inconsistent numbering and stale versions will decide whether the product feels magical or fragile.
- The KZ market is small in absolute terms. It is a good beachhead, not a final market. The product must be portable to other multilingual, document-heavy markets.

**My recommendation:** pick one beachhead — industrial distributors / building-materials suppliers — and spend the next 90 days proving answer quality and quote-cycle impact on three real document sets. Do not broaden to "all knowledge" or build a generic enterprise search competitor.

## 4. Who it is for

Primary ICP (beachhead):
- B2B distributors and industrial suppliers in Kazakhstan/Central Asia, 20–300 employees.
- 5–50 sales/back-office users who answer the same price, compatibility, delivery and warranty questions daily.
- Documents: price lists (XLSX/PDF), catalogs, compatibility matrices, delivery and return policies, internal FAQ.
- Pain: slow quotes, inconsistent answers, knowledge in 2–3 people's heads, RU/KK/EN customers.

Secondary ICP:
- Operations/compliance teams in banks, insurance, construction and logistics that need an audit trail for policy answers.
- Customer-support desks in multilingual markets.

Not the ICP (for now):
- Consumers, students, general note-taking, code search, pure enterprise search across email/chat.

## 5. Positioning

Category: **evidence layer for business documents** (not chatbot, not wiki, not enterprise search).

Message hierarchy:
1. Every answer has a receipt: file, location, passage.
2. It says "I don't know" when the documents don't.
3. Refusals become a content backlog.
4. Your documents stay yours; no keys, no account, local-first.

Proof points:
- An answer card that opens to the highlighted passage in one click.
- A blind-spot ledger with counts and closest documents.
- Trilingual interface and corpus.
- A static build with zero dependencies that a CTO can audit in an afternoon.

## 6. Business model (hypotheses to test)

| Motion | Price hypothesis | Notes |
|---|---|---|
| Team workspace, cloud | 25,000–75,000 ₸ / workspace / month (≈ $50–150) | Per workspace, not per seat, for SMB; 3–10 seats included |
| Per-seat add-on | $8–15 / user / month above included seats | For sales teams with high usage |
| On-prem / private cloud | $8k–20k / year + implementation | Data residency, compliance, integrator channel |
| Pilot | Fixed 3-month fee, credited to annual | Forces a real document set and success criteria |
| Integrations | Paid connector setup (1C, Bitrix24, Google Drive, SharePoint) | Channel partners can deliver |

Do not price on "documents indexed" — it punishes the customer for adding evidence, which is the behaviour we want.

Unit economics target: gross margin >75% cloud; implementation revenue covers on-prem services. Infra cost per workspace is small at this corpus size; the cost driver is support and document hygiene.

## 7. GTM plan

Phase A — proof (weeks 1–6)
- 10 discovery interviews with sales directors / ops leads at distributors.
- 3 design partners, each giving one real corpus (with permission) and 20 real questions.
- Measure: verified-answer rate, wrong-answer rate, time to answer, blind-spot closure.

Phase B — lighthouse (weeks 7–12)
- Publish 2 case studies with numbers: quote turnaround, escalation reduction, documents written from blind spots.
- Partner with 1–2 1C/Bitrix integrators; they have the customer base and the implementation trust.
- Demo script: 3 minutes, one price conflict, one refusal, one resolution. The current guided demo is the basis.

Phase C — repeatable sales (months 4–6)
- Paid pilots → annual contracts; on-prem option for compliance buyers.
- Channel enablement kit: demo corpus, security one-pager, pilot template, pricing calculator.
- Land-and-expand: sales desk → support desk → compliance.

Marketing site changes for Phase A:
- Replace abstract hero with a concrete buyer outcome ("Quote in minutes, with the price list line attached").
- Add a 60-second recorded walkthrough on the landing page.
- Add a security page (data flow, no keys, on-prem path).
- Static-render the landing page for SEO and fast first paint.

## 8. Milestones

### M0 — Rebuild and freeze (done)
Scope: new identity, new codebase, corpus rebrand, tests, docs, visual verification.
Exit criteria: build passes; all test files pass; core loop verified in Chrome; no legacy names or credentials in `src/`; `PLAN.md` agreed.

### M1 — Evidence quality in the wild (in progress)
Goal: the product is trustworthy on real, messy documents.
Deliverables:
- [x] Evaluation harness with per-question expected evidence and a scorecard (answered-correct / refused-correct / wrong-answer).
- [x] Demo-corpus regression sets (81 curated across three languages + 29 paraphrase/trap questions) and a CI floor at 90% answered-correct, ≤5% wrong, ≥95% refusals.
- [x] First failure-class fixes: morphology, units (`10 л` = `10 L`), transliteration (`ТерраШилд`), typos, intent routing, money-line selection, price conflicts, comparison refusal.
- [ ] 3 real corpora (with permission), 20–40 questions each, RU/KK/EN.
- [ ] Fix the top failure classes found on those corpora: scanned PDFs, multi-column tables, merged headers, doc version conflicts, currency formats.
- [ ] Document-level freshness: prefer the newer authoritative document for the same field, with a visible rule. (Price list > catalog is done; version dates are not.)
- [ ] Confidence calibration: strength labels must match measured accuracy per label.
Exit criteria: ≥85% answered-correct on answerable questions, ≤2% wrong-answer rate, ≥90% correct refusals on unanswerable questions across the three real corpora.
Current status: demo regression suite passes at 95.4% / 1.2% / 100%, but that is not a substitute for the exit criteria. Real corpora remain the gate.
Effort: 1 engineer, 1 part-time domain reviewer.

### M2 — Server, accounts, audit (3–4 weeks)
Goal: a team can use it without passing a browser profile around.
Deliverables:
- Server-side ingestion and index: Postgres + pgvector, per-workspace isolation.
- Auth (email magic link or SSO later), roles (owner, editor, viewer), invite flow.
- Immutable audit log: question, answer, evidence ids, user, timestamp; exportable.
- Document versioning: replace a file without losing citation history; mark superseded documents.
- Retention and deletion controls; encryption at rest; DPA template.
- Migration path from localStorage demo to workspace.
Exit criteria: pilot customer runs 10 users for 2 weeks; audit export accepted by their compliance reviewer; p95 answer latency <1.5s on a 1,000-page corpus.
Effort: 1–2 engineers.

### M3 — Workflow and distribution (3–4 weeks)
Goal: the blind-spot loop becomes the reason to keep paying.
Deliverables:
- Blind-spot assignment, statuses, comments, "request document" flow.
- Coverage trends over time; export to CSV/Notion/Jira.
- Embeddable answer widget/API for the customer's site or portal.
- One real connector: Google Drive or SharePoint first, 1C/Bitrix later.
- Usage analytics for admins: top questions, refused topics, evidence opens.
Exit criteria: one pilot resolves ≥10 blind spots through the product; weekly active askers ≥60% of licensed seats.
Effort: 1–2 engineers + design.

### M4 — Paid pilots and proof (6–8 weeks)
Goal: convert 3 pilots to paid annual contracts.
Deliverables:
- Pilot success scorecard and exit interview.
- Pricing page, order form, simple billing (invoice is fine in KZ).
- Security one-pager, on-prem Docker image, deployment guide.
- 2 case studies with before/after metrics.
Exit criteria: 3 signed annual contracts; CAC and payback estimated from real pipeline; churn risk assessed.
Effort: founder-led sales + 1 solutions engineer.

### M5 — Repeatable GA (months 5–6)
Goal: a sellable, supportable product for the beachhead.
Deliverables:
- Self-serve trial or guided trial; onboarding checklist; in-app doc hygiene guide.
- SLA and support process; status page.
- Partner enablement; referral terms.
- Roadmap for the second vertical, based on inbound demand.
Exit criteria: 10 paying workspaces, <5% monthly logo churn, gross margin >70%, support load <2 hours/workspace/month.

## 9. Technical roadmap (prioritized)

P0 — correctness and trust
- Eval harness with versioned question sets and scorecards in CI.
- Table extraction hardening; OCR quality on RU/KK scans; page-level locators.
- Conflict detection between document versions; authoritative-source rules.
- Answer provenance: store evidence ids with every answer; never render without them.
- Audit log and immutable answer snapshots.

P1 — team product
- Server index + workspace isolation + roles.
- Document versioning and supersession.
- Blind-spot workflow (assign, comment, resolve, export).
- Embeddable widget/API.
- Admin analytics.

P2 — leverage
- Hybrid retrieval: BM25 + multilingual embeddings + reranker; calibrated confidence.
- Query understanding for price/quantity/unit variants.
- Connectors (Drive, SharePoint, 1C, Bitrix24).
- On-prem packaging, SSO, SOC2-lite controls.
- Static-rendered marketing site and docs.

Deliberate technical choices to keep:
- Extractive answers by default; any generative layer must return citations and pass evidence validation.
- Zero-key local demo remains the top of the funnel and the security story.
- Keep the engine DOM-free so it can move to a Worker or server unchanged.

## 10. Metrics

North star: **verified-answer rate** — share of real user questions answered with a citation the user accepts as correct. (Instrument: thumbs up/down plus evidence-open events; later, sampled human review.)

Guardrails:
- Wrong-answer rate (target <2%, measured on eval sets, not self-reported).
- Refusal correctness (target >90% on unanswerable questions).
- p95 latency.
- Blind-spot closure time and count.
- Weekly active askers / licensed seats.
- Evidence opens per answer (proxy for verification behaviour).

Anti-metrics: number of documents uploaded, number of questions asked without a citation, "engagement" time in chat.

## 11. Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Real-document accuracy disappoints | High | Eval harness in M1; design partners; refuse rather than guess; set expectations in sales |
| Commoditization by LLM vendors | High | Own the workflow, vertical semantics, trilingual retrieval, deployment posture |
| Low willingness to pay in SMB | Medium | Price per workspace; tie to quote turnaround/error cost; start with revenue-facing teams |
| Long enterprise cycles | Medium | Channel partners; on-prem; security artifacts ready early |
| Data residency / compliance objections | Medium | Local/on-prem deployment, no third-party model keys, audit log, DPA |
| Founder bandwidth | High | One beachhead; ship M1 before building M2; partner for integrations |
| Legacy repo still public/private elsewhere | Low | Retire or rename the old remote after approval; new repo has clean history |

## 12. Open questions for you

1. **Beachhead.** Do you want to start with industrial distributors (my recommendation), compliance/ops teams, or multilingual support desks? The answer changes the demo corpus, the landing page and the first 10 interviews.
2. **Deployment.** Is the first paying customer more likely to accept cloud, or do we need on-prem from day one? On-prem is a stronger differentiator but slows the roadmap.
3. **Sales motion.** Self-serve trial or founder-led design partners? I recommend design partners first, self-serve after M2.
4. **Pricing anchor.** What monthly price would you be comfortable defending to a 30-person distributor — and what would make you walk away?
5. **Real corpora.** Which three companies can give us documents and 20 real questions, with permission? Without this, M1 is guesswork.
6. **Legacy cleanup.** The old private GitHub repo still exists. Do you want it renamed, archived or deleted? I did not touch it; local history is already clean.
7. **Brand scope.** Is Synoptik the company, or a product under a studio? It affects domain, legal entity and the "about" copy.
8. **Marketing build.** Keep the zero-dependency static site, or move the marketing site to a static-rendered framework for SEO? My preference: keep the app dependency-free; static-render the landing page at build time.

## 13. Next 14 days

- [ ] Confirm beachhead and pricing hypothesis (1 conversation).
- [ ] Line up 3 design partners and secure permission for their document sets.
- [x] Build the eval harness and a demo-corpus scorecard.
- [ ] Run the harness on the first real corpus and record the scorecard in `eval/`.
- [ ] Fix the top 5 extraction/retrieval failures found on that corpus.
- [ ] Add a comparison-composition path (two cited lines, not one) or keep the refusal and document it.
- [ ] Record a 3-minute walkthrough of the current demo for outbound.
- [ ] Decide on the legacy repo cleanup and the `synoptik` remote.
- [ ] Write the one-page security summary for buyers.
- [ ] Draft the pilot agreement and success criteria.

## 14. Decision log

| Date | Decision | Why |
|---|---|---|
| 2026-11-24 | Rebuild under the name Synoptik, not a rename in place | Remove legacy identity and history; new IA and visual language |
| 2026-11-24 | Keep the demo corpus domain (coatings) but replace the fictional company | Preserves verified evidence mapping while removing the old identity |
| 2026-11-24 | Zero runtime/build dependencies | Auditability, offline demo, regulated-buyer story, no supply-chain surface |
| 2026-11-24 | Blind spots as a first-class surface, not analytics | The refusal workflow is the durable differentiator |
| 2026-11-24 | Extractive answers only in v0.1 | A generated sentence without a receipt undermines the product promise |
| 2026-11-25 | Default to demo corpus on first run | Immediate value; the refusal and citation loop is visible in one click |
| 2026-11-25 | Grade the answer line, not the evidence set | A lower evidence hit with the right number must not mask a wrong top answer |
| 2026-11-25 | Prefer price list over catalog when amounts conflict, and show both | The most common real ambiguity for distributors; the user needs the disagreement, not a silent choice |
| 2026-11-25 | Refuse live comparison questions until composition exists | Quoting one side of a comparison is a wrong answer with a receipt |
| 2026-11-25 | Freeze tuning at 95.4% on the authored demo suite | Further gains on 110 authored questions would be overfitting; real corpora are the next signal |

## 15. Progress log

### 2026-11-25 — M1 measurement layer

- Built `scripts/evaluate.mjs`: per-question scoring, tag breakdown, calibration, JSON/Markdown scorecards, thresholds that fail CI, real-corpus directory support.
- Added 110 demo-corpus questions across EN/RU/KK, including typos, transliteration, unit variants, identifier traps, unanswerable questions and price conflicts.
- Rewrote tokenisation: cross-language concept mapping (price/delivery/warranty/return), Cyrillic inflection stripping, transliteration, unit/currency normalisation, English light stemming, typo/prefix aliases, stopword expansion.
- Added document-intent routing, money-line selection for price questions, and a comparison refusal guard.
- Added generic price-conflict detection with source links and price-list-over-catalog precedence.
- Fixed the scorecard to grade the displayed answer line; this exposed 12 hidden wrong answers that the previous "any evidence hit" grading had masked.
- Result: 95.4% answered-correct, 1.2% wrong, 100% refusals on the authored demo suite; 33 tests green.
- Remaining known failures: three live comparison questions (refused by design) and one primer question that quotes the wrong compatibility line. Both are on the M1 real-corpus list.
