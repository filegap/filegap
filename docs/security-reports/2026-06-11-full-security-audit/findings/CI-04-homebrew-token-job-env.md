# CI-04 — Homebrew tap PAT exposed as job-level env to third-party actions

- **Severity:** High
- **Category:** Secrets Exposure
- **Location:** `.github/workflows/release-desktop-community.yml:23-25`

## Description
`HOMEBREW_TAP_GITHUB_TOKEN` — a PAT with push access to the Homebrew tap repo — is set as a **job-level** `env:` variable, making it a process environment variable for the entire job. That includes the `softprops/action-gh-release@v2` step (third-party, mutable-tag pinned) and every other action in the job. Any code those actions run can read the token.

## Impact
If any action in the job is compromised via tag-hijack (see CI-02), the attacker obtains a PAT with write access to `filegap/homebrew-filegap` — a full supply-chain compromise path to all Homebrew users.

## Evidence
```yaml
jobs:
  build-macos-community:
    env:
      VITE_APP_DISTRIBUTION: github
      HOMEBREW_TAP_GITHUB_TOKEN: ${{ secrets.HOMEBREW_TAP_GITHUB_TOKEN }}  # job-level
    steps:
      - uses: softprops/action-gh-release@v2   # third-party, mutable pin
```

## Remediation
Remove the token from job-level `env:` and pass it only as a scoped `with:` input to the single step that checks out the tap:
```yaml
- name: Checkout Homebrew tap repository
  uses: actions/checkout@<sha>
  with:
    repository: filegap/homebrew-filegap
    token: ${{ secrets.HOMEBREW_TAP_GITHUB_TOKEN }}
    path: tap
```
