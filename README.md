# 🧴 Gnest Website — Hệ thống Catalog & CMS Quản lý Bao bì Yến Sào (Đại Tài Lợi)

Chào mừng bạn đến với dự án **Gnest Website** - Nền tảng giới thiệu sản phẩm (Catalog) và hệ thống quản trị nội dung (CMS) chuyên nghiệp dành cho thương hiệu **Đại Tài Lợi** (Hũ/chai/lọ thủy tinh, bao bì phụ kiện ngành yến và các dịch vụ liên quan).

Dự án được xây dựng với hiệu năng tối ưu, thiết kế giao diện hiện đại sử dụng **Next.js 15 App Router**, **React 19**, **Tailwind CSS v4** và hệ thống cơ sở dữ liệu thời gian thực **Supabase**.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

| Thành phần | Công nghệ | Chi tiết phiên bản / thư viện |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 15 | App Router, Server Actions, Server Components |
| **Logic & UI Library** | React 19 / TypeScript | Quản lý state, Hook tối ưu, Type-safe |
| **CSS & Styling** | Tailwind CSS v4 | Thiết kế responsive, mượt mà, tùy chỉnh tối đa |
| **Icons & Animation** | Lucide React / Motion | Hệ thống icon tối giản, hiệu ứng chuyển động mượt |
| **Backend & Database** | Supabase | PostgreSQL, Supabase Auth, Storage (Bucket `product-images`), RLS |
| **Deploy & Hosting** | Vercel | Tự động hóa CI/CD, Edge Network tối ưu tốc độ tải |

---

## 🌟 Tính Năng Chính

### 🌐 1. Giao Diện Người Dùng (Public Client Site)
* **Trang chủ (`/`):** Hiển thị banner ấn tượng, các danh mục sản phẩm nổi bật, cam kết chất lượng dịch vụ của Đại Tài Lợi và các bài viết tuyển dụng/tin tức mới nhất.
* **Catalog Sản Phẩm (`/danh-muc`):** Bộ lọc đa năng (theo từ khóa, danh mục, khoảng giá), cho phép hiển thị tất cả các loại hũ yến, chai lọ thủy tinh, nắp thiếc hoặc phụ kiện đi kèm.
* **Chi Tiết Danh Mục (`/danh-muc/[slug]`):** Trang chuyên biệt của từng nhóm sản phẩm cụ thể.
* **Modal Chi Tiết Sản Phẩm:** Hiển thị thông số kỹ thuật (dung tích, kích thước, khối lượng), bộ sưu tập hình ảnh (Gallery), bảng giá sỉ/chiết khấu sỉ theo số lượng và nút CTA nhanh.
* **Hỗ trợ Khách sỉ & Liên hệ:** Tích hợp form yêu cầu báo giá/tư vấn và các nút liên hệ nhanh qua hotline, Zalo kinh doanh của nhân sự phụ trách.
* **Trang Tuyển Dụng (`/tuyen-dung`):** Công khai các vị trí tuyển dụng đang tuyển của doanh nghiệp.

### 🔐 2. Hệ Thống Quản Trị (Gnest Admin CMS - `/admin`)
* **Xác thực bảo mật:** Hệ thống đăng nhập bảo mật (Supabase Auth) được bảo vệ bằng Route Guards phía Server (`requireAdminAuth`).
* **Bảng điều khiển (Dashboard):** Tổng quan thống kê nhanh các sản phẩm đang bán, danh mục hiện có, yêu cầu báo giá mới nhận và nhật ký hoạt động.
* **Quản lý Danh mục:** Thêm, sửa, xóa, phân loại danh mục cha-con và kích hoạt/tắt trạng thái hiển thị của danh mục.
* **Quản lý Sản phẩm:** Chỉnh sửa thông tin chi tiết, giá bán sỉ/lẻ, cấu hình thông số kỹ thuật (specs), thiết lập khung chiết khấu theo số lượng (bulk discounts) và tải lên hình ảnh sản phẩm.
* **Quản lý Ảnh sản phẩm (Supabase Storage):** Lưu trữ hình ảnh sản phẩm trực tiếp trên Storage bucket `product-images`, tự động tạo URL public an toàn.
* **Hệ thống Tiếp nhận Yêu cầu (Inquiries):** Quản lý trạng thái xử lý các form liên hệ của khách hàng, phân công nhân sự hỗ trợ.
* **Quản lý Nhân sự hỗ trợ (Sales Contacts):** Danh sách liên hệ kinh doanh hiển thị ngoài client (số điện thoại, zalo, ảnh đại diện).
* **Phân Quyền Thành Viên (Roles):** Hỗ trợ phân quyền chặt chẽ: `super_admin` (toàn quyền), `admin` (quản trị viên), `editor` (chỉnh sửa nội dung), và `viewer` (chỉ xem dữ liệu).
* **Nhật Ký Hoạt Động (Audit Logs):** Ghi lại chi tiết mọi thao tác tạo/sửa/xóa của admin nhằm đảm bảo an ninh hệ thống.

---

## 📂 Cấu Trúc Thư Mục Dự Án

```txt
Gnest-Website/
├── app/                      # Next.js App Router
│   ├── (site)/               # Route groups chứa giao diện khách hàng (Home, danh-muc, tuyen-dung)
│   ├── actions/              # Server Actions xử lý logic mutation bảo mật
│   ├── admin/                # Trang CMS quản trị nội bộ (/admin, dashboard, quản lý sản phẩm/danh mục)
│   ├── globals.css           # Cấu hình Tailwind CSS v4 & Biến giao diện toàn cục
│   ├── layout.tsx            # Bố cục chính toàn trang
│   └── providers.tsx         # Context providers (Auth, Cart, Categories)
├── components/               # Thư viện React Components dùng chung
│   ├── CatalogPage.tsx       # Trang danh mục & bộ lọc
│   ├── ProductModal.tsx      # Popup thông tin chi tiết sản phẩm
│   ├── ContactModal.tsx      # Popup form gửi yêu cầu báo giá
│   ├── SiteHeader.tsx        # Thanh điều hướng header & Mega Menu
│   └── SiteFooter.tsx        # Chân trang hiển thị thông tin doanh nghiệp
├── docs/                     # Tài liệu & hình ảnh chụp giao diện hệ thống
├── hooks/                    # Các Custom React Hooks
├── lib/                      # Các dịch vụ kết nối & Logic dùng chung
│   ├── services/             # API services kết nối Supabase (products, categories, inquiries, storage)
│   └── supabase/             # Cấu hình Client/Server Supabase SDK
├── public/                   # Thư mục chứa tài nguyên tĩnh (Logo, favicon, ảnh mặc định)
└── supabase/                 # Cơ sở dữ liệu & Cấu hình Supabase
    ├── schema.sql            # Mã SQL tạo cấu trúc bảng, RLS, triggers, indexes
    ├── seed.sql              # Dữ liệu mẫu (catalog sản phẩm, liên hệ, nội dung site)
    └── auth_session_docs.md  # Tài liệu cấu hình chi tiết middleware xác thực
```

---

## 🚀 Hướng Dẫn Cài Đặt và Chạy Dự Án

### 1. Chuẩn Bị Trước Khi Cài Đặt (Prerequisites)
* Đã cài đặt **Node.js** (Khuyên dùng phiên bản LTS mới nhất - v18 hoặc v20+).
* Đã có tài khoản trên **[Supabase](https://supabase.com)**.

### 2. Thiết Lập Dự Án
Tải mã nguồn về máy tính và cài đặt các thư viện cần thiết:
```bash
# Cài đặt dependencies
npm install
```

### 3. Cấu Hình Cơ Sở Dữ Liệu Supabase
1. Truy cập vào trang quản trị [Supabase Dashboard](https://supabase.com/dashboard) và tạo một dự án mới (`Gnest-Website`).
2. Vào **Authentication** > **Providers** > **Email**: Kích hoạt Email Provider. Tạm thời tắt **Confirm email** nếu muốn tài khoản tự động hoạt động ngay khi tạo mà không cần click link xác nhận email thật.
3. Tạo Storage Bucket:
   * Tên bucket: `product-images`
   * Chế độ: **Public**
4. Khởi tạo Database:
   * Chọn mục **SQL Editor** trong thanh menu bên trái.
   * Tạo truy vấn mới, sao chép nội dung của file `supabase/schema.sql` dán vào và nhấn **Run** để khởi tạo các bảng và chính sách bảo mật (RLS).
   * Tạo tiếp truy vấn mới, sao chép nội dung của file `supabase/seed.sql` dán vào và nhấn **Run** để nạp toàn bộ danh mục sản phẩm, mẫu sản phẩm, thông tin sỉ lẻ và bài viết tuyển dụng thực tế.

### 4. Cấu Hình Biến Môi Trường (Environment Variables)
Tạo file `.env.local` ở thư mục gốc của dự án và dán cấu hình sau:
```bash
# Supabase Project URL (Tìm thấy trong Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase Anon Key (Khóa công khai dùng cho Client)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role Key (Khóa bảo mật Server-side dùng cho Server Actions)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
*(Lưu ý: Không bao giờ được commit file `.env.local` hoặc để lộ khóa `SUPABASE_SERVICE_ROLE_KEY`).*

### 5. Tạo và Cấp Quyền Tài Khoản Admin Đầu Tiên
1. Trên Supabase Dashboard, vào mục **Authentication** > **Users** > nhấn **Add User** và tạo một tài khoản mới.
2. Sao chép chuỗi **User ID** (UUID) của tài khoản vừa tạo.
3. Vào **SQL Editor** chạy truy vấn phân quyền cấp `super_admin` cho tài khoản này:
```sql
INSERT INTO public.admin_users (id, email, role, is_active)
VALUES (
  'UUID_CỦA_USER_BẠN_ĐÃ_COPY',
  'email-admin@example.com',
  'super_admin',
  true
);
```

### 6. Khởi Chạy Môi Trường Cục Bộ
Chạy lệnh khởi động máy chủ Next.js cục bộ:
```bash
npm run dev
```
Truy cập vào địa chỉ [http://localhost:3000](http://localhost:3000) trên trình duyệt để kiểm tra kết quả.

---

## 🔒 Cơ Chế Bảo Mật & RLS (Row Level Security)

Hệ thống tuân thủ nghiêm ngặt các quy chuẩn bảo mật cấp cơ sở dữ liệu:
* **Chính sách RLS:** Toàn bộ các bảng nghiệp vụ quan trọng đều được bật RLS.
* **Quyền đọc công khai (Anonymous Read):** Khách truy cập bên ngoài chỉ có quyền đọc các sản phẩm, danh mục và tin tuyển dụng có thuộc tính `is_active = true`.
* **Quyền ghi (Write):** Khách hàng vãng lai chỉ được phép thêm mới bản ghi vào bảng `inquiries` (gửi liên hệ báo giá).
* **Bảo mật Server Actions:** Toàn bộ các thao tác thêm/sửa/xóa của admin đều được kiểm tra phiên làm việc phía server-side (`lib/supabase/server.ts`) kết hợp kiểm tra quyền hạn của User trong bảng `admin_users` trước khi ghi nhận thay đổi vào cơ sở dữ liệu.

---

## 📊 Hình Ảnh Thực Tế Hệ Thống (Screenshots)

Toàn bộ các hình ảnh minh họa chi tiết về hệ thống được lưu trữ trong thư mục `docs/`. Bạn có thể tham khảo trực tiếp các trang giao diện tiêu biểu:
* **Trang chủ website:** `docs/01_home.png`
* **Trang Catalog sản phẩm:** `docs/02_catalog.png`
* **Modal thông số và bảng giá sỉ chi tiết:** `docs/04_product_detail_modal.png`
* **Màn hình đăng nhập trang quản trị:** `docs/07_admin_login.png`
* **Trang Dashboard CMS quản lý:** `docs/08_admin_dashboard.png`
* **Bảng điều khiển quản lý danh sách sản phẩm:** `docs/10_admin_products.png`

---

## 🚀 Triển Khai (Deployment)

Dự án được tối ưu hóa hoàn toàn để vận hành trên nền tảng **Vercel**:
1. Kết nối kho lưu trữ Git (GitHub, GitLab, Bitbucket) của bạn với Vercel.
2. Thêm đầy đủ 3 biến môi trường cấu hình tại mục **Environment Variables** trên Vercel tương ứng với tệp `.env.local`.
3. Vercel sẽ tự động phát hiện dự án Next.js và tiến hành build sản phẩm sản xuất (`npm run build`).

---

*Phát triển và vận hành bởi đội ngũ kỹ thuật Đại Tài Lợi & Đối tác.*
