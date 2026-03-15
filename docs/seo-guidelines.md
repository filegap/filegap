# PDFlo Web SEO Guidelines

## SEO Objective

Each tool page must work as both:

1. Functional web app
2. Search landing page for a specific keyword intent

## Primary Keywords

1. `merge pdf`
2. `split pdf`
3. `extract pdf pages`
4. `reorder pdf pages`

## Route-to-Keyword Mapping

1. `/merge-pdf` -> merge pdf
2. `/split-pdf` -> split pdf
3. `/extract-pages` -> extract pdf pages
4. `/reorder-pdf` -> reorder pdf pages

## On-Page Structure Requirements

For each tool route:

1. Unique `<title>` containing the primary keyword.
2. Meta description with:
- keyword
- local processing message
- no-upload privacy message

3. Single H1 with exact tool intent.
4. Intro paragraph (2-3 lines max).
5. Tool interface above the fold.
6. Supporting content blocks:
- How it works
- Why PDFlo
- FAQ

## Content Rules

1. Keep copy practical and concise.
2. Mention privacy value naturally (not keyword stuffing).
3. Use clear verbs aligned with user intent:
- merge, split, extract, reorder

4. Add trust signals:
- open source
- local processing
- no file uploads

## Metadata Template

Per-page title pattern:

- `Merge PDF Online (No Upload) | PDFlo`
- `Split PDF in Browser | PDFlo`
- `Extract PDF Pages Locally | PDFlo`
- `Reorder PDF Pages Online | PDFlo`

Meta description pattern:

- "Use PDFlo to [action] directly in your browser. No uploads, no server processing. Your files never leave your device."

## Internal Linking

Each tool page should link to:

1. The other 3 MVP tools
2. A privacy-focused page/section
3. Project open-source repository

## Technical SEO Requirements

1. SSR is optional, but page metadata must be crawlable.
2. Generate sitemap including all tool routes.
3. Canonical URL per tool page.
4. Fast performance:
- small JS bundles where possible
- lazy load non-critical sections

5. Core Web Vitals awareness:
- prioritize LCP for tool page hero and drop zone.

## Structured Data (Optional but Recommended)

Use schema markup where appropriate:

1. `SoftwareApplication`
2. `FAQPage`
3. `BreadcrumbList`

## Measurement Rules

Track SEO performance without violating privacy:

1. Measure page-level visits and conversions (download clicks).
2. Never collect file content or extracted text.
3. Avoid query/event payloads that may leak document metadata.
