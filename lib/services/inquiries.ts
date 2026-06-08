import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import type { Inserts } from '@/lib/types/database';

export type CreateInquiryInput = Pick<
  Inserts<'inquiries'>,
  'customer_name' | 'phone' | 'email' | 'product_id' | 'message' | 'metadata'
>;

export async function createInquiry(input: CreateInquiryInput) {
  const supabase = await createClient();

  // Find active sale/admin to assign the inquiry (round-robin / least active new inquiry strategy)
  let assignedTo: string | null = null;
  try {
    const adminSupabase = createServiceRoleClient();
    const { data: adminUsers } = await adminSupabase
      .from('admin_users')
      .select('id')
      .eq('is_active', true)
      .in('role', ['super_admin', 'admin', 'editor']);

    if (adminUsers && adminUsers.length > 0) {
      // Find count of new/active inquiries assigned to each active admin
      const { data: counts } = await adminSupabase
        .from('inquiries')
        .select('assigned_to')
        .in('status', ['new', 'contacted', 'quoted'])
        .not('assigned_to', 'is', null);

      const countMap: Record<string, number> = {};
      adminUsers.forEach((u) => {
        countMap[u.id] = 0;
      });

      if (counts) {
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
    console.error('[createInquiry] failed to assign agent', err);
  }

  const { data, error } = await supabase
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

