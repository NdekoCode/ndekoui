import type { ShareCardContent } from '@/app/_site/share-card';
import { CATALOG_STATS } from '@/lib/catalog-stats';
import { countLabel } from '@/lib/site';

import { BUNDLE_COPY } from './bundle-copy';
import { groupOf, groupsOf } from './bundles';
import type { BundleKind } from './types';

export function bundleTotalOf(kind: BundleKind) {
  if (kind === 'blocks') {
    return CATALOG_STATS.blocks;
  }
  return CATALOG_STATS.templates;
}

export function bundleGroupParamsOf(kind: BundleKind) {
  const groups = groupsOf(kind);
  return groups.map((group) => ({ group: group.slug }));
}

/** The card of the blocks or templates page: how many there are and what they are for. */
export function bundleIndexCardOf(kind: BundleKind): ShareCardContent {
  const copy = BUNDLE_COPY[kind];
  const total = bundleTotalOf(kind);
  return {
    eyebrow: countLabel(total, copy.singular, copy.plural),
    title: copy.title,
    description: copy.lead,
  };
}

/** The card of a group page: its name, its count and the titles of what it holds. */
export function bundleGroupCardOf(
  kind: BundleKind,
  slug: string
): ShareCardContent {
  const group = groupOf(kind, slug);
  if (!group) {
    return bundleIndexCardOf(kind);
  }
  const copy = BUNDLE_COPY[kind];
  const titles = group.entries.map((entry) => entry.title);
  return {
    eyebrow: countLabel(group.entries.length, copy.singular, copy.plural),
    title: `${group.name} ${copy.plural}`,
    description: titles.join(', '),
  };
}
