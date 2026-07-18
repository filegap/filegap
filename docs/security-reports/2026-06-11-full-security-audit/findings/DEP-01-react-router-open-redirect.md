# DEP-01 — `react-router` open-redirect via protocol-relative URL (both apps)

- **Severity:** Medium
- **Category:** Supply Chain / Open Redirect
- **Location:** `apps/web/package.json:14` (`react-router-dom ^6.28.0`, installed 6.30.3) · `apps/desktop/package.json` (`react-router 6.30.3`)

## Description
react-router 6.7.0–6.30.3 are affected by **GHSA-2j2x-hqr9-3h42**: a same-origin redirect whose path begins with `//` is reinterpreted as a protocol-relative URL, enabling open redirect. Fixed in `>=6.30.4` (and 7.x).

## Impact
In both apps, all `useNavigate`/`<Navigate>` targets are currently hardcoded strings, so the bug is **not exploitable today**. The desktop app uses `createHashRouter`, raising the bar further. Risk materializes only if a future feature passes user-controlled input to `navigate()`.

## Evidence
```
react-router  6.7.0 - 6.30.3  (moderate)
React Router same-origin redirect with path starting // causes open redirect
https://github.com/advisories/GHSA-2j2x-hqr9-3h42
```

## Remediation
Bump `react-router-dom` to `^6.30.4` in both `apps/web` and `apps/desktop` and update the lockfiles (`npm audit fix`). Avoid introducing `navigate(userControlledValue)` patterns.
