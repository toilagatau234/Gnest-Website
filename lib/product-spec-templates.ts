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
}

export const TEMPLATE_KEYS = [
  'plastic',
  'glass',
  'packaging',
  'cap_bottle_jar',
  'accessory',
  'other',
] as const;

export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

export function isKnownTemplate(value: unknown): value is TemplateKey {
  return typeof value === 'string' && (TEMPLATE_KEYS as readonly string[]).includes(value);
}

export const SPEC_TEMPLATES: Record<TemplateKey, SpecTemplate> = {
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
