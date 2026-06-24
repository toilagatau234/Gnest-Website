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

  // Assign to the active agent with the fewest open inquiries via a single set-based query
  // (pick_least_loaded_agent RPC). This avoids fetching every open inquiry to count in JS and
  // narrows the race window between concurrent submissions.
  let assignedTo: string | null = null;
  try {
    const { data: agentId, error: assignErr } = await adminSupabase.rpc('pick_least_loaded_agent');
    if (!assignErr && agentId) {
      assignedTo = agentId;
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

