/**
 * Derives a human display name from a key/slug when no display name is set.
 * "quyen" -> "Quyen", "quyen-tran" -> "Quyen Tran", "QuyenTran" -> "Quyen Tran"
 */
export function deriveDisplayNameFromKey(key) {
  if (!key) return '';
  const words = key
    .split(/[-_]+/)
    .flatMap(part => part.split(/(?=[A-Z])/))
    .map(w => w.trim())
    .filter(Boolean);
  if (words.length === 0) return '';
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}
