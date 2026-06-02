# Roadmap

This is the technical roadmap for the repository. Product direction and non-PDF expansion live in [`docs/product-roadmap.md`](/Users/ste/Workspace/wLabs/prj/pdflo/docs/product-roadmap.md).

Status snapshot: 2026-06-02.

## Completed Baseline

### v0.1

- Rust workspace bootstrap.
- Core operations implemented: `merge`, `extract`, `split`, `reorder`.
- CLI commands implemented: `merge`, `extract`, `split`, `reorder`, `info`.
- Automated tests for core and CLI integration.
- Web app scaffold with React, Vite, and worker-backed local PDF processing.
- Desktop MVP scaffold with Tauri, React, home route, and merge flow wired to `filegap_core`.

### Delivered After v0.1

- Core and CLI `optimize` operation.
- Core and CLI `compress` operation with `low`, `balanced`, and `strong` presets.
- Core and CLI `extract-images` operation for supported embedded image streams.
- Web operations expanded to `merge`, `split`, `extract`, `reorder`, `optimize`, `compress`, `PDF to Images`, and `Extract Images`.
- Desktop operations expanded to `merge`, `split`, `extract`, `reorder`, `optimize`, `compress`, `PDF to Images`, and `Extract Images`.
- Workflow Builder preview added on web and desktop for linear local workflows.
- Workflow Builder terminal ZIP outputs added for image-producing terminal steps.
- CLI pipe-first examples and command docs updated.
- Shared design tokens and reusable web/desktop UI foundations introduced.
- Web SEO landing routes, `/offline-pdf-tools`, `/download`, privacy, and terms surfaces added.
- Desktop output settings, support/About surface, and distribution channel gating added.
- CLI Homebrew automation and install docs added.
- Desktop community release workflow, GitHub Release artifact publishing, and Homebrew Cask update path added.
- CI validates Rust workspace, web build/test, and desktop build/test.
- CodeQL workflow added for repository security scanning.

## Active Technical Roadmap

### Documentation and Positioning Alignment

Status: Active

- Update homepage copy and navigation to match the broader local-first sensitive-file positioning.
- Keep PDF tools clearly marked as shipped.
- Keep planned privacy/image tools clearly marked as planned.
- Keep `README.md`, `docs/web.md`, `docs/desktop.md`, and roadmap docs aligned when tool status changes.

### Desktop Distribution Hardening

Status: Active

- Add Apple Developer signing and notarization for macOS desktop artifacts.
- Decide and document desktop update policy per channel.
- Keep Homebrew Cask as a community/developer channel until signed/notarized artifacts exist.
- Prepare app store submission assets, support policy, and compliance checklist.
- Add OSS + paid-store FAQ.

Reference: [`docs/desktop-distribution-roadmap.md`](/Users/ste/Workspace/wLabs/prj/pdflo/docs/desktop-distribution-roadmap.md).

### Desktop Metadata Inspection

Status: Candidate

- Add a desktop `info` route if metadata inspection should be available outside the CLI.
- Keep any metadata display local-only and avoid logging filenames, file paths, page counts, page ranges, or extracted content.

Note: CLI `info` is already implemented.

### Workflow Builder Maturity

Status: Candidate

- Clarify which workflow shapes execute and which are preview-only.
- Consider saved presets or reusable workflow templates after the V1 local chaining model stabilizes.
- Avoid branching/graph workflows until linear workflow constraints are proven useful.

### Compression Enhancements

Status: Candidate

- Add custom image quality and maximum dimension controls only if the preset model proves insufficient.
- Keep current presets as the default UX.
- Ensure any extra controls do not expose file metadata in logs or analytics.

## Product-Led Future Work

These items need product scope before implementation work starts.

- EXIF remover.
- PDF redact.
- HEIC converter.
- Screenshot anonymizer.
- Local OCR.
- Generic non-PDF metadata cleanup after EXIF remover proves the model.

See [`docs/product-roadmap.md`](/Users/ste/Workspace/wLabs/prj/pdflo/docs/product-roadmap.md) for priority, rationale, and risks.

## Not Active Right Now

These were previously listed as broad future ideas but are not active roadmap items today.

- Page rotation.
- Watermark.
- Full custom compression control surface beyond the current presets.
- Broad all-format metadata cleanup.
- Branching Workflow Builder graph.

They can return if they become part of a focused product scope.

## Current Gaps

- Homepage still reads primarily as a PDF product, while positioning docs describe a broader local-first sensitive-file toolkit.
- Desktop distribution is still a community preview until signing and notarization are implemented.
- Desktop app store readiness needs listing assets, support policy, review checklist, and channel-specific update policy.
- PDF redaction needs conservative safety requirements before implementation.
- EXIF remover, HEIC conversion, screenshot anonymization, and local OCR need library and performance evaluation.
- `docs/desktop.md` still mentions desktop `info` as a next step; keep or remove that depending on whether desktop metadata inspection remains desired.
