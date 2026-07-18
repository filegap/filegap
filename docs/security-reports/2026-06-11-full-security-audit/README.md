# Filegap — Security Audit Report

- **Date:** 2026-06-11
- **Scope:** Full repository — Rust core + CLI (`crates/`), web app (`apps/web`), Tauri desktop app (`apps/desktop`), CI/CD and supply chain (`.github/`, `dev.sh`, `.githooks/`, distribution).
- **Method:** Read-only static review across four parallel surfaces. No code was modified. `cargo audit` / `npm audit` run read-only.
- **Threat model:** Filegap is a privacy-first, local-only PDF toolkit. The two primary attacker inputs are (1) **malicious PDF files** processed by the tool and (2) the **supply/distribution chain** (CI, Homebrew tap, unsigned builds). The core privacy guarantee — "files never leave the device" — was a specific verification target.

## Headline

**No Critical findings. The privacy guarantee holds: no network calls exist in any PDF-processing path across Rust, web, or desktop.** The most serious issues are concentrated in two areas: the **Tauri desktop IPC layer** (bespoke file-read/write commands with no path scoping) and the **CI/CD + distribution chain** (injectable release workflow, unpinned actions, broad token exposure, no checksums for direct downloads). The web app is the cleanest surface; its main gap is the absence of any Content Security Policy and an un-pinned external analytics script.

## Findings by severity

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High     | 8 |
| Medium   | 12 |
| Low      | 13 |
| **Total**| **33** |

## High-severity findings (fix first)

| ID | Title | Area |
|----|-------|------|
| [DESK-01](findings/DESK-01-arbitrary-file-read.md) | Arbitrary file read via `read_pdf_bytes` | Desktop IPC |
| [DESK-02](findings/DESK-02-arbitrary-file-write.md) | Arbitrary file write via `write_binary_file` | Desktop IPC |
| [DESK-03](findings/DESK-03-no-path-scope-all-commands.md) | All PDF commands accept unscoped paths | Desktop IPC |
| [CI-01](findings/CI-01-ci-missing-permissions.md) | `ci.yml` has no `permissions:` block | CI/CD |
| [CI-02](findings/CI-02-actions-unpinned.md) | Actions pinned by mutable tag, not SHA | Supply chain |
| [CI-03](findings/CI-03-workflow-dispatch-injection.md) | `workflow_dispatch` tag injected into `GITHUB_OUTPUT` | CI injection |
| [CI-04](findings/CI-04-homebrew-token-job-env.md) | Homebrew tap PAT exposed as job-level env | Secrets |
| [WEB-01](findings/WEB-01-no-csp.md) | No Content Security Policy / security headers | Web headers |

## Medium-severity findings

| ID | Title | Area |
|----|-------|------|
| [RUST-01](findings/RUST-01-unbounded-stdin.md) | Unbounded stdin read (memory DoS) | Rust CLI |
| [RUST-02](findings/RUST-02-parse-amplification.md) | O(N) parse amplification in reorder/split | Rust core |
| [RUST-03](findings/RUST-03-jpeg-image-bomb.md) | JPEG image bomb in `compress` | Rust core |
| [WEB-02](findings/WEB-02-analytics-no-sri.md) | External analytics script without SRI | Web supply chain |
| [DESK-04](findings/DESK-04-open-file-shell-launch.md) | `open_file`/`show_in_folder` launch unvalidated paths | Desktop IPC |
| [DESK-05](findings/DESK-05-opener-any-url.md) | Opener capability allows any http(s) URL | Desktop config |
| [DEP-01](findings/DEP-01-react-router-open-redirect.md) | `react-router` open-redirect CVE (both apps) | Dependencies |
| [CI-05](findings/CI-05-cli-tarball-hash.md) | CLI formula hashes GitHub auto-tarball | Release integrity |
| [CI-06](findings/CI-06-no-shasums.md) | No `SHASUMS256.txt` for desktop downloads | Release integrity |
| [CI-07](findings/CI-07-npm-install-vs-ci.md) | `npm install` instead of `npm ci` in CI | Supply chain |
| [CI-08](findings/CI-08-gitignore-secrets.md) | `.gitignore` missing `.env` / key patterns | Hygiene |
| [CI-09](findings/CI-09-no-dependabot.md) | No Dependabot/Renovate; `npm audit` non-blocking | Dependency hygiene |

## Low-severity findings

| ID | Title | Area |
|----|-------|------|
| [RUST-04](findings/RUST-04-terminal-injection-info.md) | Terminal control injection via PDF metadata in `info` | Rust CLI |
| [RUST-05](findings/RUST-05-output-pattern-traversal.md) | Path traversal via `--output-pattern` | Rust CLI |
| [RUST-06](findings/RUST-06-concatenated-loadmem.md) | Repeated `load_mem` on concatenated stdin | Rust CLI |
| [RUST-07](findings/RUST-07-integer-truncation.md) | Integer truncation in merge counts | Rust core |
| [WEB-03](findings/WEB-03-analytics-url-collection.md) | Analytics auto-collects page URLs (privacy nuance) | Web privacy |
| [WEB-04](findings/WEB-04-cli-preview-shell-injection.md) | Shell injection via filename in CLI preview copy | Web |
| [WEB-05](findings/WEB-05-pdfjs-eval.md) | `pdfjs` `isEvalSupported` not disabled | Web |
| [DESK-06](findings/DESK-06-path-exists-toctou.md) | `path_exists` TOCTOU in output resolution | Desktop |
| [DESK-07](findings/DESK-07-pdfjs-worker-double-init.md) | pdf.js worker initialized twice at module level | Desktop |
| [DESK-08](findings/DESK-08-unsigned-gatekeeper-bypass.md) | Unsigned builds; README trains Gatekeeper bypass | Distribution |
| [CI-10](findings/CI-10-no-codeowners.md) | No `CODEOWNERS` file | Access control |
| [CI-11](findings/CI-11-security-md-no-pgp.md) | `SECURITY.md` lacks email/PGP fallback | Disclosure |
| [DEP-02](findings/DEP-02-vitest-esbuild-dev.md) | `vitest`/`esbuild`/`vite` dev CVEs (both apps) | Dependencies (dev) |

## What looked solid

- **Privacy guarantee verified.** No `reqwest`/`hyper`/`std::net` in Rust; no `fetch`/`XMLHttpRequest`/`sendBeacon`/`WebSocket` in any PDF-processing path in web or desktop. PDF bytes never leave the device. The only outbound request anywhere is the SimpleAnalytics page-view script (web only) — see WEB-02/WEB-03.
- **No `unsafe` Rust** in the reviewed crates; `cargo audit` reported zero vulnerabilities across 152 dependencies.
- **No XSS sinks.** No `dangerouslySetInnerHTML`/`innerHTML`/`eval` in web or desktop frontends; PDF-derived metadata is rendered through React's escaping.
- **Desktop production CSP is strict** (`script-src 'self'`, `object-src 'none'`, no `unsafe-eval`); the Tauri updater is disabled (`createUpdaterArtifacts: false`).
- **No file persistence** in the browser (no localStorage/IndexedDB/service worker); object URLs are revoked after use; pdf.js worker is bundled locally, not from a CDN.
- **ZIP outputs are safe from zip-slip** — entry names are internally generated (`image-NNN.ext`, `part-N.pdf`), never derived from PDF content.
- **CLI error abstraction** strips internal detail before output, honoring the no-leak privacy requirement.
- `codeql.yml` and both release workflows have explicit minimal `permissions:` blocks; no `pull_request_target` misuse; no `curl|bash` in shell scripts; no hardcoded secrets anywhere in the tree.

## Recommended remediation order

1. **Desktop IPC scoping** (DESK-01/02/03) — single canonicalize-and-scope helper closes all three; highest blast radius if the webview is ever compromised.
2. **Release pipeline hardening** (CI-03, CI-04, CI-02, CI-01) — protects every downstream Homebrew user from a poisoned release.
3. **Web CSP + analytics SRI** (WEB-01, WEB-02) — defense-in-depth for the most-used surface; note CSP requires `isEvalSupported: false` (WEB-05) first.
4. **Rust DoS hardening** (RUST-01/02/03) — relevant for automation/pipeline use of the CLI on untrusted PDFs.
5. **Hygiene & process** (CI-07/08/09/10/11, DEP-01/02, remaining Low) — batch into one housekeeping PR.

> Note: each finding file is self-contained with location, evidence, impact, and a concrete remediation. Severities reflect this project's local-only threat model — several DoS findings would rank higher in a network-exposed service but are bounded here to local/automation contexts.
