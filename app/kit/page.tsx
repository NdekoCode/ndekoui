import type { Metadata } from 'next';

import { pageMetadataOf } from '@/app/_site/seo';
import { CATALOG_STATS } from '@/lib/catalog-stats';
import { countLabel } from '@/lib/site';
import type { RegistryItemDefinition } from '@/registry/items';

import { KIT_ITEMS } from './kit-catalog';
import { KitGroupSection } from './kit-group';
import { KIT_GROUPS } from './kit-groups';
import { ThemeSwitch } from './theme-switch';

export const metadata: Metadata = pageMetadataOf({
  title: 'React UI primitives on Base UI - ndekoui',
  description:
    'Every ndekoui primitive on one page, in light and dark, each with its code and the command that installs it.',
  keywords: [
    'React primitives',
    'Base UI components',
    'accessible React components',
    'headless UI',
  ],
  path: '/kit',
});

function itemsByNameOf(items: RegistryItemDefinition[]) {
  const byName = new Map<string, RegistryItemDefinition>();
  for (const item of items) {
    byName.set(item.name, item);
  }
  return byName;
}

export default function KitPage() {
  const itemsByName = itemsByNameOf(KIT_ITEMS);
  const count = countLabel(CATALOG_STATS.primitives, 'primitive', 'primitives');

  return (
    <div className='flex flex-col gap-14'>
      <header className='flex flex-wrap items-end justify-between gap-4'>
        <div className='flex flex-col gap-1'>
          <p className='text-primary-ink text-xs font-medium'>{count}</p>
          <h1 className='text-2xl font-semibold text-balance sm:text-3xl'>
            Primitives
          </h1>
          <p className='text-muted-foreground max-w-xl text-[13px] text-balance'>
            Base UI behaviour, drawn on one design language. Open the code of
            any of them to copy it or the command that installs it, and switch
            the theme to check both.
          </p>
        </div>
        <ThemeSwitch />
      </header>
      {KIT_GROUPS.map((group) => (
        <KitGroupSection
          key={group.id}
          group={group}
          itemsByName={itemsByName}
        />
      ))}
    </div>
  );
}
