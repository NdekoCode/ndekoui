export const REPOSITORY_URL = 'https://github.com/NdekoCode/ndekoui';

const REPOSITORY_API_URL = 'https://api.github.com/repos/NdekoCode/ndekoui';

/*
 * The home page is rebuilt each time this count expires, and a rebuild renders every showcase on it.
 * Once a day keeps the count close enough without paying for 24 rebuilds.
 */
const STARS_REFRESH_SECONDS = 86400;

type RepositorySummary = { stargazers_count?: unknown };

function starCountOf(summary: RepositorySummary) {
  const count = summary.stargazers_count;
  const isCount = typeof count === 'number';
  if (!isCount) {
    return null;
  }
  return count;
}

/** The star count GitHub reports, or null when GitHub does not answer (a private repository, a rate limit, no network). */
export async function fetchStarCount(): Promise<number | null> {
  try {
    const response = await fetch(REPOSITORY_API_URL, {
      headers: { Accept: 'application/vnd.github+json' },
      next: { revalidate: STARS_REFRESH_SECONDS },
    });
    if (!response.ok) {
      return null;
    }
    const summary = (await response.json()) as RepositorySummary;
    return starCountOf(summary);
  } catch {
    return null;
  }
}
