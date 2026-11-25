# Roadmap — three horizons, two kinds of work

This is the plan the project is actually executed against. The detailed task list is [backlog.md](backlog.md); the measured history is [progress.md](progress.md); the reasoning is [strategy.md](strategy.md).

## How to read it

Every action belongs to one of two kinds of work:

- **Intelligence (I)** — what I can do: write code, run CLI commands, use plugins/MCP servers, generate tests and scorecards, write docs, and deploy to Vercel, Supabase or other hosts.
- **Human (H)** — what only you can do: talk to people, get permission for documents, make legal and pricing decisions, record demos, introduce partners, and recommend the product to friends.

Almost every milestone is **I + H**: I build the thing, you open the door. A task with no `H` column entry is not waiting on you.

Horizons:

| Horizon | Window | Character |
|---|---|---|
| **Short term** | now → 2 weeks | Easy, small, unblocking. Mostly intelligence; a few five-minute human actions. |
| **Midterm** | 2 weeks → 3 months | Bigger milestones: real corpora, a team workspace, the blind-spot loop. |
| **Long term** | 3–12 months | The product that is awaiting: what Synoptik becomes if the beachhead works. |

---

## 1. Short term — easy, next actions

These are the exact steps I will take next, in order. All of them are small enough to finish in a session.

| # | Intelligence — what I do next | Human — what you do | Done when |
|---|---|---|---|
| S1 | Fix live answers rendering empty detail bullets (`src/app/ask.js:146–166`); add a `scripted = false` regression test. | — | Live answers show real, non-duplicated detail lines; copy is clean. |
| S2 | Honour the backend contract: keep `doc`/`location`, add a 10 s timeout and response validation (`ask.js:185–223`). | — | README example payload renders a proper citation; a hanging endpoint degrades to a refusal. |
| S3 | Apply coverage, identifier, comparison and conflict guards to the semantic fallback (`ask.js:103–143`). | — | A "20 L" question cannot be answered from a 10 L line with AI enabled. |
| S4 | Rewrite price parsing: all currencies, decimals, same-product check, honest document authority (`engine.js:254–269, 306–363`). | — | Four new regression tests pass (two products, `$`/`₽`, decimals, unknown file). |
| S5 | Make OCR use the vendored pdf.js worker, pin CDN assets with SRI, disable eval in both PDF paths (`build.mjs`, `ai/local.js`). | — | OCR-enabled browser run has zero CSP violations. |
| S6 | Pick one benchmark floor and make CI enforce it; stop the tracked scorecard from dirtying every run. | — | `npm test` and GitHub Actions agree; README numbers match the scorecard. |
| S7 | Fix contrast, focus trap / `inert` / Escape, untranslated literals, false "re-checks" copy and wrong demo counts (P0-7…P0-10). | — | Keyboard-only pass works; computed contrast passes AA; no English literal outside dictionaries. |
| S8 | Deploy the static build to Vercel with `vercel` CLI (no env vars, `dist/` as output). | Create/approve the Vercel account and give me the project name; decide if you want a custom domain. | Public URL loads landing + `/app.html`; CI and deploy are separate, repeatable commands. |
| S9 | Scaffold the future server schema on Supabase (workspaces, documents, passages, answers, audit) via CLI/SQL migrations — no keys in the repo. | Create the Supabase project; paste project URL into settings locally, never into a tracked file. | Migrations run clean; a local run can still use `localStorage` with no Supabase configured. |
| S10 | Write a one-page buyer security summary and a 3-minute demo script from the current guided demo. | Send the demo link to 5 friends/colleagues; write down the exact questions they ask and anything they found confusing. | 5 real reactions and their questions are in `plan/progress.md`; the script exists. |
| S11 | — | One conversation to pick the beachhead (industrial distributors recommended) and a price anchor you can defend. | Decisions recorded in `plan/decisions.md`. |

**Short-term exit:** all P0 items in `backlog.md` ticked, a live URL exists, and at least five humans have tried the demo.

---

## 2. Midterm — bigger milestones

| Milestone | Intelligence — what I do | Human — what you do | Exit criteria |
|---|---|---|---|
| **M1 — Evidence quality in the wild** | Build the real-corpus loader and held-out set; run the evaluator; fix scanned PDFs, multi-column tables, merged headers, version conflicts and currency formats; document freshness; calibrate `strength` labels; decide comparison composition. | Secure **3 design partners** with written permission, 20–40 real questions each in EN/RU/KK, and a domain reviewer to verify answers. | ≥85% answered-correct, ≤2% wrong, ≥90% correct refusals on three real corpora. |
| **M2 — Team workspace and audit** | Server-side ingestion + Postgres/pgvector index on Supabase, workspace isolation, auth and roles, immutable audit log, document versioning, retention controls, localStorage migration path. | Recruit 10 pilot users; get a compliance reviewer to accept an audit export; approve the DPA template. | 10 users for 2 weeks; audit export accepted; p95 < 1.5 s on a 1,000-page corpus. |
| **M3 — The blind-spot loop becomes the product** | Assignment/status/comments/request-document flow, coverage trends, CSV/Notion/Jira export, embeddable answer widget/API, first connector (Drive or SharePoint), admin analytics. | Run the pilot workflow; resolve ≥10 blind spots in-product; meet 1–2 1C/Bitrix integrators. | ≥10 blind spots resolved in-product; weekly active askers ≥60% of seats. |
| **GTM proof** | Static-render the landing page for SEO, add a localized security page, record a walkthrough with real numbers. | 10 discovery interviews; 2 case studies with quote-turnaround metrics; fixed 3-month pilot agreement. | Two published case studies with before/after numbers. |

**Midterm exit:** a paying or near-paying team uses the workspace without passing a browser profile around, and the blind-spot loop has produced measurable document changes.

---

## 3. Long term — the product that is awaiting

The destination is **not a better chatbot**. It is an evidence layer / system of record for business documents: every answer has a receipt, every refusal becomes a tracked content gap, and an auditor can reconstruct who asked what and which line answered it.

What that product looks like:

- **Horizontal core, vertical wedge.** Start as the answer-and-evidence workspace for industrial distributors and building-material suppliers in Kazakhstan/Central Asia; expand to compliance/ops teams, then a second document-heavy vertical chosen from inbound demand.
- **Deployment posture as the differentiator.** No-key local demo at the top of the funnel, cloud workspace for teams, on-prem/private cloud for data-residency buyers. Documents never need to be uploaded to a general-purpose AI vendor.
- **Workflow lock-in.** Blind spots → owner → new document → resolution → coverage trend is the operational data that a chat box cannot reproduce.
- **Audit-grade trust.** Immutable answer snapshots, evidence ids, roles, retention and export — eventually SSO and SOC2-lite controls.
- **Multilingual by construction.** EN/RU/KK first; additional languages only when a customer requires them, not as a generic "supports 100 languages" claim.
- **Business shape.** Paid pilots → annual workspace contracts → channel/implementation partners → 10 paying workspaces → a repeatable second vertical.

| Intelligence — what I can build toward it | Human — what only you can do |
|---|---|
| Hybrid retrieval: BM25 + multilingual embeddings + reranker, calibrated confidence. | Legal entity, trademark, domain, pricing architecture. |
| On-prem Docker image + deployment guide; SSO and SOC2-lite controls. | Close 3 annual contracts; own CAC/payback and churn decisions. |
| Connectors: Google Drive/SharePoint first, then 1C and Bitrix24. | Negotiate integrator/referral terms and a channel kit. |
| Second vertical corpus and eval sets; docs site; self-serve trial and onboarding. | Decide brand scope (company vs. studio), SLA, support process and second vertical. |
| Admin analytics, usage-based insight into refused topics, evidence-open rates. | Hire/assign a solutions engineer when support load exceeds ~2 h/workspace/month. |

**Long-term exit:** 10 paying workspaces, <5% monthly logo churn, >70% gross margin, and one second vertical with its own scorecard.

---

## 4. Expansion — tools beyond Vercel and Supabase

Vercel (static/edge hosting) and Supabase (Postgres, auth, storage, pgvector) are the current defaults. Nothing in the product requires either: `dist/` is a plain static site and the engine is DOM-free. These are credible alternatives, grouped by job.

| Job | Current default | Alternatives | Watch-out |
|---|---|---|---|
| Static hosting / deploy | Vercel | Cloudflare Pages, Netlify, GitHub Pages, Render, Fly.io, AWS Amplify + CloudFront, Azure Static Web Apps | Cloudflare Pages/Workers gives the best edge story and generous free bandwidth; GitHub Pages is free but no redirects/rewrites for the SPA router. |
| Server Postgres / vector | Supabase + pgvector | Neon (serverless Postgres + pgvector), PlanetScale (MySQL, no pgvector), CockroachDB Serverless, Turso (SQLite at the edge), MongoDB Atlas Vector Search | Neon is the closest drop-in for pgvector; Turso is cheapest for read-heavy edge workloads. |
| Dedicated vector search | pgvector | Qdrant Cloud, Weaviate Cloud, Pinecone | Only needed after corpora outgrow pgvector; Qdrant has the best self-host story for on-prem. |
| Auth / roles | Supabase Auth | Clerk, Auth0, WorkOS (enterprise SSO), Logto (self-hostable), Firebase Auth | WorkOS or Logto if on-prem SSO becomes a sales requirement. |
| Object storage / CDN | Supabase Storage | Cloudflare R2 (no egress fees), AWS S3, Backblaze B2 | R2 is the strongest fit for document storage with predictable cost. |
| Edge functions | Vercel Functions | Cloudflare Workers, Deno Deploy, Netlify Functions | Must keep answer generation deterministic; edge functions are for routing/ingestion, not model calls. |
| Observability / errors | GitHub Actions + local logs | Sentry, Better Stack, Grafana Cloud, Logflare | Sentry's free tier is enough for a pilot; self-host Grafana for on-prem. |
| Product analytics | none (by design) | PostHog (self-hostable), Plausible (privacy-friendly), Umami | Keep analytics event-only — never send document text or questions to a third party without consent. |
| LLM / eval tooling | local eval harness | Ollama (on-prem models), Langfuse, Braintrust, Hugging Face Inference Endpoints | Any hosted model that sees documents conflicts with the no-upload promise; keep it opt-in and documented. |
| Payments / billing | not implemented | Stripe, Paddle (merchant of record), Lemon Squeezy | Stripe is the most flexible; for KZ invoices you may need a local billing flow plus an accountant regardless of provider. |
| Transactional email | not implemented | Resend, Postmark, SMTP via a local provider | Magic-link emails need a verified domain; Postmark has the best deliverability. |
| Docs / support site | README + `plan/` | VitePress, Docusaurus, Mintlify | VitePress is dependency-light and fits the zero-dependency culture best. |
| Feature flags / experiments | not implemented | GrowthBook, Unleash (self-hostable) | Useful for gating the optional semantic model per workspace. |
| On-prem packaging | not implemented | Docker + Coolify, Portainer, Kubernetes (only at scale) | Coolify gives a one-click on-prem story for SMB buyers. |
| CI / supply chain | GitHub Actions | Dependabot, Renovate, CodeQL | Renovate is the most configurable for a dependency-free repo (mostly CI action pinning). |

**Selection rule:** choose the cheapest boring option that preserves the promise — no document text leaves the customer's control unless they explicitly opt in. Add a tool only when a named milestone needs it; do not add infrastructure to look modern.

---

## Maintenance

When a horizon ends or a milestone changes, edit this file, then follow the update convention in [README.md](README.md): tick `backlog.md`, append `progress.md`, append `decisions.md`, and re-run tests / eval / build.
