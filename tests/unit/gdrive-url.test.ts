import { describe, it, expect } from 'vitest';
import { extractDriveFolderId } from '@/lib/utils/gdrive-url';

describe('extractDriveFolderId (Phase 9 Google Drive parsing)', () => {
  it('extracts id from /folders/ URLs', () => {
    expect(extractDriveFolderId('https://drive.google.com/drive/folders/1AbC_dEf-123')).toBe('1AbC_dEf-123');
    expect(extractDriveFolderId('https://drive.google.com/drive/u/0/folders/XYZ789')).toBe('XYZ789');
  });

  it('extracts id from ?id= URLs', () => {
    expect(extractDriveFolderId('https://drive.google.com/open?id=FOLDER42')).toBe('FOLDER42');
  });

  it('trims surrounding whitespace', () => {
    expect(extractDriveFolderId('  https://drive.google.com/drive/folders/abc  ')).toBe('abc');
  });

  it('returns null for invalid / empty input', () => {
    expect(extractDriveFolderId('')).toBeNull();
    expect(extractDriveFolderId('https://example.com/not-drive')).toBeNull();
    expect(extractDriveFolderId('just some text')).toBeNull();
  });
});
