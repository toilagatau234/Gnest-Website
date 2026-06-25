-- ============================================================
-- upsert_products_by_sku (Phase 7 + 8)
-- SKU is the business identity. This RPC performs a set-based
-- INSERT ... or UPDATE matched on sku with:
--   • COALESCE preserve  → existing non-null fields kept when incoming is empty
--   • specs JSONB merge   → incremental enrichment (existing keys preserved,
--                           non-empty incoming keys overlaid)
-- Returns one row per input describing the outcome (insert vs update).
--
-- Each element of p_rows is expected to contain:
--   sku (required), name, slug, category_id, description, price, stock,
--   is_active, is_featured, seo_title, seo_description, seo_keywords, specs
-- ============================================================

create or replace function public.upsert_products_by_sku(p_rows jsonb)
returns table (id uuid, sku text, slug text, was_inserted boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  r          jsonb;
  v_existing public.products%rowtype;
  v_id       uuid;
begin
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    return;
  end if;

  for r in select * from jsonb_array_elements(p_rows)
  loop
    -- SKU is mandatory for this path.
    if coalesce(r->>'sku', '') = '' then
      continue;
    end if;

    select * into v_existing
    from public.products p
    where p.sku = (r->>'sku')
    limit 1;

    if found then
      update public.products p set
        name            = coalesce(nullif(r->>'name', ''), p.name),
        slug            = coalesce(nullif(r->>'slug', ''), p.slug),
        category_id     = coalesce((r->>'category_id')::uuid, p.category_id),
        description     = coalesce(nullif(r->>'description', ''), p.description),
        price           = coalesce((r->>'price')::numeric, p.price),
        stock           = coalesce((r->>'stock')::integer, p.stock),
        is_active       = coalesce((r->>'is_active')::boolean, p.is_active),
        is_featured     = coalesce((r->>'is_featured')::boolean, p.is_featured),
        seo_title       = coalesce(nullif(r->>'seo_title', ''), p.seo_title),
        seo_description = coalesce(nullif(r->>'seo_description', ''), p.seo_description),
        seo_keywords    = coalesce(nullif(r->>'seo_keywords', ''), p.seo_keywords),
        specs           = p.specs || coalesce(r->'specs', '{}'::jsonb),
        updated_at      = now()
      where p.id = v_existing.id;

      id := v_existing.id;
      sku := r->>'sku';
      slug := coalesce(nullif(r->>'slug', ''), v_existing.slug);
      was_inserted := false;
      return next;
    else
      insert into public.products (
        sku, name, slug, category_id, description, price, stock,
        is_active, is_featured, seo_title, seo_description, seo_keywords, specs
      ) values (
        r->>'sku',
        r->>'name',
        r->>'slug',
        (r->>'category_id')::uuid,
        nullif(r->>'description', ''),
        (r->>'price')::numeric,
        coalesce((r->>'stock')::integer, 0),
        coalesce((r->>'is_active')::boolean, true),
        coalesce((r->>'is_featured')::boolean, false),
        nullif(r->>'seo_title', ''),
        nullif(r->>'seo_description', ''),
        nullif(r->>'seo_keywords', ''),
        coalesce(r->'specs', '{}'::jsonb)
      )
      returning public.products.id into v_id;

      id := v_id;
      sku := r->>'sku';
      slug := r->>'slug';
      was_inserted := true;
      return next;
    end if;
  end loop;
end;
$$;

revoke all on function public.upsert_products_by_sku(jsonb) from public, anon, authenticated;
grant execute on function public.upsert_products_by_sku(jsonb) to service_role;
