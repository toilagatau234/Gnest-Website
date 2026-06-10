-- ============================================================
-- Phase C.2 — product spec templates DB foundation
-- Tables: product_spec_templates, product_spec_fields
-- RLS, grants, triggers, seed data mirroring lib/product-spec-templates.ts
-- ============================================================

-- ── 1. Tables ────────────────────────────────────────────────────────────────

create table if not exists public.product_spec_templates (
  id          uuid        primary key default gen_random_uuid(),
  code        text        not null unique
                          constraint product_spec_templates_code_format
                          check (code ~ '^[a-z][a-z0-9_]*$'),
  label       text        not null,
  description text,
  is_active   boolean     not null default true,
  sort_order  int         not null default 0
                          constraint product_spec_templates_sort_order_non_negative
                          check (sort_order >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.product_spec_fields (
  id          uuid        primary key default gen_random_uuid(),
  template_id uuid        not null references public.product_spec_templates(id) on delete cascade,
  key         text        not null
                          constraint product_spec_fields_key_format
                          check (key ~ '^[a-z][a-z0-9_]*$'),
  label       text        not null,
  type        text        not null
                          constraint product_spec_fields_type_check
                          check (type in ('text','number','select','multi_select','boolean','textarea')),
  unit        text,
  options     jsonb
                          constraint product_spec_fields_options_is_array
                          check (options is null or jsonb_typeof(options) = 'array'),
  required    boolean     not null default false,
  sort_order  int         not null default 0
                          constraint product_spec_fields_sort_order_non_negative
                          check (sort_order >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint product_spec_fields_template_key_unique unique (template_id, key)
);

create index if not exists product_spec_fields_template_id_idx
  on public.product_spec_fields(template_id);

-- ── 2. Triggers ──────────────────────────────────────────────────────────────

drop trigger if exists set_product_spec_templates_updated_at on public.product_spec_templates;
create trigger set_product_spec_templates_updated_at
  before update on public.product_spec_templates
  for each row execute function public.set_updated_at();

drop trigger if exists set_product_spec_fields_updated_at on public.product_spec_fields;
create trigger set_product_spec_fields_updated_at
  before update on public.product_spec_fields
  for each row execute function public.set_updated_at();

-- ── 3. RLS ───────────────────────────────────────────────────────────────────

alter table public.product_spec_templates enable row level security;
alter table public.product_spec_fields    enable row level security;

revoke insert, update, delete, truncate, references, trigger
  on public.product_spec_templates from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public.product_spec_fields from anon, authenticated;

grant select on public.product_spec_templates to anon, authenticated;
grant select on public.product_spec_fields    to anon, authenticated;

-- product_spec_templates policies
drop policy if exists "Public read active spec templates" on public.product_spec_templates;
create policy "Public read active spec templates"
  on public.product_spec_templates
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Admin manage spec templates" on public.product_spec_templates;
create policy "Admin manage spec templates"
  on public.product_spec_templates
  for all
  to authenticated
  using  (app_private.is_admin())
  with check (app_private.is_admin());

-- product_spec_fields policies
drop policy if exists "Public read spec fields" on public.product_spec_fields;
create policy "Public read spec fields"
  on public.product_spec_fields
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.product_spec_templates t
      where t.id = product_spec_fields.template_id
        and t.is_active = true
    )
  );

drop policy if exists "Admin manage spec fields" on public.product_spec_fields;
create policy "Admin manage spec fields"
  on public.product_spec_fields
  for all
  to authenticated
  using  (app_private.is_admin())
  with check (app_private.is_admin());

-- ── 4. Seed — templates ──────────────────────────────────────────────────────

insert into public.product_spec_templates (code, label, sort_order) values
  ('plastic',        'Bao bì nhựa',        1),
  ('glass',          'Bao bì thủy tinh',   2),
  ('packaging',      'Bao bì giấy / Hộp',  3),
  ('cap_bottle_jar', 'Nắp / Nút / Bơm',    4),
  ('accessory',      'Phụ kiện đóng gói',  5),
  ('other',          'Khác / Tùy chỉnh',   6)
on conflict (code) do nothing;

-- ── 5. Seed — fields ─────────────────────────────────────────────────────────

-- plastic (10 fields)
insert into public.product_spec_fields
  (template_id, key, label, type, unit, options, required, sort_order)
select t.id, v.key, v.label, v.type, v.unit, v.options::jsonb, v.required, v.sort_order
from public.product_spec_templates t,
(values
  ('material',      'Chất liệu',        'select',   null::text, '["PET","PP","HDPE","PVC","LDPE","PS","ABS"]', true,  1),
  ('capacity',      'Dung tích',        'number',   'ml',       null,                                          false, 2),
  ('dimensions',    'Kích thước (RxC)', 'text',     null::text, null,                                          false, 3),
  ('weight',        'Trọng lượng',      'number',   'g',        null,                                          false, 4),
  ('color',         'Màu sắc',          'text',     null::text, null,                                          false, 5),
  ('finish',        'Bề mặt',           'select',   null::text, '["Bóng","Mờ","Nhám","Vân"]',                 false, 6),
  ('cap_type',      'Loại nắp',         'text',     null::text, null,                                          false, 7),
  ('neck_size',     'Phi cổ',           'number',   'mm',       null,                                          false, 8),
  ('certification', 'Chứng nhận',       'text',     null::text, null,                                          false, 9),
  ('note',          'Ghi chú',          'textarea', null::text, null,                                          false, 10)
) as v(key, label, type, unit, options, required, sort_order)
where t.code = 'plastic'
on conflict (template_id, key) do nothing;

-- glass (10 fields)
insert into public.product_spec_fields
  (template_id, key, label, type, unit, options, required, sort_order)
select t.id, v.key, v.label, v.type, v.unit, v.options::jsonb, v.required, v.sort_order
from public.product_spec_templates t,
(values
  ('material',      'Chất liệu',             'select',   null::text, '["Thủy tinh trong","Thủy tinh màu","Thủy tinh borosilicate"]', true,  1),
  ('capacity',      'Dung tích',             'number',   'ml',       null,                                                            false, 2),
  ('dimensions',    'Kích thước (RxC)',       'text',     null::text, null,                                                            false, 3),
  ('weight',        'Trọng lượng',           'number',   'g',        null,                                                            false, 4),
  ('color',         'Màu sắc',               'text',     null::text, null,                                                            false, 5),
  ('finish',        'Kiểu dáng / Bề mặt',   'text',     null::text, null,                                                            false, 6),
  ('neck_size',     'Phi cổ',                'number',   'mm',       null,                                                            false, 7),
  ('cap_type',      'Loại nắp',              'text',     null::text, null,                                                            false, 8),
  ('certification', 'Chứng nhận',            'text',     null::text, null,                                                            false, 9),
  ('note',          'Ghi chú',               'textarea', null::text, null,                                                            false, 10)
) as v(key, label, type, unit, options, required, sort_order)
where t.code = 'glass'
on conflict (template_id, key) do nothing;

-- packaging (7 fields)
insert into public.product_spec_fields
  (template_id, key, label, type, unit, options, required, sort_order)
select t.id, v.key, v.label, v.type, v.unit, v.options::jsonb, v.required, v.sort_order
from public.product_spec_templates t,
(values
  ('material',   'Chất liệu',            'select',   null::text, '["Carton sóng","Carton cứng","Kraft","Duplex","Couche"]',   true,  1),
  ('dimensions', 'Kích thước (DxRxC mm)','text',     null::text, null,                                                         false, 2),
  ('gsm',        'Định lượng',           'number',   'gsm',      null,                                                         false, 3),
  ('print_type', 'In ấn',                'select',   null::text, '["Offset","Flexo","Kỹ thuật số","Không in"]',               false, 4),
  ('finish',     'Gia công bề mặt',      'select',   null::text, '["Không xử lý","Cán bóng","Cán mờ","Tráng UV","Dập nổi"]', false, 5),
  ('min_order',  'Số lượng tối thiểu',   'number',   'cái',      null,                                                         false, 6),
  ('note',       'Ghi chú',              'textarea', null::text, null,                                                         false, 7)
) as v(key, label, type, unit, options, required, sort_order)
where t.code = 'packaging'
on conflict (template_id, key) do nothing;

-- cap_bottle_jar (6 fields)
insert into public.product_spec_fields
  (template_id, key, label, type, unit, options, required, sort_order)
select t.id, v.key, v.label, v.type, v.unit, v.options::jsonb, v.required, v.sort_order
from public.product_spec_templates t,
(values
  ('type',      'Loại',         'select',   null::text, '["Nắp vặn","Nắp bật","Nắp bơm","Nút chai","Nắp lật","Vòi xịt","Nắp chấm bi"]', true,  1),
  ('material',  'Chất liệu',   'select',   null::text, '["PP","PE","ABS","Nhôm","Thủy tinh"]',                                            true,  2),
  ('neck_size', 'Phi cổ khớp', 'number',   'mm',       null,                                                                               false, 3),
  ('color',     'Màu sắc',     'text',     null::text, null,                                                                               false, 4),
  ('finish',    'Bề mặt',      'select',   null::text, '["Bóng","Mờ","Mạ"]',                                                              false, 5),
  ('note',      'Ghi chú',     'textarea', null::text, null,                                                                               false, 6)
) as v(key, label, type, unit, options, required, sort_order)
where t.code = 'cap_bottle_jar'
on conflict (template_id, key) do nothing;

-- accessory (5 fields)
insert into public.product_spec_fields
  (template_id, key, label, type, unit, options, required, sort_order)
select t.id, v.key, v.label, v.type, v.unit, v.options::jsonb, v.required, v.sort_order
from public.product_spec_templates t,
(values
  ('type',       'Loại phụ kiện', 'text',     null::text, null::text, true,  1),
  ('material',   'Chất liệu',     'text',     null::text, null::text, false, 2),
  ('dimensions', 'Kích thước',    'text',     null::text, null::text, false, 3),
  ('color',      'Màu sắc',       'text',     null::text, null::text, false, 4),
  ('note',       'Ghi chú',       'textarea', null::text, null::text, false, 5)
) as v(key, label, type, unit, options, required, sort_order)
where t.code = 'accessory'
on conflict (template_id, key) do nothing;
