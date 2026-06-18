import { Suspense } from "react";
import { CatalogPage } from "@/components/CatalogPage";
import { BannerSlot } from "@/components/BannerSlot";
import { getCategoryBySlug } from "@/lib/services/categories";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const category = await getCategoryBySlug(resolvedParams.slug);
  if (!category) {
    return { title: "Danh mục không tồn tại" };
  }

  const title = category.name;
  const description = `Khám phá các sản phẩm thuộc danh mục ${category.name} chất lượng cao, giá sỉ tốt nhất tại Đại Tài Lợi.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/danh-muc/${resolvedParams.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/danh-muc/${resolvedParams.slug}`,
    },
  };
}

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
