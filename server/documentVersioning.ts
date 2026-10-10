export function nextDocumentVersion(existingVersionCount: number): string {
  return `v${Math.max(1, existingVersionCount + 1)}`;
}
