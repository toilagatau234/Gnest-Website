# Admin UI Redesign Brief - Gnest Website

## Context

This project is Gnest Website, a B2B company website and product catalog CMS for Đại Tài Lợi. The business sells glass jars, bottles, packaging and bird nest industry accessories.

The current admin system is built with:
- Next.js App Router
- TypeScript
- React
- Tailwind CSS v4
- Supabase Auth, Database and Storage
- lucide-react icons
- Be Vietnam Pro font

Please read `project.md` before making changes.

## Current Problem

The attached AI Studio design is only a rough visual reference. Do not copy it 1:1.

The current design direction looks too AI-generated:
- Typography feels generic and unnatural.
- Visual hierarchy is not refined.
- Cards feel too similar and repetitive.
- Too many decorative elements, gradients and icon boxes.
- Spacing is inconsistent.
- Tables are not clean enough for real admin usage.
- Forms and drawers need better structure.
- The design does not feel premium/professional enough for a Vietnamese B2B business catalog CMS.

## Goal

Improve the admin UI so it feels:
- Natural
- Clean
- Premium
- Professional
- Easy to scan
- Less AI-generated
- More suitable for a real B2B catalog CMS

This is not a gaming, crypto, SaaS analytics, or heavy ecommerce dashboard. It is a CMS for managing product catalog, categories, product images, quote requests, sales contacts, site content, recruitment and admin users.

## Brand Style

Use:
- Navy: #1B3A6B
- Red: #E31E24
- Background: #F7F9FB
- Card background: white
- Border: #E2E8F0
- Font: Be Vietnam Pro

Design direction:
- Bright admin interface
- Soft cards
- Clear spacing
- Minimal gradients
- Minimal shadows
- Professional B2B feel
- Vietnamese labels

## Important UX Rules

1. Do not overuse red.
   Use #E31E24 only for destructive actions, warnings, urgent badges, or subtle brand accents.

2. Do not overuse gradients.
   Sidebar can use a navy gradient, but main content should stay clean.

3. Improve typography.
   Use better hierarchy:
   - Page title: clear, confident, not oversized
   - Section title: compact and readable
   - Body text: neutral slate color
   - Labels: medium weight
   - Tables: easy to scan

4. Improve spacing.
   Increase whitespace between sections.
   Avoid cramped cards.
   Avoid too many dense elements in one row.

5. Improve tables.
   Tables should look like real admin tables:
   - Sticky/clear header style
   - Better row spacing
   - Important columns emphasized
   - Status badges simple and consistent
   - Actions grouped cleanly

6. Improve forms.
   Add/edit forms should use drawer or modal layout.
   Long product forms should be split into tabs:
   - Basic info
   - Price & stock
   - Images
   - Specifications
   - Bulk pricing

7. Improve dashboard.
   Dashboard must show what matters first:
   - Key metrics
   - Work needing attention
   - Recent quote requests
   - Recent activity
   - System status

8. Keep the existing project architecture.
   Do not rewrite the whole app.
   Reuse existing admin components where possible.

## Existing Admin Routes

Keep and improve:
- /admin/dashboard
- /admin/categories
- /admin/products
- /admin/inquiries
- /admin/sales-contacts
- /admin/jobs
- /admin/site-content
- /admin/admin-users

Optionally add:
- /admin/audit-logs

## Implementation Scope

Focus on UI/UX improvement first.

Do not implement complex backend features unless required by existing services.

Prioritize:
1. AdminShell, AdminSidebar, AdminTopbar polish
2. Shared UI components:
   - AdminCard
   - AdminStatCard
   - AdminTableShell
   - AdminStatusChip
   - AdminPageHeader
   - Empty/Error/Loading states
3. Dashboard layout refinement
4. Categories page refinement
5. Products page refinement
6. Inquiries page refinement
7. Placeholder pages polish for sales contacts, jobs, site content and admin users

## Do Not

- Do not expose Supabase service role to client components.
- Do not break server-side admin guard.
- Do not break public routes `/danh-muc` and `/danh-muc/[slug]`.
- Do not introduce heavy UI libraries unless explicitly approved.
- Do not redesign the public website.
- Do not implement cart, checkout, payment or order fulfillment.
- Do not make the UI look like a generic AI-generated dashboard.

## Definition of Done

- Admin UI feels more natural and polished.
- Typography is cleaner.
- Tables are easier to read.
- Cards have better hierarchy.
- Sidebar/topbar feel consistent.
- Layout is responsive.
- Existing admin functionality still works.
- TypeScript passes.
- `npm run lint` passes.
- `npm run build` passes.