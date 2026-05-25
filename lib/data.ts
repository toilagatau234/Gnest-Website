export interface FilterDef {
  key: string;
  label: string;
  values: string[];
}

export interface BulkDiscount {
  threshold: number; // in items or units based on how we track quantity
  pricePerUnit: number;
}

export interface SaleContact {
  id: string;
  name: string;
  phone: string;
  zalo: string;
  avatar?: string;
  role?: string;
}

export const SALE_CONTACTS: SaleContact[] = [
  { id: '1', name: 'CSKH / Hotline', role: 'Tổng đài', phone: '0939991551', zalo: '0939991551', avatar: 'https://ui-avatars.com/api/?name=CSKH&background=e31e24&color=fff' },
  { id: '2', name: 'Nguyễn Văn Bình', role: 'Chuyên viên tư vấn', phone: '0901234567', zalo: '0901234567', avatar: 'https://ui-avatars.com/api/?name=Binh&background=1a3060&color=fff' },
  { id: '3', name: 'Trần Thị An', role: 'Chuyên viên tư vấn', phone: '0909876543', zalo: '0909876543', avatar: 'https://ui-avatars.com/api/?name=An&background=1a3060&color=fff' },
];

export interface CatalogItem {
  id?: string;
  name: string;
  img?: string | null;
  imgs?: string[];
  dungTich?: string;
  quyCach?: string;
  phiNap?: string;
  loaiNap?: string;
  color?: string;
  desc?: string;
  price?: number;
  bulkDiscounts?: BulkDiscount[];
  stock?: number;
  categoryId: string; // Belongs to a Category ID
}

export interface DbCategory {
  id: string;
  title: string;
  type: 'product' | 'service';
  hasFilters: boolean;
  parentId?: string | null;
  sortOrder: number;
}

export interface CatalogCategory {
  title: string;
  type: 'product' | 'service';
  hasFilters: boolean;
  filterDefs?: FilterDef[];
  items: CatalogItem[];
  parentId?: string;
}

export const DESC_200ML = `
<div class="space-y-4">
  <div>
    <p>Được làm bằng thủy tinh bền đẹp, rắn chắc. Chất liệu thủy tinh chống bám màu, bám mùi và không tương tác hóa học với các loại nước uống, đảm bảo an toàn cho sức khỏe. Bề mặt thủy tinh chống trầy xước và trơn nhẵn nên dễ dàng chùi rửa khi bị bám bẩn.</p>
  </div>
  <div>
    <h5 class="text-sm font-bold text-dtl-navy mb-2 pb-1 border-b-2 border-dtl-bg-alt uppercase tracking-wide">Nắp chai</h5>
    <ul class="list-disc pl-5 space-y-1">
      <li>Nắp vặn bằng thiếc sơn tĩnh điện có ron cao su hoàn toàn kín nước 100%, giúp bảo quản thức uống không bị rỉ ra ngoài, đảm bảo nắp không bị bung khi di chuyển.</li>
      <li>Màu sắc nắp: đen, vàng, trắng.</li>
      <li>Nắp đậy kín ngăn ngừa bụi bẩn, vi khuẩn xâm nhập. Thân chai thon gọn, dễ dàng cầm nắm.</li>
    </ul>
  </div>
</div>
`;

// Default categories as requested by the user
export const DEFAULT_CATEGORIES: DbCategory[] = [
  // Products (Sản phẩm)
  { id: 'chai-lo-thuy-tinh', title: 'Chai Lọ Thủy Tinh', type: 'product', hasFilters: true, parentId: null, sortOrder: 1 },
  { id: 'chai-thuy-tinh', title: 'Chai Thủy Tinh', type: 'product', hasFilters: true, parentId: 'chai-lo-thuy-tinh', sortOrder: 2 },
  { id: 'lo-thuy-tinh', title: 'Lọ Thủy Tinh', type: 'product', hasFilters: true, parentId: 'chai-lo-thuy-tinh', sortOrder: 3 },
  { id: 'nap-lo', title: 'Nắp Lọ', type: 'product', hasFilters: false, parentId: 'chai-lo-thuy-tinh', sortOrder: 4 },
  
  { id: 'hop-nhua', title: 'Hộp Nhựa', type: 'product', hasFilters: false, parentId: null, sortOrder: 5 },
  
  { id: 'bao-bi-yen', title: 'Bao Bì Ngành Yến Sào', type: 'product', hasFilters: false, parentId: null, sortOrder: 6 },
  { id: 'bao-bi-yen-tinh-che', title: 'Bao Bì Yến Tinh Chế', type: 'product', hasFilters: false, parentId: 'bao-bi-yen', sortOrder: 7 },
  { id: 'bao-bi-yen-chung', title: 'Bao Bì Yến Chưng', type: 'product', hasFilters: false, parentId: 'bao-bi-yen', sortOrder: 8 },
  { id: 'tui-giay', title: 'Túi Giấy', type: 'product', hasFilters: false, parentId: 'bao-bi-yen', sortOrder: 9 },
  
  { id: 'phu-kien-yen', title: 'Phụ Kiện Ngành Yến Sào', type: 'product', hasFilters: false, parentId: null, sortOrder: 10 },
  { id: 'khuon', title: 'Khuôn', type: 'product', hasFilters: false, parentId: 'phu-kien-yen', sortOrder: 11 },
  { id: 'nhip', title: 'Nhíp', type: 'product', hasFilters: false, parentId: 'phu-kien-yen', sortOrder: 12 },
  { id: 'can-dien-tu', title: 'Cân Điện Tử', type: 'product', hasFilters: false, parentId: 'phu-kien-yen', sortOrder: 13 },
  { id: 'mang-boc-thuc-pham', title: 'Màng Bọc Thực Phẩm', type: 'product', hasFilters: false, parentId: 'phu-kien-yen', sortOrder: 14 },
  
  { id: 'may-moc-yen', title: 'Máy Móc Thiết Bị Ngành Yến Sào', type: 'product', hasFilters: false, parentId: null, sortOrder: 15 },
  { id: 'ban-tinh-che', title: 'Bàn Tinh Chế', type: 'product', hasFilters: false, parentId: 'may-moc-yen', sortOrder: 16 },
  { id: 'may-say-yen', title: 'Máy Sấy Yến', type: 'product', hasFilters: false, parentId: 'may-moc-yen', sortOrder: 17 },
  { id: 'may-moc', title: 'Máy Móc', type: 'product', hasFilters: false, parentId: 'may-moc-yen', sortOrder: 18 },

  // Services (Dịch vụ)
  { id: 'thiet-ke-noi-ngoai-that', title: 'Thiết Kế & Thi Công Nội Ngoại Thất', type: 'service', hasFilters: false, parentId: null, sortOrder: 19 },
  { id: 'gia-cong-cnc-go-cong-nghiep', title: 'Gia Công CNC Gỗ Công Nghiệp', type: 'service', hasFilters: false, parentId: null, sortOrder: 20 },
  { id: 'thiet-ke-logo', title: 'Thiết Kế Logo', type: 'service', hasFilters: false, parentId: null, sortOrder: 21 },
  { id: 'in-an-pham', title: 'In Ấn Phẩm', type: 'service', hasFilters: false, parentId: null, sortOrder: 22 },
  { id: 'in-ly-nhua', title: 'In Ly Nhựa / In Cốc Nhựa', type: 'service', hasFilters: false, parentId: null, sortOrder: 23 },
  { id: 'in-chai-lo-thuy-tinh', title: 'In Chai Lọ Thủy Tinh', type: 'service', hasFilters: false, parentId: null, sortOrder: 24 },
];

export const DEFAULT_ITEMS: CatalogItem[] = [
  // Subcategory: Chai Thủy Tinh (chai-thuy-tinh)
  {
    name: 'Chai Thủy Tinh Tròn 200ml ĐTL',
    img: '/placeholder.svg',
    imgs: [
      'https://bizweb.dktcdn.net/thumb/large/100/091/995/products/sua-200.png',
      'https://bizweb.dktcdn.net/thumb/large/100/091/995/products/sua-250.png',
    ],
    dungTich: '200ml', quyCach: '105 chai/thùng', phiNap: '48mm', loaiNap: 'nắp kim loại', color: 'Clear',
    desc: DESC_200ML,
    price: 15000,
    bulkDiscounts: [
      { threshold: 10, pricePerUnit: 14000 },
      { threshold: 50, pricePerUnit: 13000 },
      { threshold: 100, pricePerUnit: 12000 },
    ],
    stock: 500,
    categoryId: 'chai-thuy-tinh'
  },
  {
    name: 'Chai Thủy Tinh Trụ Tròn 300ml',
    img: 'https://bizweb.dktcdn.net/thumb/large/100/091/995/products/sua-300.png',
    dungTich: '300ml', quyCach: '24 chai/thùng', phiNap: '43mm', loaiNap: 'nắp kim loại', color: 'Clear',
    price: 18000,
    stock: 200,
    categoryId: 'chai-thuy-tinh'
  },
  {
    name: 'Chai Thủy Tinh Dẹt Vương 250ml',
    img: 'https://bizweb.dktcdn.net/thumb/large/100/091/995/products/chai-thuy-tinh-det-250.png',
    dungTich: '250ml', quyCach: '48 chai/thùng', phiNap: '38mm', loaiNap: 'nắp kim loại', color: 'Clear',
    price: 21000,
    stock: 120,
    categoryId: 'chai-thuy-tinh'
  },
  {
    name: 'Chai Nắp Dây Xách Thể Thao 500ml',
    img: 'https://bizweb.dktcdn.net/thumb/large/100/091/995/products/day-xach.png',
    dungTich: '500ml', quyCach: '48 chai/thùng', phiNap: '38mm', loaiNap: 'nắp dây xách', color: 'Clear',
    price: 25000,
    stock: 80,
    categoryId: 'chai-thuy-tinh'
  },

  // Subcategory: Lọ Thủy Tinh (lo-thuy-tinh)
  {
    name: 'Hũ Thủy Tinh Lục Giác 280ml',
    img: 'https://bizweb.dktcdn.net/thumb/large/100/091/995/products/luc-giac-280.png',
    dungTich: '280ml', quyCach: '24 chai/thùng', phiNap: '58mm', loaiNap: 'nắp kim loại', color: 'Clear',
    price: 12000,
    stock: 150,
    categoryId: 'lo-thuy-tinh'
  },
  {
    name: 'Hũ Thủy Tinh Lục Giác 380ml',
    img: 'https://bizweb.dktcdn.net/thumb/large/100/091/995/products/luc-giac-380.png',
    dungTich: '380ml', quyCach: '24 chai/thùng', phiNap: '58mm', loaiNap: 'nắp kim loại', color: 'Clear',
    price: 14000,
    stock: 300,
    categoryId: 'lo-thuy-tinh'
  },
  {
    name: 'Hũ Thủy Tinh Tròn Nắp Thiếc 500ml',
    img: 'https://bizweb.dktcdn.net/thumb/large/100/091/995/products/hu-tron-500.png',
    dungTich: '500ml', quyCach: '24 hũ/thùng', phiNap: '63mm', loaiNap: 'nắp kim loại', color: 'Clear',
    price: 16000,
    stock: 50,
    categoryId: 'lo-thuy-tinh'
  },

  // Subcategory: Nắp Lọ (nap-lo)
  {
    name: 'Nắp Thiết Sơn Tĩnh Điện Vàng 58mm',
    img: '/placeholder.svg',
    phiNap: '58mm', loaiNap: 'nắp kim loại', color: 'Gold',
    price: 2000,
    stock: 5000,
    categoryId: 'nap-lo'
  },
  {
    name: 'Nắp Thiết Sơn Tĩnh Điện Đen 48mm',
    img: '/placeholder.svg',
    phiNap: '48mm', loaiNap: 'nắp kim loại', color: 'Black',
    price: 1800,
    stock: 4500,
    categoryId: 'nap-lo'
  },

  // Category: Hộp Nhựa (hop-nhua)
  {
    name: 'Hộp Nhựa Tròn Trong Suốt PET 1000ml',
    img: '/placeholder.svg',
    dungTich: '1000ml', quyCach: '100 hộp/kiện', loaiNap: 'nắp nhựa', color: 'Clear',
    price: 9000,
    stock: 1200,
    categoryId: 'hop-nhua'
  },
  {
    name: 'Hộp Nhựa Vuông Nắp Bản Lề 500ml',
    img: '/placeholder.svg',
    dungTich: '500ml', quyCach: '200 hộp/kiện', color: 'Clear',
    price: 4500,
    stock: 2500,
    categoryId: 'hop-nhua'
  },

  // Subcategory: Bao Bì Yến Tinh Chế (bao-bi-yen-tinh-che)
  {
    name: 'Hộp Nhựa Hoa Mai Đựng Yến Sào Cao Cấp',
    img: '/placeholder.svg',
    dungTich: '100g', color: 'Clear',
    price: 45000,
    stock: 350,
    categoryId: 'bao-bi-yen-tinh-che'
  },
  {
    name: 'Hộp Yến Sào Kim Cương ĐTL 100g',
    img: '/placeholder.svg',
    dungTich: '100g', color: 'Clear',
    price: 52000,
    stock: 140,
    categoryId: 'bao-bi-yen-tinh-che'
  },

  // Subcategory: Bao Bì Yến Chưng (bao-bi-yen-chung)
  {
    name: 'Khăn Hộp Quà Lót Nhung Đựng 6 Hũ Yến Chưng',
    img: '/placeholder.svg',
    price: 65000,
    stock: 120,
    categoryId: 'bao-bi-yen-chung'
  },
  {
    name: 'Khay Bi Giấy Carton Đựng Hũ Yến Chưng',
    img: '/placeholder.svg',
    price: 12000,
    stock: 800,
    categoryId: 'bao-bi-yen-chung'
  },

  // Subcategory: Túi Giấy (tui-giay)
  {
    name: 'Túi Giấy Quai Xách Cao Cấp Đựng 100g Yến Sào',
    img: '/placeholder.svg',
    price: 22000,
    stock: 1000,
    categoryId: 'tui-giay'
  },

  // Subcategory: Khuôn Yến (khuon)
  {
    name: 'Khuôn Yến Inox Tròn Định Hình Tổ',
    img: '/placeholder.svg',
    price: 15000,
    stock: 600,
    categoryId: 'khuon'
  },

  // Subcategory: Nhíp (nhip)
  {
    name: 'Nhíp Gắp Lông Yến Chuyên Dụng Sọc ĐTL',
    img: '/placeholder.svg',
    price: 25000,
    stock: 450,
    categoryId: 'nhip'
  },
  {
    name: 'Nhíp Thép Không Gỉ Cong Cao Cấp',
    img: '/placeholder.svg',
    price: 35000,
    stock: 200,
    categoryId: 'nhip'
  },

  // Subcategory: Cân điện tử (can-dien-tu)
  {
    name: 'Cân Tiểu Ly Điện Tử 500g/0.01g Siêu Chuẩn',
    img: '/placeholder.svg',
    price: 145000,
    stock: 45,
    categoryId: 'can-dien-tu'
  },

  // Subcategory: Màng bọc thực phẩm (mang-boc-thuc-pham)
  {
    name: 'Màng Bọc Thực Phẩm PVC ĐTL 30cm x 150m',
    img: '/placeholder.svg',
    price: 75000,
    stock: 180,
    categoryId: 'mang-boc-thuc-pham'
  },

  // Subcategory: Bàn Tinh Chế (ban-tinh-che)
  {
    name: 'Bàn Tinh Chế Yến Sào Inox 304 Toàn Bộ',
    img: '/placeholder.svg',
    price: 6500000,
    stock: 10,
    categoryId: 'ban-tinh-che'
  },

  // Subcategory: Máy sấy yến (may-say-yen)
  {
    name: 'Máy Sấy Nhiệt Tổ Yến ĐTL 20 Tổ',
    img: '/placeholder.svg',
    price: 9500000,
    stock: 4,
    categoryId: 'may-say-yen'
  },
  {
    name: 'Máy Sấy Lạnh Tổ Yến Công Nghệ Cao 100 Tổ',
    img: '/placeholder.svg',
    price: 42000000,
    stock: 2,
    categoryId: 'may-say-yen'
  },

  // Subcategory: Máy móc (may-moc)
  {
    name: 'Máy Rót Hũ Yến Chưng Bán Tự Động ĐTL-02',
    img: '/placeholder.svg',
    price: 18500000,
    stock: 3,
    categoryId: 'may-moc'
  },
  {
    name: 'Máy Siết Nắp Chai Hũ Yến Chưng Cầm Tay',
    img: '/placeholder.svg',
    price: 4500000,
    stock: 12,
    categoryId: 'may-moc'
  },

  // Services: Thiết kế & thi công nội ngoại thất
  {
    name: 'Thiết Kế Cửa Hàng Showroom Yến Sào Trọn Gói',
    img: '/placeholder.svg',
    price: 0, // Liên hệ báo giá
    categoryId: 'thiet-ke-noi-ngoai-that'
  },
  
  // Services: Gia công CNC gỗ công nghiệp
  {
    name: 'Gia Công Cắt Khắc CNC Gỗ MDF Công Nghiệp',
    img: '/placeholder.svg',
    price: 0,
    categoryId: 'gia-cong-cnc-go-cong-nghiep'
  },
  
  // Services: Thiết kế logo
  {
    name: 'Thiết Kế Logo Lập Diện Thương Hiệu Độc Quyền Ngành Yến',
    img: '/placeholder.svg',
    price: 0,
    categoryId: 'thiet-ke-logo'
  },
  
  // Services: In ấn phẩm
  {
    name: 'In Catalogue & Brochure Giới Thiệu Tổ Yến',
    img: '/placeholder.svg',
    price: 0,
    categoryId: 'in-an-pham'
  },
  
  // Services: In ly nhựa / cốc nhựa
  {
    name: 'In Logo Lên Ly Nhựa Cốc Nhựa Trà Sữa PP/PET',
    img: '/placeholder.svg',
    price: 0,
    categoryId: 'in-ly-nhua'
  },
  
  // Services: In chai lọ thủy tinh
  {
    name: 'In Lụa Trực Tiếp Trên Trụ Chai Thủy Tinh & Hũ Yến',
    img: '/placeholder.svg',
    price: 0,
    categoryId: 'in-chai-lo-thuy-tinh'
  }
];

export function getCatalogFromCategories(
  categoriesList: DbCategory[],
  itemsList: CatalogItem[]
): Record<string, CatalogCategory> {
  const catalog: Record<string, CatalogCategory> = {};
  
  // Build a map of category by ID for quick check
  const catMap = new Map<string, DbCategory>();
  categoriesList.forEach(c => catMap.set(c.id, c));

  categoriesList.forEach(cat => {
    // Collect items. An item belongs to this category directly, OR if it belongs to a child category of this parent,
    // and we are rendering the parent, we can aggregate.
    // However, to keep it clean, items are assigned to subcategories. 
    // Let's gather items that belong to this category ID, OR where item's category's folder parentId matches cat.id!
    const catItems = itemsList.filter(item => {
      if (item.categoryId === cat.id) return true;
      const itemCat = catMap.get(item.categoryId);
      return itemCat && itemCat.parentId === cat.id;
    });

    catalog[cat.id] = {
      title: cat.title,
      type: cat.type,
      hasFilters: cat.hasFilters,
      filterDefs: cat.hasFilters ? [
        { key:'dungTich', label:'Dung tích', values:['100ml','200ml','250ml','300ml','500ml','1000ml'] },
        { key:'quyCach',  label:'Quy cách',  values:['24 chai/thùng','48 chai/thùng','105 chai/thùng'] },
        { key:'phiNap',   label:'Phi nắp',   values:['38mm','43mm','48mm','58mm','63mm'] },
        { key:'loaiNap',  label:'Loại nắp',  values:['nắp kim loại','nắp nhựa','nắp dây xách'] },
        { key:'color',    label:'Màu sắc',   values:['Clear', 'Amber', 'Green'] },
      ] : undefined,
      items: catItems,
      parentId: cat.parentId || undefined
    };
  });
  
  return catalog;
}

// Statically built for default render / SSR
export const CATALOG: Record<string, CatalogCategory> = getCatalogFromCategories(
  DEFAULT_CATEGORIES,
  DEFAULT_ITEMS
);
