# Architecture (v0.1)

## Goal

Keep PDF domain logic independent from presentation layers.

## Layers

1. `crates/core`: typed operations and validation for PDF workflows.
2. `crates/cli`: command parsing + filesystem I/O adapter.
3. `apps/web`: browser UI, local-only processing path with no backend PDF service (active).
4. `apps/desktop`: Tauri desktop application for local distribution and execution (active).

## Core Operation Contracts

`core` exposes operation-oriented API boundaries:

- `merge_pdfs(input_docs) -> output_pdf`
- `extract_pages(input_doc, ranges) -> output_pdf`
- `split_pdf(input_doc, mode) -> output_docs`
- `reorder_pages(input_doc, order) -> output_pdf`

All contracts use bytes (`Vec<u8>`) at boundaries, keeping I/O out of `core`.

## Non-goals for v0.1

- Compression and OCR
- Robust handling for every malformed PDF edge case
- Password-protected PDF support

## Privacy Design

All adapters must keep processing local to the user's environment.
No server upload path is allowed in the default architecture.

## Runtime Boundaries

- `apps/web` must execute PDF operations in-browser (main thread + worker), never on a server.
- `apps/desktop` can call local Rust commands, but must not proxy files to remote services.
- `crates/core` remains pure processing logic and never performs network I/O.
