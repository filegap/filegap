# Desktop Distribution Roadmap

## Goal

Maximize distribution of the official desktop app while preserving the project's open-source and privacy-first positioning.

Strategic model:

- Open-source codebase and transparent development.
- Free official source access and community-oriented install paths.
- Paid convenience distribution on app stores (`4.99` lifetime target).
- Clear separation between "official signed build" and community forks.

This document focuses on desktop distribution, pricing, channel strategy, and the current implementation gap in this repository.

## Positioning

Recommended product message:

- Private PDF tools that run locally.
- No uploads.
- No subscription.
- Open source.
- Buy once on the store, or install from official community channels.

Recommended monetization model:

- GitHub Releases: free official binaries.
- Website download page: free official binaries.
- Homebrew Cask: free developer-friendly install path.
- Mac App Store / Microsoft Store: paid convenience distribution.
- In-app support CTA: optional and non-invasive.

Channel policy:

- Paid store builds should not show support or donation prompts.
- Free community builds may show a subtle support CTA.
- The product remains functionally the same across channels unless a store policy requires a narrow distribution-specific change.

What users pay for:

- easiest install path
- trusted signed distribution
- store-native updates
- support for continued development

What they do not pay for:

- access to the source code
- basic PDF functionality

## Channel Strategy

## Build Strategy

Recommended implementation model:

- one primary code branch
- one shared product codebase
- multiple distribution flavors at build time

Do not create separate long-lived `free` and `paid` branches for this.

Reason:

- the real difference is distribution and monetization context, not product behavior
- separate branches would create unnecessary merge overhead and UX drift

Recommended flavor model:

- `store`: paid convenience build, no support CTA
- `github`: free official build, support CTA allowed
- `homebrew`: free official build, support CTA allowed
- `dev`: local development build, support CTA optional

Recommended config surface:

- distribution channel
- official vs unofficial build
- support CTA enabled/disabled

This should be enforced through build-time configuration, not branching.

### 1. Official Website + GitHub Releases

Role:

- source of truth for official desktop binaries
- trust anchor for privacy-first messaging
- landing page that explains the difference between free and paid channels

Required messaging:

- official signed desktop builds available here
- app stores are the easiest paid install path
- GitHub/Homebrew remain available for community and developer users

### 2. Homebrew Cask

Role:

- developer distribution
- credibility in the OSS/macOS community
- lightweight install and upgrade path

Positioning:

- free convenience for technical users
- not a replacement for the store listing
- still official if sourced from the signed desktop artifact

Important rule:

- Homebrew for desktop should be a `cask`, not a formula compiled from source like the CLI.

### 3. App Stores

Role:

- discovery
- conversion from convenience buyers
- trust through platform review and billing

Recommended pricing:

- `4.99` one-time / lifetime

Recommended message:

- open source
- no subscription
- private local processing
- store purchase supports development

### 4. In-App Support CTA

Role:

- capture goodwill from users who installed via GitHub/Homebrew
- support the project without degrading UX

Recommended placement:

- Settings / About / Support section
- subtle footer or about entry

Recommended policy:

- show support CTA only in `github` and `homebrew` builds
- hide support CTA entirely in `store` builds
- never gate product functionality behind support prompts

Recommended copy:

- primary label: `Support Filegap`
- secondary copy: `Filegap is open source and privacy-first. If it saves you time, support development.`

Avoid the CTA label `Buy me a coffee` as the main in-app label. It is better as the destination or provider behind a more product-native `Support Filegap` entry.

Avoid:

- blocking dialogs
- repeated nags
- paywall-style prompts for core workflows

## Open Source Policy

Recommended policy:

- keep application code open source
- publish official signed builds from this repository
- define brand/trademark guidance for "official Filegap" naming and store listings

Practical implication:

- forks are allowed
- unofficial builds should not be presented as the official Filegap desktop app

This reduces confusion and protects the commercial value of the official distribution channels without weakening the OSS story.

## Roadmap

## Phase 1: Official Distribution Baseline

Goal:

- ship trustworthy official desktop binaries outside the stores

Tasks:

- document desktop installation in `README.md`
- define official desktop release flow in GitHub Actions
- build signed desktop artifacts for macOS and Windows
- publish release notes and downloadable binaries on GitHub Releases
- add a dedicated website/download message for desktop

Exit criteria:

- a user can install the official desktop app without cloning the repo
- release output is repeatable and documented

## Phase 2: Homebrew Cask

Goal:

- make macOS desktop install one command away for developer users

Tasks:

- create/update a separate Homebrew cask tap for the desktop app
- package the signed `.dmg`
- automate cask version + SHA updates from tagged releases
- document `brew install --cask ...` in the README/site

Exit criteria:

- a tagged desktop release updates the Homebrew cask without manual drift

## Phase 3: Store Readiness

Goal:

- make the desktop app acceptable for paid store distribution

Tasks:

- add About / Support / Version surface inside settings
- define build flavor policy (`store`, `github`, `homebrew`, `dev`)
- add privacy page / support links appropriate for store review
- prepare screenshots, app description, and listing copy
- review platform compliance for local file access and exported files
- decide official support policy and contact channel

Exit criteria:

- app metadata and UX are ready for review submission
- store listing assets exist and are versioned or documented

## Phase 4: Paid Distribution Launch

Goal:

- launch paid convenience distribution without harming OSS adoption

Tasks:

- publish on Mac App Store and/or Microsoft Store
- keep GitHub Releases and Homebrew available
- add "Why is the store version paid if the app is open source?" FAQ on the site/docs
- add subtle in-app support CTA for non-store builds only

Exit criteria:

- pricing is understandable
- no conflict between open-source positioning and paid distribution

## Phase 5: Post-Launch Optimization

Goal:

- improve conversion, trust, and retention

Tasks:

- add release notes discipline
- track high-level, anonymous channel metrics only
- test listing copy and screenshot variants
- monitor review feedback and support requests
- refine the site messaging around privacy, OSS, and paid convenience

Exit criteria:

- channel performance can be compared without violating privacy rules

## Current Repository Status

This section reflects the current codebase state as of `2026-03-28`.

## Implemented Update (2026-03-30)

Completed in desktop app:

- Added distribution-channel config in [`apps/desktop/src/lib/distribution.ts`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/lib/distribution.ts) with `store|github|homebrew|dev`.
- Added support CTA visibility gating: hidden for `store`, visible for community channels.
- Added support section in settings UI with:
  - section title `Support Filegap`
  - CTA button `Buy me a coffee`
  - static support URL with privacy-safe UTM params (`utm_source=filegap-desktop`, `utm_medium=app`, `utm_campaign=support_cta`)
- Added external URL opener helper in [`apps/desktop/src/lib/desktop.ts`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/lib/desktop.ts).
- Enabled URL opening permissions in desktop capability:
  - [`apps/desktop/src-tauri/capabilities/default.json`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src-tauri/capabilities/default.json)
  - [`apps/desktop/src-tauri/gen/schemas/capabilities.json`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src-tauri/gen/schemas/capabilities.json)

### Already in place

- Desktop app exists as a Tauri application with bundling enabled in [`apps/desktop/src-tauri/tauri.conf.json`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src-tauri/tauri.conf.json).
- Desktop build scripts already exist in [`apps/desktop/package.json`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/package.json) via `tauri:dev` and `tauri:build`.
- Desktop CI validation exists in [`.github/workflows/ci.yml`](/Users/ste/Workspace/wLabs/prj/pdflo/.github/workflows/ci.yml) for `npm run build` and `npm run test`.
- The app already has generated icons for desktop/store-related targets under [`apps/desktop/src-tauri/icons`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src-tauri/icons).
- Settings infrastructure already exists in [`apps/desktop/src/components/ui/SettingsModal.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/components/ui/SettingsModal.tsx), which is the right place for a future Support/About section.
- The repository already uses a release-driven Homebrew automation pattern for the CLI in [`.github/workflows/update-homebrew-formula.yml`](/Users/ste/Workspace/wLabs/prj/pdflo/.github/workflows/update-homebrew-formula.yml).
- The current repository is already well positioned for a single-branch strategy because there is no existing `free` vs `paid` divergence in desktop features.

### Gaps vs roadmap

#### Phase 1 gaps

- No documented desktop install path in [`README.md`](/Users/ste/Workspace/wLabs/prj/pdflo/README.md) beyond local development.
- No GitHub Actions workflow that builds and publishes desktop release artifacts on tags.
- No documented signing or notarization process for desktop builds.
- `createUpdaterArtifacts` is disabled in [`apps/desktop/src-tauri/tauri.conf.json`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src-tauri/tauri.conf.json#L27), and there is no updater/release channel strategy yet.

#### Phase 2 gaps

- Homebrew automation currently exists only for the CLI formula, not a desktop cask.
- No desktop `.dmg`/cask release workflow is present in `.github/workflows`.
- No README or docs entry describing desktop Homebrew install.

#### Phase 3 gaps

- No About / Version surface yet in [`SettingsModal.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/components/ui/SettingsModal.tsx) (support section exists, but versioning/support policy links are still missing).
- No in-app links yet for website, privacy policy, release notes, or support policy page.
- No store-listing assets or store submission checklist exist in `docs/`.

#### Phase 4 gaps

- No store-specific build or submission workflow is present.
- No FAQ or policy doc explains the OSS + paid-store model.
- No distinction is documented between official signed builds and community forks.

#### Phase 5 gaps

- No explicit desktop distribution metrics plan is documented yet.
- No release-note template or distribution post-launch checklist exists for desktop.

## Recommended Next 3 Tasks

If execution starts now, the highest-leverage next steps are:

1. Add a desktop release workflow that produces official tagged artifacts on GitHub.
2. Add a desktop Homebrew Cask workflow driven from tagged desktop releases (`.dmg` + SHA automation).
3. Extend settings with an About / Version area (app version, release notes, website/privacy links) to complete store-readiness metadata.
