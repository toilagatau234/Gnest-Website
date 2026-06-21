import { describe, it, expect } from 'vitest';
import {
  extractSkuFromRelativePath,
  isAllowedImageName,
  compareFilenames,
  pickThumbnailIndex,
  buildSkuImageMap,
  sanitizeSkuForPath,
  type FolderFile,
} from '@/lib/utils/image-folder';

describe('extractSkuFromRelativePath (Phase 8 — folder name = SKU)', () => {
  it('takes the immediate parent folder as the SKU', () => {
    expect(extractSkuFromRelativePath('Products/HLG100P53/01.jpg')).toBe('HLG100P53');
    expect(extractSkuFromRelativePath('HLG100P53/01.jpg')).toBe('HLG100P53');
    expect(extractSkuFromRelativePath('a/b/HLG200P58/cover.webp')).toBe('HLG200P58');
  });

  it('handles backslash separators', () => {
    expect(extractSkuFromRelativePath('Products\\HLG100P53\\02.png')).toBe('HLG100P53');
  });

  it('returns null for a loose top-level file (no folder)', () => {
    expect(extractSkuFromRelativePath('01.jpg')).toBeNull();
    expect(extractSkuFromRelativePath('')).toBeNull();
  });
});

describe('isAllowedImageName', () => {
  it('accepts jpg/jpeg/png/webp case-insensitively', () => {
    for (const n of ['01.jpg', '01.JPEG', 'cover.png', 'x.webp']) {
      expect(isAllowedImageName(n)).toBe(true);
    }
  });
  it('rejects non-images', () => {
    for (const n of ['notes.txt', 'thumbs.db', 'a.gif', 'a.heic', 'folder']) {
      expect(isAllowedImageName(n)).toBe(false);
    }
  });
});

describe('compareFilenames (natural sort)', () => {
  it('orders numbers naturally, not lexically', () => {
    const sorted = ['10.jpg', '2.jpg', '1.jpg'].sort(compareFilenames);
    expect(sorted).toEqual(['1.jpg', '2.jpg', '10.jpg']);
  });
});

describe('pickThumbnailIndex (cover.* > 01.* > first)', () => {
  it('prefers cover.*', () => {
    expect(pickThumbnailIndex(['02.jpg', 'cover.jpg', '01.jpg'])).toBe(
      ['02.jpg', 'cover.jpg', '01.jpg'].sort(compareFilenames).indexOf('cover.jpg'),
    );
  });
  it('falls back to 01.* when no cover', () => {
    const files = ['03.jpg', '01.jpg', '02.jpg'];
    const sorted = [...files].sort(compareFilenames);
    expect(pickThumbnailIndex(files)).toBe(sorted.indexOf('01.jpg'));
  });
  it('falls back to first after sort when neither present', () => {
    expect(pickThumbnailIndex(['b.jpg', 'a.jpg'])).toBe(0); // 'a.jpg' is first
  });
  it('returns -1 for empty', () => {
    expect(pickThumbnailIndex([])).toBe(-1);
  });
});

function f(path: string): FolderFile {
  const name = path.split('/').pop() ?? path;
  return { name, webkitRelativePath: path };
}

describe('buildSkuImageMap (Phase 8/9)', () => {
  it('groups by SKU, sorts files, resolves thumbnail', () => {
    const { groups } = buildSkuImageMap([
      f('Products/HLG100P53/02.jpg'),
      f('Products/HLG100P53/01.jpg'),
      f('Products/HLG200P58/cover.webp'),
      f('Products/HLG200P58/05.jpg'),
    ]);

    expect([...groups.keys()].sort()).toEqual(['HLG100P53', 'HLG200P58']);

    const a = groups.get('HLG100P53')!;
    expect(a.files.map((x) => x.name)).toEqual(['01.jpg', '02.jpg']);
    expect(a.thumbnailIndex).toBe(0); // 01.jpg

    const b = groups.get('HLG200P58')!;
    expect(b.files[b.thumbnailIndex].name).toBe('cover.webp');
  });

  it('skips non-image files and reports them', () => {
    const { groups, skippedNonImages } = buildSkuImageMap([
      f('Products/SKU1/01.jpg'),
      f('Products/SKU1/notes.txt'),
      f('Products/SKU1/Thumbs.db'),
    ]);
    expect(groups.get('SKU1')!.files).toHaveLength(1);
    expect(skippedNonImages).toHaveLength(2);
  });

  it('skips files with no derivable SKU', () => {
    const { groups, skippedNoSku } = buildSkuImageMap([f('01.jpg')]);
    expect(groups.size).toBe(0);
    expect(skippedNoSku).toHaveLength(1);
  });

  it('never matches by slug or product name — only the folder name', () => {
    const { groups } = buildSkuImageMap([f('hu-thuy-tinh-tron-100ml/01.jpg')]);
    // The folder is a slug-looking string; it is taken literally as the SKU key.
    expect(groups.has('hu-thuy-tinh-tron-100ml')).toBe(true);
  });
});

describe('sanitizeSkuForPath', () => {
  it('keeps safe chars and replaces the rest', () => {
    expect(sanitizeSkuForPath('HLG100P53')).toBe('HLG100P53');
    expect(sanitizeSkuForPath('HLG-100_P53')).toBe('HLG-100_P53');
  });
  it('neutralises path-traversal and separators (no dots kept)', () => {
    expect(sanitizeSkuForPath('A B/..\\C')).toBe('A_B____C');
    expect(sanitizeSkuForPath('../etc')).toBe('___etc');
  });
});
