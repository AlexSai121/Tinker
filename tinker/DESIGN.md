---
version: alpha
name: Tinker Atelier
description: A warm, local-first maker workspace inspired by Claude's editorial warmth, Apple's restrained components, and Framer's crisp icon-first interaction.
colors:
  accent: "#CC785C"
  accent-active: "#A9583E"
  canvas-light: "#FAF9F5"
  surface-soft-light: "#F5F0E8"
  surface-card-light: "#EFE9DE"
  ink: "#141413"
  body: "#3D3D3A"
  muted: "#6C6A64"
  hairline: "#E6DFD8"
  canvas-dark: "#181715"
  surface-dark: "#1F1E1B"
  surface-elevated-dark: "#252320"
  on-dark: "#FAF9F5"
  on-dark-soft: "#A09D96"
  success: "#5DB872"
  warning: "#D4A017"
  error: "#C64545"
typography:
  display:
    fontFamily: "Charter, Georgia, Cambria, Times New Roman, serif"
    fontSize: 30px
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: 0px
  title:
    fontFamily: "Inter, SF Pro Text, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: 0px
  body:
    fontFamily: "Inter, SF Pro Text, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0px
  label:
    fontFamily: "Inter, SF Pro Text, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0px
rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  pill: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
components:
  page:
    backgroundColor: "{colors.canvas-light}"
    textColor: "{colors.ink}"
    padding: 24px
  command-bar:
    backgroundColor: "rgba(250, 249, 245, 0.82)"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: 56px
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    height: 40px
  input:
    backgroundColor: "{colors.canvas-light}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: 40px
---

## Overview
Tinker is a workshop for learning by making. The interface should feel like a thoughtful studio: warm, precise, and calm enough that users can return every day without fatigue. It is not a marketing page and not a decorative dashboard. The work is the center.

The design direction is Claude-first: warm canvas, editorial rhythm, clay/coral accent, and human language. Apple contributes component restraint: frosted command bars, compact sidebars, native-feeling sheets, segmented controls, and predictable focus. Framer contributes icon discipline: thin-line glyphs, compact tool capsules, and crisp micro-interaction.

## Principles
- Use warmth to reduce anxiety. Cream, graphite, clay, and quiet dividers should make the app feel reflective rather than sterile.
- Keep hierarchy low-noise. Prefer one clear header, one working surface, and one inspector over nested card grids.
- Make every accent earn its place. Clay/coral marks primary actions, active states, focus, and living graph connections.
- Let data color stay functional. Error, warning, and success colors are allowed only when they communicate state.
- Prefer icon-first controls with labels where clarity requires them. Unknown icon buttons need tooltips.
- Keep corners modest. Most UI uses 6px to 12px radius; pills are reserved for segmented controls, chips, and compact command buttons.

## Page Model
Every page uses one of three structures:
- **Workspace:** a full-height working surface with a compact top command area and optional inspector.
- **Dossier:** a dense, readable analysis page with metric strip, filters, and rows.
- **Sheet:** a focused creation or settings task with clear form rhythm and fixed footer actions.

## Constellation
The constellation is a 3D knowledge graph. It should feel like Obsidian's graph view translated into Tinker: spatial, searchable, inspectable, and useful. Nodes are projects. Links are bridges. Labels appear on hover or selection. The graph is dark-first even when the app is in light mode so spatial contrast stays readable.

## Do's
- Use warm cream and graphite as the main surfaces.
- Keep panels flatter and dividers softer than the previous design pass.
- Use clay/coral for active state and primary intent.
- Preserve all existing workflows, test IDs, routes, stores, and data behavior.
- Use existing lucide icons with lighter strokes and restrained color.

## Don'ts
- Do not reintroduce app-wide orange/black branding.
- Do not use decorative gradients, stars, glow fields, bokeh, or nested cards.
- Do not use oversized hero sections inside product screens.
- Do not add new feature behavior during visual cleanup unless needed for the 3D graph controls.
