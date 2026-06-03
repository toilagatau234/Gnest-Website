import type { Json } from '@/lib/types/database';

type AuditShape = Record<string, unknown>;

function toJsonValue(value: unknown): Json | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => toJsonValue(entry))
      .filter((entry): entry is Exclude<Json, undefined> => entry !== undefined);
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => [key, toJsonValue(entry)] as const)
      .filter(([, entry]) => entry !== undefined);

    return Object.fromEntries(entries);
  }

  return String(value);
}

function toCleanObject(value: AuditShape | null | undefined) {
  return value ? (toJsonValue(value) as Json) : null;
}

export function buildAuditMetadata(params: {
  label?: string | null;
  before?: AuditShape | null;
  after?: AuditShape | null;
  extra?: AuditShape | null;
}): Json {
  const before = toCleanObject(params.before);
  const after = toCleanObject(params.after);
  const extra = toCleanObject(params.extra);
  const beforeObject =
    before && typeof before === 'object' && !Array.isArray(before)
      ? (before as Record<string, Json | undefined>)
      : null;
  const afterObject =
    after && typeof after === 'object' && !Array.isArray(after)
      ? (after as Record<string, Json | undefined>)
      : null;
  const extraObject =
    extra && typeof extra === 'object' && !Array.isArray(extra)
      ? (extra as Record<string, Json | undefined>)
      : null;

  const changed_fields =
    beforeObject && afterObject
      ? Object.keys(afterObject).filter((key) => JSON.stringify(beforeObject[key]) !== JSON.stringify(afterObject[key]))
      : [];

  return {
    status: 'success',
    name: params.label ?? null,
    before,
    after,
    changed_fields: changed_fields.length > 0 ? changed_fields : undefined,
    ...(extraObject ?? {}),
  };
}
