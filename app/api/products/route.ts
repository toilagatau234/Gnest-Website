import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

type PublicProductApiRow = {
  id: string;
  name: string;
  slug: string;
  category_id: string | null;
  description: string | null;
  price: number | null;
  stock: number;
  specs: unknown;
  created_at: string;
  product_images: {
    id: string;
    public_url: string | null;
    alt: string | null;
    sort_order: number;
    is_primary: boolean;
    is_active: boolean;
  }[];
};

function parseLimit(value: string | null) {
  const parsed = Number(value ?? DEFAULT_LIMIT);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(1, Math.floor(parsed)));
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Strict ISO-8601 timestamp (matches Postgres timestamptz output), e.g.
// 2026-06-23T12:00:00.123456+00:00 or ...Z. Deliberately narrow: no commas, parentheses or
// other PostgREST operator characters can slip through.
const ISO_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?([+-]\d{2}:?\d{2}|Z)?$/;

function parseCursor(cursor: string | null) {
  if (!cursor) return null;
  const [createdAt, id] = cursor.split('|');
  if (!createdAt || !id) return null;
  // These parts are interpolated into a PostgREST `.or()` filter below, so they MUST be strictly
  // validated to prevent filter injection. createdAt must be an ISO timestamp and id a UUID;
  // anything else is treated as "no cursor" (first page).
  if (!ISO_TIMESTAMP_RE.test(createdAt) || !UUID_RE.test(id)) return null;
  return { createdAt, id };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseLimit(searchParams.get('limit'));
  const cursor = parseCursor(searchParams.get('cursor'));
  const categoryId = searchParams.get('categoryId');
  const supabase = await createClient();

  let query = supabase
    .from('products')
    .select(
      `
        id,
        name,
        slug,
        category_id,
        description,
        price,
        stock,
        specs,
        created_at,
        product_images(id, public_url, alt, sort_order, is_primary, is_active)
      `,
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  if (cursor) {
    query = query.or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as PublicProductApiRow[];
  const items = rows.slice(0, limit);
  const last = items.at(-1);

  return NextResponse.json({
    items,
    nextCursor: rows.length > limit && last ? `${last.created_at}|${last.id}` : null,
    hasNextPage: rows.length > limit,
  });
}
