# CI-08 — `.gitignore` missing `.env` and private-key patterns

- **Severity:** Medium
- **Category:** Secrets / Repository Hygiene
- **Location:** `.gitignore:1-24`

## Description
`.gitignore` has no pattern for `.env`, `.env.*`, `*.env`, or private key material (`.pem`, `.key`, `.p12`, `.pfx`, `.jks`). No such files exist on disk today, but there is no safety net if a developer creates a local `.env` (Vite/Tauri config) or drops a signing certificate in the tree.

## Impact
Accidental commit of credentials or code-signing material. In an open-source repo with Homebrew distribution, a leaked secret would be immediately public.

## Evidence
```
# Current .gitignore — no .env or key material entries
/target/
**/*.rs.bk
node_modules/
...
.vscode/
.idea/
```

## Remediation
Add:
```
# Secrets and credentials
.env
.env.*
*.env
*.pem
*.key
*.p12
*.pfx
*.jks
```
