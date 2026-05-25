# AGENTS.md — AI Coding Guide for Gnest-Website

> File này là tài liệu định hướng bắt buộc cho AI coding agent khi chỉnh sửa dự án `Gnest-Website`.
> Mục tiêu: mọi thay đổi code phải đi đúng hướng sản phẩm, đúng stack kỹ thuật, có admin quản trị nội dung an toàn, tránh tự động kéo lại Firebase hoặc lưu ảnh sai nơi.

---

## 1. Tóm tắt dự án

`Gnest-Website` là website giới thiệu doanh nghiệp và catalog sản phẩm/dịch vụ cho Công Ty TNHH MTV Đại Tài Lợi.

Website tập trung vào:

- Giới thiệu thương hiệu Đại Tài Lợi.
- Trưng bày sản phẩm: chai lọ thủy tinh, hộp nhựa, bao bì ngành yến, phụ kiện/máy móc ngành yến.
- Trưng bày dịch vụ: thiết kế, CNC, thiết kế logo, in ấn phẩm, in ly nhựa, in chai lọ thủy tinh.
- Tìm kiếm, lọc, xem chi tiết sản phẩm.
- Hiển thị giá lẻ, giá sỉ theo số lượng, tồn kho và nút liên hệ báo giá.
- Dẫn khách hàng liên hệ qua điện thoại/Zalo.
- Trang tuyển dụng.
- Admin/CMS để quản lý các nội dung hiển thị phía client.

Đây không phải là sàn thương mại điện tử hoàn chỉnh ở giai đoạn hiện tại. Hướng ưu tiên là website doanh nghiệp + catalog + lead/contact + admin quản trị nội dung.

---

## 2. Stack kỹ thuật bắt buộc

### Frontend

- Next.js App Router.
- React + TypeScript.
- Tailwind CSS v4.
- Font chính: `Be Vietnam Pro`.
- Icon: `lucide-react`.
- Animation/interaction: giữ tinh thần hiện tại, có thể dùng `motion` khi cần.

### Backend/database

- Bắt buộc dùng Supabase/PostgreSQL.
- Không dùng Firebase, Firestore, Firebase Auth, Firebase Storage hoặc Firebase Hosting cho dự án này.
- Không thêm lại package Firebase.
- Không tạo file cấu hình Firebase mới.

### Image/file storage

- Bắt buộc lưu ảnh bằng Cloudinary.
- Supabase chỉ lưu metadata ảnh, ví dụ: `public_id`, `secure_url`, `width`, `height`, `alt`, `sort_order`.
- Không lưu binary/base64 ảnh trực tiếp trong Supabase.
- Không dùng Firebase Storage.

---

## 3. Hiện trạng repo cần lưu ý

Repo hiện có dấu vết được export từ Google AI Studio:

- `README.md` vẫn đang hướng dẫn chạy app với `GEMINI_API_KEY`.
- `package.json` hiện có dependency `firebase` và devDependency `firebase-tools`; đây là phần cần loại bỏ khi migrate thật sang Supabase.
- `app/providers.tsx` hiện wrap `FirebaseProvider`, `CategoriesProvider`, `ModalProvider`.
- `lib/categories-context.tsx` hiện đang đọc/ghi collection Firestore `categories` và fallback về dữ liệu tĩnh trong `lib/data.ts`.
- `lib/firebase.ts` và `lib/firebase-provider.tsx` là phần legacy, không được mở rộng thêm.
- `lib/data.ts` đang chứa dữ liệu mẫu `DEFAULT_CATEGORIES`, `DEFAULT_ITEMS`, `SALE_CONTACTS` và các type nền tảng.
- `next.config.ts` đang cấu hình `output: 'standalone'`, `transpilePackages: ['motion']`, `reactStrictMode: true`.

Khi code, hãy xem các phần Firebase hiện tại là legacy cần thay thế, không phải định hướng tương lai.

---

## 4. Cấu trúc chức năng chính đang có

### App routes

- `/` — trang chủ, render các section chính.
- `/danh-muc` — trang tất cả danh mục/sản phẩm.
- `/danh-muc/[slug]` — trang danh mục sản phẩm/dịch vụ theo slug.
- `/tuyen-dung` — trang tuyển dụng.

### Layout/global

- `app/layout.tsx`:
  - khai báo metadata.
  - load font `Be Vietnam Pro`.
  - wrap toàn app bằng `Providers`.
  - render `SiteHeader`, `SiteFooter`, `FloatingCTA`, `ProductModal`, `ContactModal`.

### Trang chủ

- `app/page.tsx` render các section:
  - `HeroSection`
  - `WhyUsSection`
  - `ProcessSection`
  - `ProductsRender`
  - `Interactive3DShowcase`
  - `StaffSection`
  - `CtaBanner`

### Catalog

- `components/ProductsRender.tsx`:
  - lấy `catalog`, `categories`, `loading` từ `useCategories()`.
  - render danh mục sản phẩm gốc.
  - render block dịch vụ.
  - mở modal chi tiết sản phẩm bằng `openProductDetail`.

- `components/CatalogPage.tsx`:
  - render sidebar danh mục.
  - render danh sách dịch vụ.
  - lọc sản phẩm theo thông số.
  - hỗ trợ slug `all` cho tất cả sản phẩm.
  - mở modal chi tiết sản phẩm.

### Search

- `components/SiteSearch.tsx`:
  - tìm kiếm client-side trên `catalog`.
  - debounce 300ms.
  - mở `ProductModal` khi chọn kết quả.

### Modal/context

- `lib/context.tsx`:
  - quản lý state modal: catalog, product detail, contact, checkout.
  - lock scroll body khi modal mở.

- `components/ProductModal.tsx`:
  - hiển thị ảnh sản phẩm, tồn kho, giá sỉ/lẻ, quantity và thông số.
  - dùng `getDiscountedPrice` từ `lib/cart-context.tsx`.

- `components/ContactModal.tsx`:
  - hiển thị danh sách sales/contact từ `SALE_CONTACTS`.
  - hỗ trợ Zalo và gọi điện.

---

## 5. Định hướng Admin/CMS

Website sẽ có khu vực admin để quản lý các nội dung hiển thị phía client. Admin không chỉ là một trang `/admin` đơn giản, mà là một back-office nhỏ có xác thực, phân quyền, route guard, RLS và audit log.

### Chức năng admin cần xây dựng theo chức năng client hiện có

Admin nên có các module tương ứng:

1. Dashboard tổng quan
   - Số lượng sản phẩm, danh mục, dịch vụ, liên hệ/báo giá, bài tuyển dụng.
   - Các cảnh báo: sản phẩm hết hàng, sản phẩm chưa có ảnh, nội dung đang ẩn.

2. Quản lý danh mục
   - CRUD danh mục sản phẩm/dịch vụ.
   - Quản lý danh mục cha/con.
   - Quản lý slug, thứ tự hiển thị, trạng thái active/inactive.
   - Quản lý `has_filters`.

3. Quản lý sản phẩm/dịch vụ
   - CRUD sản phẩm/dịch vụ.
   - Quản lý tên, slug, mô tả, giá, tồn kho, thông số lọc.
   - Quản lý giá sỉ theo số lượng.
   - Quản lý trạng thái hiển thị.

4. Quản lý ảnh Cloudinary
   - Upload, thay đổi, sắp xếp, xóa ảnh sản phẩm/dịch vụ.
   - Lưu metadata ảnh ở Supabase.
   - Không lưu ảnh binary/base64 trong database.

5. Quản lý nhân viên kinh doanh/liên hệ
   - CRUD sales contacts.
   - Quản lý tên, vai trò, số điện thoại, Zalo, avatar, thứ tự hiển thị.

6. Quản lý nội dung trang chủ
   - Hero section.
   - Why us/giới thiệu.
   - Quy trình làm việc.
   - CTA banner.
   - Footer/company info.
   - Floating CTA/hotline/Zalo.

7. Quản lý tuyển dụng
   - CRUD vị trí tuyển dụng.
   - Quản lý phòng ban, lương, địa điểm, deadline, yêu cầu, quyền lợi, trạng thái hiển thị.

8. Quản lý yêu cầu báo giá/liên hệ
   - Xem danh sách inquiry.
   - Cập nhật trạng thái: `new`, `contacted`, `quoted`, `closed`, `spam`.
   - Ghi chú nội bộ nếu cần.

9. Quản lý tài khoản admin
   - Chỉ super admin mới được thêm/xóa/sửa quyền admin khác.
   - Không hard-code email admin trong source code.

10. Audit log
   - Ghi lại ai đã tạo/sửa/xóa nội dung nào.
   - Ghi thời gian, hành động, bảng, record id, dữ liệu trước/sau nếu cần.

---

## 6. Đề xuất route admin

Có thể dùng route `/admin`, nhưng tuyệt đối không xem việc “ẩn đường dẫn” là bảo mật.

Đề xuất route:

```txt
/admin/login
/admin
/admin/categories
/admin/products
/admin/products/new
/admin/products/[id]/edit
/admin/contacts
/admin/jobs
/admin/inquiries
/admin/site-content
/admin/settings
/admin/users
/admin/audit-logs
```

Nếu muốn khó đoán hơn trong production, có thể đặt admin base path qua biến môi trường:

```env
ADMIN_BASE_PATH=/admin-dtl-panel
```

Tuy nhiên, đây chỉ là giảm nhiễu/bot scan, không phải lớp bảo mật chính. Bảo mật chính vẫn là Auth + server-side authorization + RLS + không expose secret.

---

## 7. Mô hình bảo mật admin đề xuất

### Khuyến nghị cho project thực tế

Dùng Supabase Auth cho đăng nhập admin, kết hợp bảng `admin_users` hoặc `profiles` để kiểm tra quyền.

Luồng chuẩn:

1. Người dùng truy cập admin.
2. Middleware/proxy kiểm tra session.
3. Server kiểm tra user đã đăng nhập bằng Supabase Auth.
4. Server query bảng `admin_users`/`profiles` để xác định role.
5. Nếu không có quyền, redirect về login hoặc trả 403.
6. Các thao tác ghi dữ liệu đi qua Server Actions hoặc Route Handlers.
7. Mọi bảng public bật RLS.
8. Ghi mutation vào `audit_logs`.

### Không nên làm

- Không chỉ bảo vệ bằng đường dẫn `/admin`.
- Không hard-code `if email === '...'` trong component client.
- Không để service role/secret key trong browser.
- Không gọi mutation admin trực tiếp từ client nếu policy chưa chặt.
- Không tắt RLS cho tiện.
- Không dùng một tài khoản admin chung cho cả doanh nghiệp.

### Role đề xuất

```txt
super_admin: toàn quyền, quản lý admin khác.
admin: quản lý nội dung, sản phẩm, danh mục, tuyển dụng, liên hệ.
editor: tạo/sửa nội dung nhưng không quản lý user/setting nhạy cảm.
viewer: chỉ xem dashboard/inquiry, không sửa dữ liệu.
```

---

## 8. Định hướng kiến trúc Supabase

Tạo module Supabase tập trung, không gọi Supabase rải rác trong component.

Đề xuất cấu trúc:

```txt
lib/
  supabase/
    client.ts          # Supabase browser client, dùng NEXT_PUBLIC_* only
    server.ts          # Supabase server client cho Server Components, Server Actions, Route Handlers
    admin.ts           # Supabase secret/service role, chỉ dùng server-side sau khi đã authorization
    proxy.ts           # refresh session/token cho SSR nếu dùng @supabase/ssr
    queries/
      categories.ts
      products.ts
      contacts.ts
      jobs.ts
      inquiries.ts
      site-content.ts
      admin-users.ts
    types.ts           # Database types hoặc type mapping

lib/
  auth/
    require-admin.ts   # helper kiểm tra role admin server-side
    permissions.ts     # permission matrix

app/
  admin/
    layout.tsx         # admin shell + guard server-side
    login/page.tsx
    page.tsx
    categories/page.tsx
    products/page.tsx
```

Quy tắc:

- Client component chỉ dùng publishable/anon key.
- Secret/service role key chỉ dùng trong route handler/server action sau khi đã xác thực và phân quyền.
- Bật RLS cho bảng public.
- Các mutation quản trị phải có auth/role rõ ràng.
- Không hard-code email admin trong component UI. Nếu cần admin, tạo bảng `profiles` hoặc `admin_users` trong Supabase.

---

## 9. Gợi ý schema Supabase/PostgreSQL

Tên bảng có thể điều chỉnh, nhưng nên giữ quan hệ rõ ràng.

```sql
categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  type text not null check (type in ('product', 'service')),
  parent_id uuid references categories(id) on delete set null,
  has_filters boolean default false,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  name text not null,
  slug text unique,
  description_html text,
  price numeric,
  stock int,
  dung_tich text,
  quy_cach text,
  phi_nap text,
  loai_nap text,
  color text,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  cloudinary_public_id text not null,
  secure_url text not null,
  alt text,
  width int,
  height int,
  sort_order int default 0,
  created_at timestamptz default now()
);

product_bulk_discounts (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  threshold int not null,
  price_per_unit numeric not null,
  created_at timestamptz default now()
);

sales_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  phone text not null,
  zalo text,
  avatar_cloudinary_public_id text,
  avatar_url text,
  sort_order int default 0,
  is_active boolean default true
);

job_vacancies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department text,
  location text,
  salary text,
  type text,
  deadline date,
  requirements text[] default '{}',
  benefits text[] default '{}',
  is_active boolean default true,
  created_at timestamptz default now()
);

inquiries (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  customer_name text,
  phone text,
  zalo text,
  message text,
  quantity int,
  status text default 'new',
  internal_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('super_admin', 'admin', 'editor', 'viewer')),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

site_contents (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  title text,
  content jsonb not null default '{}',
  is_active boolean default true,
  updated_by uuid references auth.users(id),
  updated_at timestamptz default now()
);

audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id),
  actor_email text,
  action text not null,
  table_name text,
  record_id uuid,
  before_data jsonb,
  after_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);
```

---

## 10. RLS/policy định hướng

Bắt buộc bật RLS cho các bảng trong public schema.

Định hướng policy:

- Client public chỉ được `select` dữ liệu `is_active = true`.
- Admin đã đăng nhập và có `admin_users.is_active = true` mới được insert/update/delete.
- `admin_users` chỉ super admin được quản lý.
- `audit_logs` chỉ admin/super admin được đọc, không cho client public ghi trực tiếp.
- `inquiries` có thể cho public insert qua form liên hệ, nhưng cần rate limit/server validation/captcha nếu bị spam.

Không dựa vào UI để bảo mật. Ẩn nút trên giao diện chỉ là UX; quyền thật phải nằm ở server/RLS.

---

## 11. Định hướng Cloudinary

Dùng Cloudinary cho ảnh sản phẩm, ảnh dịch vụ, avatar nhân viên, banner nếu có CMS/admin.

Env đề xuất:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_FOLDER=gnest-website
```

Quy tắc:

- Upload ảnh nên đi qua route handler/server action để ký upload nếu cần bảo mật.
- Không expose `CLOUDINARY_API_SECRET` ra client.
- Sau khi upload, lưu metadata ảnh vào Supabase.
- Khi xóa sản phẩm, nên xóa record ảnh trong Supabase và cân nhắc cleanup Cloudinary bằng `public_id`.
- Nếu dùng `next/image`, thêm remote pattern cho `res.cloudinary.com` trong `next.config.ts`.

Ví dụ remote pattern cần có:

```ts
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'res.cloudinary.com',
      pathname: '/**',
    },
  ],
}
```

---

## 12. Quy tắc migration từ Firebase sang Supabase

Khi thực hiện migration, ưu tiên làm theo thứ tự:

1. Cài package Supabase/Cloudinary cần thiết.
2. Tạo `lib/supabase/*`.
3. Tạo auth/admin guard server-side.
4. Thay `FirebaseProvider` bằng provider/auth/data flow mới nếu cần.
5. Refactor `CategoriesProvider` để lấy dữ liệu từ Supabase thay vì Firestore.
6. Chuyển `DEFAULT_CATEGORIES`, `DEFAULT_ITEMS`, `SALE_CONTACTS` thành seed data hoặc fallback tạm thời.
7. Xóa import từ `firebase/*`.
8. Gỡ dependency `firebase` và `firebase-tools` khỏi `package.json` sau khi không còn import Firebase.
9. Xóa/không dùng `firebase-applet-config.json`, `lib/firebase.ts`, `lib/firebase-provider.tsx`.
10. Cập nhật README/.env example theo Supabase + Cloudinary.

Không được làm:

- Không tạo thêm collection Firestore.
- Không thêm logic Firebase Auth mới.
- Không dùng Firebase Storage.
- Không tạo `firebaseConfig` mới.
- Không commit API secret thật.

---

## 13. Quy tắc dữ liệu/catalog

Dữ liệu sản phẩm nên giữ model gần với các type hiện có:

- `CatalogItem` hiện có: `name`, `img`, `imgs`, `dungTich`, `quyCach`, `phiNap`, `loaiNap`, `color`, `desc`, `price`, `bulkDiscounts`, `stock`, `categoryId`.
- `DbCategory` hiện có: `id`, `title`, `type`, `hasFilters`, `parentId`, `sortOrder`.

Khi đưa vào Supabase:

- `id` frontend hiện có thể là slug; trong database nên dùng `uuid` + `slug` riêng.
- `categoryId` trong UI nên map từ `category.slug` hoặc `category.id` nhất quán.
- Ảnh nhiều tấm nên tách bảng `product_images` thay vì lưu mảng URL trong một cột.
- Giá sỉ nên tách bảng `product_bulk_discounts` để dễ quản trị.
- `desc` hiện là HTML string, cần sanitize hoặc quản trị an toàn trước khi render.

---

## 14. Quy tắc UI/UX

Giữ phong cách hiện tại:

- Màu chính: đỏ `#E31E24`, navy `#1B3A6B`, nền sáng/trắng.
- Website client cần cảm giác chuyên nghiệp, rõ catalog, dễ liên hệ.
- Admin cần rõ ràng, ít hiệu ứng, ưu tiên tốc độ nhập liệu và tránh thao tác nhầm.
- Ưu tiên responsive tốt trên mobile cho client; admin có thể tối ưu desktop trước nhưng vẫn không vỡ layout trên tablet.
- CTA chính phía client: gọi điện, Zalo, nhận báo giá.
- Không biến website thành checkout phức tạp nếu chưa có yêu cầu.
- Component phải dễ đọc, hạn chế file quá dài khi thêm chức năng mới.

Design token hiện nằm trong `app/globals.css`:

- `dtl-red`
- `dtl-red-dark`
- `dtl-navy`
- `dtl-navy-dark`
- `dtl-dark`
- `dtl-gray`
- `dtl-bg-alt`
- `dtl-border`

---

## 15. Quy tắc code

- Dùng TypeScript nghiêm túc, không lạm dụng `any`.
- Giữ alias import `@/*`.
- Không phá vỡ App Router conventions.
- Client component phải có `'use client'` khi dùng state/effect/context/browser APIs.
- Server-only code không được import vào client component.
- Tránh duplicate logic lọc/search ở nhiều nơi; nếu lớn dần, tách helper.
- Với dữ liệu fetch từ Supabase, xử lý loading/error/empty state tử tế.
- Không hard-code dữ liệu doanh nghiệp mới trong component nếu đã có bảng Supabase phù hợp.
- Không đưa thông tin nhạy cảm vào client bundle.
- Admin mutation nên ưu tiên Server Actions/Route Handlers để kiểm tra quyền tập trung.
- Mỗi thao tác ghi quan trọng nên tạo audit log.

---

## 16. Biến môi trường đề xuất

```env
# Supabase public client
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

# Legacy fallback only if project still uses old Supabase key style
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server-only Supabase admin/secret
SUPABASE_SECRET_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Admin route config
ADMIN_BASE_PATH=/admin

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_FOLDER=gnest-website
```

Tuyệt đối không commit `.env.local` có secret thật.

---

## 17. Checklist trước khi hoàn thành một thay đổi

Trước khi kết thúc task, AI coding agent cần tự kiểm tra:

- Có lỡ thêm lại Firebase không?
- Có import từ `firebase/*` không?
- Có lưu ảnh sai chỗ không?
- Cloudinary secret có bị expose ra client không?
- Supabase secret/service role có chỉ chạy server-side không?
- Admin route có guard server-side chưa?
- Admin mutation có kiểm tra role chưa?
- RLS policy có đúng chưa?
- Public client có chỉ thấy dữ liệu `is_active = true` không?
- UI mobile/client có ổn không?
- Catalog/search/modal có còn hoạt động không?
- TypeScript có pass không?
- Có audit log cho thao tác quan trọng không?
- Có cập nhật README hoặc env example nếu thay đổi setup không?

---

## 18. Ưu tiên phát triển gần hạn

1. Chuẩn hóa Supabase schema + seed dữ liệu ban đầu.
2. Refactor data layer từ Firestore sang Supabase.
3. Tạo Supabase Auth + admin guard + bảng `admin_users`.
4. Tạo admin layout và dashboard.
5. Tích hợp Cloudinary upload/display cho sản phẩm.
6. Làm admin CRUD danh mục/sản phẩm/ảnh/liên hệ/tuyển dụng.
7. Làm quản lý inquiry và audit log.
8. Cải thiện search/filter theo dữ liệu thật.
9. Tối ưu SEO cho trang chủ và trang danh mục.
10. Cập nhật README hướng dẫn setup đúng stack.

---

## 19. Ghi nhớ quan trọng

Dự án này dùng Supabase + Cloudinary.

Firebase chỉ là legacy từ bản dựng ban đầu và không phải định hướng kỹ thuật của dự án.

Admin có thể dùng `/admin`, nhưng bảo mật thật phải đến từ Supabase Auth, kiểm tra role server-side, RLS, secret key chỉ dùng phía server và audit log.
