import { Suspense } from "react";
import { CatalogPage } from "@/components/CatalogPage";
import { BannerSlot } from "@/components/BannerSlot";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  return (
    <Suspense>
      <CatalogPage
        slug={resolvedParams.slug}
        banner={<BannerSlot position="catalog_top" variant="compact" />}
      />
    </Suspense>
  );
}
