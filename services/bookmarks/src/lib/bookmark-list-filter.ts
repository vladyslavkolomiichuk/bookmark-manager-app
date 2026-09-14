export function isNonEmptyArray<T>(
  items: T[]
): items is [T, ...T[]] {
  return items.length > 0;
}

export type NonEmptyArray<T> = [T, ...T[]];
