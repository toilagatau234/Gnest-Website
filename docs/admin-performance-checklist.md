# Admin Performance Checklist

Use this checklist before and after applying the indexes in `admin-performance-sql.md`.

---

## Build verification

```bash
npm run lint
npm run build
```

A clean build with no type errors is required before measuring production performance.

---

## Baseline measurement steps

### 1. Start production server

```bash
npm run build
npm run start
```

> **Important:** `next dev` includes on-demand compilation overhead that does not reflect
> production load time. Always measure with `npm run start` after a clean `npm run build`.

### 2. Test each admin route manually

Open each URL in a browser (or use DevTools Network tab / curl with timing):

| Route | URL |
|---|---|
| Products list | `/admin/products` |
| Inquiries list | `/admin/inquiries` |
| Audit logs list | `/admin/audit-logs` |
| Sales contacts | `/admin/sales-contacts` |
| Jobs list | `/admin/jobs` |

For each route, check:
- [ ] Page loads without error
- [ ] Pagination works (next/prev page)
- [ ] Filters return correct results
- [ ] No console errors in the browser

### 3. Enable server-side timing logs (development only)

Set the environment variable **only in `.env.local`**, never in production:

```bash
ADMIN_TIMING_LOGS=1
```

This flag enables per-query timing output in the Node.js console.
Remove or unset it before deploying.

---

## Comparing dev vs production

| Mode | Command | Expected behavior |
|---|---|---|
| Development | `npm run dev` | Slower first load due to JIT compilation; not representative |
| Production | `npm run build && npm run start` | Reflects real server performance |

Supabase query time itself is the same in both modes — the difference is Next.js
server-side render time and route handler compile overhead.

---

## After applying indexes

Re-run the steps above and compare response times.
Indexes primarily benefit:
- `audit_logs` table (append-only, grows fast — `created_at desc` index is most impactful)
- `products` filtered/sorted queries (`is_active`, `stock`, `updated_at desc`)
- `inquiries` filtered by `status`, `assigned_to`, `product_id`

If a query is still slow after indexing, run `EXPLAIN ANALYZE` in Supabase SQL Editor
to confirm the planner is using the new index.
