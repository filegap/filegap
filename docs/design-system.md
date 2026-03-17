# Filegap Web Design System

## Brand Direction

Filegap should feel modern, product-oriented, and confident.
Visual direction is inspired by Gumroad-like bold accents while staying clean and task-focused.

## Design Tokens

## Colors

Primary:
- `#FF2E8B`

Accent:
- `#FFD93D`

Highlight:
- `#5A54FF`

Neutrals:
- Background: `#F7F7F8`
- Surface: `#FFFFFF`
- Text: `#111111`
- Muted Text: `#6B7280`
- Border: `#E5E7EB`

## Tailwind Theme Mapping

Define these tokens in `tailwind.config.ts`:

- `colors.brand.primary`
- `colors.brand.accent`
- `colors.brand.highlight`
- `colors.ui.bg`
- `colors.ui.surface`
- `colors.ui.text`
- `colors.ui.muted`
- `colors.ui.border`

## Typography

Font families:

- Heading: `Space Grotesk`
- Body: `Inter`

Type scale:

- `h1`: 48px
- `h2`: 36px
- `h3`: 28px
- `body`: 16px
- `small`: 14px

Line height:

- Base line-height: `1.5`

Weight guidance:

- Headings: 600 to 700
- Body: 400 to 500
- Action labels: 600

## Spacing System (8px Grid)

- `4`
- `8`
- `16`
- `24`
- `32`
- `48`
- `64`

Use scale consistently for:

1. Padding
2. Gaps
3. Margins
4. Section rhythm

## Radius, Shadow, Borders

Recommended defaults:

- Card radius: 16px
- Input/drop-zone radius: 14px
- Button radius: 12px
- Border width: 1px
- Border color: `ui.border`
- Shadow: subtle only (`sm`/`md`), avoid heavy layered shadows

## Interaction States

All interactive components must have:

1. Default
2. Hover
3. Focus-visible
4. Disabled
5. Loading (when applicable)

Focus style:

- 2px ring in `brand.highlight`
- High contrast against surface

## Motion

Motion should support usability, not decorate.

Use:

1. Drop zone highlight transitions (150-200ms)
2. Button state transitions (100-150ms)
3. Small reveal for file list insertions

Avoid:

1. Continuous animations near primary actions
2. Long transitions that block task completion

## Iconography

Use a single icon system across the web app:

1. Use `lucide-react` for all UI icons.
2. Avoid custom inline SVG icons in components/pages.
3. Keep icon stroke, sizing, and style consistent via Tailwind utility classes.

## Accessibility Baseline

1. Color contrast target: WCAG AA minimum.
2. Keyboard navigation for all controls.
3. Click targets at least 40x40.
4. Clear status messaging for processing and errors.

## Content Tone

Voice:

1. Direct
2. Reassuring
3. Privacy-forward

Example microcopy:

- "Processed locally in your browser."
- "No uploads. Your files never leave your device."
