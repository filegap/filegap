# CI-09 — No Dependabot/Renovate; `npm audit` is non-blocking

- **Severity:** Medium
- **Category:** Supply Chain / Dependency Hygiene
- **Location:** `.github/` (no `dependabot.yml`); `.github/workflows/ci.yml` (`npm audit ... || true`)

## Description
There is no `dependabot.yml` or Renovate config. The project spans npm (two apps), Cargo (workspace + desktop), and GitHub Actions. The `npm audit` steps in `ci.yml` use `|| true`, so even a flagged high-severity advisory does not block merge. Known CVEs (lopdf, zip, tauri, npm packages) can accumulate silently.

## Impact
Combination of no automated updates and non-enforced audit means a known-vulnerable dependency can persist indefinitely and reach released artifacts. (See DEP-01, DEP-02 for currently-flagged advisories.)

## Evidence
`ls .github/` shows only `workflows/`; no `dependabot.yml`. `npm audit` invoked with `|| true`.

## Remediation
Add `.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule: { interval: "weekly" }
  - package-ecosystem: "cargo"
    directory: "/"
    schedule: { interval: "weekly" }
  - package-ecosystem: "npm"
    directory: "/apps/web"
    schedule: { interval: "weekly" }
  - package-ecosystem: "npm"
    directory: "/apps/desktop"
    schedule: { interval: "weekly" }
```
Also make `npm audit` blocking for High+ severities (drop `|| true`, or gate with `--audit-level=high`).
