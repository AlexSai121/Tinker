 ---
version: alpha
name: Tinker Restrained Workshop
description: Apple-inspired restraint with Tinker's black, gray, white, and orange identity.
colors:
  primary: "#000000"
  secondary: "#333333"
  tertiary: "#E85002"
  neutral: "#F9F9F9"
  gray: "#646464"
  gray-light: "#A7A7A7"
  accent-strong: "#C10801"
  danger: "#BE123C"
  success: "#059669"
typography:
  display:
    fontFamily: "SF Pro Display, SF Pro Text, -apple-system, BlinkMacSystemFont, Helvetica Neue, Arial, sans-serif"
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: 0px
  title:
    fontFamily: "SF Pro Display, SF Pro Text, -apple-system, BlinkMacSystemFont, Helvetica Neue, Arial, sans-serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.16
    letterSpacing: 0px
  body:
    fontFamily: "SF Pro Text, -apple-system, BlinkMacSystemFont, Helvetica Neue, Arial, sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.48
    letterSpacing: 0px
  label:
    fontFamily: "SF Pro Text, -apple-system, BlinkMacSystemFont, Helvetica Neue, Arial, sans-serif"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: 0px
rounded:
  sm: 6px
  md: 8px
  lg: 10px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  page: 24px
components:
  button-primary:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.md}"
    padding: 8px 14px
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.md}"
    padding: 8px 14px
  panel:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.md}"
    padding: 16px
---

## Overview
Tinker is a local-first workshop for people who learn by making. The interface should feel deliberate, quiet, and precise: the work is the object, and the UI recedes around it. The visual language borrows Apple's restraint, solid fields, tight hierarchy, and reduced chrome, while keeping Tinker's orange identity.

## Colors
The palette is stark and controlled.

- **Black (`#000000`)** is the primary app canvas and navigation field.
- **White (`#F9F9F9`)** is reserved for primary text and light mode foundations.
- **Dark Gray (`#333333`)**, **Gray (`#646464`)**, and **Light Gray (`#A7A7A7`)** create surface, metadata, disabled, and divider states.
- **Orange (`#E85002`)** is the only brand accent. Use it for primary actions, selected state, focus, and key interactive affordances.
- **Deep Orange (`#C10801`)** is the pressed or elevated accent state.
- The orange gradient may appear only as rare brand material, not as a default page background or card treatment.

## Typography
Use the SF/system stack throughout. Keep letter spacing at `0` and use weight, size, and spacing instead of decorative tracking. Headlines are compact and direct. Body copy is readable, left-aligned, and never oversized inside dense panels.

## Layout
Use a restrained 8px rhythm. Pages have a single clear header, then a small number of un-nested panels or functional surfaces. Avoid stacked cards inside cards. Dashboards should read as quiet tools for scanning, not marketing sections.

## Elevation & Depth
Depth is mostly tonal. Shadows are rare and shallow. Navigation and modals may use subtle blur, but page sections should not rely on glow, bokeh, radial gradients, or heavy drop shadows.

## Shapes
Most rectangular UI uses 6px to 10px radius. Full pills are reserved for badges, small status chips, and segmented controls. Do not use very large rounded containers for ordinary page panels.

## Components
Buttons, inputs, segmented tabs, modals, dashboard panels, and metric tiles use semantic tokens from the app stylesheet. Primary buttons are orange; secondary and neutral controls are grayscale. Functional danger, success, warning, and info colors are allowed only where they communicate status.

## Do's and Don'ts
- Do keep controls compact, readable, and easy to scan.
- Do use orange consistently for active and primary interaction.
- Do preserve light mode, but design dark mode first.
- Don't add decorative gradients, glows, or redundant borders.
- Don't make every section a separate visual card.
- Don't introduce additional brand accents such as blue or purple unless they represent functional data status.
