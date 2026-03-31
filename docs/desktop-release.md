# Desktop Release (Community Channel)

This document defines the current desktop release flow available without Apple Developer signing/notarization.

## Current Status

- Channel type: community
- Signing: not enabled yet
- Notarization: not enabled yet
- Intended use: technical users and pre-public distribution while signing is pending

## Release Workflow

Workflow file:

- [`.github/workflows/release-desktop-community.yml`](/Users/ste/Workspace/wLabs/prj/pdflo/.github/workflows/release-desktop-community.yml)

Trigger:

- push tag matching `desktop-v*`
- manual run (`workflow_dispatch`)

Build behavior:

- runs on `macos-latest`
- builds desktop app from `apps/desktop` with `VITE_APP_DISTRIBUTION=github`
- publishes bundle artifacts to GitHub Release
- updates Homebrew tap `filegap/homebrew-filegap` Cask (`Casks/filegap-desktop.rb`) using the generated `.dmg` SHA256
- validates that tag version (`desktop-vX.Y.Z`) matches desktop app version in `apps/desktop/src-tauri/tauri.conf.json`
- writes the Cask URL using the real published `.dmg` filename (prevents template mismatch issues)

Current artifacts:

- `.dmg`
- `.app.tar.gz`
- `.app.tar.gz.sig` (when produced by Tauri bundling)

## Tag Convention

Use desktop-specific tags to avoid collisions with CLI-only release automation:

- example: `desktop-v0.1.1`
- before tagging, bump desktop app version in:
  - `apps/desktop/src-tauri/tauri.conf.json`
  - `apps/desktop/package.json`

## Homebrew Tap Strategy

Desktop and CLI share the same tap repository:

- tap repo: `filegap/homebrew-filegap`
- CLI path: `Formula/filegap.rb`
- Desktop path: `Casks/filegap-desktop.rb`

Install commands (desktop):

```bash
brew tap filegap/filegap
brew install --cask filegap-desktop
brew upgrade --cask filegap-desktop
```

Website messaging for this channel should clearly state:

- `Developer Preview`
- community distribution channel
- possible macOS security prompts until signing/notarization is active

## Security and UX Caveat

These community artifacts are currently unsigned/non-notarized.

Implications for macOS users:

- Gatekeeper warnings are expected.
- This channel should not be presented as polished mainstream distribution.

## Next Upgrade Path

When Apple Developer Program is available:

1. Add `Developer ID` signing in release workflow.
2. Add Apple notarization + staple steps.
3. Mark desktop channel as official for broad distribution.
4. Use notarized `.dmg` as source for Homebrew Cask.
