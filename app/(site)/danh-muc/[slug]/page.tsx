import { Suspense } from "react";
import { CatalogPage } from "@/components/CatalogPage";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  return (
    <Suspense>
      <CatalogPage slug={resolvedParams.slug} />
    </Suspense>
  );
}
