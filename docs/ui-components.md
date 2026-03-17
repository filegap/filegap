# Filegap Web UI Components

## Goal

Define a small reusable component set for all web tools.
Components should keep pages consistent and implementation fast.

## Core Components

## `PageContainer`

Purpose:
- Constrain width and establish vertical rhythm.

Rules:

1. Centered container with responsive max-width.
2. Top spacing optimized for immediate task visibility.
3. Standard section spacing using 8px scale.

## `ToolLayout`

Purpose:
- Shared structure across tool routes.

Includes:

1. Title block
2. Tool interaction card
3. Supporting SEO sections

Props:

1. `title`
2. `description`
3. `keyword`
4. `children`

## `Card`

Purpose:
- Surface for grouped interactions.

Rules:

1. White background (`ui.surface`)
2. Light border (`ui.border`)
3. Medium radius
4. Subtle shadow

## `Button`

Variants:

1. `primary` (brand primary)
2. `secondary` (neutral border)
3. `ghost` (text action)

States:

1. default
2. hover
3. focus-visible
4. disabled
5. loading

## `ToolCard`

Purpose:
- Small cards used on home/tool index pages.

Content:

1. Tool name
2. 1-line description
3. CTA link/button

## `DropZone` (Most Important Component)

Purpose:
- Primary file intake interaction.

Behavior:

1. Click to open file picker.
2. Drag-over visual feedback.
3. Accept/reject file validation messaging.
4. Supports keyboard trigger.

Visual requirements:

1. Dashed border
2. Large internal padding
3. Centered icon + text
4. Hover/drag highlight using `brand.primary`

API proposal:

1. `accept` (MIME/extensions)
2. `multiple`
3. `maxFiles`
4. `onFilesSelected(files)`
5. `disabled`
6. `hintText`

## `FileList`

Purpose:
- Show selected files and order.

Capabilities:

1. Remove file
2. Reorder file (where needed)
3. Show file size and validation state

## `ActionPanel`

Purpose:
- Host tool-specific controls (page ranges, reorder input, options).

Rules:

1. Keep fields minimal.
2. Validate inline before processing.
3. Place primary action button at bottom of panel.

## `StatusMessage`

Purpose:
- Communicate processing state and outcomes.

Variants:

1. `info`
2. `success`
3. `error`

Messages:

1. Start processing
2. Completion with download prompt
3. Actionable error hints

## Component Composition by Tool

Shared base:

1. `PageContainer`
2. `ToolLayout`
3. `Card`
4. `DropZone`
5. `StatusMessage`

Tool-specific additions:

1. Merge: `FileList` + single primary action
2. Split: split mode selector + output preview list
3. Extract: page range input
4. Reorder: reorder UI (list drag or page order input)

## Implementation Rules

1. Components stay presentational when possible.
2. Heavy logic belongs in feature hooks/services.
3. All file processing calls go through worker bridge.
4. No component may perform network PDF operations.
5. Icons must come from `lucide-react` (do not use inline SVG icons).
