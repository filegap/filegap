# Filegap Web SEO Guidelines

## SEO Objective

Each tool page must work as both:

1. Functional web app
2. Search landing page for a specific keyword intent

## Primary Keywords

1. `merge pdf`
2. `split pdf`
3. `extract pdf pages`
4. `reorder pdf pages`
5. `compress pdf`
6. `pdf to images`

## Route-to-Keyword Mapping

1. `/merge-pdf` -> merge pdf
2. `/split-pdf` -> split pdf
3. `/extract-specific-pages-from-pdf` -> extract specific pdf pages
4. `/reorder-pdf-pages` -> reorder pdf pages
5. `/optimize-pdf` -> optimize pdf
6. `/compress-pdf` -> compress pdf
7. `/pdf-to-images` -> pdf to images

Legacy routes `/extract-pages` and `/reorder-pdf` remain compatibility routes. Sitemap,
navigation, and new internal links should use the canonical slugs above.

## Intent-Specific SEO Routes

The web app also exposes intent-specific landing/tool routes that reuse the same working
tool components and keep the tool above the fold:

1. `/split-pdf-into-individual-pages`
2. `/split-pdf-by-page-ranges`
3. `/split-pdf-without-uploading`
4. `/split-large-pdf`
5. `/merge-pdf-without-uploading`
6. `/combine-pdf-files`
7. `/extract-specific-pages-from-pdf`
8. `/save-single-pages-from-pdf`
9. `/organize-pdf-pages`
10. `/compress-pdf-to-100kb`
11. `/compress-pdf-to-200kb`
12. `/compress-pdf-for-email`
13. `/compress-pdf-without-uploading`
14. `/offline-pdf-tools`

Indexing strategy:

- Primary indexed pages:
  - `/split-pdf-by-page-ranges`
  - `/split-large-pdf`
  - `/merge-pdf-without-uploading`
  - `/extract-specific-pages-from-pdf`
  - `/reorder-pdf-pages`
  - `/compress-pdf-to-100kb`
  - `/compress-pdf-to-200kb`
  - `/compress-pdf-for-email`
  - `/compress-pdf-without-uploading`
  - `/offline-pdf-tools`
- Redundant support pages stay accessible and internally linked, but use `noindex,follow`
  and canonicalize to their primary equivalent:
  - `/split-pdf-into-individual-pages` -> `/split-pdf-by-page-ranges`
  - `/split-pdf-without-uploading` -> `/split-pdf-by-page-ranges`
  - `/combine-pdf-files` -> `/merge-pdf-without-uploading`
  - `/extract-pages-from-pdf` -> `/extract-specific-pages-from-pdf`
  - `/save-single-pages-from-pdf` -> `/extract-specific-pages-from-pdf`
  - `/organize-pdf-pages` -> `/reorder-pdf-pages`

For target-size compression pages, do not promise exact output sizes unless target-size
compression exists. The current web flow may preselect the strongest local preset and must
state that exact 100KB or 200KB output is not guaranteed.

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
- Why Filegap
- FAQ
- Related tools

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

- `Merge PDF Online (No Upload) | Filegap`
- `Split PDF in Browser | Filegap`
- `Extract PDF Pages Locally | Filegap`
- `Reorder PDF Pages Online | Filegap`

Meta description pattern:

- "Use Filegap to [action] directly in your browser. No uploads, no server processing. Your files never leave your device."

## Internal Linking

Each tool page should link to:

1. The other 3 MVP tools
2. A privacy-focused page/section
3. Project open-source repository

## Technical SEO Requirements

1. SSR is optional, but page metadata must be crawlable.
2. Generate sitemap including all tool routes.
3. Canonical URL per tool page.
4. `noindex,follow` only on intentionally redundant support pages.
5. JSON-LD should use page-specific `SoftwareApplication`, `FAQPage`, and `BreadcrumbList`
   data where a landing page has FAQ content.
6. Fast performance:
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
