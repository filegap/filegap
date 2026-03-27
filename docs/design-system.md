# Filegap Design System

## Purpose

Filegap needs one visual language across web and desktop so that:

1. New UI work starts from shared rules, not fresh taste decisions.
2. Colors, borders, spacing, and motion do not drift over time.
3. Web and desktop feel like the same product family without forcing identical layouts.

This document is the design-system source of truth for foundations, primitives, patterns, and usage rules.

## Source of Truth

Shared design foundations now live in:

- [`shared/design/tokens.css`](/Users/ste/Workspace/wLabs/prj/pdflo/shared/design/tokens.css)

These tokens are consumed by:

- Web Tailwind theme: [`apps/web/tailwind.config.ts`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/web/tailwind.config.ts)
- Web global styles: [`apps/web/src/styles.css`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/web/src/styles.css)
- Desktop global styles: [`apps/desktop/src/styles.css`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/styles.css)

Rule:

1. New shared colors must be added to `shared/design/tokens.css` first.
2. Web and desktop must consume those tokens, not hardcoded duplicate hex values.
3. Avoid introducing ad hoc palette variants unless a semantic reason exists.

## Product Principles

The Filegap design system is built around five product principles:

1. Privacy-first: UI must feel safe, calm, and trustworthy.
2. Tool-first: primary user intent is completing a PDF task quickly.
3. Calm confidence: avoid loud marketing patterns, decorative motion, and heavy visual effects.
4. Fast scanning: hierarchy must be understandable in a few seconds.
5. Shared feel, native fit: web and desktop share the same design DNA while keeping platform-appropriate layout density.

## Foundations

## Color Tokens

Semantic color tokens are preferred over direct brand or utility names.

Core surfaces:

- `--color-bg-canvas`
- `--color-bg-surface`
- `--color-bg-subtle`

Core text:

- `--color-text-primary`
- `--color-text-secondary`

Core borders:

- `--color-border-default`
- `--color-border-strong`

Accent and trust:

- `--color-accent-primary`
- `--color-accent-primary-hover`
- `--color-accent-soft`
- `--color-trust-primary`
- `--color-trust-soft`
- `--color-trust-border`

Status:

- `--color-status-success`
- `--color-status-warning`
- `--color-status-error`

Usage rules:

1. Brand pink is reserved for primary actions, key icons, selected states, and small accents.
2. Neutral surfaces remain dominant.
3. Avoid large hover surfaces filled with saturated brand colors.
4. Trust blue is reserved for trust cues, not generic secondary actions.

## Typography

Filegap uses:

- Heading font: `Space Grotesk`
- Body font: `Inter`

Guidance:

1. Headings: 600-700 weight.
2. Body copy: 400-500 weight.
3. Action labels: 600 weight.
4. Keep line lengths moderate for scanning and readability.

Recommended hierarchy:

1. Hero / page H1
2. Section H2
3. Card titles / H3
4. Body
5. Meta / small

## Spacing

Filegap uses an 8px rhythm.

Base spacing scale:

- `4px`
- `8px`
- `16px`
- `24px`
- `32px`
- `48px`
- `64px`

Rules:

1. Section rhythm must be deliberate and repeatable.
2. Use consistent stack spacing inside cards.
3. Avoid one-off spacing values unless there is a specific interaction reason.

## Radius

Shared radius tokens:

- `--radius-sm`: `8px`
- `--radius-md`: `12px`
- `--radius-lg`: `16px`
- `--radius-xl`: `20px`

Default guidance:

1. Buttons: medium radius.
2. Cards: large radius.
3. Overlay/modals: large or extra-large radius.

## Shadows

Shared shadow tokens:

- `--shadow-rest`
- `--shadow-hover-soft`
- `--shadow-hover`
- `--shadow-overlay`

Rules:

1. Rest shadows stay nearly invisible.
2. Hover shadows communicate interactivity, not drama.
3. Overlays use the strongest shadow token.
4. Avoid stacking multiple shadow treatments on the same element unless intentional.

## Motion

Shared motion tokens:

- `--motion-fast`
- `--motion-base`
- `--motion-slow`
- `--motion-ease`

Rules:

1. Motion supports affordance and hierarchy.
2. Default interaction timing: 150-200ms.
3. Use `ease-out` for hover and micro-interactions.
4. Avoid bounce, overshoot, and decorative motion near primary workflows.

## Iconography

Use `lucide-react` for product UI icons across web and desktop.

Rules:

1. Keep icon sizing consistent per context.
2. Icons support labels, never replace clarity.
3. Color emphasis should stay subtle unless the icon represents a primary action or a trust cue.

## Accessibility Baseline

Every shared component and pattern must satisfy:

1. WCAG AA minimum contrast.
2. Keyboard navigability.
3. Clear focus-visible state.
4. Adequate hit targets.
5. Generic, privacy-safe status and error messaging.

## System Layers

The design system is split into four layers:

1. Foundations: tokens and visual rules.
2. Primitives: reusable UI building blocks.
3. Product patterns: composed layouts and behaviors used repeatedly in Filegap.
4. Features: tool-specific implementations built on top of patterns.

Do not blur these layers unnecessarily.

## Shared Primitives

Current primitive set should converge around:

1. `Button`
2. `Card`
3. `Badge` / `Pill`
4. `SectionHeader`
5. `IconButton`
6. `StatusMessage`
7. `Input`

Shared primitive rules:

1. Variants must be intentional and limited.
2. Each primitive must define default, hover, focus-visible, disabled, and where relevant loading states.
3. A new primitive should only be introduced when an existing one cannot express the need cleanly.

## Product Patterns

Patterns already visible in the product:

1. Tool hero
2. Tool interaction card
3. Tool card
4. Secondary promo card
5. Editorial section with heading outside the content box
6. Trust pill
7. Completion/result block

Patterns should be documented and reused as patterns, not rebuilt each time with one-off classes.

Current web rollout:

1. `ToolHero`: [`apps/web/src/components/layout/ToolHero.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/web/src/components/layout/ToolHero.tsx)
2. `ToolActionCard`: [`apps/web/src/components/layout/ToolActionCard.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/web/src/components/layout/ToolActionCard.tsx)
3. `FileSelectionSummary`: [`apps/web/src/components/ui/FileSelectionSummary.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/web/src/components/ui/FileSelectionSummary.tsx)

Current desktop rollout:

1. `ToolHeader`: [`apps/desktop/src/components/layout/ToolHeader.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/components/layout/ToolHeader.tsx)
2. `Button` / `buttonClassName(...)`: [`apps/desktop/src/components/ui/Button.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/components/ui/Button.tsx)
3. `Card` / `cardClassName(...)`: [`apps/desktop/src/components/ui/Card.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/components/ui/Card.tsx)
4. `ResultStateBlock`: [`apps/desktop/src/components/ui/ResultStateBlock.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/components/ui/ResultStateBlock.tsx)
5. Sidebar composition patterns:
   - [`apps/desktop/src/components/ui/SidebarSection.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/components/ui/SidebarSection.tsx)
   - [`apps/desktop/src/components/ui/OutputDestinationField.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/components/ui/OutputDestinationField.tsx)
   - [`apps/desktop/src/components/ui/OutputActionSection.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/components/ui/OutputActionSection.tsx)
6. Single-file workspace patterns:
   - [`apps/desktop/src/components/ui/SingleFilePicker.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/components/ui/SingleFilePicker.tsx)
   - [`apps/desktop/src/components/ui/WorkingFileHeader.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/components/ui/WorkingFileHeader.tsx)
   - [`apps/desktop/src/components/ui/WorkspaceEmptyState.tsx`](/Users/ste/Workspace/wLabs/prj/pdflo/apps/desktop/src/components/ui/WorkspaceEmptyState.tsx)

## Visual Hierarchy Rules

Hierarchy should remain stable across web and desktop:

1. Primary actions use accent fill.
2. Secondary actions use neutral borders and surfaces.
3. Interactive cards use neutral hover states first, accent states only when semantically necessary.
4. Trust cues stay compact and non-repetitive.
5. Supporting promotional cards must never compete with tool cards.

## Governance Rules

To avoid design drift:

1. No new shared color may bypass `shared/design/tokens.css`.
2. No component should introduce a slightly different border gray, pink hover, or shadow “just for this page”.
3. If a UI pattern appears in three or more places, it must be documented and named.
4. If a new variant is proposed, document why the existing variants are insufficient.
5. Prefer consistency over novelty.

## Documentation Workflow

Whenever shared UI behavior changes:

1. Update this document if foundations or rules changed.
2. Update [`docs/ui-components.md`](/Users/ste/Workspace/wLabs/prj/pdflo/docs/ui-components.md) if primitives or patterns changed.
3. Update relevant product docs such as [`docs/web.md`](/Users/ste/Workspace/wLabs/prj/pdflo/docs/web.md) or [`docs/desktop.md`](/Users/ste/Workspace/wLabs/prj/pdflo/docs/desktop.md) when implementation details or platform usage change.

## Immediate Rollout Priorities

Recommended next rollout order:

1. Standardize web primitives (`Button`, `Card`, `SectionHeader`, `Pill`).
2. Align desktop primitives to the same token foundation.
3. Convert repeated tool-page patterns to named reusable patterns.
4. Remove remaining hardcoded visual values that duplicate token meanings.

The goal is not a large framework. The goal is a small, disciplined system that keeps Filegap coherent as it grows.
