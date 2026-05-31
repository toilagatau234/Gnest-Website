export interface Category {
  id: string;
  name: string;
  slug: string;
  type: 'Sản phẩm' | 'Dịch vụ';
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ProductSpec {
  key: string;
  value: string;
}

export interface BulkDiscount {
  min_qty: number;
  price_per_unit: number;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  price: number | 'Liên hệ';
  stock: number;
  unit: string;
  low_stock_threshold: number;
  is_active: boolean;
  images: ProductImage[];
  specs: ProductSpec[];
  bulk_discounts: BulkDiscount[];
  updated_at: string;
}

export interface Inquiry {
  id: string;
  customer_name: string;
  phone: string;
  email: string;
  product_name: string;
  message: string;
  status: 'Mới' | 'Đã liên hệ' | 'Đã báo giá' | 'Đã đóng' | 'Spam';
  assigned_to: string;
  created_at: string;
  notes: string[];
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  phone: string;
  zalo: string;
  avatar_url: string;
  sort_order: number;
  is_active: boolean;
}

export interface JobVacancy {
  id: string;
  title: string;
  slug: string;
  location: string;
  salary: string;
  description: string;
  requirements: string[];
  benefits: string[];
  is_active: boolean;
}

export interface SiteContent {
  hero: {
    title: string;
    subtitle: string;
    cta_text: string;
    banner_url: string;
  };
  footer: {
    company_name: string;
    address: string;
    phone: string;
    email: string;
    social_fb: string;
    social_zalo: string;
  };
  cta: {
    zalo_float: string;
    hotline: string;
    form_quote_title: string;
  };
  seo: {
    site_title: string;
    meta_description: string;
    og_image: string;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'editor' | 'viewer';
  is_active: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entity_id: string;
  metadata: any;
  created_at: string;
}

export const initialCategories: Category[] = [
  { id: 'cat-1', name: 'Hũ Yến Thủy Tinh', slug: 'hu-yen-thuy-tinh', type: 'Sản phẩm', parent_id: null, sort_order: 1, is_active: true },
  { id: 'cat-1-1', name: 'Hũ Thủy Tinh Tròn 75ml', slug: 'hu-thuy-tinh-tron-75ml', type: 'Sản phẩm', parent_id: 'cat-1', sort_order: 1, is_active: true },
  { id: 'cat-1-2', name: 'Hũ Thủy Tinh Lục Giác 100ml', slug: 'hu-thuy-tinh-luc-giac-100ml', type: 'Sản phẩm', parent_id: 'cat-1', sort_order: 2, is_active: true },
  
  { id: 'cat-2', name: 'Chai Lọ Thủy Tinh', slug: 'chai-lo-thuy-tinh', type: 'Sản phẩm', parent_id: null, sort_order: 2, is_active: true },
  { id: 'cat-2-1', name: 'Chai Thủy Tinh Đựng Mật Ong', slug: 'chai-thuy-tinh-dung-mat-ong', type: 'Sản phẩm', parent_id: 'cat-2', sort_order: 1, is_active: true },
  { id: 'cat-2-2', name: 'Lọ Thủy Tinh Đựng Sữa Chua', slug: 'lo-thuy-tinh-dung-sua-chua', type: 'Sản phẩm', parent_id: 'cat-2', sort_order: 2, is_active: true },
  
  { id: 'cat-3', name: 'Bao Bì Giấy & Hộp Quà', slug: 'bao-bi-giay-hop-qua', type: 'Sản phẩm', parent_id: null, sort_order: 3, is_active: true },
  { id: 'cat-3-1', name: 'Hộp Quà Đựng Yến Sào Cao Cấp', slug: 'hop-qua-dung-yen-sao-cao-cap', type: 'Sản phẩm', parent_id: 'cat-3', sort_order: 1, is_active: true },
  
  { id: 'cat-4', name: 'Dịch Vụ Ngành Yến', slug: 'dich-vu-nganh-yen', type: 'Dịch vụ', parent_id: null, sort_order: 4, is_active: true },
  { id: 'cat-4-1', name: 'Thiết Kế Tem Nhãn & Bao Bì', slug: 'thiet-ke-tem-nhan-bao-bi', type: 'Dịch vụ', parent_id: 'cat-4', sort_order: 1, is_active: true },
  { id: 'cat-4-2', name: 'Gia Công Hũ Yến Chưng Tiệt Trùng', slug: 'gia-cong-hu-yen-chung-tiet-trung', type: 'Dịch vụ', parent_id: 'cat-4', sort_order: 2, is_active: true }
];

export const initialProducts: Product[] = [
  {
    id: 'prod-1',
    category_id: 'cat-1-1',
    name: 'Hũ Thủy Tinh Tròn 75ml Nắp Thiếc',
    slug: 'hu-thuy-tinh-tron-75ml-nap-thiec',
    description: 'Hũ thủy tinh tròn dung tích 75ml tiêu chuẩn chuyên dụng để chưng yến sào. Thủy tinh chịu nhiệt độ cao, an toàn khi hấp tiệt trùng công nghiệp. Nắp thiếc có ron cao su bám chặt, chống không khí xâm nhập tuyệt đối.',
    price: 3500,
    stock: 15400,
    unit: 'Chiếc',
    low_stock_threshold: 1000,
    is_active: true,
    images: [
      { id: 'img-1-1', url: 'https://picsum.photos/seed/gnest-jar1/600/400', alt: 'Hũ yến tròn 75ml nắp thiếc đen', is_primary: true, sort_order: 1 },
      { id: 'img-1-2', url: 'https://picsum.photos/seed/gnest-jar2/600/400', alt: 'Hũ yến tròn đựng yến chưng', is_primary: false, sort_order: 2 }
    ],
    specs: [
      { key: 'Dung tích', value: '75ml' },
      { key: 'Hình dạng', value: 'Tròn' },
      { key: 'Chất liệu thủy tinh', value: 'Silicate trắng loại I' },
      { key: 'Nắp đi kèm', value: 'Thiếc xoáy 48mm màu vàng đồng/đen' },
      { key: 'Quy cách đóng thùng', value: '144 hũ/thùng carton' }
    ],
    bulk_discounts: [
      { min_qty: 500, price_per_unit: 3200 },
      { min_qty: 1000, price_per_unit: 3000 },
      { min_qty: 5000, price_per_unit: 2700 }
    ],
    updated_at: '2026-05-30T10:00:00Z'
  },
  {
    id: 'prod-2',
    category_id: 'cat-2-2',
    name: 'Chai Thủy Tinh Đựng Sữa 250ml Nắp Vặn',
    slug: 'chai-thuy-tinh-dung-sua-250ml-nap-van',
    description: 'Dòng sản phẩm chai thủy tinh trong suốt thích hợp để đựng sữa chua nếp cẩm, sữa hạt, mật ong hoặc các loại thực phẩm dạng lỏng. Nắp nhựa PP xoáy vặn chống tràn.',
    price: 4200,
    stock: 8000,
    unit: 'Chiếc',
    low_stock_threshold: 500,
    is_active: true,
    images: [
      { id: 'img-2-1', url: 'https://picsum.photos/seed/gnest-bottle1/600/400', alt: 'Chai thủy tinh 250ml nắp nhựa trắng', is_primary: true, sort_order: 1 }
    ],
    specs: [
      { key: 'Dung tích', value: '250ml' },
      { key: 'Hình dạng', value: 'Ụ tròn dẹt' },
      { key: 'Chất liệu', value: 'Thủy tinh Soda-lime loại A' },
      { key: 'Nắp đi kèm', value: 'Nắp vặn PP trắng' },
      { key: 'Quy cách đóng thùng', value: '100 chiếc/thùng' }
    ],
    bulk_discounts: [
      { min_qty: 200, price_per_unit: 3900 },
      { min_qty: 1000, price_per_unit: 3500 }
    ],
    updated_at: '2026-05-29T14:30:00Z'
  },
  {
    id: 'prod-3',
    category_id: 'cat-1-2',
    name: 'Hũ Thủy Tinh Lục Giác 100ml Cao Cấp',
    slug: 'hu-thuy-tinh-luc-giac-100ml-cao-cap',
    description: 'Thiết kế hũ lục giác sáu cạnh sang trọng, nâng tầm giá trị cho thương hiệu yến chưng cao cấp của bạn. Thủy tinh dày dặn, phản xạ ánh sáng vàng tuyệt đẹp.',
    price: 'Liên hệ',
    stock: 220,
    unit: 'Chiếc',
    low_stock_threshold: 500,
    is_active: true,
    images: [], // Có thông số rỗng để kích hoạt cảnh báo "Sản phẩm chưa có ảnh"!
    specs: [
      { key: 'Dung tích', value: '100ml' },
      { key: 'Hình dạng', value: 'Lục giác sáu cạnh' },
      { key: 'Nắp', value: 'Thiếc xoáy vàng/đỏ' }
    ],
    bulk_discounts: [],
    updated_at: '2026-05-28T09:15:00Z'
  },
  {
    id: 'prod-4',
    category_id: 'cat-3-1',
    name: 'Hộp Quà Yến Sào Hoàng Gia 6 Hũ',
    slug: 'hop-qua-yen-sao-hoang-gia-6-hu',
    description: 'Hộp cứng cao cấp làm từ chất liệu bồi carton lạnh dầy dặn, bọc giấy mỹ thuật xi nhũ vàng trang hoàng lộng lẫy. Bên trong lót khay nhung đỏ định hình vừa vặn 6 hũ yến chưng và một lọ đường phèn.',
    price: 45000,
    stock: 1200,
    unit: 'Hộp',
    low_stock_threshold: 150,
    is_active: true,
    images: [
      { id: 'img-4-1', url: 'https://picsum.photos/seed/gnest-box1/600/400', alt: 'Hộp cứng đựng yến hoàng gia', is_primary: true, sort_order: 1 }
    ],
    specs: [
      { key: 'Chất liệu', value: 'Carton lạnh dày 2mm bọc giấy Couche' },
      { key: 'Kích thước', value: '32 x 24 x 8 cm' },
      { key: 'Kiểu khay', value: 'Nhung tơ đỏ cán bọc định hình' }
    ],
    bulk_discounts: [
      { min_qty: 100, price_per_unit: 40000 },
      { min_qty: 500, price_per_unit: 35000 }
    ],
    updated_at: '2026-05-25T11:00:00Z'
  }
];

export const initialInquiries: Inquiry[] = [
  {
    id: 'inq-1',
    customer_name: 'Phạm Thị Hải Yến',
    phone: '0988123456',
    email: 'yenpham.nest@gmail.com',
    product_name: 'Hũ Thủy Tinh Tròn 75ml Nắp Thiếc',
    message: 'Chào shop, mình cần đặt mẫu 1000 hũ yến tròn 75ml kèm nắp thiếc màu vàng đồng tư vấn báo giá giúp sỉ tốt về tỉnh Lâm Đồng nhé.',
    status: 'Mới',
    assigned_to: 'Lê Thị Lợi',
    created_at: '2026-05-31T03:10:00Z',
    notes: ['Khách đang cần mẫu gấp trong tuần', 'Đã lưu thông tin kinh doanh để gửi thư chào hàng']
  },
  {
    id: 'inq-2',
    customer_name: 'Công ty Thực phẩm Yến Việt',
    phone: '0903999888',
    email: 'info@yenvietsourcing.com',
    product_name: 'Hũ Thủy Tinh Lục Giác 100ml Cao Cấp',
    message: 'Cần nhận báo giá sỉ đại lý cấp 1 cho thiết kế lục giác 100ml số lượng tối thiểu 10,000 hũ vận chuyển đến kho Bình Dương.',
    status: 'Đã liên hệ',
    assigned_to: 'Nguyễn Văn Tài',
    created_at: '2026-05-30T15:20:00Z',
    notes: ['Đã gọi điện tư vấn gián tiếp', 'Chờ khách trả lời email để chốt mẫu']
  },
  {
    id: 'inq-3',
    customer_name: 'Trần Hoàng Long',
    phone: '0912445566',
    email: 'longtran79@yahoo.com',
    product_name: 'Hộp Quà Yến Sào Hoàng Gia 6 Hũ',
    message: 'Mình cần thiết kế in thêm logo thương hiệu lên hộp yến quà tặng hoàng gia số lượng 200 chiếc. Liên hệ Zalo nhé.',
    status: 'Đã báo giá',
    assigned_to: 'Lê Thị Lợi',
    created_at: '2026-05-29T08:45:00Z',
    notes: ['Đã gửi demo thiết kế nhũ ép kim dập chìm', 'Báo giá chiết khấu đặc sản 38,500đ/hộp']
  },
  {
    id: 'inq-4',
    customer_name: 'Nguyễn Bích Liên',
    phone: '0356778899',
    email: 'liennguyen_tea@outlook.com',
    product_name: 'Hũ Thủy Tinh Lục Giác 100ml Cao Cấp',
    message: 'Mua lẻ 20 cái sỉ giá bao nhiêu vậy?',
    status: 'Đã đóng',
    assigned_to: 'Trần Minh Đại',
    created_at: '2026-05-28T16:00:00Z',
    notes: ['Đã giải thích chính sách phân phối B2B tối thiểu 120 hũ', 'Đã chuyển sang đại lý Shopee mua lẻ']
  }
];

export const initialContacts: Contact[] = [
  { id: 'cont-1', name: 'Nguyễn Văn Tài', role: 'Trưởng Phòng Kinh Doanh B2B', phone: '0987654321', zalo: '0987654321', avatar_url: 'https://picsum.photos/seed/user-tai/200/200', sort_order: 1, is_active: true },
  { id: 'cont-2', name: 'Lê Thị Lợi', role: 'Bộ phận Kinh Doanh - Phụ Trách Hũ Yến', phone: '0912345678', zalo: '0912345678', avatar_url: 'https://picsum.photos/seed/user-loi/200/200', sort_order: 2, is_active: true },
  { id: 'cont-3', name: 'Trần Minh Đại', role: 'Tư Vấn Hộp Quà & Tem Nhãn', phone: '0905111222', zalo: '0905111222', avatar_url: 'https://picsum.photos/seed/user-dai/200/200', sort_order: 3, is_active: true }
];

export const initialJobs: JobVacancy[] = [
  {
    id: 'job-1',
    title: 'Nhân Viên Thiết Kế Đồ Họa Bao Bì',
    slug: 'nhan-vien-thiet-ke-do-hoa-bao-bi',
    location: 'Quận 12, TP. Hồ Chí Minh',
    salary: '10.000.000 - 15.000.000 đ',
    description: 'Chịu trách nhiệm chính việc dựng thiết kế vector, thiết kế tem nhãn hũ yến, maket in ấn ép kim trên bao bì hộp quà giấy cho khách hàng B2B của Đại Tài Lợi.',
    requirements: ['Có tối thiểu 1 năm kinh nghiệm thiết kế bao bì giấy hoặc thủy tinh', 'Sử dụng thành thạo Adobe Illustrator, Photoshop', 'Có thẩm mỹ gọn gàng, tinh tế, hiện đại'],
    benefits: ['Lương cứng hấp dẫn + thưởng hiệu suất thiết kế theo đơn hàng chốt', 'Đóng BHXH đầy đủ theo quy định hiện hành', 'Du lịch nghỉ dưỡng hàng năm, cơm trưa phụ cấp doanh nghiệp'],
    is_active: true
  },
  {
    id: 'job-2',
    title: 'Nhân Viên Tư Vấn Bán Hàng B2B',
    slug: 'nhan-vien-tu-van-ban-hang-b2b',
    location: 'Quận 12, TP. Hồ Chí Minh',
    salary: '8.000.000 đ + % Doanh số (up to 25m)',
    description: 'Tiếp nhận các data yêu cầu báo giá từ website/hotline, tư vấn mẫu chai lọ đựng yến thích hợp, thương lượng điều khoản sỉ và chốt hợp đồng cung ứng phụ kiện ngành yến.',
    requirements: ['Giao tiếp lưu loát, giọng nói dễ nghe, chăm chỉ chu đáo', 'Có kinh nghiệm telesales hoặc bán sỉ B2B là lợi thế rộng mở', 'Sẵn sàng tương tác hỗ trợ khách hàng nhanh chóng qua Zalo'],
    benefits: ['Lương cơ bản + hoa hồng doanh số cực cao thanh toán hàng tháng', 'Hỗ trợ máy tính làm việc và cung cấp ngân quỹ điện thoại liên hệ đầy đủ', 'Tham gia khóa đào tạo chuyên sâu về ngành yến sào đại cương'],
    is_active: true
  }
];

export const initialSiteContent: SiteContent = {
  hero: {
    title: 'Giải Pháp Hũ Thủy Tinh & Bao Bì Yến Sào Toàn Diện',
    subtitle: 'Đại Tài Lợi chuyên sản xuất và cung ứng sỉ hũ yến chưng tiệt trùng, chai lọ thủy tinh, hộp quà tặng cao cấp ngành yến sào toàn quốc.',
    cta_text: 'Nhận Báo Giá Sỉ Ngay',
    banner_url: 'https://picsum.photos/seed/gnest-hero/1200/500'
  },
  footer: {
    company_name: 'CÔNG TY TNHH TM DV ĐẠI TÀI LỢI (GNEST)',
    address: 'Số 148A, Đường Thạnh Xuân 22, Phường Thạnh Xuân, Quận 12, TP. Hồ Chí Minh',
    phone: '0987.654.321 - 0912.345.678',
    email: 'lienhe@daitailoi-gnest.vn',
    social_fb: 'https://facebook.com/gnest.thuytinh',
    social_zalo: 'https://zalo.me/0987654321'
  },
  cta: {
    zalo_float: '0987654321',
    hotline: '0987.654.321',
    form_quote_title: 'Đăng Ký Nhận Thẩm Định & Báo Giá Sỉ Catalog'
  },
  seo: {
    site_title: 'Chai Lọ Thủy Tinh Gnest - Bao Bì Đại Tài Lợi',
    meta_description: 'Nhà cung ứng cấp 1 chai lọ thủy tinh cao cấp, hũ yến chưng tiệt trùng, khay hộp yến sào ép kim dập nhũ cao cấp nhất TP.HCM. Báo giá tức thì.',
    og_image: 'https://picsum.photos/seed/gnest-seo/1200/630'
  }
};

export const initialAdminUsers: AdminUser[] = [
  { id: 'adm-1', email: 'toilagatau234@gmail.com', role: 'super_admin', is_active: true, created_at: '2026-01-10T08:00:00Z' },
  { id: 'adm-2', email: 'tai.nguyen@daitailoi-gnest.vn', role: 'admin', is_active: true, created_at: '2026-02-15T09:30:00Z' },
  { id: 'adm-3', email: 'editor.gnest@gmail.com', role: 'editor', is_active: true, created_at: '2026-03-24T14:40:00Z' },
  { id: 'adm-4', email: 'viewer.guest@daitailoi.vn', role: 'viewer', is_active: true, created_at: '2026-05-10T11:15:00Z' }
];

export const initialAuditLogs: AuditLog[] = [
  { id: 'log-1', actor: 'toilagatau234@gmail.com', action: 'CREATE', entity: 'Sản phẩm', entity_id: 'prod-1', metadata: { name: 'Hũ Thủy Tinh Tròn 75ml Nắp Thiếc', catalog: 'Hũ Thủy Tinh' }, created_at: '2026-05-31T03:15:00Z' },
  { id: 'log-2', actor: 'tai.nguyen@daitailoi-gnest.vn', action: 'UPDATE_STATUS', entity: 'Yêu cầu báo giá', entity_id: 'inq-2', metadata: { old_status: 'Mới', new_status: 'Đã liên hệ', assignee: 'Nguyễn Văn Tài' }, created_at: '2026-05-31T01:40:00Z' },
  { id: 'log-3', actor: 'editor.gnest@gmail.com', action: 'UPDATE', entity: 'Nội dung website', entity_id: 'site-config', metadata: { updated_fields: ['hero.title', 'seo.meta_description'] }, created_at: '2026-05-30T16:22:00Z' },
  { id: 'log-4', actor: 'toilagatau234@gmail.com', action: 'DELETE_SOFT', entity: 'Sản phẩm', entity_id: 'prod-9', metadata: { name: 'Chai Lọ Cũ Ngừng SX' }, created_at: '2026-05-29T10:05:00Z' }
];
