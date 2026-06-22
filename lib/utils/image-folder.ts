/**
 * Pure helpers for the local-image-folder import (Phase 8/9).
 *
 * The admin selects a folder with `<input type="file" webkitdirectory multiple>`.
 * Each picked file exposes `webkitRelativePath` like:
 *
 *     Products/HLG100P53/01.jpg
 *
 * The **immediate parent folder name is the SKU** — never the slug, never the
 * product name. These functions are DOM-free so they can be unit-tested in Node
 * with plain `{ name, webkitRelativePath }` objects.
 */

export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;
const IMAGE_EXT_RE = /\.(jpe?g|png|webp)$/i;

/** Minimal shape we need from a browser File — keeps these helpers testable. */
export interface FolderFile {
  name: string;
  webkitRelativePath: string;
}

/** True when the filename has an allowed raster image extension. */
export function isAllowedImageName(filename: string): boolean {
  return IMAGE_EXT_RE.test(filename.trim());
}

/**
 * Keep only path-safe characters in a SKU used as a storage folder segment.
 * Dots are intentionally excluded so a SKU can never form a `..` traversal
 * segment; the file extension is applied server-side from the validated MIME.
 */
export function sanitizeSkuForPath(sku: string): string {
  return sku.trim().replace(/[^A-Za-z0-9_-]/g, '_');
}

/**
 * Extracts the SKU (immediate parent directory) from a webkitRelativePath.
 * Returns null when the path has no directory segment (a loose top-level file).
 *
 *   "Products/HLG100P53/01.jpg" → "HLG100P53"
 *   "HLG100P53/01.jpg"          → "HLG100P53"
 *   "a/b/HLG200P58/cover.webp"  → "HLG200P58"
 *   "01.jpg"                    → null
 */
export function extractSkuFromRelativePath(relativePath: string): string | null {
  if (!relativePath) return null;
  const segments = relativePath
    .split(/[\\/]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  // Need at least [folder, file]. The parent of the file is the SKU.
  if (segments.length < 2) return null;
  return segments[segments.length - 2] || null;
}

/**
 * Natural, case-insensitive filename comparison so "2.jpg" < "10.jpg" and
 * "01.jpg" < "02.jpg". Used to give images a deterministic order before upload.
 */
export function compareFilenames(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Chooses the thumbnail (primary) image among a SKU's filenames.
 * Priority: `cover.*` → `01.*` (or `1.*`) → first after natural sort.
 * Returns the index into the *natural-sorted* filename list, or -1 if empty.
 */
export function pickThumbnailIndex(filenames: string[]): number {
  if (filenames.length === 0) return -1;
  const sorted = [...filenames].sort(compareFilenames);

  const coverIdx = sorted.findIndex((f) => /^cover\.(jpe?g|png|webp)$/i.test(f.trim()));
  if (coverIdx !== -1) return coverIdx;

  const oneIdx = sorted.findIndex((f) => /^0*1\.(jpe?g|png|webp)$/i.test(f.trim()));
  if (oneIdx !== -1) return oneIdx;

  return 0;
}

export interface SkuImageGroup<T extends FolderFile = FolderFile> {
  sku: string;
  /** Image files, natural-sorted by filename. */
  files: T[];
  /** Index into `files` of the chosen thumbnail (primary) image. */
  thumbnailIndex: number;
}

export interface SkuImageMap<T extends FolderFile = FolderFile> {
  groups: Map<string, SkuImageGroup<T>>;
  /** Files skipped because the extension is not an allowed image type. */
  skippedNonImages: T[];
  /** Files skipped because no SKU folder could be derived from the path. */
  skippedNoSku: T[];
}

/**
 * Groups picked folder files into `Map<SKU, File[]>` (Phase 8). Only image files
 * are kept; each group is natural-sorted and gets a resolved thumbnail index.
 * Matching is **by SKU folder name only** — never slug or product name.
 */
export function buildSkuImageMap<T extends FolderFile>(files: T[]): SkuImageMap<T> {
  const groups = new Map<string, SkuImageGroup<T>>();
  const skippedNonImages: T[] = [];
  const skippedNoSku: T[] = [];

  const bySku = new Map<string, T[]>();
  for (const file of files) {
    if (!isAllowedImageName(file.name)) {
      skippedNonImages.push(file);
      continue;
    }
    const sku = extractSkuFromRelativePath(file.webkitRelativePath);
    if (!sku) {
      skippedNoSku.push(file);
      continue;
    }
    const list = bySku.get(sku) ?? [];
    list.push(file);
    bySku.set(sku, list);
  }

  for (const [sku, list] of bySku) {
    const sorted = [...list].sort((a, b) => compareFilenames(a.name, b.name));
    groups.set(sku, {
      sku,
      files: sorted,
      thumbnailIndex: pickThumbnailIndex(sorted.map((f) => f.name)),
    });
  }

  return { groups, skippedNonImages, skippedNoSku };
}
