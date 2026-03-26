# filegap

![CI](https://github.com/filegap/filegap/actions/workflows/ci.yml/badge.svg)

Private PDF tools that run locally.

Core promise: **your files never leave your device**.

Repository: https://github.com/filegap/filegap

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
│  ├─ web/       # web app (browser-local processing)
│  └─ desktop/   # tauri desktop app (Rust core integration)
├─ shared/
│  └─ design/    # shared design tokens and foundations for web + desktop
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

## Install CLI (Homebrew)

Tap first and then install:

```bash
brew tap filegap/filegap
brew install filegap
```

Or install directly from tap without a separate tap step:

```bash
brew install filegap/filegap/filegap
```

Quick sanity checks:

```bash
filegap --version
filegap --help
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

Design foundations for both web and desktop now share a common token source in `shared/design/tokens.css`.

## Automatic Commit Checks

This repository ships with a versioned Git `pre-commit` hook in `.githooks/pre-commit`.

Once enabled locally, every commit automatically runs the relevant checks based on staged files:

- changes in `apps/web/**` run `npm run build` and `npm run test` in `apps/web`
- changes in `apps/desktop/**` run `npm run build` and `npm run test` in `apps/desktop`
- changes in `shared/design/tokens.css` run both web and desktop checks

Enable hooks for your local clone with:

```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
```

## Quick Start (Desktop MVP)

Desktop app lives in `apps/desktop` and uses Tauri + React with direct calls to `crates/core`.

Requirements:

- Rust stable toolchain
- Node.js 20+

Run in development:

```bash
cd apps/desktop
npm install
npm run tauri:dev
```

Current desktop MVP includes:

- Desktop home page
- Merge PDF tool
- Split PDF tool
- Extract Pages tool
- In-memory Extract page thumbnails and assisted selection (Select all, Odd, Even, First page)
- Reorder PDF tool
- Local file picker + save dialog
- Rust-side PDF commands powered by `filegap_core`

## Status

`v0.1` feature-complete on CLI (`merge`, `extract`, `split`, `reorder`, `info`) with automated tests.
Desktop app has local production flows for `merge`, `split`, `extract`, and `reorder` running through Tauri -> Rust core.
