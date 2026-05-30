-- Gnest Website - Phase 0 Supabase Verification Queries
-- Run these queries in your Supabase SQL Editor to verify the bootstrap status.

-- =========================================================================
-- 1. KIỂM TRA SỰ TỒN TẠI CỦA CÁC BẢNG CORE TRONG public SCHEMA
-- =========================================================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'profiles', 'admin_users', 'categories', 'products', 
    'product_images', 'product_bulk_discounts', 'sales_contacts', 
    'job_vacancies', 'inquiries', 'site_contents', 'audit_logs'
  )
ORDER BY table_name;

-- =========================================================================
-- 2. XEM DANH SÁCH NGƯỜI DÙNG QUẢN TRỊ (ADMIN_USERS)
-- =========================================================================
-- Dùng truy vấn này để kiểm tra xem Super Admin đầu tiên đã được gán thành công hay chưa
SELECT id, email, role, is_active, created_at 
FROM public.admin_users;

-- =========================================================================
-- 3. TEST CÁC HÀM XÁC THỰC QUYỀN
-- =========================================================================
-- Lưu ý: Các câu lệnh này sẽ trả về true nếu tài khoản hiện tại bạn đang đăng nhập trong SQL Editor 
-- có UUID khớp với một tài khoản admin hoạt động trong bảng admin_users.
SELECT 
  app_private.is_admin() AS "is_logged_in_user_admin",
  app_private.is_super_admin() AS "is_logged_in_user_super_admin";

-- =========================================================================
-- 4. KIỂM TRA TRẠNG THÁI ROW-LEVEL SECURITY (RLS) TRÊN CÁC BẢNG CORE
-- =========================================================================
-- Tất cả các bảng core trong schema public đều PHẢI bật RLS (rowsecurity = true)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'profiles', 'admin_users', 'categories', 'products', 
    'product_images', 'product_bulk_discounts', 'sales_contacts', 
    'job_vacancies', 'inquiries', 'site_contents', 'audit_logs'
  )
ORDER BY tablename;

-- =========================================================================
-- 5. LIỆT KÊ CÁC CHÍNH SÁCH RLS ĐANG ĐƯỢC ÁP DỤNG
-- =========================================================================
-- Truy vấn này hiển thị danh sách chi tiết các policy đang hoạt động trên hệ thống
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
