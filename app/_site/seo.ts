import type { Metadata } from 'next';

import { SITE_URL } from '@/app/mcp/_shared/mcp-config';

export const SITE_NAME = 'ndekoui';

export const AUTHOR_NAME = 'ndekocode';

export const AUTHOR_URL = 'https://ndekocode.dev';

export function absoluteUrlOf(path: string) {
  return `${SITE_URL}${path}`;
}

/*
 * The words people and assistants search with, for every page. Each page adds its own subject.
 * They also sit in titles and descriptions, which is where search engines weigh them.
 */
export const SITE_KEYWORDS = [
  'ndekoui',
  'React components',
  'React component library',
  'React UI library',
  'animated React components',
  'UI components',
  'Tailwind CSS components',
  'Tailwind CSS 4',
  'shadcn',
  'shadcn/ui',
  'shadcn registry',
  'Base UI',
  'motion',
  'Framer Motion',
  'Next.js components',
  'TypeScript',
  'design system',
  'open source UI',
  'free React components',
  'dashboard components',
  'SaaS UI',
  'UI blocks',
  'UI templates',
  'MCP server',
  'AI coding',
];

type PageSeo = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
};

/** Title, description, keywords, canonical address and sharing card of a page, set in one place. */
export function pageMetadataOf({
  title,
  description,
  path,
  keywords = [],
}: PageSeo): Metadata {
  return {
    title,
    description,
    keywords: [...keywords, ...SITE_KEYWORDS],
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_US',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

type Crumb = {
  name: string;
  path: string;
};

function crumbItemOf(crumb: Crumb, index: number) {
  return {
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    item: absoluteUrlOf(crumb.path),
  };
}

export function breadcrumbOf(crumbs: Crumb[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map(crumbItemOf),
  };
}

type ListedEntry = {
  name: string;
  title: string;
  description: string;
};

/** The entries a page shows, each pointing at its own anchor on that page. */
export function itemListOf(pagePath: string, entries: ListedEntry[]) {
  const itemListElement = entries.map((entry, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: entry.title,
    description: entry.description,
    url: absoluteUrlOf(`${pagePath}#${entry.name}`),
  }));
  return {
    '@type': 'ItemList',
    numberOfItems: entries.length,
    itemListElement,
  };
}

/*
 * Search engines prove that the site is ours with a code each. The codes are not secret: they are
 * set as environment variables in Vercel, so a new engine needs no code change.
 */
const VERIFICATION_TAGS = [
  { env: 'BING_SITE_VERIFICATION', name: 'msvalidate.01' },
  { env: 'BAIDU_SITE_VERIFICATION', name: 'baidu-site-verification' },
  { env: 'NAVER_SITE_VERIFICATION', name: 'naver-site-verification' },
  { env: 'SEZNAM_SITE_VERIFICATION', name: 'seznam-wmt' },
];

function otherVerificationTags() {
  const tags: Record<string, string> = {};
  for (const tag of VERIFICATION_TAGS) {
    const code = process.env[tag.env];
    if (code) {
      tags[tag.name] = code;
    }
  }
  return tags;
}

export function searchVerificationOf(): Metadata['verification'] {
  return {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_SITE_VERIFICATION,
    other: otherVerificationTags(),
  };
}
