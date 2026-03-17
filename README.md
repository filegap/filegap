# filegap

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
cargo run -p filegap-cli -- --help
```

Examples:

```bash
cargo run -p filegap-cli -- merge -i a.pdf b.pdf -o merged.pdf
cargo run -p filegap-cli -- extract -i in.pdf -p 2-4 -o out.pdf
cargo run -p filegap-cli -- split -i in.pdf --every 2 -d ./out
cargo run -p filegap-cli -- reorder -i in.pdf -p 3,1,2 -o reordered.pdf
cargo run -p filegap-cli -- info -i in.pdf
cargo run -p filegap-cli -- info -i in.pdf --json
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
