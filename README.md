# pdflo

Privacy-first PDF tools that run locally.

Core promise: **your files never leave your device**.

## Vision

`pdflo` is an open-source PDF tools suite distributed through:

- Web app (local browser processing, no uploads)
- CLI tool (developer-friendly automation)
- Desktop app (offline-friendly UX)

## v0.1 Scope

MVP operations:

- Merge PDFs
- Extract selected pages
- Split a PDF
- Reorder pages

## Repository Structure

```text
pdflo/
├─ crates/
│  ├─ core/      # shared Rust PDF domain logic
│  └─ cli/       # CLI wrapper around core operations
├─ apps/
│  ├─ web/       # web app (planned)
│  └─ desktop/   # tauri app (planned)
├─ docs/
└─ testdata/
```

## Privacy Principles

- No remote PDF processing in the web flow
- Browser processing via `ArrayBuffer` / `Blob`
- Clear operation boundaries between UI and core logic
- Web app architecture is backend-free for PDF operations

## Web Guardrails (Non-Negotiable)

For the web channel, PDF processing must remain strictly client-side.

- No API routes for PDF manipulation
- No file upload endpoint for processing
- No server-side persistence of user PDFs
- No telemetry that includes file content or extracted text

Any proposal that introduces server-side PDF processing is out of scope for this project.

## Quick Start (Rust)

Requirements:

- Rust stable toolchain

Build workspace:

```bash
cargo build
```

Run CLI:

```bash
cargo run -p pdflo-cli -- --help
```

## Status

This repository is in active bootstrap stage for v0.1.
