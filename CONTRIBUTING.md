# Contributing

Thanks for contributing to `filegap`.

We keep contributions small, readable, and privacy-safe.

## Project Principles

- Privacy-first by default
- Local-only PDF processing
- Simple, clear code over clever abstractions

## Before You Start

If your change touches file processing, logging, or analytics, double-check that it does not violate privacy-first principles.

When in doubt, prioritize:

- removing logs over adding them
- less tracking over more tracking
- simplicity over cleverness

## Development Setup

### Prerequisites

- Rust stable toolchain
- Node.js 20+ and npm (for web app)

### Clone and Install

```bash
git clone <repo-url>
cd filegap
```

Web app:

```bash
cd apps/web
npm install
```

## Run Locally

CLI:

```bash
cargo run -p filegap-cli --bin filegap -- --help
```

Web app:

```bash
cd apps/web
npm run dev
```

## Build and Test

Workspace:

```bash
cargo build
cargo test
```

Web app:

```bash
cd apps/web
npm run build
npm run test
```

## Coding Guidelines

- Keep changes focused and minimal.
- Prefer explicit, readable code.
- Remove dead code and commented-out leftovers.
- Avoid premature abstractions.
- Keep naming consistent with existing modules.

## Privacy and Logging Rules

- Never log or track user file data.
- Do not record file names, sizes, page counts, or contents.
- Do not send PDFs or related metadata to external services.
- If in doubt, remove the log/track call.

## Pull Request Rules

- Open small, focused PRs.
- Include a short problem statement and your solution.
- Add or update tests when behavior changes.
- Update docs when commands, behavior, or architecture change.
- Ensure relevant checks pass before requesting review.

## Commit Messages

Use Conventional Commits:

- `feat(scope): ...`
- `fix(scope): ...`
- `docs(scope): ...`
- `refactor(scope): ...`

## Questions

If something is unclear, open an issue before implementing a large change.
