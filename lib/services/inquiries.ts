import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Inserts } from '@/lib/types/database';

export type CreateInquiryInput = Pick<
  Inserts<'inquiries'>,
  'customer_name' | 'phone' | 'email' | 'product_id' | 'message' | 'metadata'
>;

export async function createInquiry(input: CreateInquiryInput) {
  // Inquiries are written with the server-only service-role client. Direct anon INSERT was
  // revoked (20260623010000_harden_inquiries_grants.sql) so the anti-spam controls in the
  // Server Action cannot be bypassed via direct PostgREST calls. This runs server-side only;
  // no admin details or personal data are returned to the client.
  const adminSupabase = createServiceRoleClient();

  // Find active sale/admin to assign the inquiry (round-robin / least active new inquiry strategy)
  let assignedTo: string | null = null;
  try {
    const { data: adminUsers, error: adminErr } = await adminSupabase
      .from('admin_users')
      .select('id')
      .eq('is_active', true)
      .in('role', ['super_admin', 'admin', 'editor']);

    if (!adminErr && adminUsers && adminUsers.length > 0) {
      // Find count of new/active inquiries assigned to each active admin
      const { data: counts, error: countErr } = await adminSupabase
        .from('inquiries')
        .select('assigned_to')
        .in('status', ['new', 'contacted', 'quoted'])
        .not('assigned_to', 'is', null);

      const countMap: Record<string, number> = {};
      adminUsers.forEach((u) => {
        countMap[u.id] = 0;
      });

      if (!countErr && counts) {
        counts.forEach((c) => {
          if (c.assigned_to && countMap[c.assigned_to] !== undefined) {
            countMap[c.assigned_to]++;
          }
        });
      }

      // Find the admin user with the lowest active inquiry count
      let minCount = Infinity;
      let minAdminId = adminUsers[0].id;
      for (const admin of adminUsers) {
        const c = countMap[admin.id];
        if (c < minCount) {
          minCount = c;
          minAdminId = admin.id;
        }
      }
      assignedTo = minAdminId;
    }
  } catch (err) {
    // Graceful fallback: assignment lookup failure must never block inquiry creation
    console.error('[createInquiry] failed to assign agent', err);
    assignedTo = null;
  }

  const { data, error } = await adminSupabase
    .from('inquiries')
    .insert({
      customer_name: input.customer_name,
      phone: input.phone,
      email: input.email ?? null,
      product_id: input.product_id ?? null,
      message: input.message ?? null,
      assigned_to: assignedTo,
      metadata: input.metadata ?? {},
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create inquiry: ${error.message}`);
  }

  return data;
}

