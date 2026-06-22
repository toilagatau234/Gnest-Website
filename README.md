# 🧴 Gnest Website — Catalog & Admin CMS cho Đại Tài Lợi

Gnest Website là hệ thống giới thiệu sản phẩm và quản trị nội dung dành cho thương hiệu Đại Tài Lợi, tập trung vào catalog bao bì yến sào, hũ/chai/lọ thủy tinh, phụ kiện và các dịch vụ liên quan.

Dự án sử dụng **Next.js App Router**, **React**, **TypeScript**, **Tailwind CSS** và **Supabase** cho database, auth, storage và RLS.

---

## Tech stack

| Thành phần | Công nghệ |
| :--- | :--- |
| Frontend | Next.js App Router, React, TypeScript |
| UI | Tailwind CSS, Lucide React, Motion |
| Backend/Data | Supabase PostgreSQL, Supabase Auth, Storage |
| Admin CMS | Server Actions, Role-based access control |
| Deployment | Vercel hoặc Docker standalone |

---

## Tính năng chính

### Public site

- Trang chủ giới thiệu thương hiệu, danh mục nổi bật và CTA liên hệ.
- Catalog sản phẩm với bộ lọc theo từ khóa, danh mục, giá và trạng thái.
- **Bộ lọc động theo thông số kỹ thuật**: Lọc sản phẩm theo các tiêu chí (chất liệu, dung tích, loại nắp,...) được cấu hình động từ mẫu thông số (spec templates) trong DB.
- Trang danh mục chi tiết.
- Modal chi tiết sản phẩm gồm thông số kỹ thuật, gallery, bảng giá sỉ và CTA tư vấn.
- Form gửi yêu cầu báo giá/liên hệ.
- Trang tuyển dụng.
- **Tối ưu hóa SEO**: Tự động sinh `robots.txt` động (chặn index trên môi trường dev/staging, cho phép ở prod), sinh `sitemap.xml` tự động chứa danh sách sản phẩm và danh mục đang hoạt động, và chèn dữ liệu cấu trúc JSON-LD (`Organization`, `Product`, `CollectionPage`, `BreadcrumbList`) trên toàn bộ các trang.

### Admin CMS

- Đăng nhập bằng Supabase Auth.
- Route guard server-side qua `requireAdminAuth`.
- Dashboard thống kê sản phẩm, danh mục, yêu cầu báo giá và hoạt động gần đây.
- Quản lý danh mục cha-con, sản phẩm, hình ảnh, giá sỉ, yêu cầu liên hệ, nhân sự hỗ trợ, tuyển dụng, nội dung site và audit logs.
- **Quản lý Mẫu thông số (Spec Templates)**: Cho phép định nghĩa các trường thông số bắt buộc, tùy chọn, loại dữ liệu, và đánh dấu trường nào được phép lọc ở ngoài storefront.
- **Nhập dữ liệu từ Excel theo mẫu thông số**: Cho phép tải về file mẫu Excel động tương ứng với mẫu thông số đã chọn, kiểm tra lỗi hợp lệ (validation) trực quan từng dòng trước khi xác nhận nhập vào DB.
- Phân quyền `super_admin`, `admin`, `editor`, `viewer`.

---

## Cấu trúc thư mục

```txt
Gnest-Website/
├── app/                    # Next.js App Router
│   ├── (site)/             # Public client routes
│   ├── admin/              # Admin CMS routes
│   ├── actions/            # Server Actions
│   ├── globals.css
│   ├── layout.tsx
│   └── providers.tsx
├── components/             # Shared React components
├── docs/                   # Project docs and production checklist
├── hooks/                  # Custom hooks
├── lib/                    # Services, Supabase clients, shared logic
├── public/                 # Static assets
└── supabase/               # Schema, seed and Supabase notes
```

---

## Cài đặt local

### 1. Yêu cầu môi trường

- Node.js LTS khuyến nghị: Node 20+ hoặc Node 22+.
- npm.
- Tài khoản Supabase.

### 2. Cài dependencies

```bash
npm ci
```

### 3. Cấu hình biến môi trường

Tạo file `.env.local` từ `.env.example`:

```bash
cp .env.example .env.local
```

Các biến bắt buộc:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-or-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

> Lưu ý: code hiện tại dùng `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Không dùng tên cũ `NEXT_PUBLIC_SUPABASE_ANON_KEY` trong cấu hình dự án này.

### 4. Khởi tạo Supabase

1. Tạo Supabase project mới.
2. Bật Email Provider trong Authentication.
3. Tạo Storage bucket `product-images` ở chế độ Public nếu tiếp tục dùng public URL.
4. Chạy `supabase/schema.sql` trong SQL Editor.
5. Chạy `supabase/seed.sql` để nạp dữ liệu mẫu.
6. Tạo tài khoản admin đầu tiên trong Supabase Auth, sau đó cấp quyền:

```sql
INSERT INTO public.admin_users (id, email, role, is_active)
VALUES (
  'UUID_CUA_USER_ADMIN',
  'email-admin@example.com',
  'super_admin',
  true
);
```

### 5. Chạy development

```bash
npm run dev
```

Mở `http://localhost:3000` để kiểm tra public site và `/admin` để kiểm tra CMS.

---

## Kiểm tra trước khi deploy

```bash
npm run lint
npm run build
npm run start
```

Nếu build production lỗi vì thiếu Supabase env, kiểm tra lại `.env.local` hoặc environment variables trên hosting.

---

## Docker

Dự án đã bật `output: 'standalone'` trong `next.config.ts`, phù hợp để đóng gói Docker production.

Build image:

```bash
docker build -t gnest-website:local .
```

Chạy bằng Docker Compose:

```bash
docker compose up --build -d
```

Ứng dụng chạy ở:

```txt
http://localhost:3000
```

---

## Deploy Vercel

1. Tạo hoặc liên kết Vercel project với repository `toilagatau234/Gnest-Website`.
2. Framework preset: Next.js.
3. Build command: `npm run build`.
4. Thêm đầy đủ environment variables cho Preview và Production:

```bash
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-or-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

Sau khi có domain thật, cập nhật `NEXT_PUBLIC_SITE_URL` để metadata/canonical URL không trỏ về localhost.

---

## Ghi chú bảo mật

- Không commit `.env.local` hoặc khóa thật.
- `SUPABASE_SERVICE_ROLE_KEY` chỉ được dùng phía server.
- RLS phải được bật cho các bảng nghiệp vụ.
- Khi thay đổi schema, cần kiểm tra lại policy public/admin tương ứng.
- Nên chạy lint/build trước khi merge vào `main`.

---

## Tài liệu liên quan

- `docs/production-readiness.md`
- `docs/admin-performance-checklist.md`
- `docs/admin-performance-sql.md`
- `supabase/auth_session_docs.md`

---

Phát triển và vận hành bởi đội ngũ kỹ thuật Đại Tài Lợi & đối tác.
