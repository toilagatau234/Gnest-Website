import { Suspense } from "react";
import { CatalogPage } from "@/components/CatalogPage";
import { BannerSlot } from "@/components/BannerSlot";
import type { Metadata } from "next";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: 'Danh mục sản phẩm',
  description: 'Khám phá danh mục các sản phẩm chai lọ, hũ nhựa, hũ thủy tinh cao cấp sỉ và lẻ tại Đại Tài Lợi.',
  alternates: {
    canonical: '/danh-muc',
  },
};

export default function DanhMucIndex() {
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Danh mục sản phẩm',
    description: 'Khám phá danh mục các sản phẩm chai lọ, hũ nhựa, hũ thủy tinh cao cấp sỉ và lẻ tại Đại Tài Lợi.',
    url: `${siteConfig.url}/danh-muc`,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Trang chủ',
        item: siteConfig.url,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Danh mục',
        item: `${siteConfig.url}/danh-muc`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Suspense>
        <CatalogPage
          slug="all"
          banner={<BannerSlot position="catalog_top" variant="compact" />}
        />
      </Suspense>
    </>
  );
}
