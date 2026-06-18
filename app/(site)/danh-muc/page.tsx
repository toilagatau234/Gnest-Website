import { Suspense } from "react";
import { CatalogPage } from "@/components/CatalogPage";
import { BannerSlot } from "@/components/BannerSlot";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Danh mục sản phẩm',
  description: 'Khám phá danh mục các sản phẩm chai lọ, hũ nhựa, hũ thủy tinh cao cấp sỉ và lẻ tại Đại Tài Lợi.',
  alternates: {
    canonical: '/danh-muc',
  },
};

export default function DanhMucIndex() {
  return (
    <Suspense>
      <CatalogPage
        slug="all"
        banner={<BannerSlot position="catalog_top" variant="compact" />}
      />
    </Suspense>
  );
}
