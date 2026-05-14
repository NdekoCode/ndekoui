import type { ComponentManifestEntry } from '@/registry/ndeko/components/types';

export type CatalogEntry = ComponentManifestEntry & { category: string };

export type CatalogCategory = {
  slug: string;
  name: string;
  entries: CatalogEntry[];
};
