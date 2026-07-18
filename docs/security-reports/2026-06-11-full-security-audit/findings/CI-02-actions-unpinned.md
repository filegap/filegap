# CI-02 — GitHub Actions pinned by mutable tag, not commit SHA

- **Severity:** High
- **Category:** Supply Chain
- **Location:** `.github/workflows/ci.yml:16,19,31` · `release-desktop-community.yml:28,31,38,60,91,169` · `release-cli-community.yml:30` · `codeql.yml:62,72,101`

## Description
Every third-party action (`actions/checkout`, `actions/setup-node`, `actions/upload-artifact`, `softprops/action-gh-release`, `github/codeql-action/*`) is pinned to a mutable version tag (`@v5`, `@v4`, `@v2`). Tags can be force-pushed by the maintainer or reassigned if their account is compromised. `dtolnay/rust-toolchain@stable` is worse — a floating branch reference that changes on every run.

## Impact
A tag-hijack of any action in the release workflow grants the attacker control of a pipeline running with `contents: write` on a `macos-latest` runner — allowing injection of malicious code into the published `.dmg` or modification of the Homebrew tap formula. This is the entry point that makes CI-03/CI-04 fully exploitable.

## Evidence
```yaml
uses: actions/checkout@v5            # mutable tag
uses: dtolnay/rust-toolchain@stable  # floating branch
uses: softprops/action-gh-release@v2 # mutable tag
```

## Remediation
Pin every action to a full 40-character commit SHA, keeping the tag as a comment:
```yaml
uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v5.2.0
uses: softprops/action-gh-release@<sha>                          # v2.x
```
Automate with `pinact` or Dependabot's actions update strategy.
