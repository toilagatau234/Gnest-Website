-- Seed data for Gnest-Website
-- Safe, repeatable, and idempotent seeding script.
-- Run this inside the Supabase SQL Editor.

-- =========================================================================
-- 1. SEED CATEGORIES (Parents first, then children)
-- =========================================================================
INSERT INTO public.categories (id, name, slug, type, parent_id, sort_order, has_filters, is_active)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'Chai Lọ Thủy Tinh', 'chai-lo-thuy-tinh', 'product', null, 1, true, true),
  ('10000000-0000-0000-0000-000000000005', 'Hộp Nhựa', 'hop-nhua', 'product', null, 5, false, true),
  ('10000000-0000-0000-0000-000000000006', 'Bao Bì Ngành Yến Sào', 'bao-bi-yen', 'product', null, 6, false, true),
  ('10000000-0000-0000-0000-000000000010', 'Phụ Kiện Ngành Yến Sào', 'phu-kien-yen', 'product', null, 10, false, true),
  ('10000000-0000-0000-0000-000000000015', 'Máy Móc Thiết Bị Ngành Yến Sào', 'may-moc-yen', 'product', null, 15, false, true),
  ('10000000-0000-0000-0000-000000000019', 'Thiết Kế & Thi Công Nội Ngoại Thất', 'thiet-ke-noi-ngoai-that', 'service', null, 19, false, true),
  ('10000000-0000-0000-0000-000000000020', 'Gia Công CNC Gỗ Công Nghiệp', 'gia-cong-cnc-go-cong-nghiep', 'service', null, 20, false, true),
  ('10000000-0000-0000-0000-000000000021', 'Thiết Kế Logo', 'thiet-ke-logo', 'service', null, 21, false, true),
  ('10000000-0000-0000-0000-000000000022', 'In Ấn Phẩm', 'in-an-pham', 'service', null, 22, false, true),
  ('10000000-0000-0000-0000-000000000023', 'In Ly Nhựa / In Cốc Nhựa', 'in-ly-nhua', 'service', null, 23, false, true),
  ('10000000-0000-0000-0000-000000000024', 'In Chai Lọ Thủy Tinh', 'in-chai-lo-thuy-tinh', 'service', null, 24, false, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  has_filters = EXCLUDED.has_filters,
  is_active = EXCLUDED.is_active;

INSERT INTO public.categories (id, name, slug, type, parent_id, sort_order, has_filters, is_active)
VALUES
  ('10000000-0000-0000-0000-000000000002', 'Chai Thủy Tinh', 'chai-thuy-tinh', 'product', '10000000-0000-0000-0000-000000000001', 2, true, true),
  ('10000000-0000-0000-0000-000000000003', 'Lọ Thủy Tinh', 'lo-thuy-tinh', 'product', '10000000-0000-0000-0000-000000000001', 3, true, true),
  ('10000000-0000-0000-0000-000000000004', 'Nắp Lọ', 'nap-lo', 'product', '10000000-0000-0000-0000-000000000001', 4, false, true),
  ('10000000-0000-0000-0000-000000000007', 'Bao Bì Yến Tinh Chế', 'bao-bi-yen-tinh-che', 'product', '10000000-0000-0000-0000-000000000006', 7, false, true),
  ('10000000-0000-0000-0000-000000000008', 'Bao Bì Yến Chưng', 'bao-bi-yen-chung', 'product', '10000000-0000-0000-0000-000000000006', 8, false, true),
  ('10000000-0000-0000-0000-000000000009', 'Túi Giấy', 'tui-giay', 'product', '10000000-0000-0000-0000-000000000006', 9, false, true),
  ('10000000-0000-0000-0000-000000000011', 'Khuôn', 'khuon', 'product', '10000000-0000-0000-0000-000000000010', 11, false, true),
  ('10000000-0000-0000-0000-000000000012', 'Nhíp', 'nhip', 'product', '10000000-0000-0000-0000-000000000010', 12, false, true),
  ('10000000-0000-0000-0000-000000000013', 'Cân Điện Tử', 'can-dien-tu', 'product', '10000000-0000-0000-0000-000000000010', 13, false, true),
  ('10000000-0000-0000-0000-000000000014', 'Màng Bọc Thực Phẩm', 'mang-boc-thuc-pham', 'product', '10000000-0000-0000-0000-000000000010', 14, false, true),
  ('10000000-0000-0000-0000-000000000016', 'Bàn Tinh Chế', 'ban-tinh-che', 'product', '10000000-0000-0000-0000-000000000015', 16, false, true),
  ('10000000-0000-0000-0000-000000000017', 'Máy Sấy Yến', 'may-say-yen', 'product', '10000000-0000-0000-0000-000000000015', 17, false, true),
  ('10000000-0000-0000-0000-000000000018', 'Máy Móc', 'may-moc', 'product', '10000000-0000-0000-0000-000000000015', 18, false, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  has_filters = EXCLUDED.has_filters,
  is_active = EXCLUDED.is_active;

-- =========================================================================
-- 2. SEED PRODUCTS
-- =========================================================================
INSERT INTO public.products (id, category_id, name, slug, description, price, stock, specs, is_active)
VALUES
  -- Chai Thủy Tinh
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    'Chai Thủy Tinh Tròn 200ml ĐTL',
    'chai-thuy-tinh-tron-200ml-dtl',
    '<div class="space-y-4"><div><p>Được làm bằng thủy tinh bền đẹp, rắn chắc. Chất liệu thủy tinh chống bám màu, bám mùi và không tương tác hóa học với các loại nước uống, đảm bảo an toàn cho sức khỏe.</p></div><div><h5 class="text-sm font-bold text-dtl-navy mb-2 pb-1 border-b-2 border-dtl-bg-alt uppercase tracking-wide">Nắp chai</h5><ul class="list-disc pl-5 space-y-1"><li>Nắp vặn bằng thiếc sơn tĩnh điện có ron cao su hoàn toàn kín nước 100%.</li><li>Màu sắc nắp: đen, vàng, trắng.</li></ul></div></div>',
    15000, 500, '{"dungTich": "200ml", "quyCach": "105 chai/thùng", "phiNap": "48mm", "loaiNap": "nắp kim loại", "color": "Clear"}'::jsonb, true
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'Chai Thủy Tinh Trụ Tròn 300ml',
    'chai-thuy-tinh-tru-tron-300ml',
    'Chai thủy tinh dáng trụ tròn cao cấp 300ml, thích hợp đựng sữa hạt, nước ép, mật ong, nước mát giải khát.',
    18000, 200, '{"dungTich": "300ml", "quyCach": "24 chai/thùng", "phiNap": "43mm", "loaiNap": "nắp kim loại", "color": "Clear"}'::jsonb, true
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000002',
    'Chai Thủy Tinh Dẹt Vương 250ml',
    'chai-thuy-tinh-det-vuong-250ml',
    'Kiểu dáng dẹt dẹt vương phong cách dẹt dẹt độc lạ, thủy tinh dày dặn, thích hợp đựng trà sữa, cafe lạnh, nước ép hoa quả.',
    21000, 120, '{"dungTich": "250ml", "quyCach": "48 chai/thùng", "phiNap": "38mm", "loaiNap": "nắp kim loại", "color": "Clear"}'::jsonb, true
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000002',
    'Chai Nắp Dây Xách Thể Thao 500ml',
    'chai-nap-day-xach-the-thao-500ml',
    'Chai thủy tinh thể thao cá tính, nắp có dây xách silicon tiện dụng mang đi tập, đi học, dã ngoại.',
    25000, 80, '{"dungTich": "500ml", "quyCach": "48 chai/thùng", "phiNap": "38mm", "loaiNap": "nắp dây xách", "color": "Clear"}'::jsonb, true
  ),

  -- Lọ Thủy Tinh
  (
    '20000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000003',
    'Hũ Thủy Tinh Lục Giác 280ml',
    'hu-thuy-tinh-luc-giac-280ml',
    'Hũ thủy tinh 6 cạnh lục giác cân đối, sang trọng thích hợp đựng mật ong, mứt trái cây, saffron, tinh bột nghệ.',
    12000, 150, '{"dungTich": "280ml", "quyCach": "24 hũ/thùng", "phiNap": "58mm", "loaiNap": "nắp kim loại", "color": "Clear"}'::jsonb, true
  ),
  (
    '20000000-0000-0000-0000-000000000006',
    '10000000-0000-0000-0000-000000000003',
    'Hũ Thủy Tinh Lục Giác 380ml',
    'hu-thuy-tinh-luc-giac-380ml',
    'Hũ thủy tinh lục giác loại lớn 380ml cao cấp, chống bám bụi bẩn, kín khít tuyệt đối.',
    14000, 300, '{"dungTich": "380ml", "quyCach": "24 hũ/thùng", "phiNap": "58mm", "loaiNap": "nắp kim loại", "color": "Clear"}'::jsonb, true
  ),
  (
    '20000000-0000-0000-0000-000000000007',
    '10000000-0000-0000-0000-000000000003',
    'Hũ Thủy Tinh Tròn Nắp Thiếc 500ml',
    'hu-thuy-tinh-tron-nap-thiec-500ml',
    'Hũ thủy tinh tròn truyền thống dung tích lớn 500ml, nắp vặn kim loại chắc chắn giúp bảo quản thực phẩm lâu dài.',
    16000, 50, '{"dungTich": "500ml", "quyCach": "24 hũ/thùng", "phiNap": "63mm", "loaiNap": "nắp kim loại", "color": "Clear"}'::jsonb, true
  ),

  -- Nắp Lọ
  (
    '20000000-0000-0000-0000-000000000008',
    '10000000-0000-0000-0000-000000000004',
    'Nắp Thiết Sơn Tĩnh Điện Vàng 58mm',
    'nap-thiet-son-tinh-dien-vang-58mm',
    'Nắp vặn thiếc xi vàng sang trọng phi 58mm, có gioăng cao su silicon chống tràn chống rò rỉ.',
    2000, 5000, '{"phiNap": "58mm", "loaiNap": "nắp kim loại", "color": "Gold"}'::jsonb, true
  ),
  (
    '20000000-0000-0000-0000-000000000009',
    '10000000-0000-0000-0000-000000000004',
    'Nắp Thiết Sơn Tĩnh Điện Đen 48mm',
    'nap-thiet-son-tinh-dien-den-48mm',
    'Nắp vặn thiếc sơn tĩnh điện màu đen phi 48mm bền bỉ, chịu nhiệt độ cao khi tiệt trùng.',
    1800, 4500, '{"phiNap": "48mm", "loaiNap": "nắp kim loại", "color": "Black"}'::jsonb, true
  ),

  -- Hộp Nhựa
  (
    '20000000-0000-0000-0000-000000000010',
    '10000000-0000-0000-0000-000000000005',
    'Hộp Nhựa Tròn Trong Suốt PET 1000ml',
    'hop-nhua-tron-trong-suot-pet-1000ml',
    'Hộp nhựa PET tròn cao cấp bền bỉ, độ trong suốt cao như thủy tinh, an toàn cho thực phẩm.',
    9000, 1200, '{"dungTich": "1000ml", "quyCach": "100 hộp/kiện", "loaiNap": "nắp nhựa", "color": "Clear"}'::jsonb, true
  ),
  (
    '20000000-0000-0000-0000-000000000011',
    '10000000-0000-0000-0000-000000000005',
    'Hộp Nhựa Vuông Nắp Bản Lề 500ml',
    'hop-nhua-vuong-nap-ban-le-500ml',
    'Hộp nhựa PP vuông tiện lợi có nắp gắn liền bản lề, thích hợp đựng thực phẩm mang đi hoặc thực phẩm đông lạnh.',
    4500, 2500, '{"dungTich": "500ml", "quyCach": "200 hộp/kiện", "color": "Clear"}'::jsonb, true
  ),

  -- Bao Bì Yến Tinh Chế
  (
    '20000000-0000-0000-0000-000000000012',
    '10000000-0000-0000-0000-000000000007',
    'Hộp Nhựa Hoa Mai Đựng Yến Sào Cao Cấp',
    'hop-nhua-hoa-mai-dung-yen-sao-cao-cap',
    'Hộp nhựa mica hình hoa mai trong suốt tinh tế, tôn vinh giá trị sản phẩm tổ yến tinh chế bên trong.',
    45000, 350, '{"dungTich": "100g", "color": "Clear"}'::jsonb, true
  ),
  (
    '20000000-0000-0000-0000-000000000013',
    '10000000-0000-0000-0000-000000000007',
    'Hộp Yến Sào Kim Cương ĐTL 100g',
    'hop-yen-sao-kim-cuong-dtl-100g',
    'Mẫu hộp nhựa đựng tổ yến góc cạnh sắc sảo như kim cương pha lê, bảo vệ tổ yến nguyên vẹn.',
    52000, 140, '{"dungTich": "100g", "color": "Clear"}'::jsonb, true
  ),

  -- Bao Bì Yến Chưng
  (
    '20000000-0000-0000-0000-000000000014',
    '10000000-0000-0000-0000-000000000008',
    'Khăn Hộp Quà Lót Nhung Đựng 6 Hũ Yến Chưng',
    'khan-hop-qua-lot-nhung-dung-6-hu-yen-chung',
    'Hộp carton cứng cáp in offset cao cấp kèm khay nhung đỏ/vàng quý phái đựng 6 hũ yến chưng.',
    65000, 120, '{}'::jsonb, true
  ),
  (
    '20000000-0000-0000-0000-000000000015',
    '10000000-0000-0000-0000-000000000008',
    'Khay Bi Giấy Carton Đựng Hũ Yến Chưng',
    'khay-bi-giay-carton-dung-hu-yen-chung',
    'Khay định hình carton bế lỗ tròn đựng hũ yến giúp chống va đập, nứt vỡ trong quá trình di chuyển.',
    12000, 800, '{}'::jsonb, true
  ),

  -- Túi Giấy
  (
    '20000000-0000-0000-0000-000000000016',
    '10000000-0000-0000-0000-000000000009',
    'Túi Giấy Quai Xách Cao Cấp Đựng 100g Yến Sào',
    'tui-giay-quai-xach-cao-cap-dung-100g-yen-sao',
    'Túi giấy in hoa văn ép kim sang trọng, có quai xách chắc chắn thích hợp làm túi quà tặng.',
    22000, 1000, '{}'::jsonb, true
  ),

  -- Khuôn Yến
  (
    '20000000-0000-0000-0000-000000000017',
    '10000000-0000-0000-0000-000000000011',
    'Khuôn Yến Inox Tròn Định Hình Tổ',
    'khuon-yen-inox-tron-dinh-hinh-to',
    'Khuôn đắp tổ yến inox 304 không gỉ, đục lỗ thông thoáng giúp yến nhanh ráo nước và nhanh khô.',
    15000, 600, '{}'::jsonb, true
  ),

  -- Nhíp
  (
    '20000000-0000-0000-0000-000000000018',
    '10000000-0000-0000-0000-000000000012',
    'Nhíp Gắp Lông Yến Chuyên Dụng Sọc ĐTL',
    'nhip-gap-long-yen-chuyen-dung-soc-dtl',
    'Nhíp thép sọc xi vân nổi cầm chắc tay, đầu nhíp cực nhọn và khít giúp gắp sạch tơ lông yến nhỏ nhất.',
    25000, 450, '{}'::jsonb, true
  ),
  (
    '20000000-0000-0000-0000-000000000019',
    '10000000-0000-0000-0000-000000000012',
    'Nhíp Thép Không Gỉ Cong Cao Cấp',
    'nhip-thep-khong-gi-cong-cao-cap',
    'Dáng nhíp cong chuẩn công thái học hỗ trợ thợ tinh chế nhặt lông yến nhanh chóng không mỏi tay.',
    35000, 200, '{}'::jsonb, true
  ),

  -- Cân điện tử
  (
    '20000000-0000-0000-0000-000000000020',
    '10000000-0000-0000-0000-000000000013',
    'Cân Tiểu Ly Điện Tử 500g/0.01g Siêu Chuẩn',
    'can-tieu-ly-dien-tu-500g-0-01g-sieu-chuan',
    'Cân điện tử độ chính xác cao 0.01g, màn hình LCD sáng rõ nét, dùng cân tổ yến chia ly sấy.',
    145000, 45, '{}'::jsonb, true
  ),

  -- Màng bọc
  (
    '20000000-0000-0000-0000-000000000021',
    '10000000-0000-0000-0000-000000000014',
    'Màng Bọc Thực Phẩm PVC ĐTL 30cm x 150m',
    'mang-boc-thuc-pham-pvc-dtl-30cm-x-150m',
    'Màng bọc dẻo dai cao cấp PVC kháng khuẩn tốt, bảo vệ hũ yến chưng tránh vi khuẩn xâm nhập.',
    75000, 180, '{}'::jsonb, true
  ),

  -- Bàn tinh chế
  (
    '20000000-0000-0000-0000-000000000022',
    '10000000-0000-0000-0000-000000000016',
    'Bàn Tinh Chế Yến Sào Inox 304 Toàn Bộ',
    'ban-tinh-che-yen-sao-inox-304-toan-bo',
    'Bàn inox chuyên dụng chống oxy hóa tốt nhất, bề mặt sáng loáng dễ tiệt trùng vệ sinh xưởng.',
    6500000, 10, '{}'::jsonb, true
  ),

  -- Máy sấy yến
  (
    '20000000-0000-0000-0000-000000000023',
    '10000000-0000-0000-0000-000000000017',
    'Máy Sấy Nhiệt Tổ Yến ĐTL 20 Tổ',
    'may-say-nhiet-to-yen-dtl-20-to',
    'Máy sấy nhiệt tuần hoàn khí sạch, sấy yến khô nhanh, giữ màu trắng đẹp nguyên thủy của tổ yến.',
    9500000, 4, '{}'::jsonb, true
  ),
  (
    '20000000-0000-0000-0000-000000000024',
    '10000000-0000-0000-0000-000000000017',
    'Máy Sấy Lạnh Tổ Yến Công Nghệ Cao 100 Tổ',
    'may-say-lanh-to-yen-cong-nghe-cao-100-to',
    'Hệ thống sấy lạnh đẳng cấp bậc nhất, tách ẩm tối tân giữ nguyên giá trị vi lượng chất dinh dưỡng quý giá trong tổ yến.',
    42000000, 2, '{}'::jsonb, true
  ),

  -- Máy móc khác
  (
    '20000000-0000-0000-0000-000000000025',
    '10000000-0000-0000-0000-000000000018',
    'Máy Rót Hũ Yến Chưng Bán Tự Động ĐTL-02',
    'may-rot-hu-yen-chung-ban-tu-dong-dtl-02',
    'Máy chiết rót định lượng dung dịch sệt tổ yến vào hũ thủy tinh tự động, độ chính xác cực cao.',
    18500000, 3, '{}'::jsonb, true
  ),
  (
    '20000000-0000-0000-0000-000000000026',
    '10000000-0000-0000-0000-000000000018',
    'Máy Siết Nắp Chai Hũ Yến Chưng Cầm Tay',
    'may-siet-nap-chai-hu-yen-chung-cam-tay',
    'Máy siết nắp cầm tay chuyên dụng khóa nắp thiếc kín hoàn toàn, chống lọt khí tiệt trùng.',
    4500000, 12, '{}'::jsonb, true
  ),

  -- DỊCH VỤ (Services)
  (
    '20000000-0000-0000-0000-000000000027',
    '10000000-0000-0000-0000-000000000019',
    'Thiết Kế Cửa Hàng Showroom Yến Sào Trọn Gói',
    'thiet-ke-cua-hang-showroom-yen-sao-tron-goi',
    'Thiết kế 3D và thi công lắp ráp trọn gói tủ kệ trưng bày showroom yến sào đẳng cấp chuyên nghiệp.',
    null, 0, '{}'::jsonb, true
  ),
  (
    '20000000-0000-0000-0000-000000000028',
    '10000000-0000-0000-0000-000000000020',
    'Gia Công Cắt Khắc CNC Gỗ MDF Công Nghiệp',
    'gia-cong-cat-khac-cnc-go-mdf-cong-nghiep',
    'Gia công cắt vách ngăn CNC, đục họa tiết tủ kệ gỗ công nghiệp MDF cho các cửa hàng đại lý.',
    null, 0, '{}'::jsonb, true
  ),
  (
    '20000000-0000-0000-0000-000000000029',
    '10000000-0000-0000-0000-000000000021',
    'Thiết Kế Logo Lập Diện Thương Hiệu Độc Quyền Ngành Yến',
    'thiet-ke-logo-lap-dien-thuong-hieu-doc-quyen-nganh-yen',
    'Thiết kế biểu trưng thương hiệu độc quyền ngành yến sào, đảm bảo gu thẩm mỹ cao, độc đáo.',
    null, 0, '{}'::jsonb, true
  ),
  (
    '20000000-0000-0000-0000-000000000030',
    '10000000-0000-0000-0000-000000000022',
    'In Catalogue & Brochure Giới Thiệu Tổ Yến',
    'in-catalogue-brochure-gioi-thieu-to-yen',
    'In ấn offset catalogue quảng bá tổ yến sào tinh chế chất lượng cao, màu sắc trung thực bắt mắt.',
    null, 0, '{}'::jsonb, true
  ),
  (
    '20000000-0000-0000-0000-000000000031',
    '10000000-0000-0000-0000-000000000023',
    'In Logo Lên Ly Nhựa Cốc Nhựa Trà Sữa PP/PET',
    'in-logo-len-ly-nhua-coc-nhua-tra-sua-pp-pet',
    'Dịch vụ in logo thương hiệu ly nhựa uống trà sữa, trà chanh PP/PET số lượng lớn giá cực mềm.',
    null, 0, '{}'::jsonb, true
  ),
  (
    '20000000-0000-0000-0000-000000000032',
    '10000000-0000-0000-0000-000000000024',
    'In Lụa Trực Tiếp Trên Trụ Chai Thủy Tinh & Hũ Yến',
    'in-lua-truc-tiep-tren-tru-chai-thuy-tinh-hu-yen',
    'In lụa tròn xoay trực tiếp lên chai thủy tinh, hũ yến chưng, logo không phai, sắc nét cực đẹp.',
    null, 0, '{}'::jsonb, true
  )
ON CONFLICT (slug) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  specs = EXCLUDED.specs,
  is_active = EXCLUDED.is_active;

-- =========================================================================
-- 3. SEED PRODUCT IMAGES (Predictable IDs for rerun safety)
-- =========================================================================
INSERT INTO public.product_images (id, product_id, storage_path, public_url, alt, sort_order, is_primary, is_active)
VALUES
  (
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'catalog/sua-200.png',
    'https://bizweb.dktcdn.net/thumb/large/100/091/995/products/sua-200.png',
    'Chai Thủy Tinh Tròn 200ml ĐTL',
    0, true, true
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    'catalog/sua-250.png',
    'https://bizweb.dktcdn.net/thumb/large/100/091/995/products/sua-250.png',
    'Chai Thủy Tinh Tròn 250ml ĐTL',
    1, false, true
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000002',
    'catalog/sua-300.png',
    'https://bizweb.dktcdn.net/thumb/large/100/091/995/products/sua-300.png',
    'Chai Thủy Tinh Trụ Tròn 300ml',
    0, true, true
  ),
  (
    '30000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000003',
    'catalog/chai-thuy-tinh-det-250.png',
    'https://bizweb.dktcdn.net/thumb/large/100/091/995/products/chai-thuy-tinh-det-250.png',
    'Chai Thủy Tinh Dẹt Vương 250ml',
    0, true, true
  ),
  (
    '30000000-0000-0000-0000-000000000005',
    '20000000-0000-0000-0000-000000000004',
    'catalog/day-xach.png',
    'https://bizweb.dktcdn.net/thumb/large/100/091/995/products/day-xach.png',
    'Chai Nắp Dây Xách Thể Thao 500ml',
    0, true, true
  ),
  (
    '30000000-0000-0000-0000-000000000006',
    '20000000-0000-0000-0000-000000000005',
    'catalog/luc-giac-280.png',
    'https://bizweb.dktcdn.net/thumb/large/100/091/995/products/luc-giac-280.png',
    'Hũ Thủy Tinh Lục Giác 280ml',
    0, true, true
  ),
  (
    '30000000-0000-0000-0000-000000000007',
    '20000000-0000-0000-0000-000000000006',
    'catalog/luc-giac-380.png',
    'https://bizweb.dktcdn.net/thumb/large/100/091/995/products/luc-giac-380.png',
    'Hũ Thủy Tinh Lục Giác 380ml',
    0, true, true
  ),
  (
    '30000000-0000-0000-0000-000000000008',
    '20000000-0000-0000-0000-000000000007',
    'catalog/hu-tron-500.png',
    'https://bizweb.dktcdn.net/thumb/large/100/091/995/products/hu-tron-500.png',
    'Hũ Thủy Tinh Tròn Nắp Thiếc 500ml',
    0, true, true
  )
ON CONFLICT (id) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  storage_path = EXCLUDED.storage_path,
  public_url = EXCLUDED.public_url,
  alt = EXCLUDED.alt,
  sort_order = EXCLUDED.sort_order,
  is_primary = EXCLUDED.is_primary,
  is_active = EXCLUDED.is_active;

-- =========================================================================
-- 4. SEED PRODUCT BULK DISCOUNTS (Predictable IDs for rerun safety)
-- =========================================================================
INSERT INTO public.product_bulk_discounts (id, product_id, min_quantity, price_per_unit, is_active)
VALUES
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 10, 14000, true),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 50, 13000, true),
  ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 100, 12000, true)
ON CONFLICT (id) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  min_quantity = EXCLUDED.min_quantity,
  price_per_unit = EXCLUDED.price_per_unit,
  is_active = EXCLUDED.is_active;

-- =========================================================================
-- 5. SEED SALES CONTACTS (Predictable IDs for rerun safety)
-- =========================================================================
INSERT INTO public.sales_contacts (id, name, role, phone, zalo, avatar_url, sort_order, is_active)
VALUES
  (
    '50000000-0000-0000-0000-000000000001',
    'CSKH / Hotline',
    'Tổng đài',
    '0939991551',
    '0939991551',
    'https://ui-avatars.com/api/?name=CSKH&background=e31e24&color=fff',
    1,
    true
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    'Nguyễn Văn Bình',
    'Chuyên viên tư vấn',
    '0901234567',
    '0901234567',
    'https://ui-avatars.com/api/?name=Binh&background=1a3060&color=fff',
    2,
    true
  ),
  (
    '50000000-0000-0000-0000-000000000003',
    'Trần Thị An',
    'Chuyên viên tư vấn',
    '0909876543',
    '0909876543',
    'https://ui-avatars.com/api/?name=An&background=1a3060&color=fff',
    3,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  phone = EXCLUDED.phone,
  zalo = EXCLUDED.zalo,
  avatar_url = EXCLUDED.avatar_url,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- =========================================================================
-- 6. SEED JOB VACANCIES (Predictable IDs for rerun safety)
-- =========================================================================
INSERT INTO public.job_vacancies (id, title, slug, description, location, salary_range, sort_order, is_active)
VALUES
  (
    '60000000-0000-0000-0000-000000000001',
    'Chuyên Viên Tư Vấn Bán Hàng (Sales Executive)',
    'sales-executive',
    '<h3>Mảng Kinh Doanh Bao Bì & Chai Lọ</h3><p>Yêu cầu công việc:</p><ul><li>Có tối thiểu 1 năm kinh nghiệm trong lĩnh vực sales, chăm sóc khách hàng hoặc ngành bao bì, hũ yến sào.</li><li>Giao tiếp lưu loát, đàm phán thuyết phục tốt.</li></ul><p>Quyền lợi:</p><ul><li>Lương cứng + % doanh số không giới hạn.</li><li>Tham gia bảo hiểm đầy đủ.</li></ul>',
    '716 Nguyễn Huệ, P. Mỹ Trà, Đồng Tháp',
    '7.000.000đ - 15.000.000đ',
    1,
    true
  ),
  (
    '60000000-0000-0000-0000-000000000002',
    'Kỹ Thuật Viên Vận Hành Máy CNC Gỗ Công Nghiệp',
    'cnc-operator',
    '<h3>Mảng Gia Công Sản Xuất CNC</h3><p>Yêu cầu công việc:</p><ul><li>Kinh nghiệm vận hành máy CNC cắt khắc gỗ tối thiểu 1 năm.</li><li>Biết đọc bản vẽ CAD/CAM cơ bản.</li></ul><p>Quyền lợi:</p><ul><li>Phụ cấp ăn trưa tại xưởng.</li><li>Thưởng tăng ca và năng suất.</li></ul>',
    'Phân xưởng Gia công CNC Đồng Tháp',
    '8.500.000đ - 13.000.000đ',
    2,
    true
  ),
  (
    '60000000-0000-0000-0000-000000000003',
    'Thiết Kế Đồ Họa Bao Bì & Logo Thương Hiệu',
    'graphic-designer',
    '<h3>Mảng In Ấn & Thiết Kế Thương Hiệu</h3><p>Yêu cầu công việc:</p><ul><li>Sử dụng thành thạo Photoshop, Illustrator, Corel Draw.</li><li>Có gu thẩm mỹ tốt, sáng tạo bao bì hũ yến sào.</li></ul><p>Quyền lợi:</p><ul><li>Thưởng nóng cho các dự án logo xuất sắc.</li><li>Môi trường sáng tạo năng động.</li></ul>',
    '716 Nguyễn Huệ, P. Mỹ Trà, Đồng Tháp',
    '8.000.000đ - 12.000.000đ',
    3,
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  location = EXCLUDED.location,
  salary_range = EXCLUDED.salary_range,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- =========================================================================
-- 7. SEED SITE CONTENTS (Predictable IDs for rerun safety)
-- =========================================================================
INSERT INTO public.site_contents (id, key, value, is_active)
VALUES
  (
    '70000000-0000-0000-0000-000000000001',
    'general_settings',
    '{"companyName": "Đại Tài Lợi", "brandName": "Gnest", "hotline": "0939.991.551", "address": "716 Nguyễn Huệ, P. Mỹ Trà, TP. Cao Lãnh, Đồng Tháp"}'::jsonb,
    true
  ),
  (
    '70000000-0000-0000-0000-000000000002',
    'home_hero',
    '{"title": "SẢN XUẤT THEO YÊU CẦU", "subtitle": "Đa dạng mẫu mã · Chất lượng đảm bảo · Giao hàng toàn quốc"}'::jsonb,
    true
  )
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  is_active = EXCLUDED.is_active;
