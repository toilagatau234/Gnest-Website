---
name: Gnest Admin Core
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#44474f'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#747780'
  outline-variant: '#c4c6d0'
  surface-tint: '#425e91'
  primary: '#002452'
  on-primary: '#ffffff'
  primary-container: '#1b3a6b'
  on-primary-container: '#89a5dd'
  inverse-primary: '#acc7ff'
  secondary: '#bb0014'
  on-secondary: '#ffffff'
  secondary-container: '#e41f25'
  on-secondary-container: '#fffbff'
  tertiary: '#00293a'
  on-tertiary: '#ffffff'
  tertiary-container: '#004059'
  on-tertiary-container: '#21b1eb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e2ff'
  primary-fixed-dim: '#acc7ff'
  on-primary-fixed: '#001a40'
  on-primary-fixed-variant: '#294678'
  secondary-fixed: '#ffdad6'
  secondary-fixed-dim: '#ffb4ab'
  on-secondary-fixed: '#410002'
  on-secondary-fixed-variant: '#93000d'
  tertiary-fixed: '#c4e7ff'
  tertiary-fixed-dim: '#7bd0ff'
  on-tertiary-fixed: '#001e2c'
  on-tertiary-fixed-variant: '#004c69'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
  surface-glass: rgba(255, 255, 255, 0.7)
  border-subtle: '#E2E8F0'
  text-main: '#0F172A'
  text-muted: '#64748B'
  success: '#10B981'
  warning: '#F59E0B'
typography:
  display-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Be Vietnam Pro
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 11px
    fontWeight: '500'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  container-padding: 24px
  gutter: 20px
  sidebar-width: 260px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system for the admin dashboard is defined by a **Corporate Modern** aesthetic infused with **Glassmorphism** touches. It aims to evoke a sense of professional reliability, surgical precision, and airy sophistication. Given the nature of the business—supplying glass packaging and industrial accessories—the UI mirrors the transparency and cleanliness of glass itself.

The interface prioritizes high information density without sacrificing clarity, using generous whitespace and a structured grid to manage complex data visualization. Soft shadows and translucent surface layers differentiate this from standard flat enterprise tools, creating a "tactile-digital" hybrid that feels premium and responsive.

**Key Stylistic Pillars:**
- **Translucency:** Subtle backdrop blurs on navigation and floating panels.
- **Precision:** Fine 1px borders and disciplined alignment.
- **Vibrancy:** High-contrast primary navy against ultra-light backgrounds, with urgent red accents for critical system feedback.

## Colors

The color strategy centers on **Cool Blue (#1B3A6B)** to establish authority and trust. This is balanced by a dominant **Light Grey (#F8FAFC)** background, which prevents the interface from feeling heavy.

**Functional Color Usage:**
- **Primary:** Used for sidebar navigation backgrounds, primary action buttons, and active state indicators.
- **Secondary (Red):** Reserved strictly for alerts, destructive actions (Delete/Decline), and low-stock indicators.
- **Tertiary (Sky Blue):** Used for data visualization accents and secondary interactive elements to maintain a "cool" temperature.
- **Neutral:** A range of Slate and Blue-Greys used for borders and text to ensure high legibility and a modern feel.
- **Glass Effect:** Surfaces use a semi-transparent white with a 12px-20px backdrop blur to create depth layers.

## Typography

This design system utilizes **Be Vietnam Pro** across all levels to maintain a contemporary, humanist feel that remains highly readable in data-heavy contexts.

- **Scale & Hierarchy:** We use a tight typographic scale. Headlines utilize heavier weights (600-700) and slightly tighter letter spacing to feel "anchored."
- **Data Display:** Tables and lists use the `body-md` size for maximum density without straining the eye.
- **Labels:** `label-md` is used for category tags, table headers, and small caps metadata to provide visual distinction from body text.
- **Mobile Adaptivity:** For screens below 768px, `display-lg` should downscale to 28px and `headline-lg` to 22px to ensure title text does not wrap aggressively.

## Layout & Spacing

The layout follows a **Fixed Sidebar + Fluid Content** model. The sidebar remains locked at 260px, while the main dashboard content expands to fill the viewport using a 12-column system.

**Spacing Rhythm:**
- A **4px baseline grid** governs all internal element spacing.
- **Margins:** Standard page margins are set to 24px, increasing to 32px on wide desktop monitors.
- **Grid:** Layouts utilize a 20px gutter between cards and data widgets.
- **Breakpoints:** 
    - *Desktop (1280px+):* 12 columns, full sidebar.
    - *Tablet (768px - 1279px):* Sidebar collapses to icons only (80px), margins reduce to 16px.
    - *Mobile (<768px):* Sidebar becomes a hidden drawer; content stacks vertically in a single column.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layering** and **Ambient Shadows**. Instead of harsh black shadows, we use tinted shadows that inherit the primary navy hue at extremely low opacities.

- **Level 0 (Background):** Solid `#F8FAFC`.
- **Level 1 (Cards/Panels):** Pure white background with a very soft shadow: `0px 4px 20px rgba(27, 58, 107, 0.04)`. 1px border in `#E2E8F0`.
- **Level 2 (Glass Overlays):** Modals and dropdowns use the `surface-glass` variable (70% white) with a `16px blur`. This creates a sophisticated "frosted" look that maintains context of the data beneath.
- **Level 3 (Popovers):** Higher elevation with a more pronounced shadow: `0px 10px 30px rgba(27, 58, 107, 0.08)`.

## Shapes

The shape language is consistently **Rounded**, reflecting the soft edges of the glass products sold by the company.

- **Components:** Buttons, Input fields, and small UI widgets use a **0.5rem (8px)** radius.
- **Containers:** Dashboard cards and main content wrappers use a larger **1rem (16px)** radius to create a soft, friendly "container" feel.
- **Pills:** Status badges (e.g., "Active", "Pending") and search bars use a full pill-shape (999px) to contrast against the structured rectangular grid of the dashboard.

## Components

### Buttons
- **Primary:** Solid `#1B3A6B` with white text. Subtle hover state: slightly lightens. 
- **Destructive:** Solid `#E31E24` for high-risk actions.
- **Ghost/Glass:** Transparent background with a 1px border or subtle blur for secondary actions.

### Data Tables & Lists
- **Header:** `label-md` typography with a subtle grey background.
- **Rows:** Hover state should trigger a subtle blue tint (`#F1F5F9`) and a change to the cursor.
- **Density:** 12px vertical padding on rows to maintain an "airy" feel.

### Input Fields
- **Style:** 1px border in `#E2E8F0`, 8px radius. 
- **Focus:** Border changes to primary blue with a 3px soft outer glow (halo) in the same color at 10% opacity.

### Status Chips
- Small, pill-shaped badges.
- **Success:** Soft green background with dark green text.
- **Alert:** Soft red background with dark red text.

### Cards
- Used for grouping metrics or product details.
- Must include a `1px` border and the Level 1 shadow defined in Elevation. 
- Headers inside cards should have a thin bottom border to separate titles from content.

### Dashboard Widgets (Data Viz)
- Charts should use the primary blue and tertiary sky blue for data series. 
- Avoid heavy grid lines; use light dotted lines or no lines at all to keep the "glass" aesthetic clean.