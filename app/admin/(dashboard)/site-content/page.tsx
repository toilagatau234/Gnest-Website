import { requireAdminAuth } from '@/lib/services/admin/auth';
import { getSiteContents } from '@/lib/services/admin/site-content';
import { SiteContentEditor } from './SiteContentEditor';

export const metadata = {
  title: 'Nội Dung Website | Admin CMS',
};

export default async function SiteContentPage() {
  // eslint-disable-next-line react-hooks/purity
  const _t0 = Date.now();
  await requireAdminAuth();
  const contents = await getSiteContents();
  if (process.env.NODE_ENV === 'development' && process.env.ADMIN_TIMING_LOGS === '1') {
    // eslint-disable-next-line react-hooks/purity
    console.log(`[admin-timing] site-content page total: ${Date.now() - _t0}ms`);
  }

  return <SiteContentEditor initialContents={contents} />;
}
