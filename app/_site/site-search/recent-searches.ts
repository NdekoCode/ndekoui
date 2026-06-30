const STORAGE_KEY = 'ndeko-ui:recent-searches';

const MAX_RECENT_SEARCHES = 5;

function isStringList(value: unknown): value is string[] {
  if (!Array.isArray(value)) {
    return false;
  }
  return value.every((item) => typeof item === 'string');
}

/** Storage can be blocked (private windows, strict settings): the search then simply has no history. */
export function readRecentSearches() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const parsed: unknown = JSON.parse(stored);
    if (!isStringList(parsed)) {
      return [];
    }
    return parsed.slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}

function isSameSearch(first: string, second: string) {
  const firstKey = first.toLowerCase();
  const secondKey = second.toLowerCase();
  return firstKey === secondKey;
}

export function rememberSearch(query: string, recentSearches: string[]) {
  const trimmed = query.trim();
  if (!trimmed) {
    return;
  }
  const others = recentSearches.filter(
    (recent) => !isSameSearch(recent, trimmed)
  );
  const ordered = [trimmed, ...others];
  const kept = ordered.slice(0, MAX_RECENT_SEARCHES);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(kept));
  } catch {
    // Blocked storage: the search keeps working without a history.
  }
}
