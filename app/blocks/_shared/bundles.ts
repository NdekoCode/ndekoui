import { groups as blockGroups } from '@/app/blocks/_generated';
import { groups as templateGroups } from '@/app/templates/_generated';

import type { BundleTile } from '@/app/_site/bundle-tiles';

import type { BundleGroup, BundleKind } from './types';

const GROUPS: Record<BundleKind, BundleGroup[]> = {
  blocks: blockGroups,
  templates: templateGroups,
};

export function isBundleKind(value: string): value is BundleKind {
  const isBlocks = value === 'blocks';
  const isTemplates = value === 'templates';
  return isBlocks || isTemplates;
}

export function groupsOf(kind: BundleKind) {
  return GROUPS[kind];
}

export function groupOf(kind: BundleKind, slug: string) {
  return GROUPS[kind].find((group) => group.slug === slug);
}

export function bundleEntryOf(kind: BundleKind, slug: string, name: string) {
  const group = groupOf(kind, slug);
  if (!group) {
    return undefined;
  }
  const entry = group.entries.find((candidate) => candidate.name === name);
  if (!entry) {
    return undefined;
  }
  return { group, entry };
}

/** The entry alone, with nothing around it: the source of every preview frame. */
export function viewPathOf(kind: BundleKind, group: string, name: string) {
  return `/view/${kind}/${group}/${name}`;
}

/** The entry centred in a spacious frame under a slim bar, for the full-page link. */
export function presentPathOf(kind: BundleKind, group: string, name: string) {
  const viewPath = viewPathOf(kind, group, name);
  return `${viewPath}/present`;
}

/** The group page scrolled to the entry. */
export function entryAnchorPathOf(
  kind: BundleKind,
  group: string,
  name: string
) {
  return `/${kind}/${group}#${name}`;
}

const BUNDLE_KINDS: BundleKind[] = ['blocks', 'templates'];

function viewParamsOfKind(kind: BundleKind) {
  return GROUPS[kind].flatMap((group) =>
    group.entries.map((entry) => ({
      kind,
      group: group.slug,
      name: entry.name,
    }))
  );
}

export function viewParamsOf() {
  return BUNDLE_KINDS.flatMap(viewParamsOfKind);
}

const UNIT_NAMES: Record<BundleKind, { singular: string; plural: string }> = {
  blocks: { singular: 'block', plural: 'blocks' },
  templates: { singular: 'template', plural: 'templates' },
};

function tileOf(kind: BundleKind, group: BundleGroup): BundleTile | null {
  const firstEntry = group.entries[0];
  if (!firstEntry) {
    return null;
  }
  return {
    href: `/${kind}/${group.slug}`,
    previewSrc: viewPathOf(kind, group.slug, firstEntry.name),
    name: group.name,
    count: group.entries.length,
    ...UNIT_NAMES[kind],
  };
}

function isTile(value: BundleTile | null): value is BundleTile {
  return value !== null;
}

/** One tile per group, previewed with its first entry. */
export function tilesOf(kind: BundleKind, groups: BundleGroup[]) {
  const tiles = groups.map((group) => tileOf(kind, group));
  return tiles.filter(isTile);
}
