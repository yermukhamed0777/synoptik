# Third-party notices

Synoptik itself is licensed as described in [LICENSE](LICENSE). The following third-party components are included or loaded on demand and retain their own licences.

## Bundled in `vendor/`

- **pdf.js** (`vendor/pdf.min.mjs`, `vendor/pdf.worker.min.mjs`) — Copyright Mozilla contributors, licensed under the Apache License, Version 2.0. Full text: https://www.apache.org/licenses/LICENSE-2.0

## Loaded on demand (optional, off by default)

These are not bundled. When the user enables semantic search / OCR, the browser fetches them from jsDelivr and fetches model weights from Hugging Face:

- `@huggingface/transformers` — Apache-2.0
- `multilingual-e5-small` — MIT
- `tesseract.js` — Apache-2.0
- `pdfjs-dist` — Apache-2.0

Each project's own licence governs its use. No keys or credentials are bundled with Synoptik.
