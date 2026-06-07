import { Suspense } from "react";
import { CatalogPage } from "@/components/CatalogPage";

export default function DanhMucIndex() {
  return (
    <Suspense>
      <CatalogPage slug="all" />
    </Suspense>
  );
}
