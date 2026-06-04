# Production Readiness Checklist — Gnest Website

Tài liệu này ghi lại các điểm cần kiểm tra trước khi triển khai production cho Gnest Website.

## 1. Environment variables

Bắt buộc cấu hình đủ các biến sau trên local, Docker host và Vercel:

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-or-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

Lưu ý: code hiện tại dùng `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, không dùng `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## 2. Local production build

```bash
npm ci
npm run lint
npm run build
npm run start
```

## 3. Docker deployment

Build image:

```bash
docker build -t gnest-website:local .
```

Run bằng Compose:

```bash
docker compose up --build -d
```

Ứng dụng chạy ở `http://localhost:3000`.

## 4. Supabase checks

- Đã chạy `supabase/schema.sql` và `supabase/seed.sql`.
- Đã tạo bucket `product-images` ở chế độ Public nếu tiếp tục dùng public URL.
- Đã tạo tài khoản admin đầu tiên trong bảng `admin_users`.
- RLS đang bật cho các bảng nghiệp vụ.
- Không dùng `SUPABASE_SERVICE_ROLE_KEY` ở client component.

## 5. Vercel deployment checks

- Project đã liên kết với GitHub repository `toilagatau234/Gnest-Website`.
- Build command: `npm run build`.
- Output framework: Next.js.
- Cấu hình đủ Environment Variables cho Production/Preview.
- `NEXT_PUBLIC_SITE_URL` phải trỏ về domain production sau khi có domain chính thức.

## 6. Known follow-up improvements

- Thêm GitHub Actions CI để chạy lint/build trước khi merge.
- Bật kiểm tra dependency security định kỳ.
- Chuẩn hóa README để tránh nhầm `NEXT_PUBLIC_SUPABASE_ANON_KEY` với `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Theo dõi bundle size do `xlsx` và thư viện animation có thể làm tăng JS nếu bị import tĩnh.
