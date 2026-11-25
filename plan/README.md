# Plan — execution layer

This folder is the working contract for the project. It is deliberately separate from the README (what the product is) and the code (what exists today).

| File | Purpose | Update rule |
|---|---|---|
| [strategy.md](strategy.md) | Market thesis, ICP, positioning, metrics, risks and session history. The "why" and "what happened". | Change only when the thesis or a milestone changes; append a session-history row each time. |
| [roadmap.md](roadmap.md) | The plan in three horizons (short / mid / long term), split into **Intelligence** (my work) and **Human** (your work), plus expansion options. | Update when a horizon ends, a milestone moves, or a tool choice changes. |
| [backlog.md](backlog.md) | Ordered, concrete next actions with scope and acceptance criteria. The "what next". | Tick, split or add items as work happens. |
| [decisions.md](decisions.md) | Append-only decision log with date and rationale. | Add a row for any choice that changes direction, cost or scope. Never rewrite old rows. |
| [progress.md](progress.md) | Append-only work log: what changed, what was verified, what remains open. | Append one entry per work session. |

## Convention: update the plan after each work session

Do this **in the same commit as the work**, before declaring the task done:

1. Mark the finished item **done** in `backlog.md`, or replace it with smaller follow-ups. Do not leave a completed item unchecked.
2. Append an entry to `progress.md` with: files/surfaces changed, exact verification commands and results, and any new or remaining risk. Map open items back to backlog IDs (e.g. `P0-2`).
3. Append to `decisions.md` if you picked an approach over an alternative, changed scope, or accepted a new risk.
4. Update [roadmap.md](roadmap.md) if the horizon, milestone or work split changed; add a row to the session history in `strategy.md`.
5. Update the status snapshot below if a milestone, score or repo fact changed.
6. Run `npm test`, `node scripts/evaluate.mjs --all --md /tmp/scorecard.md` and `node build.mjs`; record the results in the progress entry.

If a session produces no code (research, interviews, scoping), still append a progress entry — the decision or finding is the output.

## Status snapshot (2026-11-25)

- **Repository:** https://github.com/yermukhamed0777/synoptik (public, source-available; commercial rights retained)
- **Stage:** v0.1 + M1 measurement layer, pre-pilot. M1 exit gate (real corpora) not met.
- **Latest benchmark:** 95.4% answered-correct, 1.2% wrong, 100% refusals on the authored demo suite (110 questions). Node p95 ≈ 5–6 ms. Not a generalisation result.
- **Tests:** 33 passing across six files; CI runs tests, benchmark and build on push/PR.
- **Plan shape:** short / mid / long term in `roadmap.md`, with every milestone split into Intelligence (my work) and Human (your work). Next action: **S1 / P0-1**, the live-answer detail bug.
- **Known release blockers:** answer-detail rendering bug, remote citation metadata dropped, semantic fallback bypasses abstention guards, price-conflict false positives, CSP/OCR inconsistency (P0-1…P0-5), plus WCAG AA contrast failures, missing focus management, untranslated UI literals and contradicted UI copy (P0-7…P0-10). See `backlog.md`.
