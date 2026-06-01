import { requireAdminAuth } from '@/lib/services/admin/auth';
import { getSiteContents } from '@/lib/services/admin/site-content';
import { SiteContentEditor } from './SiteContentEditor';

export const metadata = {
  title: 'Nội Dung Website | Admin CMS',
};

export default async function SiteContentPage() {
  await requireAdminAuth();
  const contents = await getSiteContents();

  return <SiteContentEditor initialContents={contents} />;
}
