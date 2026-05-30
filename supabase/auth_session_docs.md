# Supabase Auth & Session Security Documentation

Tài liệu này giải thích cách thức Next.js App Router quản lý phiên đăng nhập (session) của quản trị viên bằng cơ chế **Cookie Flow** của `@supabase/ssr`.

---

## 1. Cơ Chế Lưu Trữ Token Tiêu Chuẩn

Ứng dụng Gnest **không** tự xây dựng hệ thống quản lý Token riêng, cũng **không** lưu trữ `access_token` hay `refresh_token` thủ công vào `localStorage` của trình duyệt. 

Thay vào đó, hệ thống sử dụng gói thư viện chính thức `@supabase/ssr` để tự động hóa toàn bộ quy trình bảo mật:
- Khi đăng nhập thành công (`signInWithPassword`), máy chủ Supabase trả về cặp token gồm:
  - **Access Token (JWT)**: Chứa thông tin định danh và quyền hạn của người dùng, có thời hạn ngắn (mặc định 1 giờ) để tăng tính bảo mật.
  - **Refresh Token**: Dùng để lấy một Access Token mới khi cái cũ hết hạn, có thời hạn dài.
- Thư viện `@supabase/ssr` tự động ghi các token này vào **Cookies** của trình duyệt dưới các tên có tiền tố `sb-` (ví dụ: `sb-ref-auth-token`).
- Cookies này được cấu hình với thuộc tính `HttpOnly` và `Secure` (trên môi trường sản phẩm), giúp ngăn chặn các cuộc tấn công đánh cắp phiên qua XSS (cross-site scripting).

---

## 2. Vai Trò Của Middleware Trong Việc Refresh Session

Trong kiến trúc Next.js App Router, các trang tĩnh và Server Components có thể được phục vụ rất nhanh từ bộ nhớ đệm. Tuy nhiên, nếu Access Token trong cookie hết hạn và không được làm mới kịp thời, các truy vấn Server-side tiếp theo sẽ thất bại do không có quyền.

Để giải quyết vấn đề này, một tệp [middleware.ts](file:///d:/Gnest-Website/middleware.ts) tối giản đã được thiết lập ở thư mục gốc:
1. **Lắng nghe mọi Request**: Middleware chặn tất cả các yêu cầu tải trang hoặc API (ngoại trừ các tài nguyên tĩnh như ảnh, CSS, JS).
2. **Khởi tạo Client Server**: Middleware khởi tạo một Supabase Client bằng `@supabase/ssr` liên kết trực tiếp với cookies của request hiện tại.
3. **Tự động Làm mới (Refresh)**: Gọi hàm `supabase.auth.getUser()`. Nếu Access Token đã hết hạn nhưng Refresh Token còn hiệu lực, Supabase Client sẽ tự động gửi yêu cầu lấy Access Token mới, cập nhật lại cookies trong cả **Request** (để Server Component nhận được token mới ngay lập tức) và **Response** (để trình duyệt lưu lại token mới).

Nhờ cơ chế này, người dùng quản trị có thể làm việc liên tục mà không bao giờ bị ngắt quãng hoặc bị văng ra khỏi hệ thống một cách đột ngột.

---

## 3. Quy Tắc Bảo Mật Cần Tuân Thủ

- **Không lưu Token thủ công**: Tuyệt đối không sao chép token ra `localStorage`, `sessionStorage` hay cookies tự tạo.
- **Không dùng Service Role ở Client**: Khóa `SUPABASE_SERVICE_ROLE_KEY` tuyệt đối không được sử dụng ở Client (frontend) hoặc trong các file có chỉ thị `'use client'`. Nó chỉ được import ở Server (`lib/supabase/server.ts`) để phục vụ các tác vụ đặc quyền (như đọc bảng `admin_users` để gán vai trò).
- **Server-side Guards**: Các trang quản trị luôn được bảo vệ nghiêm ngặt ở phía Server bằng cách gọi hàm `requireAdminAuth()` trong các `layout.tsx` hoặc `page.tsx` thuộc nhánh `/admin`. Việc bảo vệ này xảy ra ngay tại Server trước khi bất kỳ giao diện HTML nào được gửi về trình duyệt, đảm bảo an toàn tuyệt đối.
