# filegap

![CI](https://github.com/filegap/filegap/actions/workflows/ci.yml/badge.svg)

Private PDF tools that run locally.

Core promise: **your files never leave your device**.

## Vision

`filegap` is an open-source PDF tools suite distributed through:

- Web app (local browser processing, no uploads)
- CLI tool (developer-friendly automation)
- Desktop app (offline-friendly UX)

## v0.1 Scope

MVP operations:

- Merge PDFs
- Extract selected pages
- Split a PDF
- Reorder pages
- Inspect PDF metadata and structure (`info`)

## Repository Structure

```text
filegap/
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
- No network requests during PDF processing across web, CLI, and desktop app

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
cargo run -p filegap-cli --bin filegap -- --help
```

Pipe-first examples:

```bash
cargo run -p filegap-cli --bin filegap -- merge a.pdf b.pdf > merged.pdf
cat input.pdf | cargo run -p filegap-cli --bin filegap -- extract --pages 2-4 > out.pdf
cat input.pdf | cargo run -p filegap-cli --bin filegap -- reorder --pages 3,1,2 > reordered.pdf
cargo run -p filegap-cli --bin filegap -- split input.pdf --pages 1-3 > part.pdf
cargo run -p filegap-cli --bin filegap -- split input.pdf --pages 1-2,5 --format zip > parts.zip
cargo run -p filegap-cli --bin filegap -- info input.pdf
cargo run -p filegap-cli --bin filegap -- info input.pdf --json
```

Chaining example:

```bash
cat input.pdf \
| cargo run -p filegap-cli --bin filegap -- extract --pages 1-5 \
| cargo run -p filegap-cli --bin filegap -- reorder --pages 5,4,3,2,1 \
> final.pdf
```

## Quick Start (Web Scaffold)

The web app scaffold is in `apps/web` and runs fully local in the browser.

```bash
cd apps/web
npm install
npm run dev
```

Current web scaffold includes local merge flow via Web Worker.

## Status

`v0.1` feature-complete on CLI (`merge`, `extract`, `split`, `reorder`, `info`) with automated tests.
