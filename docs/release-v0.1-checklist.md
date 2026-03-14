# v0.1 Release Checklist

## Scope Completion

- [x] Core operations implemented: merge, extract, split, reorder
- [x] CLI commands wired end-to-end: merge, extract, split, reorder, info
- [x] `info` command outputs readable summary and supports `--json`
- [x] Web architecture remains local-only (no backend processing)

## Quality Gates

- [x] Security pre-commit checks configured in `AGENTS.md`
- [x] Test pre-commit policy configured in `AGENTS.md`
- [x] Unit and integration tests for implemented operations
- [x] `cargo test` passes on `dev`

## Documentation

- [x] README updated with v0.1 status and usage
- [x] `docs/cli.md` aligned with implemented commands
- [x] `docs/privacy.md` and `docs/web.md` enforce browser-only web processing
- [x] `testdata/` policy documented

## Web MVP Scaffold

- [x] React + Vite scaffold in `apps/web`
- [x] Local Web Worker processing path for merge
- [x] No network processing path for files

## Branch / Release Workflow

- [ ] Rebase or merge `dev` into release branch `release/v0.1.0`
- [ ] Final manual smoke test on merge/extract/split/reorder/info
- [ ] Merge release branch into `main`
- [ ] Tag release `v0.1.0`
