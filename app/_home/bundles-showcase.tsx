'use client';

import { BundleTileGrid, type BundleTile } from '@/app/_site/bundle-tiles';
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/registry/ndeko/ui/tabs';

export type BundleShelf = {
  name: string;
  tiles: BundleTile[];
};

export function BundlesShowcase({ shelves }: { shelves: BundleShelf[] }) {
  const firstShelf = shelves[0];
  if (!firstShelf) {
    return null;
  }
  const hasOneShelf = shelves.length === 1;
  if (hasOneShelf) {
    return <BundleTileGrid tiles={firstShelf.tiles} />;
  }

  return (
    <Tabs defaultValue={firstShelf.name} className='gap-6'>
      <TabsList variant='segmented' aria-label='Kinds'>
        {shelves.map((shelf) => (
          <TabsTab key={shelf.name} value={shelf.name}>
            {shelf.name}
          </TabsTab>
        ))}
      </TabsList>
      {shelves.map((shelf) => (
        <TabsPanel key={shelf.name} value={shelf.name}>
          <BundleTileGrid tiles={shelf.tiles} />
        </TabsPanel>
      ))}
    </Tabs>
  );
}
