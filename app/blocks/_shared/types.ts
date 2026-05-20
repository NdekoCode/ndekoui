import type { BlockManifestEntry } from '@/registry/ndeko/blocks/types';

export type BundleKind = 'blocks' | 'templates';

export type BundleEntry = BlockManifestEntry & { group: string };

export type BundleGroup = {
  slug: string;
  name: string;
  entries: BundleEntry[];
};
