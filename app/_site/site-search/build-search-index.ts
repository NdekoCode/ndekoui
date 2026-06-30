import { groupsOf } from '@/app/blocks/_shared/bundles';
import type { BundleKind } from '@/app/blocks/_shared/types';
import { catalog } from '@/app/components/_generated/catalog';
import { NAVIGATION } from '@/app/docs/navigation';
import { KIT_GROUPS } from '@/app/kit/kit-groups';
import { motionItemNameOf } from '@/lib/site';
import registry from '@/registry.json';
import { chatItems } from '@/registry/chat-items';
import { primitiveItems, type RegistryItemDefinition } from '@/registry/items';

import type { SearchEntry, SearchKind } from './search-types';

type RegistrySummary = { name: string; title?: string; description?: string };

type DocsLink = { name: string; href: string };

type GuidePage = { name: string; description: string };

const REGISTRY_SUMMARIES = registry.items as RegistrySummary[];

const DOCS_PREFIX = '/docs/';

const GUIDE_PAGES = new Map<string, GuidePage>([
  [
    '/docs',
    {
      name: 'introduction',
      description:
        'Reusable animated components built with Motion and Tailwind CSS',
    },
  ],
  [
    '/docs/installation',
    {
      name: 'installation',
      description: 'How to install Ndeko UI in your project',
    },
  ],
]);

const BUNDLE_SEARCH_KINDS: Record<BundleKind, SearchKind> = {
  blocks: 'block',
  templates: 'template',
};

const FINAL_STOP = /\.\s*$/;

function captionOf(sentence: string) {
  const trimmed = sentence.trim();
  return trimmed.replace(FINAL_STOP, '');
}

/** Matches the heading id that `app/kit/kit-group.tsx` gives each group. */
function kitGroupHrefOf(groupId: string) {
  return `/kit#kit-${groupId}`;
}

function itemsByNameOf(items: RegistryItemDefinition[]) {
  const byName = new Map<string, RegistryItemDefinition>();
  for (const item of items) {
    byName.set(item.name, item);
  }
  return byName;
}

function primitiveEntries() {
  const kitItems = [...primitiveItems, ...chatItems];
  const itemsByName = itemsByNameOf(kitItems);
  const entries: SearchEntry[] = [];
  for (const group of KIT_GROUPS) {
    const groupHref = kitGroupHrefOf(group.id);
    for (const unit of group.units) {
      const item = itemsByName.get(unit.name);
      if (!item) {
        continue;
      }
      entries.push({
        kind: 'primitive',
        name: item.name,
        title: item.title,
        group: group.title,
        description: captionOf(item.description),
        href: `/kit#${item.name}`,
        groupHref,
      });
    }
  }
  return entries;
}

function componentEntries() {
  const entries: SearchEntry[] = [];
  for (const category of catalog) {
    const groupHref = `/components/${category.slug}`;
    for (const entry of category.entries) {
      entries.push({
        kind: 'component',
        name: entry.name,
        title: entry.title,
        group: category.name,
        description: captionOf(entry.description),
        href: `${groupHref}#${entry.name}`,
        groupHref,
      });
    }
  }
  return entries;
}

function bundleEntries(bundleKind: BundleKind) {
  const kind = BUNDLE_SEARCH_KINDS[bundleKind];
  const entries: SearchEntry[] = [];
  for (const group of groupsOf(bundleKind)) {
    const groupHref = `/${bundleKind}/${group.slug}`;
    for (const entry of group.entries) {
      entries.push({
        kind,
        name: entry.name,
        title: entry.title,
        group: group.name,
        description: captionOf(entry.description),
        href: `${groupHref}#${entry.name}`,
        groupHref,
      });
    }
  }
  return entries;
}

function summariesByNameOf(summaries: RegistrySummary[]) {
  const byName = new Map<string, RegistrySummary>();
  for (const summary of summaries) {
    byName.set(summary.name, summary);
  }
  return byName;
}

function docsSlugOf(href: string) {
  if (!href.startsWith(DOCS_PREFIX)) {
    return '';
  }
  return href.slice(DOCS_PREFIX.length);
}

function motionEntryOf(
  link: DocsLink,
  groupName: string,
  summaries: Map<string, RegistrySummary>
): SearchEntry {
  const guide = GUIDE_PAGES.get(link.href);
  if (guide) {
    return {
      kind: 'motion',
      name: guide.name,
      title: link.name,
      group: groupName,
      description: guide.description,
      href: link.href,
    };
  }
  const slug = docsSlugOf(link.href);
  const itemName = motionItemNameOf(slug);
  const summary = summaries.get(itemName);
  const title = summary?.title ?? link.name;
  const description = summary?.description ?? '';
  return {
    kind: 'motion',
    name: itemName,
    title,
    group: groupName,
    description: captionOf(description),
    href: link.href,
  };
}

function motionEntries() {
  const summaries = summariesByNameOf(REGISTRY_SUMMARIES);
  const entries: SearchEntry[] = [];
  for (const group of NAVIGATION) {
    for (const link of group.children) {
      const entry = motionEntryOf(link, group.name, summaries);
      entries.push(entry);
    }
  }
  return entries;
}

export function buildSearchIndex() {
  const primitives = primitiveEntries();
  const components = componentEntries();
  const blocks = bundleEntries('blocks');
  const templates = bundleEntries('templates');
  const motion = motionEntries();
  return [...primitives, ...components, ...blocks, ...templates, ...motion];
}
