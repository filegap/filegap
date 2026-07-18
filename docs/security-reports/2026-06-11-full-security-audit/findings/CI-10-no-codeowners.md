# CI-10 — No `CODEOWNERS` file

- **Severity:** Low
- **Category:** Repository Hygiene / Access Control
- **Location:** `.github/CODEOWNERS` (does not exist)

## Description
There is no `CODEOWNERS` file, so GitHub does not auto-request review from designated owners when a PR touches sensitive paths (`.github/workflows/`, `Cargo.toml`, `apps/desktop/src-tauri/`). This matters most for CI/CD and release workflows, where an unreviewed change could alter signing or distribution logic.

## Impact
A PR modifying a workflow or the Tauri config could be merged without mandatory security review.

## Evidence
`ls .github/` — only `workflows/` exists.

## Remediation
Add `.github/CODEOWNERS`:
```
.github/workflows/                       @filegap/security
Cargo.toml                               @filegap/security
apps/desktop/src-tauri/tauri.conf.json   @filegap/security
apps/desktop/src-tauri/capabilities/     @filegap/security
```
