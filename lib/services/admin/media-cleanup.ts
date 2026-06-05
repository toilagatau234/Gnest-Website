import 'server-only';

import { createServiceRoleClient } from '@/lib/supabase/server';

const PRODUCT_IMAGES_BUCKET = 'product-images';

export interface MediaCleanupItemResult {
  storage_path: string;
  attempted: boolean;
  skipped: boolean;
  deleted: boolean;
  failed: boolean;
  reason?: string;
  error?: string;
}

export async function cleanupProductImageStorage(
  storagePaths: string[],
): Promise<MediaCleanupItemResult[]> {
  const supabase = createServiceRoleClient();
  const uniquePaths = [...new Set(storagePaths.filter(Boolean))];
  const results: MediaCleanupItemResult[] = [];

  for (const storage_path of uniquePaths) {
    if (storage_path.startsWith('http://') || storage_path.startsWith('https://')) {
      results.push({ storage_path, attempted: false, skipped: true, deleted: false, failed: false, reason: 'external_url' });
      continue;
    }

    const { count, error: countError } = await supabase
      .from('product_images')
      .select('id', { count: 'exact', head: true })
      .eq('storage_path', storage_path);

    if (countError) {
      results.push({ storage_path, attempted: true, skipped: false, deleted: false, failed: true, reason: 'ref_check_failed', error: countError.message });
      continue;
    }

    if ((count ?? 0) > 0) {
      results.push({ storage_path, attempted: true, skipped: true, deleted: false, failed: false, reason: 'still_referenced' });
      continue;
    }

    const { error: deleteError } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([storage_path]);
    if (deleteError) {
      results.push({ storage_path, attempted: true, skipped: false, deleted: false, failed: true, error: deleteError.message });
    } else {
      results.push({ storage_path, attempted: true, skipped: false, deleted: true, failed: false });
    }
  }

  return results;
}
