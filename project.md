# project.md — Gnest Website Context

> Context ngắn cho AI coding. Đọc trước khi sửa code. Giữ scope, hỏi khi thiếu ngữ cảnh, không tự ý commit/push/deploy.

## Project

Website doanh nghiệp + catalog sản phẩm/dịch vụ cho **Đại Tài Lợi**: hũ/chai/lọ thủy tinh, bao bì, phụ kiện ngành yến và dịch vụ liên quan.

Mục tiêu hiện tại:
- Client xem trang chủ, danh mục, sản phẩm, tìm kiếm/lọc, chi tiết sản phẩm.
- Khách liên hệ qua Zalo/điện thoại/form báo giá.
- Admin/CMS quản lý dữ liệu hiển thị phía client.

Mục tiêu sau:
- Nâng cấp thành ecommerce: cart, checkout, customer, order, inventory, payment nếu được yêu cầu.

## Stack

```txt
Framework      : Next.js App Router
Language       : TypeScript
UI             : React
Style          : Tailwind CSS v4
Font           : Be Vietnam Pro
Icons          : lucide-react
Backend        : Supabase
Database       : Supabase PostgreSQL
Auth           : Supabase Auth
Storage        : Supabase Storage
Deploy         : Vercel
```

Không dùng/mở rộng backend legacy. Supabase là backend chính cho migration.

## Current Routes

```txt
/                       Home
/danh-muc               All categories/products
/danh-muc/[slug]        Category detail
/tuyen-dung             Recruitment
/admin                  Admin/CMS target
/admin/orders           Legacy admin/orders page
```

## Current Key Files

```txt
app/layout.tsx
app/providers.tsx
app/page.tsx
app/danh-muc/page.tsx
app/danh-muc/[slug]/page.tsx
app/admin/orders/page.tsx

components/SiteHeader.tsx
components/ProductsRender.tsx
components/CatalogPage.tsx
components/ProductModal.tsx
components/ContactModal.tsx
components/SiteFooter.tsx

lib/data.ts
lib/context.tsx
lib/categories-context.tsx
lib/cart-context.tsx
```

## Public Features

- Home sections.
- Header + mega menu.
- Product/service categories.
- Parent/child categories.
- Product listing.
- Product search/filter.
- Product detail modal.
- Product image gallery.
- Price, wholesale discount, stock, specs.
- Zalo/hotline/contact CTA.
- Recruitment page.

## Admin/CMS Features

Admin must manage:
- Dashboard.
- Categories parent/child.
- Products/services.
- Product images.
- Product price, stock, specs.
- Wholesale/bulk discounts.
- Sales contacts: phone, Zalo, avatar.
- Recruitment posts.
- Homepage/footer/CTA/site content.
- Inquiries/quote requests.
- Admin users/roles.
- Audit logs for important actions.

Admin security must use Auth + role + RLS/server-side guard, not hidden URL.

## Main Flows

Customer:
```txt
Home -> Category -> Product list -> Product modal -> Zalo/phone/form quote
```

Admin:
```txt
Login -> Dashboard -> Manage content/products/categories -> Upload images -> Review inquiries
```

## Data Model

Core tables:
```txt
admin_users
profiles
categories
products
product_images
product_bulk_discounts
sales_contacts
job_vacancies
inquiries
site_contents
audit_logs
```

Minimal fields:
```txt
categories: id, name, slug, type, parent_id, sort_order, is_active
products: id, category_id, name, slug, description, price, stock, specs, is_active
product_images: id, product_id, storage_path, public_url, alt, sort_order, is_primary
product_bulk_discounts: id, product_id, min_quantity, price_per_unit
sales_contacts: id, name, role, phone, zalo, avatar_url, sort_order, is_active
inquiries: id, customer_name, phone, message, status, assigned_to, created_at
admin_users: id, email, role, is_active
audit_logs: id, actor_id, action, entity, entity_id, metadata, created_at
```

## Supabase Rules

- Enable RLS for public tables.
- Public can read only `is_active = true`.
- Public can create inquiries only.
- Admin mutations must be server-side guarded.
- Do not hardcode admin email in client.
- Do not expose service role/secret keys.
- Use Server Actions or Route Handlers for sensitive mutations.
- Store image files in Supabase Storage; DB stores only path/url/metadata.

## Roles

```txt
super_admin : full access
admin       : manage main content
editor      : create/update content, no sensitive settings/users
viewer      : read-only
```

## Suggested Folders

```txt
lib/supabase/client.ts
lib/supabase/server.ts
lib/services/categories.ts
lib/services/products.ts
lib/services/inquiries.ts
lib/services/storage.ts
app/admin/(auth)/
app/admin/(dashboard)/
```

## Code Rules

- Clean code, small components, clear naming.
- TypeScript strict; avoid `any`.
- Keep alias `@/*`.
- Do not redesign UI unless requested.
- Do not change routes/schema/business logic without context.
- Ask first when requirements are unclear.
- Do not commit/push/deploy without approval.
- Client components use browser-safe code only.
- Server-only code must not be imported into client components.
- Validate all forms.
- Upload image: validate type/size.
- Admin UI needs loading/error/empty/success states.
- Keep brand style: red `#E31E24`, navy `#1B3A6B`, bright professional layout.

## Do Not Do

- Do not add backend legacy back.
- Do not expose secrets.
- Do not build payment/cart unless requested.
- Do not remove existing public features.
- Do not break `/danh-muc` or `/danh-muc/[slug]`.
- Do not silently perform destructive actions.

## Task Checklist

Before finishing:
- TypeScript passes.
- No backend legacy expansion.
- No exposed secrets.
- RLS/role guard considered for mutations.
- Admin route guarded server-side.
- Catalog/search/modal still works.
- Important admin mutation logs audit if relevant.
