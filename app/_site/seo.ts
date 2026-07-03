import type { Metadata } from 'next';

import { SITE_URL } from '@/app/mcp/_shared/mcp-config';

export const SITE_NAME = 'ndekoui';

export const AUTHOR_NAME = 'ndekocode';

export const AUTHOR_URL = 'https://ndekocode.dev';

export function absoluteUrlOf(path: string) {
  return `${SITE_URL}${path}`;
}

type PageSeo = {
  title: string;
  description: string;
  path: string;
};

/** Title, description, canonical address and sharing card of a page, set in one place. */
export function pageMetadataOf({
  title,
  description,
  path,
}: PageSeo): Metadata {
  return {
    title,
    description,
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
