'use client';

import { hotkeysCoreFeature, syncDataLoaderFeature } from '@headless-tree/core';

import {
  BookIcon,
  BookmarkIcon,
  BookOpenIcon,
} from '@/registry/ndeko/lib/icons';
import { Tree, TreeItemLabel, useTree } from '@/registry/ndeko/ui/tree';

import {
  branchLoaderOf,
  hasChildren,
  indexBranches,
  nameOf,
  type Branch,
} from './_parts/tree-data';
import { OpeningGlyph } from './_parts/tree-glyphs';
import { TreeRow, TreeRows } from './_parts/tree-rows';

const BOOKSHOP: Branch = {
  id: 'bookshop',
  name: 'Solway Books shelves',
  children: [
    {
      id: 'fiction',
      name: 'Fiction',
      children: [
        {
          id: 'crime',
          name: 'Crime and thrillers',
          children: [
            { id: 'nordic-noir', name: 'Nordic noir' },
            { id: 'cosy-mysteries', name: 'Cosy mysteries' },
            { id: 'courtroom-drama', name: 'Courtroom drama' },
          ],
        },
        { id: 'science-fiction', name: 'Science fiction' },
        { id: 'short-stories', name: 'Short stories' },
      ],
    },
    {
      id: 'non-fiction',
      name: 'Non-fiction',
      children: [
        { id: 'history', name: 'History' },
        { id: 'travel-writing', name: 'Travel writing' },
        { id: 'cookery', name: 'Cookery' },
      ],
    },
    {
      id: 'children',
      name: 'Children',
      children: [
        { id: 'picture-books', name: 'Picture books' },
        { id: 'first-readers', name: 'First readers' },
      ],
    },
  ],
};

const SHELVES = indexBranches(BOOKSHOP);

const SHELF_LOADER = branchLoaderOf(SHELVES);

const OPEN_AT_START = ['fiction', 'crime'];

/* The label draws its chevron first: reversing the row sends it to the end, and a shelf without one starts at the edge. */
const CHEVRON_AT_THE_END = 'flex-row-reverse not-in-data-[folder=true]:ps-2';

type ShelfGlyphProps = {
  isSection: boolean;
};

function ShelfGlyph({ isSection }: ShelfGlyphProps) {
  if (isSection) {
    return <OpeningGlyph closed={BookIcon} open={BookOpenIcon} />;
  }
  return <BookmarkIcon className='text-muted-foreground size-4' />;
}

export default function Tree04() {
  const tree = useTree<Branch>({
    initialState: { expandedItems: OPEN_AT_START },
    rootItemId: BOOKSHOP.id,
    getItemName: nameOf,
    isItemFolder: hasChildren,
    dataLoader: SHELF_LOADER,
    features: [syncDataLoaderFeature, hotkeysCoreFeature],
  });

  return (
    <Tree aria-label={BOOKSHOP.name} tree={tree} className='w-full'>
      <TreeRows>
        {tree.getItems().map((item) => (
          <TreeRow key={item.getId()} item={item} hasGuides>
            <TreeItemLabel className={CHEVRON_AT_THE_END}>
              <span className='flex min-w-0 flex-1 items-center gap-1.5'>
                <ShelfGlyph isSection={item.isFolder()} />
                <span className='truncate'>{item.getItemName()}</span>
              </span>
            </TreeItemLabel>
          </TreeRow>
        ))}
      </TreeRows>
    </Tree>
  );
}
