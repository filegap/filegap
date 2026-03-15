# Web MVP Architecture

## Principles

- No upload endpoints
- In-browser processing only
- UI and PDF engine separated by adapter
- No backend dependency for PDF operations

## Proposed modules

- `src/features/pdf/`: operation state + UI flow
- `src/workers/pdf.worker.ts`: heavy processing worker
- `src/adapters/pdfEngine.ts`: operation interface implementation

## Current Scaffold (v0.1)

- Framework: React + Vite + TypeScript
- Worker-backed local merge and split flows
- Worker-backed local merge, split, extract, and reorder flows
- Merge queue supports incremental add, remove, and drag-and-drop reorder
- Split parser supports range input including single pages (for example `1-3,4,5-10`) with preview-ready architecture
- No backend/API dependency for file processing
- Public routes implemented: `/merge-pdf`, `/split-pdf`, `/extract-pages`, `/reorder-pdf`
- Home route intentionally deferred

## Implemented Tool Behaviors

### `/merge-pdf`

- Multiple file queue with add/remove/reorder (drag and drop)
- Per-file metadata: filename, size, page count
- Worker-first processing with main-thread fallback
- Result state with `Download PDF` and `New merge`
- Dropzone disabled while merge is processing

### `/split-pdf`

- Single source PDF flow with `Uploaded files` section
- Range input parser supports both ranges and single pages:
  - Example: `1-3,4,5-10`
- Live range validation and parsed segment preview chips
- Worker-first processing with main-thread fallback
- Output list with per-file download and `Download all`
- Result state with `New split` to reset and start again
- Dropzone disabled while split is processing

### `/extract-pages`

- Single source PDF flow with `Uploaded files` section
- Range parser supports mixed selections (for example `1-3,5,7-9`)
- Live range validation and parsed segment preview chips
- Worker-first processing with main-thread fallback
- Single output result with `Download PDF`
- Result state with `New extract` to reset and start again
- Dropzone disabled while extract is processing

### `/reorder-pdf`

- Single source PDF flow with `Uploaded files` section
- Page-order parser supports singles and ranges (for example `3,1,2,4-6`)
- Validation requires full page order with no duplicates
- Worker-first processing with main-thread fallback
- Single output result with `Download PDF`
- Result state with `New reorder` to reset and start again
- Dropzone disabled while reorder is processing

Run locally:

```bash
cd apps/web
npm install
npm run dev
```

## Basic flow

1. User drops files
2. Files read as `ArrayBuffer`
3. Worker runs selected operation
4. Worker returns `Blob`
5. Browser triggers local download

## Forbidden Patterns

- Sending PDF bytes to remote APIs for processing
- Introducing server endpoints (`/api/pdf/*`) for merge/split/extract/reorder
- Storing user files in cloud buckets, logs, or queues
- Adding third-party SDKs that inspect file content outside browser runtime

## Allowed Network Usage

- Serving static assets (HTML/CSS/JS) via CDN or static hosting
- Optional anonymous analytics that never include file content, text extraction, or metadata from uploaded files

## Implementation Checklist

1. All file handling uses `File`, `ArrayBuffer`, `Uint8Array`, and `Blob` in browser runtime.
2. Heavy processing runs in a Web Worker to avoid UI blocking.
3. Output is generated locally and downloaded via object URL.
4. No request body ever contains PDF binary payload.
