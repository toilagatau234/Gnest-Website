import { createClient } from '@/lib/supabase/server';
import type { Tables, InquiryStatus } from '@/lib/types/database';

export type Inquiry = Tables<'inquiries'>;

export interface GetInquiriesOptions {
  status?: InquiryStatus;
  limit?: number;
  offset?: number;
}

export async function getInquiries(options?: GetInquiriesOptions) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching inquiries:', error.message);
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to fetch inquiries:', message);
    return { data: null, error: message };
  }
}

export async function getInquiryCount() {
  try {
    const supabase = await createClient();

    const { count, error } = await supabase
      .from('inquiries')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error counting inquiries:', error.message);
      return { count: 0, error: error.message };
    }

    return { count: count || 0, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to count inquiries:', message);
    return { count: 0, error: message };
  }
}

export async function getNewInquiriesCount() {
  try {
    const supabase = await createClient();

    const { count, error } = await supabase
      .from('inquiries')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new');

    if (error) {
      console.error('Error counting new inquiries:', error.message);
      return { count: 0, error: error.message };
    }

    return { count: count || 0, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to count new inquiries:', message);
    return { count: 0, error: message };
  }
}
