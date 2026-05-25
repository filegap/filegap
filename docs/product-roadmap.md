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

## Current Tool Categories

### PDF Tools

- Merge PDFs
- Split PDFs
- Extract selected pages
- Reorder pages
- Optimize PDF structure
- Compress PDFs with local presets
- Convert PDF pages to images
- Extract embedded PDF images
- Inspect PDF metadata and structure through the CLI

### Workflow / Power User Tools

- Workflow Builder preview for linear tool chaining
- CLI pipe-first workflows
- Desktop app workflows with local file picker and save dialog

### Future Privacy Tools

- EXIF remover
- Screenshot anonymizer
- PDF redact
- Metadata cleanup for non-PDF file types where local parsing is practical

### Future Image Tools

- HEIC converter
- Local OCR for images and scanned documents
- Screenshot cleanup and export helpers

## Planned Tools

### EXIF Remover

Status: Planned

Why it matters:

- Photos often contain location, device, timestamp, and camera metadata.
- Removing metadata is a clear privacy utility that fits the local-first promise.
- The tool can be useful beyond PDF workflows without changing the product identity.

Risks / complexity:

- Metadata formats vary by image type.
- The UI must avoid exposing sensitive metadata values in logs or analytics.
- Output quality and color profile handling need careful validation.

Priority: High

### HEIC Converter

Status: Planned

Why it matters:

- HEIC is common on Apple devices but inconvenient in many workflows.
- Local conversion to JPEG or PNG is a practical utility for everyday file handling.
- This can introduce image-tool surface area without requiring accounts or uploads.

Risks / complexity:

- Browser support and decoding libraries need evaluation.
- Large images can be memory intensive.
- Conversion must preserve expected visual quality while keeping the UI simple.

Priority: Medium

### Screenshot Anonymizer

Status: Planned

Why it matters:

- Screenshots often contain names, emails, account details, messages, URLs, or internal data.
- A local blur/redaction flow supports sharing sensitive screenshots safely.
- This reinforces Filegap as a toolkit for sensitive files, not only PDF operations.

Risks / complexity:

- Automatic detection can miss sensitive content.
- Manual selection tools need to be precise and easy to review.
- The product must communicate that users remain responsible for final review.

Priority: Medium

### Local OCR

Status: Planned

Why it matters:

- OCR helps users extract text from scans, screenshots, and image-based PDFs.
- Local OCR keeps sensitive documents out of cloud OCR services.
- OCR can support future workflows such as search, copy text, and assisted redaction.

Risks / complexity:

- OCR engines can add bundle size and CPU cost.
- Accuracy varies by language, scan quality, and layout.
- Extracted text is sensitive and must not be logged, tracked, or sent off-device.

Priority: Medium

### PDF Redact

Status: Planned

Why it matters:

- Redaction is a high-trust PDF workflow for contracts, IDs, financial documents, and legal files.
- A local redaction tool aligns strongly with the product's privacy positioning.
- It expands Filegap from file transformation into sensitive-file preparation.

Risks / complexity:

- Redaction must remove underlying content, not only draw boxes over it.
- Text, images, annotations, embedded objects, and metadata require careful handling.
- Incorrect redaction can create serious user harm, so scope should be conservative.

Priority: High

## Homepage Evolution

The homepage should evolve from a PDF feature grid toward local-first toolkit positioning.

Direction:

- Lead with the broader promise: local-first tools for sensitive files.
- Keep PDF tools visible as the strongest current category.
- Group tools by user intent instead of listing every feature with equal weight.
- Make the privacy model clear without adding fear-based messaging.
- Show the Workflow Builder as a power-user capability, not a hidden secondary route.

Homepage priorities:

- Better categorization across PDF, privacy, image, and workflow tools
- Stronger trust communication around no uploads and no accounts
- Use-case orientation for documents, photos, screenshots, and sensitive sharing
- Clear current versus planned tool boundaries

## TODO

### Immediate

- [ ] Update homepage language from PDF-only positioning to local-first file toolkit positioning.
- [ ] Keep PDF tools as the primary available category.
- [ ] Add clear category labels for current and future tools.
- [ ] Surface Workflow Builder more clearly on the homepage.

### Next

- [ ] Define MVP scope for EXIF remover.
- [ ] Define MVP scope for PDF redact with explicit safety constraints.
- [ ] Evaluate local libraries for HEIC conversion and OCR.
- [ ] Add design patterns for non-PDF file tool pages.

### Later

- [ ] Expand image utilities once privacy and performance constraints are proven.
- [ ] Explore local OCR-assisted workflows.
- [ ] Revisit navigation around tool categories as the product grows.
- [ ] Keep documentation aligned as roadmap priorities change.
