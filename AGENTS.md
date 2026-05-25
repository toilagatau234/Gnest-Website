# AGENTS.md — Gnest-Website Coding Rules

## Project

Website doanh nghiệp + catalog sản phẩm/dịch vụ cho Đại Tài Lợi. Client có trang chủ, danh mục sản phẩm/dịch vụ, tìm kiếm, lọc, modal chi tiết/báo giá, liên hệ Zalo/điện thoại và tuyển dụng. Dự án sẽ có admin/CMS để quản lý nội dung hiển thị phía client.

## Stack bắt buộc

- Next.js App Router + React + TypeScript.
- Tailwind CSS v4, font `Be Vietnam Pro`, icon `lucide-react`.
- Database/Auth: Supabase/PostgreSQL.
- Image storage: Cloudinary.
- Không dùng Firebase/Firestore/Firebase Auth/Firebase Storage/Firebase Hosting.

## Hiện trạng legacy cần thay thế

Repo hiện còn dấu vết Firebase từ bản dựng ban đầu:

- `package.json` còn `firebase`, `firebase-tools`.
- `app/providers.tsx` còn `FirebaseProvider`.
- `lib/categories-context.tsx` đang đọc/ghi Firestore.
- `lib/firebase.ts`, `lib/firebase-provider.tsx` là legacy.

Không mở rộng các phần Firebase. Khi migration xong thì gỡ dependency, import và file cấu hình Firebase.

## Data model chính

Nên giữ các nhóm dữ liệu:

- `categories`: danh mục sản phẩm/dịch vụ, cha/con, slug, sort order, active.
- `products`: tên, slug, mô tả, giá, tồn kho, thông số lọc, active.
- `product_images`: metadata ảnh Cloudinary, sort order.
- `product_bulk_discounts`: giá sỉ theo số lượng.
- `sales_contacts`: nhân viên liên hệ, phone, Zalo, avatar.
- `job_vacancies`: tin tuyển dụng.
- `inquiries`: yêu cầu báo giá/liên hệ.
- `site_contents`: nội dung trang chủ/footer/CTA/settings hiển thị client.
- `admin_users`: user admin và role.
- `audit_logs`: lịch sử thao tác admin.

## Supabase rules

- Bật RLS cho bảng public.
- Public client chỉ được đọc dữ liệu `is_active = true`.
- Mutation admin phải kiểm tra Supabase Auth + role server-side.
- Không hard-code email admin trong client.
- Service role/secret key chỉ dùng server-side.
- Admin mutation nên đi qua Server Actions hoặc Route Handlers.

## Admin/CMS

Có thể dùng route `/admin`, nhưng bảo mật không dựa vào việc giấu URL. Bảo mật chính là Auth + role + RLS + server-side guard.

Admin module nên có:

- Dashboard.
- Quản lý danh mục.
- Quản lý sản phẩm/dịch vụ.
- Upload/quản lý ảnh Cloudinary.
- Quản lý liên hệ/sales contacts.
- Quản lý nội dung trang chủ/footer/CTA.
- Quản lý tuyển dụng.
- Quản lý inquiry/báo giá.
- Quản lý admin users.
- Audit logs.

Role đề xuất:

- `super_admin`: toàn quyền.
- `admin`: quản lý nội dung chính.
- `editor`: tạo/sửa nội dung, không quản lý user/settings nhạy cảm.
- `viewer`: chỉ xem.

## Cloudinary rules

- Ảnh sản phẩm/dịch vụ/avatar/banner lưu ở Cloudinary.
- Supabase chỉ lưu metadata: `public_id`, `secure_url`, `width`, `height`, `alt`, `sort_order`.
- Không lưu ảnh base64/binary trong database.
- Không expose `CLOUDINARY_API_SECRET` ra client.
- Nếu dùng `next/image`, thêm remote pattern cho `res.cloudinary.com`.

## Env gợi ý

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_FOLDER=gnest-website

ADMIN_BASE_PATH=/admin
```

Không commit `.env.local` hoặc secret thật.

## Code conventions

- Dùng TypeScript rõ ràng, hạn chế `any`.
- Giữ alias import `@/*`.
- Client component chỉ dùng browser-safe code.
- Server-only code không import vào client component.
- Không đưa secret vào client bundle.
- Loading/error/empty state phải rõ ràng.
- UI client giữ phong cách đỏ `#E31E24`, navy `#1B3A6B`, nền sáng, chuyên nghiệp.
- Admin ưu tiên rõ ràng, nhanh, ít hiệu ứng, tránh thao tác nhầm.

## Checklist trước khi xong task

- Không thêm lại Firebase.
- Không expose Supabase/Cloudinary secret.
- Admin route có server-side guard.
- Mutation admin có kiểm tra role.
- RLS policy phù hợp.
- Ảnh đi qua Cloudinary.
- Catalog/search/modal client không hỏng.
- TypeScript pass.
- Có audit log cho thao tác quan trọng nếu task liên quan admin.
