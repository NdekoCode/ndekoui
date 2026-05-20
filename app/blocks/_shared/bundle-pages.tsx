import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BundleTileGrid } from '@/app/_site/bundle-tiles';
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
  let total = 0;
  for (const group of groupsOf(kind)) {
    total += group.entries.length;
  }
  return total;
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

  return (
    <div className='flex flex-col gap-12'>
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
