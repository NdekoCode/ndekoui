import type { ComponentType } from 'react';

import {
  groups as blockGroups,
  loaders as blockLoaders,
} from '@/app/blocks/_generated';
import {
  groups as templateGroups,
  loaders as templateLoaders,
} from '@/app/templates/_generated';

import type { BundleTile } from '@/app/_site/bundle-tiles';

import type { BundleGroup, BundleKind } from './types';

type Loader = () => Promise<{ previews: Record<string, ComponentType> }>;

const GROUPS: Record<BundleKind, BundleGroup[]> = {
  blocks: blockGroups,
  templates: templateGroups,
};

const LOADERS: Record<BundleKind, Record<string, Loader>> = {
  blocks: blockLoaders,
  templates: templateLoaders,
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

export async function previewOf(kind: BundleKind, slug: string, name: string) {
  const loader = LOADERS[kind][slug];
  if (!loader) {
    return undefined;
  }
  const { previews } = await loader();
  return previews[name];
}

export function viewPathOf(kind: BundleKind, group: string, name: string) {
  return `/view/${kind}/${group}/${name}`;
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
