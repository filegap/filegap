# CI-01 — `ci.yml` lacks a top-level `permissions:` block

- **Severity:** High
- **Category:** CI/CD Permissions
- **Location:** `.github/workflows/ci.yml:1-66`

## Description
`ci.yml` declares no `permissions:` block at workflow or job level. When none is present and the repository default token permission is "read and write", every step runs with a `GITHUB_TOKEN` carrying `contents: write`, `pull-requests: write`, `packages: write`, and more. Even if the repo default is read-only today, the absence of an explicit restriction means any future org-level default change silently upgrades the token scope with no code diff.

## Impact
A compromised or malicious dependency executed during `npm ci`, `npm run build`, or `cargo build` could exfiltrate the `GITHUB_TOKEN` and push commits, create releases, or modify package registry records in the org.

## Evidence
```yaml
# ci.yml — no permissions: block anywhere
on:
  push:
  pull_request:
jobs:
  ci:
    runs-on: ubuntu-latest
```

## Remediation
Add an explicit minimal block at the top of the workflow:
```yaml
permissions:
  contents: read
```
`codeql.yml` and both release workflows already do this — bring `ci.yml` in line.
