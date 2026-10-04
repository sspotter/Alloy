---
name: Alloy Tech — Signal & Flow
description: Separate homepage variant for user-selected concept 07.
colors:
  forest-ground: "#0b241c"
  forest-surface: "#14382b"
  project-surface: "#102d22"
  pale-text: "#f1f4e9"
  muted-sage: "#b8c9ba"
  forest-border: "#345043"
  lime-action: "#d5f49c"
  lime-hover: "#e5ffbc"
  action-ink: "#132b1c"
  string-lime: "rgb(205,230,139)"
  glow-cyan: "rgb(108,229,255)"
  glow-violet: "rgb(203,164,255)"
  glow-mint: "rgb(140,255,188)"
typography:
  display:
    fontFamily: "Georgia, serif"
    fontSize: "clamp(48px, 6.1vw, 88px)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "15px"
    lineHeight: 1.65
  flow-label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "11px"
    letterSpacing: "0.12em"
rounded:
  panel: "12px"
  button: "5px"
components:
  hero-button:
    backgroundColor: "{colors.lime-action}"
    textColor: "{colors.action-ink}"
    rounded: "{rounded.button}"
    padding: "16px 24px"
  hero-button-hover:
    backgroundColor: "{colors.lime-hover}"
---

## Overview

**Creative North Star: "07 Signal & Flow"**

The user-selected concept centers a serif statement above lime curved strings on a dark forest field. Strings converge around the Alloy AI core, connecting knowledge and people to systems and real improvement. The established Alloy Tech identity and evidence-led content remain the product foundation.

This document governs only `/signal-flow.html`, implemented by `assets/signal-flow.css` and `assets/signal-flow.js`. It has its own design document because the original homepage remains available: this is a separate visual variant, not a replacement of the root visual system. Root `DESIGN.md`, `PRODUCT.md`, and `.impeccable/design.json` retain their existing scope.

## Colors

Forest ground supports pale text and muted sage descriptions. Lime identifies primary actions, selected filters, focus outlines, and the central core. Project cards use a slightly lighter forest surface; real screenshot panels retain their light backgrounds for legibility. Cyan, violet, and mint belong to nearby illuminated string segments rather than general page accents.

## Typography

Georgia gives the centered hero its measured editorial character; italic emphasis marks “trust.” Locally served Manrope remains the body, navigation, section heading, and control font inherited from `styles.css`. The hero supporting copy uses 17px and its description 14px. At 760px and below, the display becomes `clamp(42px, 9.5vw, 65px)` with line-height 1.12; supporting copy becomes 15px and description 13px.

## Layout

The full-width hero places centered copy and actions above a canvas stage (height `clamp(310px, 28vw, 420px)`). Desktop copy is capped at 1100px with 48px total outer space. The core is centered and labels frame both sides. At 760px and below, copy has 40px total outer space, the stage is 300px high, the core shrinks from 108px to 78px, actions wrap, and the caption wraps. Lower sections retain the original responsive layout from `styles.css`.

## Elevation & Depth

A radial forest gradient gives the hero depth. Ambient lime outer and inset glows emphasize the core; proximity glow follows string segments. Lower cards use tonal surfaces and borders, retaining shared screenshot treatments.

## Shapes

The circular AI core anchors curved strings. Shared panels and buttons retain the gentle corners defined above. Existing SVG arrows, screenshots, portraits, and logo assets remain consistent with the original site.

## Components

The canvas draws 36 curved strings and ten nodes. Non-touch pointer proximity illuminates nearby segments in cyan, violet, and mint, with smoothed glow entry and exit. Animation pauses when the stage is offscreen or the document is hidden. Reduced motion keeps a static scene; pointer movement can redraw local glow without continuous animation. Canvas resolution is capped at device pixel ratio 2. The surrounding image role provides the diagram description; the canvas itself is hidden from assistive technology.

`styles.css` supplies shared layout and component behavior; `app.js` supplies filters, case-study expansion, screenshot galleries, image dialogs, and contact interactions. The variant stylesheet loads after the shared stylesheet. Current shared content in `signal-flow.html` is a copied snapshot of the original homepage, not a live template: later original copy updates should be applied here too.

## Do's and Don'ts

- Do keep this variant at its separate URL and preserve the original homepage.
- Do retain project status, attribution, real screenshots, and explicit illustration labels from the original content and `PRODUCT.md`.
- Do keep reduced-motion rendering static and pause continuous work offscreen.
- Don't turn canvas glow colors into unrelated page accents or imply invented traction.
- Verify variant behavior with `node --test scripts/signal-flow.test.mjs`; documentation of the command does not imply it has been run.
