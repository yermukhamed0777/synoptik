# Contributing

Thanks for looking at Synoptik. Before opening a pull request, please read the [plan folder](plan/README.md): it contains the current strategy, the executable backlog and the progress log. Pick an item from the backlog, or open an issue describing the change first.

## Local setup

Node.js 20+ is required. There is no install step and no dependency tree.

```bash
node build.mjs              # writes dist/
node scripts/serve.mjs      # http://127.0.0.1:4173/ and /app.html
npm test                    # 33 tests, Node's built-in runner
node scripts/evaluate.mjs --all --md /tmp/scorecard.md
```

Do not commit `dist/` or `artifacts/`; both are git-ignored.

## Ground rules

- Answers stay extractive: never render a generated sentence without a citation into the evidence array.
- Keep `src/domain/engine.js` DOM-free so it can move to a Worker or server unchanged.
- No runtime or build dependencies, no API keys, no telemetry.
- New retrieval behaviour needs a regression test and, where it changes answer quality, an eval question set entry.

## After each work session

The plan is part of the deliverable. Before you finish:

1. Tick, split or add items in [plan/backlog.md](plan/backlog.md).
2. Append what changed, what was verified and what remains open to [plan/progress.md](plan/progress.md).
3. Add a row to [plan/decisions.md](plan/decisions.md) if you changed direction, scope or cost.
4. Leave [plan/strategy.md](plan/strategy.md) alone unless the thesis itself changed.

Security issues should be reported privately (see [SECURITY.md](SECURITY.md)), not in a public issue.
