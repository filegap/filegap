# CI-07 — `npm install` instead of `npm ci` for desktop dependencies in CI

- **Severity:** Medium
- **Category:** Supply Chain
- **Location:** `.github/workflows/ci.yml:53`

## Description
The CI step installing the desktop app's dependencies uses `npm install` rather than `npm ci`. `npm install` may update `package-lock.json` if installed versions differ and does not enforce lockfile integrity. A `package-lock.json` exists at `apps/desktop/package-lock.json`. The web app already uses `npm ci` (line 37).

## Impact
The resolved dependency tree is not guaranteed to match the lockfile, undermining reproducible builds and allowing dependency-confusion or minor-version-bump attacks to go undetected in CI.

## Evidence
```yaml
- name: Install desktop dependencies
  working-directory: apps/desktop
  run: npm install       # should be: npm ci
```

## Remediation
Replace `npm install` with `npm ci` on line 53 to match the web app step.
