# DEP-02 — `vitest` / `esbuild` / `vite` dev-dependency CVEs (both apps)

- **Severity:** Low (dev/CI tooling only — not shipped to users)
- **Category:** Supply Chain (development)
- **Location:** `apps/web/package.json` (devDeps, `vitest ^2.1.8`), `apps/desktop/package.json` (devDeps, `vitest 2.1.9`, `vite 5.4.21`, `esbuild 0.21.5`)

## Description
Development dependencies carry known advisories:
- **vitest** `2.1.x` — GHSA-5xrq-8626-4rwp (critical in advisory): when the Vitest UI server is listening, arbitrary files can be read and executed. Fixed `>=3.2.6`.
- **esbuild** `0.21.5` — GHSA-67mh-4wv8-2f99 (moderate): any website can send requests to the dev server and read responses. Fixed `>0.24.2`.
- **vite** `5.4.21` — GHSA-4w7w-66w2-5vf9 (moderate): path traversal in `.map` handling.

All are dev-only — they do not affect the built web app or packaged desktop app.

## Impact
A developer running `vitest --ui` / `vite dev` while browsing a malicious page could have local files read or code executed. Real risk on developer workstations and any CI that exposes the dev/UI ports; nil for end users.

## Evidence
```
vitest  2.1.x   GHSA-5xrq-8626-4rwp  (critical, dev) — fixed >=3.2.6
esbuild 0.21.5  GHSA-67mh-4wv8-2f99  (moderate)      — fixed >0.24.2
vite    5.4.21  GHSA-4w7w-66w2-5vf9  (moderate)
```

## Remediation
Bump `vitest` to `^3.2.6` in both apps (pulls fixed `vite`/`esbuild`), run `npm audit fix`, and verify the test suites pass. Ensure CI does not expose the Vitest UI / Vite dev server ports.
