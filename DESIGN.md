---
name: Gnest Website
description: Premium product catalog and admin CMS for Đại Tài Lợi packaging brand.
colors:
  primary: "#E31E24"
  primary-dark: "#C01519"
  secondary: "#1B3A6B"
  secondary-dark: "#0d1f3c"
  neutral-bg: "#ffffff"
  neutral-bg-alt: "#f5f6f8"
  neutral-dark: "#1a1a1a"
  neutral-gray: "#666666"
  border: "#e2e5ea"
typography:
  display:
    fontFamily: "Be Vietnam Pro, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 4rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Be Vietnam Pro, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-dark}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  button-secondary-hover:
    backgroundColor: "{colors.secondary-dark}"
---

# Design System: Gnest Website

## 1. Overview

**Creative North Star: "The Artisan Showcase"**

The Gnest Website design system is structured to project the premium quality, reliability, and precision of Đại Tài Lợi packaging products. The system balance focuses on a clean, professional, and high-integrity layout. It emphasizes clear visual hierarchy, solid grid layouts, and pristine product imagery, rejecting the typical cluttered layout or overused modern landing page tropes.

**Key Characteristics:**
- **Product Spotlight**: The products (glass bottles, jars, packaging box designs) are the focal point, clean and uncluttered.
- **Bold Corporate Accents**: Deep corporate navy represents stability and trust, while the brand red acts as a precise focal accent.
- **Structured Typography**: High-contrast, clean Grotesque-style typography (Be Vietnam Pro) with generous spacing to ensure readability and professionalism.

## 2. Colors

The color palette uses high-contrast, clean corporate hues combined with neutral backdrops to ensure perfect readability (complying with WCAG 2.1 AA) and brand recognition.

### Primary
- **DTL Red** (#E31E24): The primary brand accent color. Used purposefully on active CTAs, highlights, badges, and key interactive focal points.
- **DTL Red Dark** (#C01519): Used for hover states on primary interactive elements.

### Secondary
- **DTL Navy** (#1B3A6B): Reflects brand stability and trustworthiness. Used in header navigations, section titles, and secondary highlights.
- **DTL Navy Dark** (#0d1f3c): Used for text headings, main header backgrounds, or hover states.

### Neutral
- **White Background** (#ffffff): The canonical backdrop for clean product lists.
- **Alternate Light Gray** (#f5f6f8): Used for alternate section blocks or input backdrops.
- **Dark Ink** (#1a1a1a): The primary text color for maximum readability.
- **Muted Gray** (#666666): Used for secondary captions, metadata, or borders.

### Named Rules
**The Rarity Accent Rule.** Red is used on ≤10% of any given screen. Its rarity is the point, guiding the user's eye to primary CTAs.

**No-Washed-Gray Rule.** Text on colored backgrounds must use a darker shade of the background's hue, or clear white, never washed-out gray.

## 3. Typography

**Display Font:** Be Vietnam Pro (sans-serif)
**Body Font:** Be Vietnam Pro (sans-serif)

**Character:** Clean, highly legible, and structured. Using weights and hierarchy to differentiate components and content blocks without cluttering the page.

### Hierarchy
- **Display** (Bold, clamp(2.25rem, 5vw, 4rem), 1.2): Used exclusively for hero titles on key marketing landing sections.
- **Headline** (Bold, 1.75rem, 1.3): Used for main section headers.
- **Title** (SemiBold, 1.25rem, 1.4): Used for cards, product names, and dialog headers.
- **Body** (Regular, 14px, 1.6): Used for body text, descriptions, and technical specifications. Max line length capped at 65–75ch.
- **Label** (Bold, 12px, 0.05em, uppercase): Used for tags, badges, and minor table headers.

### Named Rules
**The Balance Heading Rule.** Always set display and headline styles to `text-wrap: balance` to prevent awkward typography line wraps.

## 4. Elevation

The elevation design is flat-by-default, relying on structural borders and subtle tone variations to convey hierarchy. Shadows are used sparingly to indicate active interactive layers or overlays.

### Shadow Vocabulary
- **Card Rest State**: None. A solid 1px border (`#e2e5ea`) defines boundaries.
- **Card Hover State** (`box-shadow: 0 12px 28px rgba(27, 58, 107, 0.10)`): A subtle rise to indicate interactivity.
- **Modal Pop** (`box-shadow: 0 18px 45px rgba(27, 58, 107, 0.14)`): Used for modals, dropdowns, and overlays to lift them above the main page plane.

### Named Rules
**The Hover Lift Rule.** Shadows appear as a response to interaction or modal layer status; static surfaces remain flat.

## 5. Components

### Buttons
- **Shape:** Rounded corners with a 6px border-radius (`rounded-sm`).
- **Primary:** Background DTL Red (`#E31E24`), text white (`#ffffff`). Padding: 10px 20px.
- **Hover:** Transition to DTL Red Dark (`#C01519`) with a slight upward translate of 0.5px.

### Cards / Containers
- **Corner Style:** Rounded corners with a 10px border-radius (`rounded-md`).
- **Background:** White (`#ffffff`).
- **Border:** 1px solid gray-border (`#e2e5ea`). No shadows at rest.

### Inputs / Fields
- **Style:** Background white (`#ffffff`), 1px solid border (`#e2e5ea`), rounded 6px (`rounded-sm`).
- **Focus:** Border transitions to DTL Navy (`#1B3A6B`) with a soft glow ring.

### Navigation
- **Header Navigation:** DTL Navy text, transitioning to DTL Red on hover. Active links are bolded.

## 6. Do's and Don'ts

### Do:
- **Do** maintain a body copy line length between 65–75ch.
- **Do** ensure contrast of body copy text against backgrounds is at least 4.5:1.
- **Do** use `text-wrap: balance` on H1 to H3 headings.
- **Do** keep components flat at rest and show elevation only on hover or active overlays.

### Don't:
- **Don't** use warm cream/beige backgrounds (e.g. bones, linen, sand, ivory).
- **Don't** pair a 1px solid border and a soft shadow (blur ≥ 16px) on the same button or card at rest.
- **Don't** use a corner radius larger than 16px on cards, components, or panels.
- **Don't** use gradient text backgrounds or decorative glassmorphism.
- **Don't** put a tiny uppercase tracked eyebrow above every single section.
- **Don't** use side-stripe borders (border-left/right > 1px) as colored accents on cards or callouts.
