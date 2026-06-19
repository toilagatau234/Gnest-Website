export type FieldType = 'text' | 'number' | 'select' | 'multi_select' | 'boolean' | 'textarea';

export interface SpecField {
  key: string;
  label: string;
  type: FieldType;
  unit?: string;
  options?: string[];
  required?: boolean;
  sortOrder: number;
}

export interface SpecTemplate {
  label: string;
  fields: SpecField[];
  nameTemplate?: string;
}

export const TEMPLATE_KEYS = [
  // New product types (active)
  'glass_container',
  'plastic_container',
  'packaging_bag',
  'cap_pump_stopper',
  'bird_nest_mold',
  'tweezers',
  'digital_scale',
  'food_wrap',
  'equipment',
  // Legacy types (kept for backward compatibility with existing products)
  'plastic',
  'glass',
  'packaging',
  'cap_bottle_jar',
  'accessory',
  'other',
] as const;

export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

// Maps old template codes to their closest new equivalent (for documentation).
// Existing products keep their old _template value — no forced remapping.
export const LEGACY_TEMPLATE_ALIASES: Partial<Record<string, string>> = {
  plastic: 'plastic_container',
  glass: 'glass_container',
  packaging: 'packaging_bag',
  cap_bottle_jar: 'cap_pump_stopper',
  // accessory → manual remap by admin (could be tweezers, bird_nest_mold, equipment, etc.)
  other: 'other',
};

export interface TemplateRegistry {
  templates: Record<string, SpecTemplate>;
  keys: string[];
}

export function isKnownTemplate(value: unknown): value is TemplateKey {
  return typeof value === 'string' && (TEMPLATE_KEYS as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Server-side validation
// ---------------------------------------------------------------------------

/**
 * Validates a parsed specs object against template rules.
 * Throws a user-facing Error on any violation.
 * Safe to call from server actions — never touches the DOM.
 *
 * Pass a TemplateRegistry (from getActiveSpecTemplates) to validate against
 * live DB-loaded templates and fields. Omit to fall back to code templates.
 *
 * Rules:
 *  - No _template key → legacy/custom, always allowed.
 *  - _template === "other" → custom object, always allowed.
 *  - _template not in active registry keys → rejected.
 *  - Known template → required fields must be non-empty; number/select/
 *    multi_select/boolean fields are type-checked against the field config.
 */
export function validateSpecs(specs: Record<string, unknown>, registry?: TemplateRegistry): void {
  const templateValue = specs._template;

  // No _template: legacy or custom — nothing to validate.
  if (templateValue === undefined || templateValue === null) return;

  // "other" = free-form custom object, nothing to type-check.
  if (templateValue === 'other') return;

  // Resolve active template set from registry or fall back to code templates.
  const activeKeys: string[] = registry ? registry.keys : [...TEMPLATE_KEYS];
  const activeTemplates: Record<string, SpecTemplate> = registry
    ? registry.templates
    : (SPEC_TEMPLATES as Record<string, SpecTemplate>);

  // _template present but not in the active registry.
  if (typeof templateValue !== 'string' || !activeKeys.includes(templateValue)) {
    const allowed = activeKeys.filter((k) => k !== 'other').join(', ');
    throw new Error(
      `Mẫu thông số không hợp lệ: "${String(templateValue)}". Giá trị cho phép: ${allowed}, other.`,
    );
  }

  const template = activeTemplates[templateValue];
  if (!template) return;

  for (const field of template.fields) {
    const raw = specs[field.key];
    const strVal = raw != null ? String(raw).trim() : '';

    // Required check.
    if (field.required && !strVal) {
      throw new Error(
        `Thông số "${field.label}" là bắt buộc cho mẫu "${template.label}".`,
      );
    }

    // Skip type checks for empty optional fields.
    if (!strVal) continue;

    switch (field.type) {
      case 'number': {
        const n = Number(strVal);
        if (!Number.isFinite(n) || n < 0) {
          throw new Error(
            `Thông số "${field.label}" phải là số hợp lệ không âm (nhận được: "${strVal}").`,
          );
        }
        break;
      }
      case 'select': {
        if (field.options && !field.options.includes(strVal)) {
          throw new Error(
            `Giá trị "${strVal}" không hợp lệ cho "${field.label}". Cho phép: ${field.options.join(', ')}.`,
          );
        }
        break;
      }
      case 'multi_select': {
        if (field.options) {
          const parts = strVal.split(',').map((v) => v.trim()).filter(Boolean);
          const bad = parts.filter((v) => !field.options!.includes(v));
          if (bad.length > 0) {
            throw new Error(
              `Giá trị "${bad.join(', ')}" không hợp lệ cho "${field.label}". Cho phép: ${field.options.join(', ')}.`,
            );
          }
        }
        break;
      }
      case 'boolean': {
        if (strVal !== 'true' && strVal !== 'false') {
          throw new Error(
            `Thông số "${field.label}" phải là true hoặc false (nhận được: "${strVal}").`,
          );
        }
        break;
      }
    }
  }
}

export const SPEC_TEMPLATES: Record<TemplateKey, SpecTemplate> = {
  // ── New product types ──────────────────────────────────────────────────────

  glass_container: {
    label: 'Hũ/Chai thủy tinh',
    nameTemplate: '{container_type} {capacity_ml}ml Phi {neck_diameter_mm}',
    fields: [
      { key: 'container_type',   label: 'Loại hũ/chai', type: 'select', options: ['Hũ lục giác','Hũ vuông','Hũ tròn','Chai yến','Chai sữa','Chai thủy tinh'], required: true, sortOrder: 1 },
      { key: 'capacity_ml',      label: 'Dung tích',    type: 'number', unit: 'ml', required: true, sortOrder: 2 },
      { key: 'neck_diameter_mm', label: 'Phi nắp',      type: 'number', unit: 'mm', required: true, sortOrder: 3 },
      { key: 'cap_type',         label: 'Loại nắp',     type: 'select', options: ['Nắp vặn','Nắp cài','Nắp bơm','Nắp thiếc','Không có'], sortOrder: 4 },
      { key: 'cap_color',        label: 'Màu nắp',      type: 'text',   sortOrder: 5 },
      { key: 'packing_spec',     label: 'Quy cách',     type: 'text',   sortOrder: 6 },
      { key: 'material',         label: 'Chất liệu',    type: 'select', options: ['Thủy tinh trong','Thủy tinh màu','Thủy tinh borosilicate'], sortOrder: 7 },
      { key: 'height_mm',        label: 'Chiều cao',    type: 'number', unit: 'mm', sortOrder: 8 },
      { key: 'diameter_mm',      label: 'Đường kính',   type: 'number', unit: 'mm', sortOrder: 9 },
      { key: 'note',             label: 'Ghi chú',      type: 'textarea', sortOrder: 10 },
    ],
  },

  plastic_container: {
    label: 'Hộp/Hũ nhựa',
    nameTemplate: '{box_type} {weight_g}g',
    fields: [
      { key: 'box_type',     label: 'Loại hộp',    type: 'select', options: ['Hộp tròn','Hộp vuông','Hộp bầu dục','Hộp chữ nhật'], required: true, sortOrder: 1 },
      { key: 'weight_g',     label: 'Trọng lượng', type: 'number', unit: 'g',   required: true, sortOrder: 2 },
      { key: 'material',     label: 'Chất liệu',   type: 'select', options: ['PET','PP','HDPE','PVC','LDPE','PS','ABS'], sortOrder: 3 },
      { key: 'packing_spec', label: 'Quy cách',    type: 'text',   sortOrder: 4 },
      { key: 'note',         label: 'Ghi chú',     type: 'textarea', sortOrder: 5 },
    ],
  },

  packaging_bag: {
    label: 'Túi đóng gói',
    nameTemplate: 'Túi {bag_type} {size}',
    fields: [
      { key: 'size',           label: 'Kích thước',      type: 'text',         required: true, sortOrder: 1 },
      { key: 'bag_type',       label: 'Loại túi',        type: 'select',       required: true, options: ['Túi đứng có đáy','Túi zip','Túi 3 biên','Túi hút chân không','Túi đứng zipper'], sortOrder: 2 },
      { key: 'surface_finish', label: 'Gia công bề mặt', type: 'select',       options: ['Cán bóng','Cán mờ','Tráng UV','Không xử lý'], sortOrder: 3 },
      { key: 'rope_type',      label: 'Loại dây',        type: 'select',       options: ['Dây giấy','Dây ribbon','Không có'], sortOrder: 4 },
      { key: 'addon_features', label: 'Tính năng thêm',  type: 'multi_select', options: ['Cửa sổ','Khóa zip','Van thở','Vòi rót'], sortOrder: 5 },
      { key: 'note',           label: 'Ghi chú',         type: 'textarea', sortOrder: 6 },
    ],
  },

  cap_pump_stopper: {
    label: 'Nắp/Bơm/Nút',
    nameTemplate: '{closure_type} Phi {size_mm}',
    fields: [
      { key: 'closure_type', label: 'Loại',      type: 'select', options: ['Nắp vặn','Nắp bật','Nắp bơm','Nút chai','Nắp lật','Vòi xịt','Nắp chấm bi'], required: true, sortOrder: 1 },
      { key: 'size_mm',      label: 'Phi',       type: 'number', unit: 'mm', required: true, sortOrder: 2 },
      { key: 'material',     label: 'Chất liệu', type: 'select', options: ['PP','PE','ABS','Nhôm','Thủy tinh'], required: true, sortOrder: 3 },
      { key: 'color',        label: 'Màu sắc',   type: 'text',   sortOrder: 4 },
      { key: 'note',         label: 'Ghi chú',   type: 'textarea', sortOrder: 5 },
    ],
  },

  bird_nest_mold: {
    label: 'Khuôn tổ yến',
    nameTemplate: 'Khuôn {mold_type} {weight_g}g',
    fields: [
      { key: 'mold_type',    label: 'Loại khuôn', type: 'select', options: ['Khuôn tổ sào','Khuôn tổ đùi gà','Khuôn tổ phẳng','Khuôn tổ trái tim'], required: true, sortOrder: 1 },
      { key: 'weight_g',     label: 'Trọng lượng', type: 'number', unit: 'g', required: true, sortOrder: 2 },
      { key: 'packing_spec', label: 'Quy cách',    type: 'text', sortOrder: 3 },
      { key: 'note',         label: 'Ghi chú',     type: 'textarea', sortOrder: 4 },
    ],
  },

  tweezers: {
    label: 'Nhíp',
    nameTemplate: 'Nhíp {material} {length_cm}cm {tip_type}',
    fields: [
      { key: 'material',  label: 'Chất liệu', type: 'select', options: ['Inox','Nhựa','Nhôm','Titan'], required: true, sortOrder: 1 },
      { key: 'length_cm', label: 'Chiều dài', type: 'number', unit: 'cm', required: true, sortOrder: 2 },
      { key: 'tip_type',  label: 'Đầu nhíp',  type: 'select', options: ['Đầu thẳng','Đầu cong','Đầu tù','Đầu nhọn'], required: true, sortOrder: 3 },
      { key: 'note',      label: 'Ghi chú',   type: 'textarea', sortOrder: 4 },
    ],
  },

  digital_scale: {
    label: 'Cân điện tử',
    nameTemplate: 'Cân điện tử {max_weight}',
    fields: [
      { key: 'max_weight',   label: 'Tải trọng tối đa', type: 'text',   required: true, sortOrder: 1 },
      { key: 'accuracy',     label: 'Độ chính xác',     type: 'text',   required: true, sortOrder: 2 },
      { key: 'battery_type', label: 'Loại pin',         type: 'text',   sortOrder: 3 },
      { key: 'display_type', label: 'Loại màn hình',    type: 'select', options: ['LED','LCD'], sortOrder: 4 },
      { key: 'note',         label: 'Ghi chú',          type: 'textarea', sortOrder: 5 },
    ],
  },

  food_wrap: {
    label: 'Màng bọc thực phẩm',
    nameTemplate: 'Màng bọc {material} {width_cm}cm x {length_m}m',
    fields: [
      { key: 'width_cm', label: 'Chiều rộng', type: 'number', unit: 'cm', required: true, sortOrder: 1 },
      { key: 'length_m', label: 'Chiều dài',  type: 'number', unit: 'm',  required: true, sortOrder: 2 },
      { key: 'material', label: 'Chất liệu',  type: 'select', options: ['PE','PVC','PLA','PP'], required: true, sortOrder: 3 },
      { key: 'note',     label: 'Ghi chú',    type: 'textarea', sortOrder: 4 },
    ],
  },

  equipment: {
    label: 'Thiết bị',
    nameTemplate: '{equipment_type}',
    fields: [
      { key: 'equipment_type', label: 'Loại thiết bị', type: 'select', options: ['Máy hàn miệng túi','Máy đóng gói','Máy ghép mí','Máy rút màng','Máy dán nhãn','Máy in date','Máy hút chân không'], required: true, sortOrder: 1 },
      { key: 'power',          label: 'Công suất',     type: 'text',   sortOrder: 2 },
      { key: 'voltage',        label: 'Điện áp',       type: 'text',   sortOrder: 3 },
      { key: 'capacity',       label: 'Năng suất',     type: 'text',   sortOrder: 4 },
      { key: 'origin',         label: 'Xuất xứ',       type: 'select', options: ['Trung Quốc','Đài Loan','Việt Nam','Nhật Bản','Hàn Quốc'], sortOrder: 5 },
      { key: 'warranty',       label: 'Bảo hành',      type: 'text',   sortOrder: 6 },
      { key: 'note',           label: 'Ghi chú',       type: 'textarea', sortOrder: 7 },
    ],
  },

  // ── Legacy types (kept for backward compatibility) ────────────────────────
  plastic: {
    label: 'Bao bì nhựa',
    fields: [
      {
        key: 'material',
        label: 'Chất liệu',
        type: 'select',
        options: ['PET', 'PP', 'HDPE', 'PVC', 'LDPE', 'PS', 'ABS'],
        required: true,
        sortOrder: 1,
      },
      { key: 'capacity', label: 'Dung tích', type: 'number', unit: 'ml', sortOrder: 2 },
      { key: 'dimensions', label: 'Kích thước (RxC)', type: 'text', sortOrder: 3 },
      { key: 'weight', label: 'Trọng lượng', type: 'number', unit: 'g', sortOrder: 4 },
      { key: 'color', label: 'Màu sắc', type: 'text', sortOrder: 5 },
      {
        key: 'finish',
        label: 'Bề mặt',
        type: 'select',
        options: ['Bóng', 'Mờ', 'Nhám', 'Vân'],
        sortOrder: 6,
      },
      { key: 'cap_type', label: 'Loại nắp', type: 'text', sortOrder: 7 },
      { key: 'neck_size', label: 'Phi cổ', type: 'number', unit: 'mm', sortOrder: 8 },
      { key: 'certification', label: 'Chứng nhận', type: 'text', sortOrder: 9 },
      { key: 'note', label: 'Ghi chú', type: 'textarea', sortOrder: 10 },
    ],
  },

  glass: {
    label: 'Bao bì thủy tinh',
    fields: [
      {
        key: 'material',
        label: 'Chất liệu',
        type: 'select',
        options: ['Thủy tinh trong', 'Thủy tinh màu', 'Thủy tinh borosilicate'],
        required: true,
        sortOrder: 1,
      },
      { key: 'capacity', label: 'Dung tích', type: 'number', unit: 'ml', sortOrder: 2 },
      { key: 'dimensions', label: 'Kích thước (RxC)', type: 'text', sortOrder: 3 },
      { key: 'weight', label: 'Trọng lượng', type: 'number', unit: 'g', sortOrder: 4 },
      { key: 'color', label: 'Màu sắc', type: 'text', sortOrder: 5 },
      { key: 'finish', label: 'Kiểu dáng / Bề mặt', type: 'text', sortOrder: 6 },
      { key: 'neck_size', label: 'Phi cổ', type: 'number', unit: 'mm', sortOrder: 7 },
      { key: 'cap_type', label: 'Loại nắp', type: 'text', sortOrder: 8 },
      { key: 'certification', label: 'Chứng nhận', type: 'text', sortOrder: 9 },
      { key: 'note', label: 'Ghi chú', type: 'textarea', sortOrder: 10 },
    ],
  },

  packaging: {
    label: 'Bao bì giấy / Hộp',
    fields: [
      {
        key: 'material',
        label: 'Chất liệu',
        type: 'select',
        options: ['Carton sóng', 'Carton cứng', 'Kraft', 'Duplex', 'Couche'],
        required: true,
        sortOrder: 1,
      },
      { key: 'dimensions', label: 'Kích thước (DxRxC mm)', type: 'text', sortOrder: 2 },
      { key: 'gsm', label: 'Định lượng', type: 'number', unit: 'gsm', sortOrder: 3 },
      {
        key: 'print_type',
        label: 'In ấn',
        type: 'select',
        options: ['Offset', 'Flexo', 'Kỹ thuật số', 'Không in'],
        sortOrder: 4,
      },
      {
        key: 'finish',
        label: 'Gia công bề mặt',
        type: 'select',
        options: ['Không xử lý', 'Cán bóng', 'Cán mờ', 'Tráng UV', 'Dập nổi'],
        sortOrder: 5,
      },
      { key: 'min_order', label: 'Số lượng tối thiểu', type: 'number', unit: 'cái', sortOrder: 6 },
      { key: 'note', label: 'Ghi chú', type: 'textarea', sortOrder: 7 },
    ],
  },

  cap_bottle_jar: {
    label: 'Nắp / Nút / Bơm',
    fields: [
      {
        key: 'type',
        label: 'Loại',
        type: 'select',
        options: ['Nắp vặn', 'Nắp bật', 'Nắp bơm', 'Nút chai', 'Nắp lật', 'Vòi xịt', 'Nắp chấm bi'],
        required: true,
        sortOrder: 1,
      },
      {
        key: 'material',
        label: 'Chất liệu',
        type: 'select',
        options: ['PP', 'PE', 'ABS', 'Nhôm', 'Thủy tinh'],
        required: true,
        sortOrder: 2,
      },
      { key: 'neck_size', label: 'Phi cổ khớp', type: 'number', unit: 'mm', sortOrder: 3 },
      { key: 'color', label: 'Màu sắc', type: 'text', sortOrder: 4 },
      {
        key: 'finish',
        label: 'Bề mặt',
        type: 'select',
        options: ['Bóng', 'Mờ', 'Mạ'],
        sortOrder: 5,
      },
      { key: 'note', label: 'Ghi chú', type: 'textarea', sortOrder: 6 },
    ],
  },

  accessory: {
    label: 'Phụ kiện đóng gói',
    fields: [
      { key: 'type', label: 'Loại phụ kiện', type: 'text', required: true, sortOrder: 1 },
      { key: 'material', label: 'Chất liệu', type: 'text', sortOrder: 2 },
      { key: 'dimensions', label: 'Kích thước', type: 'text', sortOrder: 3 },
      { key: 'color', label: 'Màu sắc', type: 'text', sortOrder: 4 },
      { key: 'note', label: 'Ghi chú', type: 'textarea', sortOrder: 5 },
    ],
  },

  other: {
    label: 'Khác / Tùy chỉnh',
    fields: [],
  },
};
