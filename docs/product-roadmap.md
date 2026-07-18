# Product Roadmap

## Vision

Filegap started as a privacy-first PDF toolkit. The product direction is to become a broader local-first toolkit for sensitive files.

The core promise stays the same: files are processed on the user's device, without uploads, accounts, or server-side inspection. The tool surface can expand beyond PDFs when the new utility fits that promise and keeps the product fast, lightweight, and trustworthy.

Target direction:

- From PDF utilities
- To local-first file utilities
- For sensitive documents, images, screenshots, and everyday file cleanup

## Core Principles

1. Local processing only: file content must stay on the user's device.
2. No uploads: tools must not send user files to a backend for processing.
3. No account required: core utilities should work without sign-in.
4. Privacy-first: privacy is a product constraint, not a marketing layer.
5. Fast and lightweight: tools should load quickly and complete focused tasks without heavy setup.
6. Minimal and trustworthy UX: interfaces should be clear, calm, and direct.

## Current Status

This snapshot reflects the repository state as of 2026-06-02.

### Shipped PDF Tools

- Merge PDFs across web, CLI, and desktop.
- Split PDFs across web, CLI, and desktop.
- Extract selected pages across web, CLI, and desktop.
- Reorder pages across web, CLI, and desktop.
- Optimize PDF structure across web, CLI, and desktop.
- Compress PDFs locally with `low`, `balanced`, and `strong` presets across web, CLI, and desktop.
- Convert PDF pages to JPEG/PNG images in web and desktop.
- Extract supported embedded PDF images in web, CLI, and desktop.
- Inspect PDF metadata and structure through the CLI `info` command.

### Shipped Workflow / Power User Surface

- Workflow Builder preview exists on web and desktop for linear local chaining.
- Workflow Builder supports `merge`, `extract`, `reorder`, `optimize`, `compress`, `split`, `PDF to Images`, and `Extract Images` steps.
- CLI supports pipe-first workflows for implemented structure operations.
- Desktop supports local file picker, save dialog, output settings, reveal/open actions, and community-channel support/About surfaces.

### Shipped Distribution / Trust Surface

- CLI Homebrew install and upgrade documentation is in place.
- Desktop community preview installation through Homebrew Cask is documented.
- Desktop community release workflow builds unsigned macOS artifacts and can update the Homebrew cask.
- Privacy, web architecture, desktop architecture, release, SEO, and design-system docs describe the local-only model and current implementation boundaries.

### Positioning Work Completed

- `docs/positioning.md` defines Filegap as a local-first toolkit for sensitive files.
- The web app includes an `/offline-pdf-tools` privacy/SEO hub.
- The desktop home groups current PDF tools by workflow intent; the web home exposes the shipped PDF tool grid but still needs the broader toolkit framing.

## Current Product Gap

The product implementation is still PDF-first even though the positioning has moved toward broader local-first sensitive-file utilities.

The main missing product work is not another PDF operation. It is making the broader toolkit direction visible without implying that unfinished non-PDF tools already exist.

## Roadmap Notes

The strategy is not to maximize the number of tools. Filegap should prioritize tools that strengthen privacy, local-first processing, trust, and sensitive file handling before expanding into more generic productivity utilities.

## Active Product Priorities

### 1. Homepage Evolution

Status: In progress / needs implementation

Goal:

- Move the public homepage from PDF-only positioning toward local-first sensitive-file toolkit positioning.
- Keep current PDF tools as the primary shipped category.
- Clearly separate available tools from planned privacy/image tools.
- Surface Workflow Builder as a power-user path, not just another card in the grid.

Why it matters:

- The repository already has broader positioning docs.
- Future non-PDF tools need a product frame before they are added.
- The homepage should avoid overpromising while still showing where Filegap is going.

### 2. Desktop Distribution Hardening

Status: Partially shipped / still active

Goal:

- Move desktop distribution from community preview toward trusted official distribution.
- Preserve the open-source model while supporting paid convenience channels.

Done:

- Community desktop release workflow.
- Homebrew Cask install/update documentation.
- Build flavor surface for `store`, `github`, `homebrew`, and `dev`.
- Support CTA gating for community versus store builds.

Still missing:

- Apple Developer signing and notarization.
- Store submission assets and checklist.
- Explicit support policy for paid store users versus community users.
- OSS + paid-store FAQ.
- Desktop update policy per distribution channel.

### 3. EXIF Remover

Status: Planned

Why it matters:

- Photos often contain location, device, timestamp, and camera metadata.
- Removing metadata is a clear privacy utility that fits the local-first promise.
- The tool expands Filegap beyond PDFs without changing the product identity.

MVP scope to define:

- Supported image formats.
- Metadata fields to remove.
- Color profile and output quality behavior.
- Browser versus desktop support expectations.

Priority: High

### 4. PDF Redact

Status: Planned, safety-sensitive

Why it matters:

- Redaction is a high-trust PDF workflow for contracts, IDs, financial documents, and legal files.
- A local redaction tool aligns strongly with the product's privacy positioning.
- It expands Filegap from file transformation into sensitive-file preparation.

MVP scope to define:

- Conservative supported PDF content types.
- Clear guarantee that redaction removes underlying content, not only overlays visual boxes.
- Explicit unsupported cases.
- Validation and warning UX.

Priority: High

### 5. HEIC Converter

Status: Planned

Why it matters:

- HEIC is common on Apple devices but inconvenient in many workflows.
- Local conversion to JPEG or PNG is a practical utility for everyday file handling.
- This can introduce image-tool surface area without requiring accounts or uploads.

MVP scope to define:

- Browser decoding feasibility.
- Desktop fallback expectations.
- Output format and quality defaults.
- Large-image memory limits.

Priority: Medium

### 6. Screenshot Anonymizer

Status: Planned

Why it matters:

- Screenshots often contain names, emails, account details, messages, URLs, or internal data.
- A local blur/redaction flow supports sharing sensitive screenshots safely.
- This reinforces Filegap as a toolkit for sensitive files, not only PDF operations.

MVP scope to define:

- Manual selection first.
- Optional assisted detection only after local OCR/detection feasibility is proven.
- Clear responsibility messaging before export.

Priority: Medium

### 7. Local OCR

Status: Research

Why it matters:

- OCR helps users extract text from scans, screenshots, and image-based PDFs.
- Local OCR keeps sensitive documents out of cloud OCR services.
- OCR can support future workflows such as search, copy text, and assisted redaction.

Risks:

- OCR engines can add bundle size and CPU cost.
- Accuracy varies by language, scan quality, and layout.
- Extracted text is sensitive and must not be logged, tracked, or sent off-device.

Priority: Medium

## Future Opportunities

These are not active roadmap items yet. They are future candidates that could fit the local-first sensitive-file direction if scoped carefully.

### File Sanitizer

Purpose:

- Remove metadata and hidden information from PDFs, images, and office documents.

Rationale:

- Natural extension of the privacy-first positioning.

Priority: Future candidate

### Image Compressor

Purpose:

- Compress images locally.

Rationale:

- High-utility file operation that fits local-first processing.

Priority: Future candidate

### PDF Password Tools

Purpose:

- Protect PDFs.
- Unlock PDFs.

Rationale:

- Useful PDF workflow, but lower strategic value than privacy-oriented features.

Priority: Future candidate

### Document Compare Tool

Purpose:

- Visually compare documents and PDFs.

Rationale:

- Interesting professional workflow, but not currently aligned with the highest-priority privacy direction.

Priority: Future candidate

### Signature / Scan Cleanup Tool

Purpose:

- Clean scanned documents and signatures.

Rationale:

- Potential future image/document utility.

Priority: Future candidate

## Parking Lot

These ideas are not active product roadmap items right now. They can be reconsidered after the local-first sensitive-file direction is clearer.

- Page rotation: useful PDF editing utility, but lower strategic value than privacy/image expansion.
- Watermark: common PDF feature, but not strongly tied to the privacy-first product wedge.
- Custom compression controls: useful power-user enhancement, but current presets already cover the main shipped compression story.
- Generic non-PDF metadata cleanup: promising, but should follow EXIF remover rather than start as a broad multi-format project.
- Full OCR-assisted automation: should wait until local OCR feasibility, privacy constraints, and UX review are proven.

## TODO

### Immediate

- [ ] Update homepage language from PDF-only positioning to local-first sensitive-file toolkit positioning.
- [ ] Keep shipped PDF tools as the primary available category.
- [ ] Add clear current/planned labels for PDF, privacy, image, and workflow categories.
- [ ] Surface Workflow Builder more clearly as a power-user capability.
- [ ] Keep desktop Homebrew messaging explicit about unsigned/non-notarized community preview status.

### Next

- [ ] Define MVP scope for EXIF remover.
- [ ] Define MVP scope for PDF redact with explicit safety constraints.
- [ ] Prepare desktop signing/notarization plan once Apple Developer credentials are available.
- [ ] Prepare store submission kit: screenshots, listing copy, privacy text, support policy, review checklist.
- [ ] Evaluate local libraries for HEIC conversion and OCR.

### Later

- [ ] Expand image utilities once privacy and performance constraints are proven.
- [ ] Explore local OCR-assisted workflows.
- [ ] Implement the deferred, opt-in desktop anonymous hello after the first successful operation, following [`anonymous-hello.md`](anonymous-hello.md) before introducing any endpoint or telemetry.
- [ ] Revisit navigation around tool categories as the product grows.
- [ ] Decide whether page rotation or watermarking should return to the active roadmap.
- [ ] Keep documentation aligned as roadmap priorities change.
