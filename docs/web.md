# Web MVP Architecture

## Principles

- No upload endpoints
- In-browser processing only
- UI and PDF engine separated by adapter

## Proposed modules

- `src/features/pdf/`: operation state + UI flow
- `src/workers/pdf.worker.ts`: heavy processing worker
- `src/adapters/pdfEngine.ts`: operation interface implementation

## Basic flow

1. User drops files
2. Files read as `ArrayBuffer`
3. Worker runs selected operation
4. Worker returns `Blob`
5. Browser triggers local download
