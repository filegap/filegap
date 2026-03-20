# Desktop Architecture (MVP)

## Scope

This document covers the desktop app in `apps/desktop` only.

MVP includes:

- App shell (home + routing)
- Merge PDF flow
- Tauri command boundary
- Direct `filegap_core` integration (no CLI subprocess)

## Runtime Model

Desktop execution path:

1. React UI gathers local file paths and output destination.
2. UI invokes Tauri command `merge_pdfs`.
3. Rust command reads local files, calls `filegap_core::ops::merge_pdfs`.
4. Rust command writes merged output to selected destination.

No server-side processing and no network dependency are required for PDF operations.

## Module Boundaries

- `apps/desktop/src/*`:
  - UI, route flow, and command invocation only.
  - No PDF transformation logic.
- `apps/desktop/src-tauri/src/*`:
  - File-system orchestration and command-level input validation.
  - Maps internal errors to generic user-safe messages.
- `crates/core/*`:
  - Domain PDF operations and validation.

## Privacy and Logging

- The desktop command does not log file names, paths, sizes, or PDF content.
- Error messages returned to UI remain generic.
- Processing remains local-only.

## Next Steps

- Add `info` command and route for metadata inspection.
- Add `extract`, `reorder`, and `split` flows.
- Add desktop integration tests around command success/failure boundaries.
