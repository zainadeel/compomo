/**
 * A transcript reset replaces the current baseline instead of appending or
 * prepending around surviving nodes. Emptying a populated transcript also
 * starts a reset that completes when its next baseline is supplied.
 */
export function isMessageScrollerTranscriptReset<T>(
  previous: readonly T[],
  current: readonly T[]
): boolean {
  if (!previous.length) return false;
  if (!current.length) return true;
  const previousElements = new Set(previous);
  return !current.some(element => previousElements.has(element));
}

/** Keep identity tracking bounded to nodes in the current transcript. */
export function pruneMessageScrollerTranscriptSet<T>(known: Set<T>, current: readonly T[]): void {
  const currentElements = new Set(current);
  for (const element of known) {
    if (!currentElements.has(element)) known.delete(element);
  }
}
