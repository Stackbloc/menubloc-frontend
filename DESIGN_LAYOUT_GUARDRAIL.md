# Layout Guardrail

This file exists to prevent unrequested layout drift in the frontend.

## Core rule

Do not invent new page framing, left-rail labels, split-column layouts, or desktop-only alignment tricks unless the user explicitly asks for them.

## Required baseline

- Preserve the current page structure unless the change is specifically about layout.
- Keep headings inside the same centered content pattern used by the existing page.
- Do not add a second title row when the page already has a title or location header.
- Do not move a heading to the far left just because the viewport is wide enough to allow it.
- Do not create custom desktop composition on one page that does not already exist in the established design system.

## Safe default

If a proposed layout element would make the page feel like a different product section, do not add it.

## Approval rule

Before changing page framing, spacing, alignment, or header structure:

1. Show the diff.
2. State what visual element moves or disappears.
3. State what stays the same.
4. Wait for explicit approval.
