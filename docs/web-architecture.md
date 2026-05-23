# Filegap Web Architecture

## Scope

This document defines architecture rules for the **web app only** (`filegap.dr-w.it`).
CLI and desktop concerns are intentionally out of scope.

Core rule:

**All PDF processing must run in the browser. No backend processing.**

## Architectural Principles

1. Local-first processing:
- Files are read as `File`/`ArrayBuffer` in browser runtime.
- Operations run in a Web Worker.
- Output is generated as `Blob` and downloaded client-side.

2. Zero server processing:
- No `/api` endpoints for PDF manipulation.
- No upload flow for input documents.
- No storage of user PDF bytes on remote systems.

3. Simple UX over feature depth:
- Tool pages prioritize one clear task at a time.
- Drag-and-drop area is the primary interaction.

4. Reusable UI patterns:
- Tool pages share a common layout and component primitives.
- Business logic is isolated in feature modules and adapters.

## Frontend Stack

- React
- TypeScript
- Vite
- TailwindCSS
- `lucide-react` for all UI icons
- `pdf-lib` for PDF operations in browser

## Recommended Project Structure

```text
apps/web/
├─ public/
│  └─ og/                      # Social share images
├─ src/
│  ├─ app/
│  │  ├─ router.tsx
│  │  ├─ App.tsx
│  │  └─ providers.tsx
│  ├─ pages/
│  │  ├─ merge-pdf/
│  │  ├─ split-pdf/
│  │  ├─ extract-pages/
│  │  └─ reorder-pdf/
│  ├─ features/
│  │  └─ pdf-tools/
│  │     ├─ merge/
│  │     ├─ split/
│  │     ├─ extract/
│  │     ├─ reorder/
│  │     └─ shared/
│  ├─ components/
│  │  ├─ ui/
│  │  ├─ layout/
│  │  └─ seo/
│  ├─ workers/
│  │  └─ pdf.worker.ts
│  ├─ lib/
│  │  ├─ pdf/
│  │  │  ├─ adapters/
│  │  │  ├─ validation/
│  │  │  └─ file-utils.ts
│  │  └─ analytics/
│  ├─ styles/
│  │  ├─ globals.css
│  │  └─ tailwind.css
│  ├─ types/
│  └─ main.tsx
├─ tailwind.config.ts
├─ postcss.config.js
├─ vite.config.ts
└─ package.json
```

## Runtime Boundaries

1. UI Layer:
- Collects files, user options, and triggers actions.
- Does not perform heavy PDF transformation on main thread.

2. Worker Layer:
- Executes `pdf-lib` operations.
- Returns typed success/error payload to UI.

3. Adapter Layer:
- Exposes tool operations with consistent signatures:
  - `merge(files) -> Blob`
  - `split(file, options) -> Blob[]`
  - `extract(file, pageSelection) -> Blob`
  - `reorder(file, pageOrder) -> Blob`

## Tool Route Contract

- `/merge-pdf`
- `/split-pdf`
- `/extract-specific-pages-from-pdf`
- `/reorder-pdf-pages`

Each route must include:

1. H1 with target keyword
2. Short privacy-first description
3. Tool UI (drop zone + action controls)
4. Supporting content blocks for SEO

## Error Handling Rules

1. Validation errors:
- Explain what user should change (example: invalid page range).

2. Processing errors:
- Use generic safe message and optional technical detail block.

3. Recovery:
- Keep selected files when possible.
- Allow retry without full page reload.

## Client Logging Policy (Always On)

Console logs are part of the product operation and must always be enabled.
They are not test-only diagnostics.

Required levels:

1. `debug`:
- Technical execution details for developers.
- Example: worker events, buffer sizes, operation timings.

2. `info`:
- User-friendly operational milestones.
- Example: files selected, merge started, merge completed.

3. `warn`:
- User-recoverable problems.
- Example: invalid input before processing.

4. `error`:
- Failures with concise technical reason.
- Example: worker processing failed.

Tone and content rules:

1. `debug` can be more technical.
2. `info`/`warn`/`error` should remain understandable by non-technical users.
3. Never log PDF content, extracted text, or sensitive metadata.
4. Prefer safe metrics (file count, total bytes, operation state).

## Performance Rules

1. Keep worker payloads minimal.
2. Avoid unnecessary file copies in memory.
3. Show progress state for actions longer than ~300ms.
4. Use lazy loading for non-critical modules.

## Privacy Compliance Checklist (Web)

1. No network request contains PDF file bytes.
2. No telemetry includes extracted text or metadata from files.
3. No persistent storage of uploaded files.
4. Processing path works offline after app load.
