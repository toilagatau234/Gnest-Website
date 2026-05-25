# AGENTS.md — AI Coding Guide for Gnest-Website

> File này là tài liệu định hướng bắt buộc cho AI coding agent khi chỉnh sửa dự án `Gnest-Website`.
> Mục tiêu: mọi thay đổi code phải đi đúng hướng sản phẩm, đúng stack kỹ thuật, tránh tự động kéo lại Firebase hoặc lưu ảnh sai nơi.

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

Đây không phải là sàn thương mại điện tử hoàn chỉnh ở giai đoạn hiện tại. Hướng ưu tiên là website doanh nghiệp + catalog + lead/contact.

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

## 5. Định hướng kiến trúc Supabase

Tạo module Supabase tập trung, không gọi Supabase rải rác trong component.

Đề xuất cấu trúc:

```txt
lib/
  supabase/
    client.ts          # Supabase browser client, dùng NEXT_PUBLIC_* only
    server.ts          # Supabase server client nếu cần server actions/route handlers
    admin.ts           # Supabase service role, chỉ dùng server-side, tuyệt đối không import ở client
    queries/
      categories.ts
      products.ts
      contacts.ts
      jobs.ts
    types.ts           # Database types hoặc type mapping
```

Quy tắc:

- Client component chỉ dùng anon key.
- Service role key chỉ dùng trong route handler/server action.
- Bật RLS cho bảng public.
- Các mutation quản trị phải có auth/role rõ ràng.
- Không hard-code email admin trong component UI. Nếu cần admin, tạo bảng `profiles` hoặc `admin_users` trong Supabase.

---

## 6. Gợi ý schema Supabase/PostgreSQL

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
  created_at timestamptz default now()
);
```

---

## 7. Định hướng Cloudinary

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

## 8. Quy tắc migration từ Firebase sang Supabase

Khi thực hiện migration, ưu tiên làm theo thứ tự:

1. Cài package Supabase/Cloudinary cần thiết.
2. Tạo `lib/supabase/*`.
3. Thay `FirebaseProvider` bằng provider/auth/data flow mới nếu cần.
4. Refactor `CategoriesProvider` để lấy dữ liệu từ Supabase thay vì Firestore.
5. Chuyển `DEFAULT_CATEGORIES`, `DEFAULT_ITEMS`, `SALE_CONTACTS` thành seed data hoặc fallback tạm thời.
6. Xóa import từ `firebase/*`.
7. Gỡ dependency `firebase` và `firebase-tools` khỏi `package.json` sau khi không còn import Firebase.
8. Xóa/không dùng `firebase-applet-config.json`, `lib/firebase.ts`, `lib/firebase-provider.tsx`.
9. Cập nhật README/.env example theo Supabase + Cloudinary.

Không được làm:

- Không tạo thêm collection Firestore.
- Không thêm logic Firebase Auth mới.
- Không dùng Firebase Storage.
- Không tạo `firebaseConfig` mới.
- Không commit API secret thật.

---

## 9. Quy tắc dữ liệu/catalog

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

## 10. Quy tắc UI/UX

Giữ phong cách hiện tại:

- Màu chính: đỏ `#E31E24`, navy `#1B3A6B`, nền sáng/trắng.
- Website cần cảm giác chuyên nghiệp, rõ catalog, dễ liên hệ.
- Ưu tiên responsive tốt trên mobile.
- CTA chính: gọi điện, Zalo, nhận báo giá.
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

## 11. Quy tắc code

- Dùng TypeScript nghiêm túc, không lạm dụng `any`.
- Giữ alias import `@/*`.
- Không phá vỡ App Router conventions.
- Client component phải có `'use client'` khi dùng state/effect/context/browser APIs.
- Server-only code không được import vào client component.
- Tránh duplicate logic lọc/search ở nhiều nơi; nếu lớn dần, tách helper.
- Với dữ liệu fetch từ Supabase, xử lý loading/error/empty state tử tế.
- Không hard-code dữ liệu doanh nghiệp mới trong component nếu đã có bảng Supabase phù hợp.
- Không đưa thông tin nhạy cảm vào client bundle.

---

## 12. Biến môi trường đề xuất

```env
# Supabase public client
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server-only Supabase admin
SUPABASE_SERVICE_ROLE_KEY=

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_FOLDER=gnest-website
```

Tuyệt đối không commit `.env.local` có secret thật.

---

## 13. Checklist trước khi hoàn thành một thay đổi

Trước khi kết thúc task, AI coding agent cần tự kiểm tra:

- Có lỡ thêm lại Firebase không?
- Có import từ `firebase/*` không?
- Có lưu ảnh sai chỗ không?
- Cloudinary secret có bị expose ra client không?
- Supabase service role có chỉ chạy server-side không?
- UI mobile có ổn không?
- Catalog/search/modal có còn hoạt động không?
- TypeScript có pass không?
- Có cập nhật README hoặc env example nếu thay đổi setup không?

---

## 14. Ưu tiên phát triển gần hạn

1. Chuẩn hóa Supabase schema + seed dữ liệu ban đầu.
2. Refactor data layer từ Firestore sang Supabase.
3. Tích hợp Cloudinary upload/display cho sản phẩm.
4. Làm admin CRUD danh mục/sản phẩm/ảnh/liên hệ/tuyển dụng.
5. Cải thiện search/filter theo dữ liệu thật.
6. Tối ưu SEO cho trang chủ và trang danh mục.
7. Cập nhật README hướng dẫn setup đúng stack.

---

## 15. Ghi nhớ quan trọng

Dự án này dùng Supabase + Cloudinary.

Firebase chỉ là legacy từ bản dựng ban đầu và không phải định hướng kỹ thuật của dự án.
