# Hướng Dẫn Bootstrap Supabase & Xác Minh Admin Auth (Phase 0)

Tài liệu này cung cấp hướng dẫn từng bước để thiết lập cơ sở dữ liệu Supabase, tạo tài khoản quản trị đầu tiên, cấu hình môi trường Next.js và xử lý các lỗi thường gặp trong quá trình bootstrap hệ thống.

---

## Quy Trình Các Bước Thực Hiện

### Bước 1: Tạo Dự Án Supabase Mới
1. Truy cập vào trang quản trị [Supabase Dashboard](https://supabase.com/dashboard).
2. Nhấn nút **New Project**, chọn Organization của bạn.
3. Nhập các thông tin dự án:
   - **Name**: `Gnest-Website` (hoặc tên tùy chọn).
   - **Database Password**: Nhập mật khẩu mạnh (hãy lưu trữ cẩn thận).
   - **Region**: Chọn vùng gần nhất (ví dụ: `Singapore - ap-southeast-1` để có độ trễ thấp nhất).
4. Đợi vài phút để Supabase khởi tạo hạ tầng cơ sở dữ liệu.

### Bước 2: Bật Chức Năng Email/Password Authentication
1. Trên thanh điều hướng bên trái của bảng điều khiển Supabase, chọn **Authentication** (biểu tượng hình khóa).
2. Đi tới phần **Providers** > **Email**.
3. Đảm bảo rằng **Enable Email Provider** đã được bật (màu xanh).
4. Thiết lập các tùy chọn bổ sung (khuyên dùng cho môi trường phát triển cục bộ):
   - **Confirm email**: Có thể tạm thời tắt tùy chọn này (`Confirm email = false`) để tài khoản mới đăng ký tự động được kích hoạt ngay lập tức mà không cần xác nhận qua email thật.
5. Nhấn **Save**.

### Bước 3: Chạy Toàn Bộ `schema.sql` & `seed.sql` Trong SQL Editor
1. Chọn mục **SQL Editor** (biểu tượng bảng điều khiển SQL `SQL`) từ menu bên trái.
2. Nhấn **New Query** để tạo một trang soạn thảo mới.
3. Sao chép toàn bộ nội dung của tệp mã nguồn [schema.sql](./schema.sql), dán vào và nhấn **Run** (hoặc tổ hợp phím `Ctrl + Enter`). Lệnh này sẽ tự động khởi tạo tất cả các bảng cốt lõi, enums, triggers, chỉ mục và chính sách bảo mật cấp dòng (RLS).
4. Tiếp tục tạo một trang soạn thảo mới hoặc thay thế nội dung cũ bằng toàn bộ mã nguồn trong tệp [seed.sql](./seed.sql). Nhấn **Run** để nạp dữ liệu thật đầy đủ cho catalog sản phẩm, danh mục, liên hệ bán hàng, tin tuyển dụng và nội dung website.

### Bước 4: Tạo Tài Khoản User Đầu Tiên
1. Đi tới mục **Authentication** > **Users** từ menu bên trái.
2. Nhấn nút **Add User** > chọn **Create User**.
3. Nhập địa chỉ **Email** và **Password** cho tài khoản quản trị viên đầu tiên của bạn.
4. Nếu ở Bước 2 bạn chọn tắt *Confirm email*, tài khoản sẽ tự động chuyển sang trạng thái hoạt động ngay lập tức. Nếu bật *Confirm email*, hãy vào hòm thư điện tử của bạn hoặc kiểm tra tab *Inboxes* của dự án Supabase để kích hoạt tài khoản.

### Bước 5: Sao Chép User ID (UUID)
1. Trong màn hình danh sách **Users** của mục **Authentication**, tìm tài khoản bạn vừa tạo.
2. Tìm cột **User ID** (một chuỗi định dạng UUID, ví dụ: `e8f9d0c2-5b12-4c8d-aa9f-7c10d3abef89`).
3. Nhấn vào biểu tượng copy bên cạnh chuỗi UUID đó để sao chép vào bộ nhớ đệm.

### Bước 6: Phân Quyền Super Admin Trong SQL Editor
1. Quay lại mục **SQL Editor** và mở một truy vấn mới.
2. Dán đoạn mã SQL dưới đây, nhớ thay thế các giá trị mẫu bằng **UUID** và **Email** thực tế mà bạn vừa tạo ở Bước 4 & 5:

```sql
INSERT INTO public.admin_users (id, email, role, is_active)
VALUES (
  'UUID_CỦA_USER_BẠN_ĐÃ_COPY',  -- Thay thế bằng User ID UUID thực tế
  'email-admin-cua-ban@example.com', -- Thay thế bằng email của bạn
  'super_admin',
  true
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;
```
3. Nhấn **Run** để thực hiện lệnh chèn dữ liệu.

### Bước 7: Chạy Truy Vấn Kiểm Tra SQL & Dữ Liệu Seed
Để đảm bảo cơ sở dữ liệu đã được nạp dữ liệu thật chính xác và tài khoản của bạn được liên kết đúng quyền quản trị tối cao, hãy chạy các lệnh kiểm tra sau trong SQL Editor:

```sql
-- 1. Kiểm tra bản ghi admin vừa tạo
SELECT * FROM public.admin_users;

-- 2. Kiểm tra hàm phân quyền có nhận diện đúng người dùng đang truy cập hay không
SELECT app_private.is_admin();

-- 3. Xác minh số lượng danh mục đã được seed thành công
SELECT count(*) AS "total_categories" FROM public.categories;

-- 4. Xác minh danh sách sản phẩm và danh mục tương ứng
SELECT p.name AS "product_name", c.name AS "category_name", p.price
FROM public.products p
JOIN public.categories c ON p.category_id = c.id
ORDER BY c.name, p.name;

-- 5. Xem thông tin liên hệ bán hàng hỗ trợ khách sỉ
SELECT name, role, phone, zalo FROM public.sales_contacts ORDER BY sort_order;
```

> [!TIP]
> Bạn cũng có thể mở tệp [phase0_verify.sql](./phase0_verify.sql) và chạy toàn bộ các câu lệnh trong đó để có một báo cáo phân tích chi tiết về tính toàn vẹn của cơ sở dữ liệu.

### Bước 8: Cấu Hình Tệp `.env.local`
1. Tại thư mục gốc của dự án Next.js (bên ngoài thư mục `supabase`), tạo một tệp mới có tên là `.env.local`.
2. Sao chép các định nghĩa từ tệp `.env.example` và điền thông số kết nối từ dự án Supabase của bạn (tìm thấy trong mục **Project Settings** > **API**):

```bash
# Supabase URL kết nối
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Khóa công khai dùng cho phía Client
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpX...

# Khóa bí mật quản trị (Service Role) - CHỈ dùng ở Server-side, KHÔNG ĐƯỢC để lộ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> [!WARNING]
> Không bao giờ commit tệp `.env.local` chứa các key thật này lên Git. Tệp này đã được đưa vào `.gitignore` để đảm bảo an toàn tuyệt đối.

### Bước 9: Khởi Chạy Ứng Dụng Next.js Cục Bộ
1. Trong terminal tại thư mục dự án, chạy lệnh cài đặt dependencies (nếu chưa cài):
   ```bash
   npm install
   ```
2. Khởi chạy môi trường phát triển cục bộ:
   ```bash
   npm run dev
   ```
3. Mở trình duyệt và truy cập vào địa chỉ [http://localhost:3000](http://localhost:3000).

### Bước 10: Thử Nghiệm Luồng Đăng Nhập Đã Bootstrap
1. Truy cập vào trang đăng nhập quản trị: `/admin/login` (hoặc trực tiếp `/admin`).
2. Điền email và mật khẩu của tài khoản quản trị viên bạn đã đăng ký.
3. **Kết quả mong muốn**: 
   - Sau khi nhấn đăng nhập, hệ thống sẽ xác thực thông tin và tự động điều hướng bạn về trang quản trị `/admin/dashboard`.
   - Nếu bạn cố tình truy cập thẳng vào trang `/admin/dashboard` khi chưa đăng nhập, hệ thống bảo vệ route phía server (`requireAdminAuth`) sẽ tự động chặn và trả bạn về lại trang `/admin/login`.

---

## Hướng Dẫn Khắc Phục Sự Cố

### Lỗi: `relation "public.admin_users" does not exist`

Đây là lỗi phổ biến nhất xảy ra khi cơ sở dữ liệu Supabase chưa được khởi tạo đầy đủ hoặc ứng dụng Next.js kết nối tới một dự án database trống.

#### Nguyên nhân chính
1. **Thiếu Schema**: Chưa chạy hoặc chạy tệp `schema.sql` bị lỗi nửa chừng trong SQL Editor.
2. **Sai Schema kết nối**: Tệp `.env.local` đang trỏ tới một dự án Supabase khác hoặc sai thông số `NEXT_PUBLIC_SUPABASE_URL`.
3. **Thứ tự thực hiện không đúng**: Dự án Next.js cố gắng truy vấn kiểm tra quyền của người dùng trước khi bảng `admin_users` được định nghĩa.

#### Checklist Các Bước Giải Quyết

- [ ] **Bước 1: Xác nhận kết nối Database**
  Kiểm tra tệp `.env.local` để đảm bảo URL của Supabase trùng khớp chính xác với URL hiển thị trong Settings dự án của bạn trên Dashboard Supabase.
  
- [ ] **Bước 2: Chạy lại toàn bộ Schema**
  Vào SQL Editor, tạo một Query mới, dán toàn bộ nội dung của tệp `supabase/schema.sql` mới (bản an toàn đã cập nhật) và chạy lại. Do đã có cơ chế `IF NOT EXISTS` và `DROP ... IF EXISTS`, việc chạy lại sẽ hoàn toàn an toàn và sửa chữa mọi bảng bị thiếu.

- [ ] **Bước 3: Xác minh sự tồn tại của bảng**
  Chạy câu lệnh dưới đây trong SQL Editor để chắc chắn bảng đã được tạo thành công:
  ```sql
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name = 'admin_users'
  );
  ```
  *Kết quả mong muốn trả về là `true`.*

- [ ] **Bước 4: Kiểm tra phân quyền truy cập hàm**
  Hãy chắc chắn rằng các vai trò nặc danh (`anon`) và người dùng đã xác thực (`authenticated`) được cấp quyền sử dụng schema và hàm xác thực:
  ```sql
  GRANT USAGE ON SCHEMA public TO anon, authenticated;
  GRANT EXECUTE ON FUNCTION app_private.is_admin() TO anon, authenticated;
  ```

- [ ] **Bước 5: Restart Máy Chủ Next.js**
  Sau khi hoàn tất cấu trúc database, hãy tắt terminal chạy Next.js cục bộ (`Ctrl + C`) và khởi chạy lại (`npm run dev`) để đảm bảo Next.js nhận đầy đủ các biến môi trường mới và xoá bộ nhớ cache cũ.
