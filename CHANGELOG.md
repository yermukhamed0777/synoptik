# Changelog

## Unreleased

- Published the repository publicly and added a source-available licence, CI workflow, third-party notices and the `plan/` execution folder.
- Fixed `npm test` so it runs all test files on Node 20+.

## v0.1.0 — 2026-11-25

Evidence-first retrieval workspace for business documents.

- Trilingual (EN/RU/KK) landing page and browser workspace with no account, API key or upload endpoint.
- Client-side parsing for TXT/MD, CSV, DOCX, XLSX and PDF (vendored pdf.js with layout/table reconstruction); optional local OCR and multilingual embeddings.
- BM25 retrieval with RU/KK morphology, cross-script transliteration, unit normalisation, typo tolerance and document-intent routing.
- Evidence coverage and abstention, identifier guard, price-conflict handling and comparison refusal.
- Blind-spot ledger, coverage view, evidence drawer and guided demo.
- Evidence evaluator with two demo-corpus sets (110 questions) and a committed scorecard: 95.4% answered-correct, 1.2% wrong, 100% refusals.
- 33 tests across engine, corpus, parsers, i18n, brand hygiene and retrieval floor.
