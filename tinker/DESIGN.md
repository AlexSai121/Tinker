---
version: alpha
name: Tinker Google-First Workshop
description: Google DESIGN.md structure as the source of truth, with Claude-style calm, Apple restraint, and Framer motion polish.
colors:
  primary: "#0B0C0E"
  on-primary: "#F8FAFC"
  secondary: "#2D3137"
  on-secondary: "#F8FAFC"
  tertiary: "#E85002"
  on-tertiary: "#0B0C0E"
  neutral: "#F8FAFC"
  on-neutral: "#111318"
  surface-0: "#0B0C0E"
  surface-1: "#15171A"
  surface-2: "#202329"
  surface-3: "#2A2E35"
  surface-4: "#353A42"
  surface-light-0: "#FAFBFC"
  surface-light-1: "#F2F4F7"
  surface-light-2: "#E8ECF1"
  text-1: "#F8FAFC"
  text-2: "#CBD3DE"
  text-3: "#97A1B0"
  text-muted: "#7A8390"
  border: "#30343B"
  border-strong: "#424852"
  accent-soft: "#351A0E"
  accent-strong: "#C10801"
  danger: "#BE123C"
  warning: "#F59E0B"
  success: "#16A34A"
  info: "#0EA5E9"
typography:
  display:
    fontFamily: "Google Sans, Google Sans Text, SF Pro Display, SF Pro Text, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: 32px
    fontWeight: 650
    lineHeight: 1.12
    letterSpacing: 0px
  title:
    fontFamily: "Google Sans, Google Sans Text, SF Pro Display, SF Pro Text, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: 0px
  body:
    fontFamily: "Google Sans Text, SF Pro Text, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0px
  label:
    fontFamily: "Google Sans Text, SF Pro Text, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.32
    letterSpacing: 0px
rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 10px
  xl: 12px
  full: 9999px
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  page: 24px
components:
  app-frame:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body}"
  app-surface:
    backgroundColor: "{colors.surface-0}"
    textColor: "{colors.text-1}"
    typography: "{typography.body}"
  app-surface-light:
    backgroundColor: "{colors.surface-light-0}"
    textColor: "{colors.on-neutral}"
    typography: "{typography.body}"
  sidebar:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.text-2}"
    rounded: "{rounded.md}"
    padding: 16px
  panel:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.text-1}"
    rounded: "{rounded.lg}"
    padding: 16px
  panel-muted:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text-2}"
    rounded: "{rounded.md}"
    padding: 12px
  panel-strong:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.text-1}"
    rounded: "{rounded.lg}"
    padding: 16px
  panel-raised:
    backgroundColor: "{colors.surface-4}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.lg}"
    padding: 16px
  light-panel:
    backgroundColor: "{colors.surface-light-1}"
    textColor: "{colors.on-neutral}"
    rounded: "{rounded.lg}"
    padding: 16px
  light-panel-muted:
    backgroundColor: "{colors.surface-light-2}"
    textColor: "{colors.on-neutral}"
    rounded: "{rounded.md}"
    padding: 12px
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.on-tertiary}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: 8px 14px
  button-primary-hover:
    backgroundColor: "{colors.accent-strong}"
    textColor: "{colors.neutral}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: 8px 14px
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: 8px 14px
  button-focus:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.neutral}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: 8px 14px
  input:
    backgroundColor: "{colors.surface-0}"
    textColor: "{colors.text-1}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 8px 12px
  metric:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.text-3}"
    rounded: "{rounded.lg}"
    padding: 14px 16px
  divider:
    backgroundColor: "{colors.border}"
    textColor: "{colors.text-1}"
    height: 1px
  divider-strong:
    backgroundColor: "{colors.border-strong}"
    textColor: "{colors.text-1}"
    height: 1px
  quiet-copy:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-neutral}"
    typography: "{typography.body}"
  muted-on-dark:
    backgroundColor: "{colors.surface-0}"
    textColor: "{colors.text-muted}"
    typography: "{typography.body}"
  status-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.neutral}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: 4px 10px
  status-warning:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.primary}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: 4px 10px
  status-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.primary}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: 4px 10px
  status-info:
    backgroundColor: "{colors.info}"
    textColor: "{colors.primary}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: 4px 10px
---

## Overview
Tinker uses DESIGN.md as the durable contract between product intent and implementation. Google is the primary influence here: tokens are explicit, components are systematic, and decisions should be easy for coding agents to apply without improvising. Claude Design is the secondary influence: the experience should feel calm, clear, and supportive of deep thinking. Apple contributes restraint, spatial discipline, and native-feeling typography. Framer contributes purposeful motion, not decoration.

The result is a precise local-first workspace. It should feel like a serious tool for people building knowledge through projects, not a marketing page or a moodboard.

## Colors
The default UI is dark, neutral, and high contrast. `primary`, `surface-0`, and `surface-1` create the app frame. `text-1`, `text-2`, and `text-3` control hierarchy. `tertiary` is Tinker's action orange and should be the main interactive accent.

Use orange for primary actions, active view state, focus, and selected affordances. Use `accent-strong` for pressed and destructive-adjacent emphasis, but keep `danger` reserved for true destructive or failure states. Functional colors (`success`, `warning`, `info`, `danger`) are allowed when they encode status, data, or review urgency.

Light mode uses the `surface-light-*` values and keeps the same orange interaction system. Do not introduce decorative purple, blue-purple, beige, or brown palettes as the default app identity.

## Typography
Use the Google/System/SF stack throughout. Display and title text should be clean and compact, with no negative letter spacing. Body text should feel calm and readable, with restrained line length and no oversized prose inside dense panels.

Prefer sentence-case labels. Uppercase is allowed for short metadata kickers only. Do not use a serif display face for product UI headings.

## Layout
Use the 8px rhythm as the base. App views should have one clear header, then functional surfaces arranged for scanning and repeated work. Panels can frame tools, metrics, modals, inspectors, and repeated items; they should not nest inside other panels.

Dashboards should be dense but breathable. Keep controls near the data they affect, and keep the first viewport focused on doing the work.

## Elevation & Depth
Depth is mostly tonal. Use shallow shadows for modals and dragged/floating objects only. Chrome may use subtle blur, but default page sections should not rely on glow, bokeh, radial gradients, or heavy shadows.

Framer motion should clarify state changes: active tab movement, modal entry, drag response, save/loading state, and view transitions. Motion should be short, springy, and interruptible.

## Shapes
Default rectangles use 6px to 12px radii. Standard buttons and panels use `rounded.md` or `rounded.lg`. Full pills are reserved for segmented controls, badges, status chips, and search inputs where the shape improves recognition.

Avoid very large rounded cards for ordinary dashboard sections.

## Components
Shared components must consume the CSS variables that mirror these tokens. Primary buttons are solid orange. Secondary and surface buttons are grayscale. Inputs use neutral surfaces and orange focus rings. Metrics, rows, panels, and modals use the same tonal surface ladder.

Icons should come from lucide-react when available. Icon-only controls need accessible labels and tooltips. Framer-motion is appropriate for interaction feedback, but animation should not change layout dimensions or hide important state.

## Do's and Don'ts
- Do treat `DESIGN.md` as the source of truth before adding new colors, radii, or motion values.
- Do keep the interface quiet, compact, and useful for repeated work.
- Do use orange sparingly and consistently for interaction.
- Do preserve dark mode first and maintain a complete light mode.
- Don't use decorative gradients, glow fields, bokeh, or glass as the default visual language.
- Don't nest cards inside cards or turn every section into a floating object.
- Don't introduce one-off typography stacks, negative letter spacing, or serif product headings.
