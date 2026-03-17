# Privacy Policy (Project-Level)

`filegap` is privacy-first by design.

## Core commitment

Your files never leave your device during standard operation.
PDF processing must not require network requests in any channel (web, CLI, desktop app).

## Web app constraints

- No upload endpoint for PDF processing.
- Processing performed directly in browser memory.
- Output generated client-side and downloaded locally.
- No server-side fallback for PDF operations.

## Cross-project network rule

- Web: no network requests during PDF processing.
- CLI: no network requests during PDF processing.
- Desktop app: no network requests during PDF processing.

## Data Handling Guarantees

- PDF binary data must stay in local runtime memory.
- Logs must never contain PDF content, extracted text, or sensitive metadata.
- Crash/error reporting must redact file-related payloads by default.

## Transparency

- Source code is open for inspection.
- Data flow documentation is maintained in `docs/`.
