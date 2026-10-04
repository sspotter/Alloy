---
name: Applied AI engineering
description: An editorial showcase for Yousef Mamdouh and collaborators.
colors:
  paper: "#f5f4ee"
  ink: "#232b24"
  muted: "#64695f"
  line: "#dadcd1"
  green: "#335b43"
  forest: "#243b2c"
  lime: "#d7e3b8"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(60px,6.6vw,92px)"
    fontWeight: 500
    lineHeight: 1.02
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "15px"
    lineHeight: 1.65
rounded:
  panel: "12px"
  button: "5px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.button}"
    padding: "16px 23px"
---

## Overview

The approved direction is editorial: warm off-white, charcoal, restrained green, large typography, and generous separation. The site presents independent applied AI engineering through real project evidence.

## Colors

CSS custom properties in styles.css are the source of truth. Forest carries the hero diagram and contact panel. Lime highlights permission control and the closing CTA. Individual project visuals have muted contextual backgrounds.

## Typography

Manrope is served locally as a variable TrueType font, with weights 400–800. Georgia italic provides brief emphasis on “trust” and the Nest Invest concept. Headings use balanced wrapping. Body and project descriptions use 13–15px; functional labels use at least 12px. The copyright line uses 10px and illustrative terminal code uses 10px.

## Layout

The container is capped at 1240px with 96px total outer space on desktop, 56px below 1050px, and 40px below 760px. The hero, introduction, and projects use two columns on desktop. Guardian RAG spans the project grid. At 760px the page becomes a single column; header navigation is hidden, with section links and the contact CTA still available through the page. Additional adjustments apply at 370px.

## Elevation & Depth

Panels use solid surfaces and single borders. Soft offset shadows lift real project screenshots. The hero diagram has a slight desktop rotation and is level on mobile.

## Shapes

Panels use 12px corners; buttons use 5px corners. Tags and status badges use smaller corners. Team initials are circles. Inline SVGs provide a consistent arrow system.

## Components

The objective section explains the shared engineering identity and intended collaborators in two columns, collapsing to one on mobile. Its 16:9 brand film uses native video controls, a locally served poster, burned-in captions, and a direct MP4 download. Video does not autoplay. The film follows the page palette and uses the same locally hosted Manrope font.

Project filters update visible cards and the announced count. Detail buttons expand content within each card and synchronize aria-expanded. Contact links open email. External source links open a new tab with rel=noopener noreferrer. Focus rings use green. Reduced-motion preferences disable the diagram pulse and smooth scrolling.

## Do's and Don'ts

- Retain real screenshot attribution and explicit illustration labels.
- Preserve project status and ownership.
- Connect projects to capabilities rather than inventing traction or production claims.
- Keep source links secondary to project storytelling.
- Use the established SVG arrow system for CTAs.
