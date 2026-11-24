# Security

## Posture

Synoptik v0.1 is local-first. Documents are parsed and indexed inside the browser tab. There is no Synoptik upload endpoint, no account, no telemetry and no API key.

The only network requests the product can make are:

1. **Optional local model** — if you enable Settings → Semantic search + OCR, the browser fetches `@huggingface/transformers`, `multilingual-e5-small`, `pdfjs-dist` and `tesseract.js` from jsDelivr. This is off by default and gated by a user action.
2. **Optional custom backend** — if you enter a URL in Settings, the page POSTs the question and language to that URL. Only the URL is stored. No key is accepted or transmitted by Synoptik.

The static build contains no secrets and requires no environment variables.

## Data handling

- Uploaded files and extracted passages are stored in `localStorage` (`synoptik.state.v1`), along with history, blind spots and feedback.
- Nothing is replicated to a server. Clearing the workspace or resetting the browser profile deletes the data.
- The demo corpus is fictional (Zhaiyk Coatings, `zhaiyk-coatings.example`). It contains no real customer data.
- Do not use the current browser-local build with confidential documents on a shared machine or shared browser profile. There is no authentication or per-user isolation yet; that is the M2 milestone.

## Content security

- Both HTML shells set a strict `Content-Security-Policy`: no inline scripts, `object-src 'none'`, `base-uri 'self'`.
- All document-derived text is HTML-escaped before rendering. Highlighting is applied with `<mark>` around escaped text, never with unescaped HTML.
- The page never evaluates document content.
- PDFs are processed by the vendored pdf.js build with evaluation disabled.

## Repository hygiene

- `tests/brand.test.mjs` fails if credential-shaped strings (`sk-…`, `ghp_…`, `AIza…`, private keys, `api_key = …`) or legacy product names enter `src/`.
- `.gitignore` excludes `.env*`, private keys, `node_modules`, `dist` and build artifacts.
- No CI secrets are required. The build is a copy plus two static HTML files.

## Known limitations / threat model notes

| Concern | Current state |
|---|---|
| Malicious document causing browser compromise | Parsing uses browser APIs and pdf.js; a browser-level 0-day is out of scope. Zip decompression is bounded by the 30 MB upload cap. |
| XSS through document text | Escaped at render; CSP blocks inline script. |
| Zip bomb | Upload size is capped, but decompressed size is not separately capped. Add a decompression budget before server-side ingestion. |
| Cross-site data theft | Data stays in the origin's localStorage. A compromise of the hosting origin would expose it. Self-host for sensitive corpora. |
| Custom backend | The operator chooses the endpoint; Synoptik does not validate its trustworthiness. The endpoint receives questions only, not documents. |
| Multi-user access control | Not implemented. Do not deploy the browser-local build as a shared team service. |
| Auditability | Not implemented server-side. Answers are not yet stored with immutable evidence ids outside the browser. |

## Reporting

This is a private project. Report issues directly to the maintainer rather than opening a public issue. Include reproduction steps, affected browser, and whether data exposure is involved.

## Pre-release checklist

```bash
npm test                      # or run each tests/*.test.mjs directly
node build.mjs
# review dist/, confirm no unexpected origins in CSP
# confirm no .env, keys, tokens, personal data in git status
```
