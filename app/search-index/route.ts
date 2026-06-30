import { buildSearchIndex } from '@/app/_site/site-search/build-search-index';
import type { SearchIndexPayload } from '@/app/_site/site-search/search-types';

export const dynamic = 'force-static';

export function GET() {
  const entries = buildSearchIndex();
  const payload: SearchIndexPayload = { entries };
  return Response.json(payload);
}
