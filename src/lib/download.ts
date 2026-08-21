// Turns the user-editable project name (see stores/project.ts) into
// something safe to hand to `anchor.download` — strips characters that are
// illegal (or awkward) in a filename on Windows/macOS/Linux alike.
export function sanitizeFilename(name: string): string {
  const cleaned = name.trim().replace(/[\\/:*?"<>|]+/g, '_');
  return cleaned || 'Untitled Project';
}

// Shared by Save (flowchart JSON) and Export (generated Java source) — both
// are just "hand the browser some text under a filename," no backend to
// post to.
export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

// Same idea, for a data: URL (e.g. html-to-image's PNG export — see
// lib/flowchart/exportPng.ts) — no Blob/object URL needed, it's already a
// self-contained URL the anchor can point straight at.
export function downloadDataUrl(filename: string, dataUrl: string): void {
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.click();
}
