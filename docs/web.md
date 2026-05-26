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
- `src/components/layout/AppHeader.tsx`: sticky tool navigation shell

## Current Scaffold (v0.1)

- Framework: React + Vite + TypeScript
- Worker-backed local merge and split flows
- Worker-backed local merge, split, extract, and reorder flows
- Merge queue supports incremental add, remove, and drag-and-drop reorder
- Split parser supports range input including single pages (for example `1-3,4,5-10`) with preview-ready architecture
- No backend/API dependency for file processing
- Public routes implemented: `/`, `/workflow-builder`, `/merge-pdf`, `/split-pdf`, `/extract-specific-pages-from-pdf`, `/reorder-pdf-pages`, `/optimize-pdf`, `/compress-pdf`, `/pdf-to-images`, `/extract-images`, `/download`
- Legacy compatibility routes remain available for `/extract-pages` and `/reorder-pdf`, but sitemap and navigation use the canonical SEO slugs.
- Intent-specific SEO routes reuse the same local tool components instead of duplicating PDF processing logic:
  - split: `/split-pdf-into-individual-pages`, `/split-pdf-by-page-ranges`, `/split-pdf-without-uploading`, `/split-large-pdf`
  - merge: `/merge-pdf-without-uploading`, `/combine-pdf-files`
  - extract: `/extract-specific-pages-from-pdf`, `/extract-pages-from-pdf`, `/save-single-pages-from-pdf`
  - reorder: `/organize-pdf-pages`
  - compress: `/compress-pdf-to-100kb`, `/compress-pdf-to-200kb`, `/compress-pdf-for-email`, `/compress-pdf-without-uploading`
  - privacy hub: `/offline-pdf-tools`
- Redundant SEO support routes remain reachable and internally linked with `noindex,follow`,
  but canonicalize to primary pages to reduce search-result cannibalization.
- Landing pages emit page-specific `FAQPage`, `SoftwareApplication`, and `BreadcrumbList`
  JSON-LD where FAQ content is present.
- Shared tool layout is app-like and compact:
  - sticky top header with tool links
  - title/subtitle directly in page flow (no hero card)
  - tool card appears immediately after heading

## Shared Design System Foundations

The web app uses shared design tokens from:

- [`shared/design/tokens.css`](/Users/ste/Workspace/wLabs/prj/pdflo/shared/design/tokens.css)

Tailwind theme colors map to those tokens in:

- [`apps/web/tailwind.config.ts`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/web/tailwind.config.ts)

Rule:

1. Do not introduce new shared palette values directly in page components.
2. Shared color and surface changes must start from the design tokens file.

## Implemented Tool Behaviors

### `/workflow-builder` (Preview)

- Linear visual pipeline builder (Workflow V1) inspired by CLI chaining.
- Input mode selector (`single` vs `multiple`) and ordered step list.
- Step operations: `merge`, `extract`, `reorder`, `optimize`, `compress`, `split`, `PDF to Images`, `Extract Images`.
- Inline validation for V1 constraints:
  - `merge` only as first step
  - `split` only as last step
  - `PDF to Images` only as last step because it exports image ZIP files
  - `Extract Images` only as last step because it exports image ZIP files
  - `multiple` input mode requires first step `merge`
- Real-time CLI preview generation for the configured workflow shape.
- For `PDF to Images`, the preview shows the planned local workflow shape even though CLI support is not implemented yet.
- For `Extract Images`, the preview uses the executable `filegap extract-images` CLI command, and browser execution extracts supported embedded image streams locally.
- Workflow execution runs locally for supported web operations, including terminal ZIP outputs.

### `/download`

- Provides desktop community-channel installation instructions via Homebrew cask.
- Gives the Homebrew update command prominent placement for already installed desktop apps.
- Shows developer-preview positioning and channel caveats for unsigned/non-notarized artifacts.
- Links to CLI and GitHub Releases without changing privacy invariants.

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

### `/extract-specific-pages-from-pdf`

- Single source PDF flow with `Uploaded files` section
- Range parser supports mixed selections (for example `1-3,5,7-9`)
- Live range validation and parsed segment preview chips
- Worker-first processing with main-thread fallback
- Single output result with `Download PDF`
- Result state with `New extract` to reset and start again
- Dropzone disabled while extract is processing

### `/reorder-pdf-pages`

- Single source PDF flow with `Uploaded files` section
- Page-order parser supports singles and ranges (for example `3,1,2,4-6`)
- Validation requires full page order with no duplicates
- Worker-first processing with main-thread fallback
- Single output result with `Download PDF`
- Result state with `New reorder` to reset and start again
- Dropzone disabled while reorder is processing

### `/pdf-to-images`

- Single source PDF flow with JPEG and PNG export formats
- Screen and print resolution presets for local page rendering
- Uses `pdfjs-dist` in the browser to render each page to canvas
- Packages one image per page into a local ZIP file without adding upload or backend processing
- Result state with `Download ZIP` and `New conversion`
- Dropzone disabled while conversion is processing

### `/extract-images`

- Single source PDF flow for embedded image asset extraction
- Uses `pdf-lib` to inspect PDF image XObjects in the browser
- Extracts supported `DCTDecode` JPEG streams as `.jpg` and `JPXDecode` JPEG 2000 streams as `.jp2`
- Does not render PDF pages, decode complex raw image streams, inspect inline images, or recurse through Form XObjects
- Packages extracted assets into a local ZIP file without adding upload or backend processing
- Empty or unsupported PDFs show a clear no-supported-images state
- Result state with `Download ZIP` and `New extraction`

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
2. PDF manipulation runs in a Web Worker where available; page rendering uses the local PDF.js worker plus browser canvas.
3. Output is generated locally and downloaded via object URL.
4. No request body ever contains PDF binary payload.
