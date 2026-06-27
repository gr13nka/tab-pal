/**
 * Trigger a client-side file download for in-memory text. Wraps the text in a
 * Blob, points a transient <a download> at an object URL, clicks it, and cleans
 * up. Kept self-contained so the export feature owns its only side effect.
 */
export function downloadText(filename: string, mime: string, text: string): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
