export type ProductImageUploadPlaceholderInput = {
  productId: string;
  fileName: string;
};

export async function uploadProductImagePlaceholder(input: ProductImageUploadPlaceholderInput) {
  const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();

  return {
    bucket: 'product-images',
    path: `products/${input.productId}/${safeFileName}`,
    publicUrl: null,
    uploaded: false,
    message: 'Placeholder only. Configure Supabase Storage bucket and implement upload in admin phase.',
  };
}
