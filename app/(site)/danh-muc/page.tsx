import { Suspense } from "react";
import { CatalogPage } from "@/components/CatalogPage";
import { BannerSlot } from "@/components/BannerSlot";

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
