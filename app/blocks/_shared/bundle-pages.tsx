import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BundleTileGrid } from '@/app/_site/bundle-tiles';
import { JsonLd } from '@/app/_site/json-ld';
import { breadcrumbOf, itemListOf, pageMetadataOf } from '@/app/_site/seo';
import { CATALOG_STATS } from '@/lib/catalog-stats';
import { countLabel } from '@/lib/site';

import { BundleCard } from './bundle-card';
import { groupOf, groupsOf, tilesOf } from './bundles';
import type { BundleKind } from './types';

const COPY: Record<
  BundleKind,
  { title: string; lead: string; singular: string; plural: string }
> = {
  blocks: {
    title: 'Blocks for whole sections of a product',
    lead: 'App shells, lists, boards, settings and marketing sections, built from the components with fictional data. Resize each one to check it on a phone.',
    singular: 'block',
    plural: 'blocks',
  },
  templates: {
    title: 'Templates to start a product from',
    lead: 'Complete pages assembled from the blocks. Open one, install it and replace the fictional data with yours.',
    singular: 'template',
    plural: 'templates',
  },
};

function totalOf(kind: BundleKind) {
  if (kind === 'blocks') {
    return CATALOG_STATS.blocks;
  }
  return CATALOG_STATS.templates;
}

export function BundleIndexPage({ kind }: { kind: BundleKind }) {
  const copy = COPY[kind];
  const groups = groupsOf(kind);
  const hasGroups = groups.length > 0;
  const total = totalOf(kind);

  return (
    <div className='flex flex-col gap-12'>
      <header className='grid gap-6 md:grid-cols-2 md:items-end'>
        <div className='flex flex-col gap-2'>
          <p className='text-primary-ink text-xs font-medium'>
            {countLabel(total, copy.singular, copy.plural)}
          </p>
          <h1 className='text-3xl font-semibold text-balance sm:text-4xl'>
            {copy.title}
          </h1>
        </div>
        <p className='text-muted-foreground max-w-md text-[13px] text-pretty md:justify-self-end'>
          {copy.lead}
        </p>
      </header>
      {!hasGroups && (
        <p className='hairline-border border-foreground/20 text-muted-foreground rounded-xl border-dashed p-6 text-[13px]'>
          The first {copy.plural} are being built. They appear here as soon as
          their manifest is published.
        </p>
      )}
      {hasGroups && <BundleTileGrid tiles={tilesOf(kind, groups)} />}
    </div>
  );
}

function kindNameOf(kind: BundleKind) {
  const plural = COPY[kind].plural;
  const initial = plural.charAt(0).toUpperCase();
  return `${initial}${plural.slice(1)}`;
}

function entryTitlesOf(titles: string[]) {
  return titles.join(', ');
}

/** The tab title, description and canonical address of a group page, named after what it holds. */
export function bundleGroupMetadataOf(
  kind: BundleKind,
  slug: string
): Metadata {
  const copy = COPY[kind];
  const group = groupOf(kind, slug);
  if (!group) {
    return {};
  }
  const count = countLabel(group.entries.length, copy.singular, copy.plural);
  const titles = entryTitlesOf(group.entries.map((entry) => entry.title));
  const subject = group.name.toLowerCase();
  return pageMetadataOf({
    title: `${group.name} ${copy.plural} for React and Tailwind CSS - ndekoui`,
    description: `${count}: ${titles}. Built from ndekoui components, previewed live and installable with the shadcn CLI.`,
    path: `/${kind}/${group.slug}`,
    keywords: [
      `React ${subject} ${copy.singular}`,
      `${subject} ${copy.singular}`,
      `Tailwind CSS ${subject}`,
      `shadcn ${subject}`,
    ],
  });
}

export function BundleGroupPage({
  kind,
  slug,
}: {
  kind: BundleKind;
  slug: string;
}) {
  const copy = COPY[kind];
  const group = groupOf(kind, slug);
  if (!group) {
    notFound();
  }
  const groupPath = `/${kind}/${group.slug}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbOf([
        { name: 'ndekoui', path: '/' },
        { name: kindNameOf(kind), path: `/${kind}` },
        { name: group.name, path: groupPath },
      ]),
      itemListOf(groupPath, group.entries),
    ],
  };

  return (
    <div className='flex flex-col gap-12'>
      <JsonLd data={structuredData} />
      <header className='flex flex-col gap-1'>
        <Link
          href={`/${kind}`}
          className='text-primary-ink w-fit text-xs font-medium hover:underline'
        >
          {countLabel(group.entries.length, copy.singular, copy.plural)}
        </Link>
        <h1 className='text-2xl font-semibold text-balance sm:text-3xl'>
          {group.name}
        </h1>
      </header>
      {group.entries.map((entry) => (
        <BundleCard key={entry.name} kind={kind} entry={entry} />
      ))}
    </div>
  );
}
