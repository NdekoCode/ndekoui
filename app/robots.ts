import type { MetadataRoute } from 'next';

import { absoluteUrlOf } from '@/app/_site/seo';

/* Preview frames, code fragments and the search data are not pages of their own. */
const NOT_PAGES = ['/view/', '/code/', '/search-index'];

/*
 * Assistants are named so their access is explicit: the ones that answer with search results and
 * the ones that train or read on a user's request all get the same pages as everyone else.
 */
const ASSISTANT_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: NOT_PAGES },
      { userAgent: ASSISTANT_CRAWLERS, allow: '/', disallow: NOT_PAGES },
    ],
    sitemap: absoluteUrlOf('/sitemap.xml'),
  };
}
