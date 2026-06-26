import type { MetadataRoute } from 'next';

import { groupsOf } from '@/app/blocks/_shared/bundles';
import { catalog } from '@/app/components/_generated/catalog';
import { NAVIGATION } from '@/app/docs/navigation';

const SITE_URL = 'https://ui.ndekocode.dev';

const STATIC_PATHS = ['/', '/kit', '/components', '/blocks', '/templates'];

function entryOf(pathname: string): MetadataRoute.Sitemap[number] {
  return { url: `${SITE_URL}${pathname}` };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const categoryPaths = catalog.map(
    (category) => `/components/${category.slug}`
  );
  const blockPaths = groupsOf('blocks').map((group) => `/blocks/${group.slug}`);
  const templatePaths = groupsOf('templates').map(
    (group) => `/templates/${group.slug}`
  );
  const docsPaths = NAVIGATION.flatMap((group) =>
    group.children.map((child) => child.href)
  );
  const paths = [
    ...STATIC_PATHS,
    ...categoryPaths,
    ...blockPaths,
    ...templatePaths,
    ...docsPaths,
  ];
  return paths.map(entryOf);
}
