import { requireAdminAuth } from '@/lib/services/admin/auth';
import { SYSTEM_CONFIG_ROLES } from '@/lib/services/admin/permissions';
import { getSiteContents } from '@/lib/services/admin/site-content';
import { SiteContentEditor } from './SiteContentEditor';

export const metadata = {
  title: 'Nội Dung Website | Admin CMS',
};

export default async function SiteContentPage() {
  // eslint-disable-next-line react-hooks/purity
  const _t0 = Date.now();
  // Only super_admin and admin may access and modify system configuration.
  await requireAdminAuth(SYSTEM_CONFIG_ROLES);
  const contents = await getSiteContents();
  if (process.env.NODE_ENV === 'development' && process.env.ADMIN_TIMING_LOGS === '1') {
    // eslint-disable-next-line react-hooks/purity
    console.log(`[admin-timing] site-content page total: ${Date.now() - _t0}ms`);
  }

  return <SiteContentEditor initialContents={contents} />;
}
