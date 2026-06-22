-- ============================================================
-- PHASE 1: Deactivate old 6 templates (keep for backward compat)
-- ============================================================
UPDATE public.product_spec_templates
SET is_active = false
WHERE code IN ('plastic', 'glass', 'packaging', 'cap_bottle_jar', 'accessory', 'other');

-- ============================================================
-- PHASE 2: Insert 9 new product type templates
-- ============================================================
INSERT INTO public.product_spec_templates (code, name, name_template, is_active, sort_order)
VALUES
  ('glass_container',   'Hũ/Chai thủy tinh',    '{container_type} {capacity_ml}ml Phi {neck_diameter_mm}',   true, 10),
  ('plastic_container', 'Hộp/Hũ nhựa',          '{box_type} {weight_g}g',                                    true, 20),
  ('packaging_bag',     'Túi đóng gói',          'Túi {bag_type} {size}',                                     true, 30),
  ('cap_pump_stopper',  'Nắp/Bơm/Nút',           '{closure_type} Phi {size_mm}',                              true, 40),
  ('bird_nest_mold',    'Khuôn tổ yến',          'Khuôn {mold_type} {weight_g}g',                             true, 50),
  ('tweezers',          'Nhíp',                  'Nhíp {material} {length_cm}cm {tip_type}',                  true, 60),
  ('digital_scale',     'Cân điện tử',           'Cân điện tử {max_weight}',                                  true, 70),
  ('food_wrap',         'Màng bọc thực phẩm',    'Màng bọc {material} {width_cm}cm x {length_m}m',            true, 80),
  ('equipment',         'Thiết bị',              '{equipment_type}',                                           true, 90)
ON CONFLICT (code) DO UPDATE
  SET name          = EXCLUDED.name,
      name_template = EXCLUDED.name_template,
      is_active     = true,
      sort_order    = EXCLUDED.sort_order;

-- ============================================================
-- PHASE 3: Insert fields for each template
-- ============================================================

-- Helper: get template id by code
-- We use a DO block to look up IDs and insert fields idempotently.

DO $$
DECLARE
  t_glass_container   uuid;
  t_plastic_container uuid;
  t_packaging_bag     uuid;
  t_cap_pump_stopper  uuid;
  t_bird_nest_mold    uuid;
  t_tweezers          uuid;
  t_digital_scale     uuid;
  t_food_wrap         uuid;
  t_equipment         uuid;
BEGIN
  SELECT id INTO t_glass_container   FROM public.product_spec_templates WHERE code = 'glass_container';
  SELECT id INTO t_plastic_container FROM public.product_spec_templates WHERE code = 'plastic_container';
  SELECT id INTO t_packaging_bag     FROM public.product_spec_templates WHERE code = 'packaging_bag';
  SELECT id INTO t_cap_pump_stopper  FROM public.product_spec_templates WHERE code = 'cap_pump_stopper';
  SELECT id INTO t_bird_nest_mold    FROM public.product_spec_templates WHERE code = 'bird_nest_mold';
  SELECT id INTO t_tweezers          FROM public.product_spec_templates WHERE code = 'tweezers';
  SELECT id INTO t_digital_scale     FROM public.product_spec_templates WHERE code = 'digital_scale';
  SELECT id INTO t_food_wrap         FROM public.product_spec_templates WHERE code = 'food_wrap';
  SELECT id INTO t_equipment         FROM public.product_spec_templates WHERE code = 'equipment';

  -- Remove existing fields for these templates to avoid duplicates on re-run
  DELETE FROM public.product_spec_fields
  WHERE template_id IN (
    t_glass_container, t_plastic_container, t_packaging_bag,
    t_cap_pump_stopper, t_bird_nest_mold, t_tweezers,
    t_digital_scale, t_food_wrap, t_equipment
  );

  -- ── 1. glass_container ──────────────────────────────────────────
  INSERT INTO public.product_spec_fields
    (template_id, key, label, type, unit, options, is_required, is_filterable, is_active, sort_order)
  VALUES
    (t_glass_container, 'container_type',   'Loại hũ/chai',    'select', null,
      '["Hũ lục giác","Hũ vuông","Hũ tròn","Chai yến","Chai sữa","Chai thủy tinh"]'::jsonb,
      true, true, true, 1),
    (t_glass_container, 'capacity_ml',      'Dung tích',       'number', 'ml',  null,                    true,  true,  true, 2),
    (t_glass_container, 'neck_diameter_mm', 'Phi nắp',         'number', 'mm',  null,                    true,  true,  true, 3),
    (t_glass_container, 'cap_type',         'Loại nắp',        'select', null,
      '["Nắp vặn","Nắp cài","Nắp bơm","Nắp thiếc","Không có"]'::jsonb,
      false, false, true, 4),
    (t_glass_container, 'cap_color',        'Màu nắp',         'text',   null,  null,                    false, false, true, 5),
    (t_glass_container, 'packing_spec',     'Quy cách',        'text',   null,  null,                    false, false, true, 6),
    (t_glass_container, 'material',         'Chất liệu',       'select', null,
      '["Thủy tinh trong","Thủy tinh màu","Thủy tinh borosilicate"]'::jsonb,
      false, true,  true, 7),
    (t_glass_container, 'height_mm',        'Chiều cao',       'number', 'mm',  null,                    false, false, true, 8),
    (t_glass_container, 'diameter_mm',      'Đường kính',      'number', 'mm',  null,                    false, false, true, 9),
    (t_glass_container, 'note',             'Ghi chú',         'textarea', null, null,                   false, false, true, 10);

  -- ── 2. plastic_container ────────────────────────────────────────
  INSERT INTO public.product_spec_fields
    (template_id, key, label, type, unit, options, is_required, is_filterable, is_active, sort_order)
  VALUES
    (t_plastic_container, 'box_type',    'Loại hộp',    'select', null,
      '["Hộp tròn","Hộp vuông","Hộp bầu dục","Hộp chữ nhật"]'::jsonb,
      true,  true,  true, 1),
    (t_plastic_container, 'weight_g',    'Trọng lượng', 'number', 'g',   null,  true,  true,  true, 2),
    (t_plastic_container, 'material',    'Chất liệu',   'select', null,
      '["PET","PP","HDPE","PVC","LDPE","PS","ABS"]'::jsonb,
      false, true,  true, 3),
    (t_plastic_container, 'packing_spec','Quy cách',    'text',   null,  null,  false, false, true, 4),
    (t_plastic_container, 'note',        'Ghi chú',     'textarea', null, null, false, false, true, 5);

  -- ── 3. packaging_bag ────────────────────────────────────────────
  INSERT INTO public.product_spec_fields
    (template_id, key, label, type, unit, options, is_required, is_filterable, is_active, sort_order)
  VALUES
    (t_packaging_bag, 'size',           'Kích thước',           'text',         null, null,
      true,  false, true, 1),
    (t_packaging_bag, 'bag_type',       'Loại túi',             'select',       null,
      '["Túi đứng có đáy","Túi zip","Túi 3 biên","Túi hút chân không","Túi đứng zipper"]'::jsonb,
      true,  true,  true, 2),
    (t_packaging_bag, 'surface_finish', 'Gia công bề mặt',      'select',       null,
      '["Cán bóng","Cán mờ","Tráng UV","Không xử lý"]'::jsonb,
      false, true,  true, 3),
    (t_packaging_bag, 'rope_type',      'Loại dây',             'select',       null,
      '["Dây giấy","Dây ribbon","Không có"]'::jsonb,
      false, false, true, 4),
    (t_packaging_bag, 'addon_features', 'Tính năng thêm',       'multi_select', null,
      '["Cửa sổ","Khóa zip","Van thở","Vòi rót"]'::jsonb,
      false, false, true, 5),
    (t_packaging_bag, 'note',           'Ghi chú',              'textarea',     null, null,
      false, false, true, 6);

  -- ── 4. cap_pump_stopper ─────────────────────────────────────────
  INSERT INTO public.product_spec_fields
    (template_id, key, label, type, unit, options, is_required, is_filterable, is_active, sort_order)
  VALUES
    (t_cap_pump_stopper, 'closure_type', 'Loại',        'select', null,
      '["Nắp vặn","Nắp bật","Nắp bơm","Nút chai","Nắp lật","Vòi xịt","Nắp chấm bi"]'::jsonb,
      true,  true,  true, 1),
    (t_cap_pump_stopper, 'size_mm',      'Phi',         'number', 'mm',  null,  true,  true,  true, 2),
    (t_cap_pump_stopper, 'material',     'Chất liệu',   'select', null,
      '["PP","PE","ABS","Nhôm","Thủy tinh"]'::jsonb,
      true,  true,  true, 3),
    (t_cap_pump_stopper, 'color',        'Màu sắc',     'text',   null,  null,  false, false, true, 4),
    (t_cap_pump_stopper, 'note',         'Ghi chú',     'textarea', null, null, false, false, true, 5);

  -- ── 5. bird_nest_mold ───────────────────────────────────────────
  INSERT INTO public.product_spec_fields
    (template_id, key, label, type, unit, options, is_required, is_filterable, is_active, sort_order)
  VALUES
    (t_bird_nest_mold, 'mold_type',    'Loại khuôn',  'select', null,
      '["Khuôn tổ sào","Khuôn tổ đùi gà","Khuôn tổ phẳng","Khuôn tổ trái tim"]'::jsonb,
      true,  true,  true, 1),
    (t_bird_nest_mold, 'weight_g',     'Trọng lượng', 'number', 'g',   null,  true,  false, true, 2),
    (t_bird_nest_mold, 'packing_spec', 'Quy cách',    'text',   null,  null,  false, false, true, 3),
    (t_bird_nest_mold, 'note',         'Ghi chú',     'textarea', null, null, false, false, true, 4);

  -- ── 6. tweezers ─────────────────────────────────────────────────
  INSERT INTO public.product_spec_fields
    (template_id, key, label, type, unit, options, is_required, is_filterable, is_active, sort_order)
  VALUES
    (t_tweezers, 'material',  'Chất liệu',   'select', null,
      '["Inox","Nhựa","Nhôm","Titan"]'::jsonb,
      true,  true,  true, 1),
    (t_tweezers, 'length_cm', 'Chiều dài',   'number', 'cm',  null,  true,  false, true, 2),
    (t_tweezers, 'tip_type',  'Đầu nhíp',    'select', null,
      '["Đầu thẳng","Đầu cong","Đầu tù","Đầu nhọn"]'::jsonb,
      true,  true,  true, 3),
    (t_tweezers, 'note',      'Ghi chú',     'textarea', null, null, false, false, true, 4);

  -- ── 7. digital_scale ────────────────────────────────────────────
  INSERT INTO public.product_spec_fields
    (template_id, key, label, type, unit, options, is_required, is_filterable, is_active, sort_order)
  VALUES
    (t_digital_scale, 'max_weight',   'Tải trọng tối đa', 'text',   null, null,  true,  false, true, 1),
    (t_digital_scale, 'accuracy',     'Độ chính xác',     'text',   null, null,  true,  false, true, 2),
    (t_digital_scale, 'battery_type', 'Loại pin',         'text',   null, null,  false, false, true, 3),
    (t_digital_scale, 'display_type', 'Loại màn hình',    'select', null,
      '["LED","LCD"]'::jsonb,
      false, false, true, 4),
    (t_digital_scale, 'note',         'Ghi chú',          'textarea', null, null, false, false, true, 5);

  -- ── 8. food_wrap ────────────────────────────────────────────────
  INSERT INTO public.product_spec_fields
    (template_id, key, label, type, unit, options, is_required, is_filterable, is_active, sort_order)
  VALUES
    (t_food_wrap, 'width_cm',  'Chiều rộng', 'number', 'cm', null,  true,  true,  true, 1),
    (t_food_wrap, 'length_m',  'Chiều dài',  'number', 'm',  null,  true,  false, true, 2),
    (t_food_wrap, 'material',  'Chất liệu',  'select', null,
      '["PE","PVC","PLA","PP"]'::jsonb,
      true,  true,  true, 3),
    (t_food_wrap, 'note',      'Ghi chú',    'textarea', null, null, false, false, true, 4);

  -- ── 9. equipment ────────────────────────────────────────────────
  INSERT INTO public.product_spec_fields
    (template_id, key, label, type, unit, options, is_required, is_filterable, is_active, sort_order)
  VALUES
    (t_equipment, 'equipment_type', 'Loại thiết bị', 'select', null,
      '["Máy hàn miệng túi","Máy đóng gói","Máy ghép mí","Máy rút màng","Máy dán nhãn","Máy in date","Máy hút chân không"]'::jsonb,
      true,  true,  true, 1),
    (t_equipment, 'power',          'Công suất',     'text',   null, null,  false, false, true, 2),
    (t_equipment, 'voltage',        'Điện áp',       'text',   null, null,  false, false, true, 3),
    (t_equipment, 'capacity',       'Năng suất',     'text',   null, null,  false, false, true, 4),
    (t_equipment, 'origin',         'Xuất xứ',       'select', null,
      '["Trung Quốc","Đài Loan","Việt Nam","Nhật Bản","Hàn Quốc"]'::jsonb,
      false, false, true, 5),
    (t_equipment, 'warranty',       'Bảo hành',      'text',   null, null,  false, false, true, 6),
    (t_equipment, 'note',           'Ghi chú',       'textarea', null, null, false, false, true, 7);

END $$;
