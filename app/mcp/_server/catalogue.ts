import { FAMILIES } from '@/app/components/_catalog/families';
import { NAVIGATION } from '@/app/docs/navigation';
import { SITE_URL } from '@/app/mcp/_shared/mcp-config';
import { motionItemNameOf } from '@/lib/site';

import { loadRegistryIndex, type RegistryItem } from './registry-store';
import { slugOf } from './slug';

export const ITEM_KINDS = [
  'primitive',
  'component',
  'block',
  'template',
  'motion',
  'lib',
] as const;

export type ItemKind = (typeof ITEM_KINDS)[number];

export type CatalogueEntry = {
  name: string;
  title: string;
  kind: ItemKind;
  category: string;
  categoryName: string;
  description: string;
  previewUrl: string | null;
  item: RegistryItem;
};

export type ItemSummary = Pick<
  CatalogueEntry,
  'name' | 'title' | 'kind' | 'category' | 'description'
>;

type MotionPage = { groupSlug: string; groupName: string; href: string };

type CategoryCount = { slug: string; name: string; count: number };

type FamilyCount = { name: string; count: number; categories: CategoryCount[] };

export type CatalogueMap = {
  totals: Record<ItemKind, number>;
  primitives: CategoryCount[];
  components: { families: FamilyCount[]; outsideFamilies: CategoryCount[] };
  blocks: CategoryCount[];
  templates: CategoryCount[];
  motion: CategoryCount[];
  lib: CategoryCount[];
};

const KIND_BY_ROOT_CATEGORY: Record<string, ItemKind> = {
  primitives: 'primitive',
  components: 'component',
  blocks: 'block',
  templates: 'template',
  motion: 'motion',
  foundations: 'lib',
  hooks: 'lib',
};

const DOCS_PREFIX = '/docs/';

const FALLBACK_CATEGORY = 'other';

let cataloguePromise: Promise<CatalogueEntry[]> | null = null;

/** Matches the group names the site generates from a slug ("empty-states" reads "Empty states"). */
function sentenceNameOf(slug: string) {
  const spaced = slug.replace(/-/g, ' ');
  const firstLetter = spaced.charAt(0);
  const capital = firstLetter.toUpperCase();
  const rest = spaced.slice(1);
  return `${capital}${rest}`;
}

function motionPagesByName() {
  const pages = new Map<string, MotionPage>();
  for (const group of NAVIGATION) {
    const groupSlug = slugOf(group.name);
    for (const link of group.children) {
      if (!link.href.startsWith(DOCS_PREFIX)) {
        continue;
      }
      const docsSlug = link.href.slice(DOCS_PREFIX.length);
      const itemName = motionItemNameOf(docsSlug);
      pages.set(itemName, {
        groupSlug,
        groupName: group.name,
        href: link.href,
      });
    }
  }
  return pages;
}

function kindOf(item: RegistryItem): ItemKind {
  const root = item.categories?.[0];
  if (!root) {
    return 'lib';
  }
  const kind = KIND_BY_ROOT_CATEGORY[root];
  if (!kind) {
    return 'lib';
  }
  return kind;
}

function categorySlugOf(
  item: RegistryItem,
  kind: ItemKind,
  motionPage: MotionPage | undefined
) {
  if (kind === 'motion') {
    return motionPage?.groupSlug ?? FALLBACK_CATEGORY;
  }
  if (kind === 'lib') {
    return item.categories?.[0] ?? FALLBACK_CATEGORY;
  }
  const second = item.categories?.[1];
  if (second) {
    return second;
  }
  return item.categories?.[0] ?? FALLBACK_CATEGORY;
}

function categoryNameOf(slug: string, motionPage: MotionPage | undefined) {
  if (motionPage) {
    return motionPage.groupName;
  }
  return sentenceNameOf(slug);
}

function previewUrlOf(
  name: string,
  kind: ItemKind,
  category: string,
  motionPage: MotionPage | undefined
) {
  if (kind === 'primitive') {
    return `${SITE_URL}/kit#${name}`;
  }
  if (kind === 'component') {
    return `${SITE_URL}/components/${category}#${name}`;
  }
  if (kind === 'block') {
    return `${SITE_URL}/blocks/${category}#${name}`;
  }
  if (kind === 'template') {
    return `${SITE_URL}/templates/${category}#${name}`;
  }
  if (motionPage) {
    return `${SITE_URL}${motionPage.href}`;
  }
  return null;
}

/** Blocks and templates also render alone on a full page, which is what an agent should open to see one. */
export function fullPageUrlOf(entry: CatalogueEntry) {
  if (entry.kind === 'block') {
    return `${SITE_URL}/view/blocks/${entry.category}/${entry.name}`;
  }
  if (entry.kind === 'template') {
    return `${SITE_URL}/view/templates/${entry.category}/${entry.name}`;
  }
  return null;
}

function entryOf(
  item: RegistryItem,
  motionPages: Map<string, MotionPage>
): CatalogueEntry {
  const kind = kindOf(item);
  const motionPage = motionPages.get(item.name);
  const category = categorySlugOf(item, kind, motionPage);
  return {
    name: item.name,
    title: item.title ?? item.name,
    kind,
    category,
    categoryName: categoryNameOf(category, motionPage),
    description: item.description ?? '',
    previewUrl: previewUrlOf(item.name, kind, category, motionPage),
    item,
  };
}

async function buildCatalogue() {
  const items = await loadRegistryIndex();
  const motionPages = motionPagesByName();
  return items.map((item) => entryOf(item, motionPages));
}

export function loadCatalogue() {
  if (!cataloguePromise) {
    cataloguePromise = buildCatalogue().catch((error: unknown) => {
      cataloguePromise = null;
      throw error;
    });
  }
  return cataloguePromise;
}

export function findInCatalogue(catalogue: CatalogueEntry[], name: string) {
  const trimmed = name.trim();
  const wanted = trimmed.toLowerCase();
  return catalogue.find((entry) => entry.name === wanted);
}

export async function findEntry(name: string) {
  const catalogue = await loadCatalogue();
  return findInCatalogue(catalogue, name);
}

export function summaryOf(entry: CatalogueEntry): ItemSummary {
  return {
    name: entry.name,
    title: entry.title,
    kind: entry.kind,
    category: entry.category,
    description: entry.description,
  };
}

function familySlugOf(categorySlug: string) {
  const family = FAMILIES.find((candidate) =>
    candidate.slugs.includes(categorySlug)
  );
  if (!family) {
    return null;
  }
  return slugOf(family.name);
}

/** A component matches its category slug or the slug of its family ("forms", "data-display"). */
export function matchesCategory(entry: CatalogueEntry, category: string) {
  const wanted = slugOf(category);
  if (entry.category === wanted) {
    return true;
  }
  if (entry.kind !== 'component') {
    return false;
  }
  const familySlug = familySlugOf(entry.category);
  return familySlug === wanted;
}

function countByCategory(entries: CatalogueEntry[]) {
  const counts = new Map<string, CategoryCount>();
  for (const entry of entries) {
    const existing = counts.get(entry.category);
    if (existing) {
      existing.count += 1;
      continue;
    }
    counts.set(entry.category, {
      slug: entry.category,
      name: entry.categoryName,
      count: 1,
    });
  }
  return [...counts.values()];
}

function entriesOfKind(catalogue: CatalogueEntry[], kind: ItemKind) {
  return catalogue.filter((entry) => entry.kind === kind);
}

function categoryCountsOf(catalogue: CatalogueEntry[], kind: ItemKind) {
  const entries = entriesOfKind(catalogue, kind);
  return countByCategory(entries);
}

function totalOf(categories: CategoryCount[]) {
  let total = 0;
  for (const category of categories) {
    total += category.count;
  }
  return total;
}

function componentFamilies(componentCounts: CategoryCount[]) {
  const bySlug = new Map<string, CategoryCount>();
  for (const category of componentCounts) {
    bySlug.set(category.slug, category);
  }
  const placed = new Set<string>();
  const families: FamilyCount[] = [];
  for (const family of FAMILIES) {
    const categories: CategoryCount[] = [];
    for (const slug of family.slugs) {
      const category = bySlug.get(slug);
      if (!category) {
        continue;
      }
      categories.push(category);
      placed.add(slug);
    }
    if (categories.length === 0) {
      continue;
    }
    const count = totalOf(categories);
    families.push({ name: family.name, count, categories });
  }
  const outsideFamilies = componentCounts.filter(
    (category) => !placed.has(category.slug)
  );
  return { families, outsideFamilies };
}

function totalsOf(catalogue: CatalogueEntry[]) {
  const totals: Record<ItemKind, number> = {
    primitive: 0,
    component: 0,
    block: 0,
    template: 0,
    motion: 0,
    lib: 0,
  };
  for (const entry of catalogue) {
    totals[entry.kind] += 1;
  }
  return totals;
}

export async function catalogueMap(): Promise<CatalogueMap> {
  const catalogue = await loadCatalogue();
  const componentCounts = categoryCountsOf(catalogue, 'component');
  return {
    totals: totalsOf(catalogue),
    primitives: categoryCountsOf(catalogue, 'primitive'),
    components: componentFamilies(componentCounts),
    blocks: categoryCountsOf(catalogue, 'block'),
    templates: categoryCountsOf(catalogue, 'template'),
    motion: categoryCountsOf(catalogue, 'motion'),
    lib: categoryCountsOf(catalogue, 'lib'),
  };
}
