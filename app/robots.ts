import type { MetadataRoute } from 'next';

import { absoluteUrlOf } from '@/app/_site/seo';

/* Preview frames, code fragments and the search data are not pages of their own. */
const NOT_PAGES = ['/view/', '/code/', '/search-index'];

/*
 * Assistants are named so their access is explicit: the ones that answer with search results, read a
 * page on a developer's request or train an assistant all get the same pages as everyone else,
 * the registry under /r/ and the MCP server included.
 */
const ASSISTANT_CRAWLERS = [
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

/* Bulk crawlers that copy whole sites for training datasets, with nobody waiting on the answer. */
const BULK_TRAINING_CRAWLERS = ['GPTBot', 'CCBot', 'Bytespider', 'Amazonbot'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: NOT_PAGES },
      { userAgent: ASSISTANT_CRAWLERS, allow: '/', disallow: NOT_PAGES },
      { userAgent: BULK_TRAINING_CRAWLERS, disallow: '/' },
    ],
    sitemap: absoluteUrlOf('/sitemap.xml'),
  };
}
