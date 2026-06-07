---
target: components/CatalogPage.tsx
total_score: 22
p0_count: 0
p1_count: 3
timestamp: 2026-06-07T08-54-02Z
slug: components-catalogpage-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Skeleton + error + empty states exist; idle→loading micro-flicker; count shown before data resolves |
| 2 | Match System / Real World | 3 | Vietnamese labels accurate; "Coming Soon" English inside a Vietnamese-first UI |
| 3 | User Control and Freedom | 3 | Clear-all filters works; isFilterPanelOpen collapse path has no trigger button in rendered JSX |
| 4 | Consistency and Standards | 2 | globals.css defines 8 --color-dtl-* tokens; CatalogPage uses 0 of them — 100% hardcoded hex |
| 5 | Error Prevention | 2 | Raw slug leaked in 404 message; filter state not URL-persisted (lost on refresh/share) |
| 6 | Recognition Rather Than Recall | 3 | Active filter badges visible and dismissible; grid-view badge appears interactive but is non-functional |
| 7 | Flexibility and Efficiency | 1 | No URL filter sync, no sort, no page-size control; B2B buyers cannot share filtered views |
| 8 | Aesthetic and Minimalist Design | 2 | 5 stacked chrome layers before first product; product count shown twice |
| 9 | Error Recovery | 2 | Error state has no retry action; 404 state has no recovery link |
| 10 | Help and Documentation | 1 | No spec tooltips; filter labels meaningless to buyers without prior knowledge |
| **Total** | | **22/40** | **Acceptable — significant improvements needed** |

## Anti-Patterns Verdict

Two absolute-ban patterns remain active after the last polish pass:
1. Eyebrow badge above H1: "Catalog san pham" in 11px uppercase is the tiny tracked all-caps kicker listed in PRODUCT.md anti-references and Impeccable absolute bans.
2. Hero metric panel: the right-side stats card (big tabular number + label + supporting text + divider) is the SaaS dashboard hero-metric template, an absolute ban.
3. Uniform card grid: three columns of structurally identical cards with no art direction.

Deeper miss: this is a brand-register page. It reads as generic B2B SaaS product listing. Zero visual communication of premium Vietnamese packaging quality or identity.

Deterministic scan: 0 findings. JSX pattern scanner clean.

## Overall Impression

Functionally complete and structurally sound. Loading states, filter system, and dual-image hover are solid. But the page answers "what products exist?" without asking "why would you want them?" The dark corporate banner projects bureaucracy, not premium craft.

## What Works

1. Dual-image hover swap (ProductImageDisplay): genuine product showcase move — reveals alternate views on hover.
2. Active filter badge system: state visible as dismissible chips, count badge, single clear-all escape.
3. Loading skeleton fidelity: maintains 4:3 aspect ratio — no jarring layout shift on resolve.

## Priority Issues

[P1] Brand register fail — page reads as generic SaaS, not a premium Vietnamese packaging brand.
Why: PRODUCT.md declares register brand. Brand surfaces communicate identity; this one communicates nothing.
Fix: Replace dark corporate banner with a category hero using product imagery or strong typographic anchor, quality narrative, and premium visual language.
Command: /impeccable bolder

[P1] Two absolute-ban anti-patterns: eyebrow badge + hero metric template.
Why: Both explicitly listed as AI slop tells.
Fix: Remove the eyebrow badge. Replace stats card with confident copy line about quality, not a count.
Command: /impeccable distill

[P1] Design token bypass.
Why: globals.css registers --color-dtl-red etc.; CatalogPage uses 100% hardcoded hex. Two sources of truth.
Fix: Replace bg-[#E31E24] with bg-dtl-red, text-[#1B3A6B] with text-dtl-navy throughout.
Command: /impeccable polish

[P2] No URL filter state — B2B buyers cannot share or bookmark filtered views.
Why: Core B2B workflow failure. Filters vanish on every refresh.
Fix: Sync activeFilters and page to URL search params.
Command: /impeccable harden

[P2] No visible focus rings on interactive elements.
Why: Fails WCAG 2.1 AA SC 2.4.7.
Fix: Add focus-visible:ring-2 focus-visible:ring-dtl-navy/40 to all buttons and links.
Command: /impeccable audit

## Audit Health Score

| # | Dimension | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Accessibility | 2 | No focus rings; no aria-live on dynamic count; dual card interaction pattern |
| 2 | Performance | 3 | transition-all used in 3 places |
| 3 | Responsive Design | 3 | Touch targets ~40px; horizontal nav overflow has no visual scroll hint |
| 4 | Theming | 1 | 8 tokens defined, 0 used |
| 5 | Anti-Patterns | 2 | Eyebrow badge + hero metric template active |
| **Total** | | **11/20** | **Acceptable — significant work needed** |

## Persona Red Flags

Lan (Vietnamese B2B packaging buyer):
- Arrives at /danh-muc. Dark corporate banner with a count number. Nothing signals premium quality.
- 5 UI chrome layers before first product on mobile.
- Finds right spec, shares URL — colleague lands on unfiltered results.
- "Coming Soon" in English mixes languages in a Vietnamese-first context.

Casey (Mobile buyer):
- No scroll hint on horizontal category nav — off-screen categories invisible.
- ~600px scroll on 390px phone before first product.
- Filter state lost on refresh.

Sam (Keyboard/screen reader):
- No visible focus ring at any interactive state.
- aria-live missing on dynamic product count.
- Two interactive elements per card without clear distinction.

## Minor Observations

- serviceCategories variable declared but never used.
- "Coming Soon" should be "Sap co" in Vietnamese.
- isFilterPanelOpen false branch exists but no toggle button renders in JSX.
- Pagination shadow-sm at rest: minor hover-lift-rule deviation.
