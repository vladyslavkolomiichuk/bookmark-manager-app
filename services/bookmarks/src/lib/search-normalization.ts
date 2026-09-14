export function normalizeSearch(
  search: string | null
): string | null {
  if (search === null) {
    return null;
  }

  const normalized = search.trim().toLowerCase();

  return normalized.length > 0
    ? normalized
    : null;
}
