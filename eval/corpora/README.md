# Real corpora live here (ignored by git).

Create one directory per design partner, e.g. `eval/corpora/acme/`, add their
documents and an eval set in `eval/sets/acme.json`, then run:

```bash
node scripts/evaluate.mjs --corpus eval/corpora/acme --set eval/sets/acme.json --verbose --md eval/acme-scorecard.md
```

Never commit customer documents or personal data.
