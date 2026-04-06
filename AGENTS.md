# AGENTS.md

## Project Context

- `filegap` is a privacy-first PDF tools suite built around local-only processing.
- The project supports web, CLI, and desktop workflows without uploading user files to external services.
- Read [README.md](README.md) first for product vision, repository structure, commands, and architecture context.

## Embedded Core Rules

- Read `README.md` before making changes.
- Use existing scripts and repository workflows instead of inventing new ones.
- Keep changes small, clear, and easy to review.
- Ask before irreversible actions such as commit, push, merge, release, or deploy.
- If repository rules are stricter than generic preferences, repository rules win.

## Open Source and Sensitive Data Rules

- This project is open source: no sensitive data may enter the repository.
- Before proposing or preparing a commit, verify that there are no:
  - secrets, API keys, tokens, or credentials
  - `.env` files or real configuration values
  - dumps, logs, or test PDFs containing personal data that is not fully anonymized
- If a file is questionable, stop and ask before proceeding.

## Privacy and Data Handling Invariants

- No network requests are allowed during PDF processing in any channel:
  - web
  - CLI
  - desktop
- User PDF files must never be uploaded, persisted server-side, or inspected by a backend service.
- Any proposal that introduces server-side PDF processing is out of scope.
- If a change risks one of these invariants, stop and request explicit confirmation.

## Logging and Analytics Policy

- Never log user data or PDF file metadata in development or production.
- Forbidden in logs:
  - filename
  - user path
  - file size
  - page count
  - page order
  - page ranges
  - file content
  - extracted text
  - binary buffers
- Error messages must remain generic and must not include user input.
- Only high-level technical logs are allowed.

- Analytics is allowed only in anonymous, aggregated, high-level form.
- Never track:
  - filename
  - user path
  - file size
  - page count
  - page order
  - page ranges
  - file content
  - user input tied to file operations
- Allowed tracking examples:
  - page views
  - high-level tool usage
  - high-level CTA clicks
- Analytics events should contain the event name only, without sensitive payload.
- When in doubt, do not log and do not track.

## Commit and Validation Rules

- All commits must follow Conventional Commits.
- Before every commit, a security review must pass with no unresolved critical findings.
- Before every commit, relevant automatic tests must be run and must pass.
- If a change touches `apps/web`, the minimum mandatory checks are:
  - `npm run build` in `apps/web`
  - `npm run test` in `apps/web`
- If a change touches `apps/desktop`, the minimum mandatory checks are:
  - `npm run build` in `apps/desktop`
  - `npm run test` in `apps/desktop`
- Keep each commit focused on one logical change with a minimal diff.
- Update `README.md` and `docs/*` when behavior, commands, or user-facing flows change.

The detailed pre-commit workflow should be handled through local skills when available.

## Branch Model

- Main long-lived branches:
  - `main`
  - `dev`
- Preferred working model:
  - `feature/<name>` from `dev`
  - `fix/<name>` from `dev`
  - `hotfix/<name>` from `main` when necessary
  - `release/<version>` from `dev` when preparing a release
- Normal development should integrate toward `dev`.
- Only stable code should be promoted to `main`.

## Parallel Work Protocol

### Area Ownership

- `web`: `apps/web/**`
- `desktop-ui`: `apps/desktop/src/**`
- `desktop-tauri`: `apps/desktop/src-tauri/**`
- `cli`: `crates/cli/**`
- `core`: `crates/core/**`

### Shared Hotspots

- `crates/core/**` is a shared hotspot between `cli` and `desktop-tauri`.
- Anyone modifying `crates/core/**` should declare it before implementation.
- Avoid concurrent public API changes in `crates/core/**` from multiple agents.
- Shared files such as `README.md`, `docs/**`, `Cargo.toml`, and `Cargo.lock` should be updated in a dedicated final pass by a single owner when possible.

### Operating Rules

- Every task should declare:
  - allowed scope
  - excluded scope
  - expected output
- Do not widen scope without explicit confirmation.
- Prefer small, atomic patches to reduce conflicts and simplify review.

### Integration and Verification

- Integrate one patch at a time on shared files.
- Run relevant checks for the touched perimeter before integration:
  - web: `npm run build` and `npm run test` in `apps/web`
  - desktop: `npm run build` and `npm run test` in `apps/desktop`
  - cli/core: relevant Rust tests in the workspace
- If a patch changes commands, behavior, or user flow, update `README.md` and `docs/*` in the same work cycle.

## Handoff Template

- Scope touched:
- Scope excluded:
- Checks executed:
- Open risks / dependencies:

## Shared Workflows and Local Skills

Use local skills for repeatable workflows such as:

- issue analysis
- issue branch setup
- documentation sync
- commit preparation
- test validation
- security review
- privacy review
- pre-commit gate checks
- parallel scope checks
