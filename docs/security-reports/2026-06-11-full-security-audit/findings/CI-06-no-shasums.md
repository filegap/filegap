# CI-06 — No standalone `SHASUMS256.txt` published with desktop release assets

- **Severity:** Medium
- **Category:** Release Integrity
- **Location:** `.github/workflows/release-desktop-community.yml:90-95`

## Description
The desktop release publishes `.dmg`, `.app.tar.gz`, and `.app.tar.gz.sig` via `softprops/action-gh-release`, but no standalone `SHASUMS256.txt`. The SHA256 is computed in the workflow (line 119) and embedded only in the Homebrew cask — never exposed to users who download the `.dmg` directly from the Releases page.

## Impact
A user downloading the `.dmg` manually has no independent checksum to verify against. A man-in-the-path attacker or compromised CDN would go undetected — compounded by the builds being unsigned (see DESK-08).

## Evidence
```yaml
- name: Publish GitHub Release
  uses: softprops/action-gh-release@v2
  with:
    files: release-artifacts/*   # no SHASUMS256.txt present
```

## Remediation
Generate and include a checksums file before publishing:
```bash
cd release-artifacts
shasum -a 256 * > SHASUMS256.txt
```
Then add `SHASUMS256.txt` to the released files and document the verification step in the install instructions.
