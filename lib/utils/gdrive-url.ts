/**
 * Pure Google Drive folder-URL parsing (no server dependencies, unit-testable).
 *
 * Supports:
 *   - https://drive.google.com/drive/folders/{folderId}
 *   - https://drive.google.com/drive/u/0/folders/{folderId}
 *   - https://drive.google.com/open?id={folderId}
 */
export function extractDriveFolderId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) return folderMatch[1];

  try {
    const parsed = new URL(trimmed);
    const id = parsed.searchParams.get('id');
    if (id) return id;
  } catch {
    // not a valid URL
  }

  return null;
}
