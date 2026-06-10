import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Package, Tag, Layers, CheckCircle } from 'lucide-react';
import type { Metadata } from 'next';

import { getPublicProductBySlug } from '@/lib/services/public-products';
import { ProductGallery } from '@/components/ProductGallery';
import { ProductDetailCTAs } from '@/components/ProductDetailCTAs';
import { isKnownTemplate, SPEC_TEMPLATES } from '@/lib/product-spec-templates';

// Fallback labels for legacy custom-key specs
const LEGACY_SPEC_LABELS: Record<string, string> = {
  dungTich: 'Dung tích',
  quyCach: 'Quy cách',
  phiNap: 'Phi nắp',
  loaiNap: 'Loại nắp',
  color: 'Màu sắc',
  material: 'Chất liệu',
  weight: 'Trọng lượng',
  dimensions: 'Kích thước',
};

function formatLegacyLabel(key: string): string {
  return LEGACY_SPEC_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').trim();
}

interface SpecDisplayRow {
  label: string;
  value: string;
}

function buildSpecRows(rawSpecs: unknown): SpecDisplayRow[] {
  if (!rawSpecs || typeof rawSpecs !== 'object' || Array.isArray(rawSpecs)) return [];
  const obj = rawSpecs as Record<string, unknown>;

  // Template-aware display: use template field order and labels
  if (isKnownTemplate(obj._template)) {
    const template = SPEC_TEMPLATES[obj._template];
    return [...template.fields]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .filter((f) => obj[f.key] != null && obj[f.key] !== '')
      .map((f) => ({ label: f.label, value: String(obj[f.key]) }));
  }

  // Legacy / custom display: keep existing behavior, skip internal keys
  return Object.entries(obj)
    .filter(([k, v]) => k !== '_template' && v !== null && v !== '')
    .map(([k, v]) => ({ label: formatLegacyLabel(k), value: String(v) }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);
  if (!product) return { title: 'Sản phẩm không tồn tại' };

  const description =
    product.description ??
    `Xem chi tiết và báo giá sỉ sản phẩm ${product.name} tại Đại Tài Lợi.`;

  const primaryImage =
    product.images.find((img) => img.is_primary) ?? product.images[0] ?? null;

  const ogImages = primaryImage?.public_url
    ? [{ url: primaryImage.public_url, alt: product.name }]
    : [];

  return {
    title: `${product.name} | Đại Tài Lợi`,
    description,
    alternates: {
      canonical: `/san-pham/${slug}`,
    },
    openGraph: {
      type: 'website',
      title: `${product.name} | Đại Tài Lợi`,
      description,
      url: `/san-pham/${slug}`,
      ...(ogImages.length > 0 ? { images: ogImages } : {}),
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);

  if (!product) notFound();

  const specs = buildSpecRows(product.specs);
  const hasBulkDiscounts = product.bulkDiscounts.length > 0;

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <nav
        aria-label="Điều hướng"
        className="bg-dtl-bg-alt border-b border-dtl-border"
      >
        <div className="max-w-[1220px] mx-auto px-5 py-3 flex items-center gap-1.5 text-[13px] text-dtl-gray flex-wrap">
          <Link href="/" className="hover:text-dtl-red transition-colors font-medium">
            Trang chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          {product.category ? (
            <>
              <Link
                href={`/danh-muc/${product.category.slug}`}
                className="hover:text-dtl-red transition-colors font-medium"
              >
                {product.category.name}
              </Link>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            </>
          ) : (
            <>
              <Link href="/danh-muc" className="hover:text-dtl-red transition-colors font-medium">
                Danh mục
              </Link>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            </>
          )}
          <span className="text-dtl-dark font-semibold line-clamp-1">{product.name}</span>
        </div>
      </nav>

      {/* Main content */}
      <div className="max-w-[1220px] mx-auto px-5 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14">
          {/* Left — Gallery */}
          <div>
            <ProductGallery images={product.images} productName={product.name} />
          </div>

          {/* Right — Details */}
          <div className="flex flex-col gap-5">
            {/* Category badge */}
            {product.category && (
              <Link
                href={`/danh-muc/${product.category.slug}`}
                className="self-start inline-flex items-center gap-1.5 bg-dtl-bg-alt border border-dtl-border text-dtl-navy text-[12px] font-bold px-3 py-1 rounded-full uppercase tracking-wide hover:bg-dtl-navy hover:text-white transition-colors"
              >
                <Tag className="w-3 h-3" />
                {product.category.name}
              </Link>
            )}

            {/* Product name */}
            <h1 className="text-[24px] md:text-[28px] font-black text-dtl-dark leading-tight">
              {product.name}
            </h1>

            {/* SKU / slug */}
            <p className="text-[12px] text-dtl-gray font-mono">
              SKU: <span className="text-dtl-dark font-semibold uppercase">{product.slug}</span>
            </p>

            {/* Short description */}
            {product.description && (
              <p className="whitespace-pre-line text-[14px] text-dtl-gray leading-relaxed border-l-2 border-dtl-red pl-3">
                {product.description}
              </p>
            )}

            {/* Price */}
            <div className="bg-dtl-bg-alt rounded-xl p-4 border border-dtl-border">
              {product.price ? (
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-[28px] font-extrabold text-dtl-red leading-none">
                    {product.price.toLocaleString('vi-VN')}đ
                  </span>
                  <span className="text-[13px] text-dtl-gray font-medium">/sản phẩm</span>
                </div>
              ) : (
                <p className="text-[16px] font-bold text-dtl-navy">Liên hệ báo giá</p>
              )}

              {hasBulkDiscounts && (
                <p className="text-[12px] text-dtl-gray mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse inline-block" />
                  Giá sỉ chiết khấu từ{' '}
                  <strong className="text-dtl-red ml-0.5">
                    {Math.min(...product.bulkDiscounts.map((d) => d.price_per_unit)).toLocaleString('vi-VN')}đ
                  </strong>
                </p>
              )}

              {/* Stock status */}
              <div className="mt-3 flex items-center gap-2">
                {product.stock > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Còn hàng ({product.stock.toLocaleString('vi-VN')} sản phẩm)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-dtl-gray bg-dtl-bg-alt border border-dtl-border px-2.5 py-1 rounded-full">
                    <Package className="w-3.5 h-3.5" />
                    Liên hệ kiểm tra tồn kho
                  </span>
                )}
              </div>
            </div>

            {/* Bulk discount table */}
            {hasBulkDiscounts && (
              <div>
                <h2 className="text-[13px] font-bold text-dtl-dark uppercase tracking-wide mb-2 flex items-center gap-2">
                  <span className="w-1 h-4 bg-dtl-red rounded-full inline-block" />
                  Bảng giá sỉ
                </h2>
                <div className="rounded-lg border border-dtl-border overflow-hidden text-[13px]">
                  <div className="grid grid-cols-2 bg-dtl-navy text-white text-[11px] font-bold uppercase tracking-wide">
                    <div className="px-4 py-2.5">Số lượng</div>
                    <div className="px-4 py-2.5 text-right">Giá/sản phẩm</div>
                  </div>
                  {product.bulkDiscounts.map((tier) => (
                    <div
                      key={tier.id}
                      className="grid grid-cols-2 border-t border-dtl-border even:bg-dtl-bg-alt hover:bg-orange-50 transition-colors"
                    >
                      <div className="px-4 py-3 font-semibold text-dtl-dark">
                        Từ {tier.min_quantity.toLocaleString('vi-VN')} sản phẩm
                      </div>
                      <div className="px-4 py-3 text-right font-extrabold text-dtl-red">
                        {tier.price_per_unit.toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTAs */}
            <ProductDetailCTAs
              productId={product.id}
              productSlug={product.slug}
              productName={product.name}
              categorySlug={product.category?.slug ?? null}
            />
          </div>
        </div>

        {/* Specs + Description below fold */}
        {(specs.length > 0 || product.description) && (
          <div className="mt-10 md:mt-14 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Specs table */}
            {specs.length > 0 && (
              <div>
                <h2 className="flex items-center gap-2 text-[16px] font-black text-dtl-navy uppercase tracking-wide mb-4">
                  <Layers className="w-5 h-5 text-dtl-red" />
                  Thông số kỹ thuật
                </h2>
                <div className="rounded-xl border border-dtl-border overflow-hidden text-[13px]">
                  {specs.map(({ label, value }, idx) => (
                    <div
                      key={label}
                      className={`grid grid-cols-2 border-b border-dtl-border last:border-b-0 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-dtl-bg-alt'
                      }`}
                    >
                      <div className="px-4 py-3 font-semibold text-dtl-gray">
                        {label}
                      </div>
                      <div className="px-4 py-3 font-bold text-dtl-dark">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extended description */}
            {product.description && (
              <div>
                <h2 className="flex items-center gap-2 text-[16px] font-black text-dtl-navy uppercase tracking-wide mb-4">
                  <span className="w-1 h-5 bg-dtl-red rounded-full inline-block" />
                  Mô tả sản phẩm
                </h2>
                <p className="whitespace-pre-line text-dtl-gray leading-relaxed text-[14px]">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Bottom CTA strip */}
        <div className="mt-10 md:mt-14 bg-dtl-navy rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-5">
          <div>
            <p className="text-white font-bold text-[16px] md:text-[18px]">
              Bạn cần tư vấn hoặc báo giá sỉ?
            </p>
            <p className="text-white/70 text-[13px] mt-1">
              Đội ngũ kinh doanh Đại Tài Lợi sẵn sàng hỗ trợ bạn 24/7.
            </p>
          </div>
          <ProductDetailCTAs
            productId={product.id}
            productSlug={product.slug}
            productName={product.name}
            categorySlug={product.category?.slug ?? null}
          />
        </div>
      </div>
    </div>
  );
}
