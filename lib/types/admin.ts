import type { AdminRole } from '@/lib/types/database';

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
}

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Quản trị viên',
  editor: 'Biên tập viên',
  viewer: 'Người xem',
};
