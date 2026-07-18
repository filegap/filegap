# CI-05 — CLI formula hashes GitHub auto-generated source tarball

- **Severity:** Medium
- **Category:** Release Integrity
- **Location:** `.github/workflows/release-cli-community.yml:26-27`

## Description
The Homebrew formula SHA256 is computed from `https://github.com/filegap/filegap/archive/refs/tags/${TAG}.tar.gz` — an archive GitHub auto-generates on demand. GitHub documents that the content of these archives is not guaranteed stable over time (repo rename, history rewrites), so the stored SHA256 is not a durable provenance guarantee. The formula also builds from source via `cargo install`, so there is no pre-built, checksummed binary on the release page; users must trust the build-from-source path entirely.

## Impact
A Homebrew user has no cryptographically signed artifact to verify. If the archive URL ever served different bytes for the same tag, Homebrew would not detect the substitution.

## Evidence
```yaml
- name: Compute tarball SHA256
  run: |
    curl -L "${TARBALL_URL}" -o source.tar.gz
    echo "SHA256=$(sha256sum source.tar.gz | awk '{print $1}')" >> "${GITHUB_ENV}"
```

## Remediation
Publish a pre-built binary as a release asset and checksum that in the formula. Longer-term, adopt `cargo-dist` or sign artifacts with `cosign`/Sigstore for provenance independent of GitHub's archive CDN.
