'use client';

import Link from 'next/link';

import { CategoryThumbnail } from '@/app/components/_catalog/category-thumbnail';
import { countLabel } from '@/lib/site';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/registry/ndeko/ui/tabs';

export type ShowcaseCategory = {
  slug: string;
  name: string;
  count: number;
};

export type ShowcaseShelf = {
  name: string;
  categories: ShowcaseCategory[];
};

const SHELF_SIZE = 8;

const TILE =
  'flex flex-col gap-3 rounded-xl bg-card p-2 pb-3 hairline-ring ring-border shadow-[0_1px_2px_rgb(0_0_0/0.04)] outline-none transition-colors hover:bg-foreground/[0.015] focus-visible:ring-[3px] focus-visible:ring-ring/25';

function CategoryTile({ category }: { category: ShowcaseCategory }) {
  return (
    <li>
      <Link href={`/components/${category.slug}`} className={TILE}>
        <CategoryThumbnail slug={category.slug} />
        <span className='flex items-baseline justify-between gap-2 px-1'>
          <span className='text-[13px] font-medium'>{category.name}</span>
          <span className='text-muted-foreground text-xs tabular-nums'>
            {countLabel(category.count, 'component', 'components')}
          </span>
        </span>
      </Link>
    </li>
  );
}

export function ComponentsShowcase({ shelves }: { shelves: ShowcaseShelf[] }) {
  const firstShelf = shelves[0];
  if (!firstShelf) {
    return null;
  }

  return (
    <Tabs defaultValue={firstShelf.name} className='gap-6'>
      <div className='-mx-4 overflow-x-auto px-4 pb-1'>
        <TabsList variant='segmented' aria-label='Families'>
          {shelves.map((shelf) => (
            <TabsTab key={shelf.name} value={shelf.name}>
              {shelf.name}
            </TabsTab>
          ))}
        </TabsList>
      </div>
      {shelves.map((shelf) => (
        <TabsPanel key={shelf.name} value={shelf.name}>
          <ul className='grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-4'>
            {shelf.categories.slice(0, SHELF_SIZE).map((category) => (
              <CategoryTile key={category.slug} category={category} />
            ))}
          </ul>
        </TabsPanel>
      ))}
    </Tabs>
  );
}
