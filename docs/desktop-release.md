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

Current artifacts:

- `.dmg`
- `.app.tar.gz`
- `.app.tar.gz.sig` (when produced by Tauri bundling)

## Tag Convention

Use desktop-specific tags to avoid collisions with CLI-only release automation:

- example: `desktop-v0.1.1`

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
