# DESK-08 — Unsigned builds; README trains users to bypass Gatekeeper

- **Severity:** Low
- **Category:** Supply Chain / Signing Posture
- **Location:** `README.md:181,187`

## Description
The README states signing/notarization is not enabled for community (Homebrew) builds and provides the exact command to strip macOS quarantine: `xattr -dr com.apple.quarantine "/Applications/Filegap Desktop.app"`. This trains users to bypass the mechanism macOS uses to protect against tampered/malicious apps. An unsigned app cannot be verified as unmodified.

## Impact
A supply-chain substitution (compromised tap, replaced GitHub release) would not be caught by Gatekeeper, and users conditioned to run the bypass apply it without questioning authenticity. Particularly relevant given the unscoped file commands in DESK-01/02/03.

## Evidence
```
# README.md:181
"Until Apple signing/notarization is enabled, macOS Gatekeeper prompts can occur."
# README.md:187
xattr -dr com.apple.quarantine "/Applications/Filegap Desktop.app"
```

## Remediation
Enroll in the Apple Developer Program and enable notarization in the Tauri build workflow. Until then, publish SHA-256 checksums (see CI-06) and document verification before install rather than normalizing the Gatekeeper bypass.
