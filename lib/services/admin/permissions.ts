'server-only';

import type { AdminRole } from '@/lib/types/database';

/**
 * Central RBAC permission matrix for admin server actions and pages.
 *
 * Role hierarchy (highest → lowest):
 *   super_admin → admin → editor → viewer
 *
 * - super_admin : full access, including user management
 * - admin       : all content + system config, cannot modify super_admin accounts
 * - editor      : create/edit content (products, banners, jobs, categories,
 *                 sales contacts, inquiries); cannot access system config or
 *                 admin user management
 * - viewer      : read-only; all mutations are rejected
 */

/** Any authenticated admin role — used only for read-only actions. */
export const ANY_ADMIN_ROLE: readonly AdminRole[] = [
  'super_admin',
  'admin',
  'editor',
  'viewer',
] as const;

/**
 * Roles allowed to mutate content:
 * products, categories, banners, jobs, sales contacts, inquiries.
 */
export const CONTENT_EDITOR_ROLES: readonly AdminRole[] = [
  'super_admin',
  'admin',
  'editor',
] as const;

/**
 * Roles allowed to change system configuration:
 * site content (company info, footer, SEO, hero), critical settings.
 * Editors cannot change system config.
 */
export const SYSTEM_CONFIG_ROLES: readonly AdminRole[] = [
  'super_admin',
  'admin',
] as const;

/**
 * Roles allowed to view sensitive system data:
 * audit logs, admin user directory.
 */
export const SYSTEM_VIEWER_ROLES: readonly AdminRole[] = [
  'super_admin',
  'admin',
] as const;

/**
 * Only super_admin may invite, modify, or remove admin user accounts.
 */
export const USER_MANAGER_ROLES: readonly AdminRole[] = ['super_admin'] as const;
