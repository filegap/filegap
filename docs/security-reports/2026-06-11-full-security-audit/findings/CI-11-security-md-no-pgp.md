# CI-11 — `SECURITY.md` lacks an email/PGP fallback channel

- **Severity:** Low
- **Category:** Vulnerability Disclosure
- **Location:** `SECURITY.md:7-9`

## Description
The security policy directs reporters to GitHub private security advisories only. There is no fallback for researchers who cannot or prefer not to use GitHub, and no email contact or PGP key for encrypted communication.

## Impact
A researcher unable to use GitHub's advisory UI has no documented alternative — a low-friction gap, not directly exploitable.

## Evidence
```markdown
## How To Report
- Open a **private security advisory** on GitHub
```

## Remediation
Add a secondary contact (a security-specific email, optionally with a PGP public key fingerprint) as a fallback channel.
