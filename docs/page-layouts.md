# PDFlo Web Page Layouts

## Route Set (MVP)

1. `/merge-pdf`
2. `/split-pdf`
3. `/extract-pages`
4. `/reorder-pdf`

Each page must be standalone and complete for direct SEO entry.

## Universal Tool Page Template

Order of sections:

1. Hero:
- H1 with tool keyword
- 1-2 sentence value proposition
- privacy statement ("processed locally in your browser")

2. Tool Interface Card:
- Drop zone
- Tool-specific controls
- Primary action button
- Status/error area

3. How It Works:
- 3-4 short steps

4. Why PDFlo:
- privacy-first bullet points
- no upload reassurance

5. FAQ (short):
- 3-5 concise answers for common concerns

## Merge PDF Page

Main UI:

1. Drop zone accepting multiple PDFs
2. Uploaded files list
3. Reordering support for file order
4. Primary CTA: "Merge PDF"

Microcopy:

- "Combine multiple PDF files into a single document."

## Split PDF Page

Main UI:

1. Drop zone for one PDF
2. Mode controls:
- split every N pages
- split by ranges
3. Primary CTA: "Split PDF"

Microcopy:

- "Create multiple PDFs from one file, locally."

## Extract Pages Page

Main UI:

1. Drop zone for one PDF
2. Page range input (`1,3,5-8`)
3. Primary CTA: "Extract Pages"

Microcopy:

- "Keep only the pages you need."

## Reorder PDF Page

Main UI:

1. Drop zone for one PDF
2. Page order control (drag list or order input)
3. Primary CTA: "Reorder PDF"

Microcopy:

- "Rearrange pages in the exact order you want."

## Responsive Layout Guidance

Desktop:

1. Single centered column for focus.
2. Keep controls above the fold when possible.

Mobile:

1. Large touch-friendly drop zone.
2. Sticky primary action button only if content is long.
3. Avoid multi-column controls.

## UX Constraints

1. No modal-heavy flows.
2. Keep primary path under 4 interactions.
3. Preserve user-selected files during local validation errors.
4. Show success state with immediate download action.
