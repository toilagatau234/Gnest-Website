The screenshots are references for structure only, not for final visual style.

# Admin UI Redesign Notes

## 1. Nhận xét chung về thiết kế AI Studio

Thiết kế AI Studio hiện tại chỉ dùng làm wireframe tham khảo, không dùng làm thiết kế cuối cùng.

Các vấn đề chính:
- Giao diện nhìn còn khá “AI-generated”, chưa có cảm giác được thiết kế thủ công.
- Typography chưa đẹp, chữ hơi cứng, thiếu cảm giác premium/professional.
- Một số card, badge, icon box nhìn lặp lại nhiều, gây cảm giác rập khuôn.
- Mật độ thông tin hơi cao, một số khu vực bị rối mắt.
- Phân cấp thị giác chưa rõ: chưa biết phần nào quan trọng nhất khi nhìn lần đầu.
- Màu sắc và hiệu ứng nhấn chưa tiết chế.
- Một số section có quá nhiều border, shadow hoặc icon trang trí.
- Layout đầy đủ chức năng nhưng chưa thật sự tối ưu cho admin thao tác hằng ngày.

## 2. Phong cách mong muốn

Giao diện admin nên có cảm giác:
- Tự nhiên hơn
- Sạch hơn
- Chuyên nghiệp hơn
- Ít màu mè hơn
- Dễ scan thông tin hơn
- Phù hợp với doanh nghiệp B2B Việt Nam
- Không giống template dashboard AI/SaaS generic

Style nên hướng tới:
- Bright admin dashboard
- Premium but simple
- Card trắng, border nhẹ
- Typography rõ ràng
- Khoảng trắng tốt
- Màu nhấn có kiểm soát
- Tránh lạm dụng gradient

## 3. Brand cần giữ

Màu sắc:
- Navy chính: #1B3A6B
- Red thương hiệu: #E31E24
- Background: #F7F9FB
- Card: #FFFFFF
- Border: #E2E8F0 hoặc #D7E0EC

Quy tắc dùng màu:
- Navy dùng cho primary button, heading chính, active state.
- Red chỉ dùng cho cảnh báo, destructive action, badge quan trọng hoặc điểm nhấn nhỏ.
- Không dùng quá nhiều màu phụ làm dashboard bị rối.
- Không biến giao diện thành dark dashboard.

Font:
- Be Vietnam Pro
- Heading cần chắc, gọn, hiện đại.
- Body text dễ đọc, không quá nhỏ.
- Label form rõ ràng, không quá đậm.

## 4. Những phần nên giữ từ thiết kế AI Studio

Có thể giữ:
- Cấu trúc sidebar trái + topbar + main content.
- Cách chia module admin: Dashboard, Danh mục, Sản phẩm, Yêu cầu báo giá, Liên hệ bán hàng, Tuyển dụng, Nội dung website, Người dùng quản trị, Nhật ký hoạt động.
- Ý tưởng dùng card cho dashboard.
- Ý tưởng dùng drawer/modal cho form thêm/sửa.
- Ý tưởng có filter/search cho bảng dữ liệu.
- Ý tưởng chia form sản phẩm thành nhiều tab.

Không nên copy nguyên:
- Style typography
- Gradient/icon box quá nhiều
- Card layout quá dày đặc
- Badge quá nhiều màu
- Các section trang trí nhưng không giúp admin thao tác tốt hơn

## 5. Dashboard cần cải thiện

Dashboard hiện nên tập trung vào việc admin cần xử lý trước.

Ưu tiên hiển thị:
1. KPI quan trọng
2. Việc cần xử lý
3. Yêu cầu báo giá gần đây
4. Sản phẩm có vấn đề
5. Nhật ký hoạt động
6. Trạng thái hệ thống

Không nên:
- Nhồi quá nhiều card cùng cấp.
- Dùng quá nhiều icon lớn.
- Dùng nhiều màu nền khác nhau.
- Làm dashboard giống SaaS analytics hoặc ecommerce revenue dashboard.

Dashboard cần trả lời nhanh:
- Có bao nhiêu yêu cầu báo giá mới?
- Có sản phẩm nào thiếu ảnh không?
- Có sản phẩm nào tồn kho thấp không?
- Có danh mục/sản phẩm nào đang bị ẩn không?
- Admin gần đây đã thao tác gì?

## 6. Trang sản phẩm cần cải thiện

Đây là màn hình quan trọng nhất.

Bảng sản phẩm cần dễ đọc, ưu tiên:
- Ảnh đại diện
- Tên sản phẩm
- Danh mục
- Giá
- Tồn kho
- Trạng thái
- Thao tác

Cần tránh:
- Quá nhiều cột gây rối.
- Action button quá nhiều nằm ngang.
- Badge quá nổi làm mất tập trung.
- Form sản phẩm quá dài trên một màn hình.

Form sản phẩm nên chia tab:
- Thông tin cơ bản
- Giá & kho
- Hình ảnh
- Thông số kỹ thuật
- Giá sỉ

Specs không nên nhập bằng JSON thô. Nên dùng key-value builder để admin dễ thao tác hơn.

## 7. Trang danh mục cần cải thiện

Danh mục cần thể hiện rõ quan hệ cha/con.

Nên có:
- Tree view cho danh mục cha/con.
- Table view cho quản lý nhanh.
- Search theo tên hoặc slug.
- Filter theo loại và trạng thái.
- Drawer thêm/sửa danh mục.

Cần làm rõ:
- Danh mục cha
- Danh mục con
- Số sản phẩm trong danh mục
- Thứ tự hiển thị
- Trạng thái hiển thị

## 8. Trang yêu cầu báo giá cần cải thiện

Trang này nên giống mini CRM, không chỉ là bảng dữ liệu.

Cần có:
- Status tabs: Tất cả, Mới, Đã liên hệ, Đã báo giá, Đã đóng, Spam.
- Bộ lọc theo trạng thái, ngày gửi, sản phẩm, người phụ trách.
- Quick action: Gọi, Email, Zalo, Xem chi tiết.
- Detail drawer để xem thông tin khách hàng và cập nhật trạng thái.

Cần ưu tiên:
- Yêu cầu mới phải nổi bật.
- Số điện thoại và action liên hệ phải dễ thao tác.
- Nội dung tin nhắn nên rút gọn trong table, xem đầy đủ trong drawer.

## 9. Sidebar và topbar cần cải thiện

Sidebar:
- Gọn hơn.
- Ít hiệu ứng hơn.
- Active state rõ nhưng không quá chói.
- Nhóm menu rõ ràng.
- Không dùng quá nhiều icon nổi bật.

Topbar:
- Đơn giản.
- Chỉ cần breadcrumb, search placeholder, role badge và logout.
- Không làm topbar quá cao hoặc quá nhiều chi tiết.

## 10. Table style mong muốn

Table nên:
- Header rõ, nền nhạt.
- Row spacing thoáng.
- Hover nhẹ.
- Cột quan trọng có font-weight cao hơn.
- Badge trạng thái nhỏ gọn, nhất quán.
- Action gom vào menu hoặc nhóm nút gọn.
- Có empty state khi chưa có dữ liệu.
- Có loading skeleton nếu cần.

Không nên:
- Border quá đậm.
- Shadow quá mạnh.
- Quá nhiều màu trong một hàng.
- Cột action chiếm quá nhiều diện tích.

## 11. Form / Drawer style mong muốn

Form nên:
- Có header rõ ràng.
- Có mô tả ngắn.
- Chia nhóm field hợp lý.
- Label rõ ràng.
- Input spacing thoải mái.
- Có helper text khi cần.
- Footer cố định với button Hủy / Lưu.
- Primary action dùng navy.
- Destructive action dùng red.

Drawer/modal:
- Không quá rộng nếu form ngắn.
- Với form sản phẩm có thể dùng drawer lớn hoặc modal lớn.
- Long form phải có tabs hoặc sections.

## 12. Những điều không được làm

Không được:
- Biến admin thành ecommerce dashboard nặng về doanh thu/cart/checkout.
- Thêm cart, checkout, payment, order fulfillment.
- Dùng service role ở client.
- Phá route public `/danh-muc` và `/danh-muc/[slug]`.
- Thay đổi business logic lớn nếu không cần.
- Thêm UI library nặng nếu chưa được duyệt.
- Copy nguyên style AI Studio.
- Làm giao diện quá màu mè hoặc quá nhiều animation.

## 13. Ưu tiên khi Claude Code/Codex thực hiện

Thứ tự ưu tiên:
1. Cải thiện layout shell: sidebar, topbar, spacing tổng thể.
2. Chuẩn hóa design system nhỏ cho admin.
3. Cải thiện dashboard.
4. Cải thiện products page.
5. Cải thiện categories page.
6. Cải thiện inquiries page.
7. Polish các placeholder pages.
8. Chỉ thêm audit logs page nếu không ảnh hưởng scope quá lớn.

## 14. Tiêu chí đánh giá sau khi làm xong

Giao diện sau khi cải thiện phải đạt:
- Nhìn tự nhiên hơn, không còn cảm giác AI-generated.
- Dễ đọc hơn.
- Ít rối mắt hơn.
- Dashboard có trọng tâm rõ.
- Table dễ scan hơn.
- Form dễ thao tác hơn.
- Màu sắc tiết chế hơn.
- Các component nhất quán hơn.
- Responsive ổn.
- Chức năng admin hiện có không bị hỏng.