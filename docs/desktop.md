# Desktop Architecture (MVP)

## Scope

This document covers the desktop app in `apps/desktop` only.

MVP includes:

- App shell (home + routing)
- Merge PDF flow
- Split PDF flow
- Extract Pages flow
- Reorder PDF flow
- Tauri command boundary
- Direct `filegap_core` integration (no CLI subprocess)

## Runtime Model

Desktop execution path:

1. React UI gathers local file paths and output destination.
2. UI invokes a Tauri command (`merge_pdfs`, `split_pdf`, `extract_pages`, `reorder_pdf`, `read_pdf_bytes`).
3. Rust command reads local files, calls `filegap_core` operation.
4. Rust command writes output to selected destination.
5. For Extract preview, UI renders thumbnails in-memory via bundled `pdf.js` worker (no network).

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

## Shared Design System Foundations

The desktop app consumes the shared design token foundation from:

- [`shared/design/tokens.css`](/Users/ste/Workspace/wLabs/prj/pdflo/shared/design/tokens.css)

Desktop-specific styles then build on top of those tokens in:

- [`apps/desktop/src/styles.css`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/styles.css)

Rule:

1. New shared palette values should be added in the shared token file, not directly in desktop-only CSS.
2. Desktop-specific styling may compose the tokens differently, but should not invent a parallel palette.

## Tool Overview (Current)

Purpose:

- Run local PDF operations (`Merge`, `Split`, `Extract Pages`, `Reorder`) with desktop-native UX.
- Keep repetitive workflows efficient: run tool, verify result, start new operation.

User flow:

1. Select local files via file picker.
2. Review and reorder files in the left working area.
3. Configure export options in the right sidebar (`File name`, `Location`, `Change`).
4. Run operation from primary CTA (`Merge PDF`, `Split PDF`, `Extract pages`, `Reorder PDF`).
5. Inspect completion result in sidebar result block.
6. Use post-operation actions (`Open`, `Reveal`) or reset with `New ...`.

Key UX decisions:

- Local-first only: no file uploads, no remote processing path.
- Sidebar as control panel: all export and merge actions are centralized on the right.
- Result-state grouping: completion message and file actions are grouped in a dedicated result block.

## Desktop UI/UX Patterns

### Layout

- Left panel: working surface (dropzone, selected files list/table actions, or thumbnail grid for Extract).
- Right panel: persistent control sidebar (export configuration, run action, result actions, trust note).
- Footer: system feedback area for transient operational messages.
- Footer settings: opens desktop settings modal.

### States

- Idle: no active operation.
- Processing files: selected file metadata inspection is running.
- Processing: operation is running.
- Completed: result block is visible with completion details and follow-up actions.
- Error: generic error message in footer/system feedback channel.

### Action hierarchy

- Primary: `Merge PDF` / `Merge again`
- Secondary: `New merge`
- Utility: `Change` (location), per-row file actions, `Clear all`

## Reusable Components (Desktop)

These components and patterns are reused across desktop tools (`Merge`, `Split`, `Extract`, `Reorder`):

- Result state block:
  - Completion title + result details + file actions.
  - Styled as subtle system feedback, not marketing card.
- File table:
  - Ordered rows with remove and reorder actions.
  - Internal scrolling for large lists (prevents page growth).
- Sidebar sections:
  - Export/configuration section.
  - Action section (primary CTA + completion/reset flow).
  - Trust/privacy section anchored to sidebar bottom.
- Settings modal:
  - `Output` settings:
    - `Default folder` (initial export destination).
    - `Ask destination every time` (ignores default folder and prompts on each run).
    - `Filename templates` per tool (`Merge`, `Split`, `Extract`, `Reorder`) with `{date}` and `{n}` variables.
    - `Overwrite behavior`: `ask`, `auto-rename`, `replace`.
  - `Privacy` settings:
    - `Open file after export`.
    - `Reveal in folder after export`.
  - If no default folder is set and `Ask destination every time` is disabled, app falls back to system Downloads directory.
- Thumbnail grid (Extract):
  - In-memory page previews.
  - Direct page selection with range-assist actions (`Select all`, `Odd`, `Even`, `First page`).
  - Local-only rendering; no file upload and no remote fetch.
- Button variants:
  - Primary (`Merge`)
  - Secondary (supporting actions)
  - Ghost/utility (`Change`, `New merge`)
- Inline utility actions:
  - Compact controls with semantic icons and concise labels.

Current shared rollout status:

- [`apps/desktop/src/components/ui/Button.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/components/ui/Button.tsx) now carries explicit shared button variants and size helpers.
- [`apps/desktop/src/components/ui/Card.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/components/ui/Card.tsx) now carries shared card variants for neutral, subtle, and result surfaces.
- [`apps/desktop/src/components/layout/ToolLayout.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/components/layout/ToolLayout.tsx) now composes a reusable tool header pattern.
- [`apps/desktop/src/components/ui/ResultStateBlock.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/components/ui/ResultStateBlock.tsx) now sits on top of the shared card primitive instead of custom standalone success panel styling.
- The right-side tool panels now share sidebar composition blocks via [`apps/desktop/src/components/ui/SidebarSection.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/components/ui/SidebarSection.tsx), [`apps/desktop/src/components/ui/OutputDestinationField.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/components/ui/OutputDestinationField.tsx), and [`apps/desktop/src/components/ui/OutputActionSection.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/components/ui/OutputActionSection.tsx).

## Copy Guidelines (Desktop, Privacy-First)

Use local-first terminology consistently:

- Prefer `Selected files` (not `Uploaded files`).
- Use `Processed locally on your device — no uploads`.
- Use `Reveal` (not `Show`) for file-location action.
- Avoid web/server wording such as `upload`, `server`, `cloud processing`.

## Interaction Guidelines

- Hover behavior:
  - All interactive elements must have visible hover and active states.
  - Utility actions use lower-intensity hover than primary actions.
- Button hierarchy:
  - Primary CTA remains visually dominant.
  - Secondary/utility actions remain clearly interactive but non-competing.
- Icon usage:
  - Use semantic Lucide icons only.
  - Keep icon sizing consistent (typically 16px for inline/action contexts).
  - Match icon spacing and interaction behavior across similar actions.
- Motion:
  - Keep transitions fast and subtle.
  - Avoid decorative or attention-stealing animations.

## Next Steps

- Add `info` command and route for metadata inspection.
- Add desktop integration tests around command success/failure boundaries.
