import { Suspense } from "react";
import { CatalogPage } from "@/components/CatalogPage";
import { BannerSlot } from "@/components/BannerSlot";

export default function DanhMucIndex() {
  return (
    <>
      <BannerSlot position="catalog_top" />
      <Suspense>
        <CatalogPage slug="all" />
      </Suspense>
    </>
  );
}
