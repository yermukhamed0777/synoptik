# Decision log

Decisions are append-only. Add a row when a choice changes direction, cost, or scope; never rewrite an old row. The strategy document (`strategy.md`) explains why; this file records what was decided and when.

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
| 2026-11-25 | Publish the repository publicly as `yermukhamed0777/synoptik` | Portfolio consistency with the other public projects; source is public, commercial rights are retained |
| 2026-11-25 | Ship a proprietary "all rights reserved" LICENSE, not MIT | The plan is a paid product; publishing source must not grant commercial rights |
| 2026-11-25 | Separate strategy, execution backlog, decisions and progress into `plan/` | Keeps the durable thesis stable while making the next action and its outcome unambiguous |
| 2026-11-25 | Add GitHub Actions CI: tests, evidence benchmark, static build | Makes the quality claims reproducible for anyone cloning the repo |
| 2026-11-25 | Use an explicit test-file list in `npm test` | `node --test tests/` fails on Node 24 when given a directory; explicit files work on every supported Node version |
| 2026-11-25 | Keep the fictional demo corpus, but label demo mode explicitly rather than presenting seeded answers as real evidence | Authenticity means honesty about what is real; removing the demo would destroy the onboarding loop and the verified citation mapping |
| 2026-11-25 | Fix accessibility and literal-string leaks before polishing visual detail | A public repo is judged by keyboard/screen-reader behaviour and translation parity as much as by screenshots |
| 2026-11-25 | Structure the plan into short / mid / long term and split every milestone into Intelligence (my work) and Human (your work) | Makes the next action unambiguous and prevents work from stalling on tasks only one of us can do |
| 2026-11-25 | Keep Vercel + Supabase as defaults, but require a named milestone before adding any other vendor | The product promise is no document uploads and no keys; infrastructure must not quietly break it |
| 2026-11-25 | Any hosted model or third-party analytics that sees document text or questions stays opt-in | Preserves the local-first privacy story and the regulated-buyer positioning |
