# Filegap UI Components and Patterns

## Purpose

This document defines the shared UI primitives and product patterns that should be reused across Filegap.

The goal is to stop recreating the same element in slightly different ways on every page or screen.

For foundations and token rules, see:

- [`docs/design-system.md`](/Users/ste/Workspace/wLabs/prj/pdflo/docs/design-system.md)

## Taxonomy

We use two categories:

1. Primitives: low-level reusable UI building blocks.
2. Product patterns: composed UI structures that represent recurring Filegap flows.

Use the right category. Not every repeated piece should become a primitive.

## Primitives

## `Button`

Purpose:

- Trigger primary, secondary, and utility actions.

Approved variants:

1. `primary`
2. `secondary`
3. `ghost`
4. `link` when the action should remain text-forward

Rules:

1. Primary buttons use accent fill.
2. Secondary buttons use neutral border and neutral surface.
3. Ghost buttons stay low emphasis.
4. Loading states must preserve layout and label clarity.
5. Hover states should feel calm, not flashy.

Current implementation note:

- Web primitive lives in [`apps/web/src/components/ui/Button.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/web/src/components/ui/Button.tsx)
- Desktop primitive lives in [`apps/desktop/src/components/ui/Button.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/components/ui/Button.tsx)

The web primitive now exposes a shared `buttonStyles(...)` helper so anchors and buttons can use the same official variants instead of duplicating long class strings in pages.
The desktop primitive now exposes a parallel `buttonClassName(...)` helper so desktop buttons can use the same variant logic without repeating class combinations.

## `Card`

Purpose:

- Provide a surface for grouped content or grouped interactions.

Approved usages:

1. Content card
2. Interactive card
3. Result/success card

Rules:

1. Use `ui.surface` background.
2. Use shared border and radius tokens.
3. Use subtle rest shadow only.
4. Interactive cards should signal hover via lift, shadow, and/or soft border shifts, not saturated fills.

Current implementation note:

- Web primitive lives in [`apps/web/src/components/ui/Card.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/web/src/components/ui/Card.tsx)
- Desktop primitive wrapper lives in [`apps/desktop/src/components/ui/Card.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/components/ui/Card.tsx)

The web primitive now exposes a shared `cardStyles(...)` helper with `default`, `interactive`, and `interactive-subtle` variants.
The desktop primitive now exposes `cardClassName(...)` with `default`, `subtle`, and `result` variants.

## `Pill` / `Badge`

Purpose:

- Surface small, supporting metadata or trust messaging.

Current recurring examples:

1. Trust pill
2. Small metadata badge
3. Secondary label badge

Rules:

1. Pills must stay visually secondary.
2. Trust pills should be compact and not repeated aggressively near identical copy.
3. Avoid treating pills as large callout banners.

## `SectionHeader`

Purpose:

- Provide a consistent section title block for editorial/supporting content.

Rules:

1. Heading sits outside the content box.
2. Optional intro/subtitle may appear under the title.
3. Spacing between header and content should be consistent across pages.

Current implementation note:

- Web section pattern lives in [`apps/web/src/components/layout/SectionBlock.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/web/src/components/layout/SectionBlock.tsx)
- It now composes the shared `Card` primitive instead of duplicating the same surface classes inline.

## `ToolHero`

Purpose:

- Standardize the title, description, and trust cue at the top of tool pages.

Rules:

1. Keep the hero concise and operational.
2. Trust messaging sits between description and the first interaction surface.
3. Do not turn tool heroes into marketing banners.

Current implementation note:

- Web pattern lives in [`apps/web/src/components/layout/ToolHero.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/web/src/components/layout/ToolHero.tsx)
- [`ToolLayout.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/web/src/components/layout/ToolLayout.tsx) now composes `ToolHero`.
- Desktop tool shell now composes its own shared header pattern in [`apps/desktop/src/components/layout/ToolHeader.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/components/layout/ToolHeader.tsx) via [`apps/desktop/src/components/layout/ToolLayout.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/components/layout/ToolLayout.tsx).

## `IconButton`

Purpose:

- Compact utility actions such as remove, replace, settings, or close.

Rules:

1. Must have a visible hover state.
2. Must have accessible labeling.
3. Keep icon size and hit target consistent.

## `Input`

Purpose:

- Capture ranges, page orders, file settings, and similar structured input.

Rules:

1. Neutral surface and border by default.
2. Accent is reserved for focus and validation cues.
3. Inline validation beats detached error banners whenever possible.

## `StatusMessage`

Purpose:

- Communicate info, success, and error states.

Rules:

1. Messages must remain generic and privacy-safe.
2. Use consistent tone and visual treatment across web and desktop.
3. Success and error styling should not look like marketing banners.

## Product Patterns

## `ToolHero`

Current shared behavior:

1. Main title
2. Description
3. Compact trust cue
4. Tool interaction starts immediately below

Rules:

1. The hero remains concise and tool-first.
2. Trust messaging should appear before file interaction begins.
3. Avoid stacking multiple repetitive privacy messages in the same block.

## `ToolInteractionCard`

Purpose:

- Main working surface for a tool.

Contains combinations of:

1. Drop zone
2. File list/table
3. Tool-specific controls
4. Primary action
5. Result state

Rules:

1. Keep the card visually stable while state changes.
2. Do not introduce marketing styling into operational surfaces.

Current implementation note:

- Web wrapper lives in [`apps/web/src/components/layout/ToolActionCard.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/web/src/components/layout/ToolActionCard.tsx)
- Single-file tool pages reuse [`FileSelectionSummary.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/web/src/components/ui/FileSelectionSummary.tsx) for the collapsed file state instead of repeating inline markup.
- Desktop sidebar panels now share reusable sidebar composition primitives in [`apps/desktop/src/components/ui/SidebarSection.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/components/ui/SidebarSection.tsx), [`apps/desktop/src/components/ui/OutputDestinationField.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/components/ui/OutputDestinationField.tsx), and [`apps/desktop/src/components/ui/OutputActionSection.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/components/ui/OutputActionSection.tsx).

## `ToolCard`

Purpose:

- Homepage or index navigation card for a PDF tool.

Content:

1. Tool icon
2. Tool name
3. One short description
4. Integrated CTA treatment

Rules:

1. Entire card is clickable.
2. Hover state should feel premium and restrained.
3. Inner CTA must feel integrated with the card, not like a competing button.
4. Brand accent is used sparingly.

## `SecondaryPromoCard`

Purpose:

- Lower-priority cards such as CLI and desktop app promotion.

Rules:

1. Must remain visually quieter than tool cards.
2. Hover intensity should be softer than tool cards.
3. Secondary action treatment should remain neutral and low-noise.

## `EditorialSection`

Purpose:

- Supporting content blocks such as FAQ, Why Filegap, and explanatory sections.

Rules:

1. Use section header outside the box.
2. Keep content scannable.
3. Avoid mixing editorial sections with high-intensity CTA styling.

## `ResultState`

Purpose:

- Confirm completion and expose next actions.

Rules:

1. Make the success state clear.
2. Keep actions obvious and limited.
3. Visual treatment should support confidence without looking celebratory or noisy.

Current implementation note:

- Desktop uses [`apps/desktop/src/components/ui/ResultStateBlock.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/components/ui/ResultStateBlock.tsx), now aligned to the shared `Card` primitive instead of standalone success styling.

## Platform Guidance

## Shared between web and desktop

These should feel materially the same:

1. Colors and semantic token meaning
2. Typography hierarchy
3. Button variants
4. Card behavior
5. Hover/focus philosophy
6. Trust treatment
7. Motion timing

## Allowed to differ by platform

These may adapt to platform constraints:

1. Overall density
2. Navigation shell
3. Sidebar vs stacked layout
4. Footer/status placement
5. Modal sizing

## Decision Rules

When adding or changing UI:

1. Check whether the element is a primitive or a pattern.
2. Reuse an existing primitive/pattern if possible.
3. If a new variant is truly needed, document it here.
4. If the change affects shared visual language, update [`docs/design-system.md`](/Users/ste/Workspace/wLabs/prj/pdflo/docs/design-system.md) too.

The system should stay small, explicit, and reusable. If it starts collecting one-off exceptions, it is no longer doing its job.
