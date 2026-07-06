'use client';

import {
  expandAllFeature,
  hotkeysCoreFeature,
  selectionFeature,
  syncDataLoaderFeature,
  type ItemInstance,
} from '@headless-tree/core';
import { useState } from 'react';

import { ListCollapseIcon, ListTreeIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Tree, TreeItemLabel, useTree } from '@/registry/ndeko/ui/tree';

import {
  branchLoaderOf,
  hasChildren,
  indexBranches,
  nameOf,
  type Branch,
} from './_parts/tree-data';
import { FolderGlyph } from './_parts/tree-glyphs';
import { TreeRow, TreeRows } from './_parts/tree-rows';

const CATALOGUE: Branch = {
  id: 'catalogue',
  name: 'Pinecrest catalogue',
  children: [
    {
      id: 'camping',
      name: 'Camping',
      children: [
        {
          id: 'tents',
          name: 'Tents',
          children: [
            { id: 'two-person-tents', name: 'Two-person tents' },
            { id: 'family-tents', name: 'Family tents' },
            { id: 'ultralight-tents', name: 'Ultralight tents' },
          ],
        },
        { id: 'sleeping-bags', name: 'Sleeping bags' },
        { id: 'stoves', name: 'Stoves' },
      ],
    },
    {
      id: 'footwear',
      name: 'Footwear',
      children: [
        { id: 'trail-shoes', name: 'Trail shoes' },
        { id: 'hiking-boots', name: 'Hiking boots' },
      ],
    },
    {
      id: 'clothing',
      name: 'Clothing',
      children: [
        { id: 'rain-shells', name: 'Rain shells' },
        { id: 'base-layers', name: 'Base layers' },
        { id: 'socks', name: 'Socks' },
      ],
    },
  ],
};

const CATEGORIES = indexBranches(CATALOGUE);

const CATEGORY_LOADER = branchLoaderOf(CATEGORIES);

const OPEN_AT_START = ['camping', 'tents'];

const SELECTED_AT_START = ['family-tents'];

type CategoryRowProps = {
  row: ItemInstance<Branch>;
};

function CategoryRow({ row }: CategoryRowProps) {
  const isGroup = row.isFolder();
  const childCount = row.getChildren().length;

  return (
    <TreeItemLabel>
      {isGroup && <FolderGlyph />}
      <span className='truncate'>{row.getItemName()}</span>
      {isGroup && (
        <span className='text-muted-foreground ms-auto ps-2 text-xs tabular-nums'>
          {childCount}
        </span>
      )}
    </TreeItemLabel>
  );
}

export default function Tree10() {
  const [notice, setNotice] = useState('');

  const tree = useTree<Branch>({
    initialState: {
      expandedItems: OPEN_AT_START,
      selectedItems: SELECTED_AT_START,
    },
    rootItemId: CATALOGUE.id,
    getItemName: nameOf,
    isItemFolder: hasChildren,
    dataLoader: CATEGORY_LOADER,
    features: [
      syncDataLoaderFeature,
      hotkeysCoreFeature,
      selectionFeature,
      expandAllFeature,
    ],
  });

  function openEveryCategory() {
    void tree.expandAll();
    setNotice('Every category is open');
  }

  function closeEveryCategory() {
    tree.collapseAll();
    setNotice('Every category is closed');
  }

  return (
    <div className='relative flex w-full flex-col gap-2'>
      <div className='flex flex-wrap items-center gap-2'>
        <Button
          type='button'
          size='sm'
          variant='outline'
          onClick={openEveryCategory}
        >
          <ListTreeIcon />
          Expand all
        </Button>
        <Button
          type='button'
          size='sm'
          variant='outline'
          onClick={closeEveryCategory}
        >
          <ListCollapseIcon />
          Collapse all
        </Button>
      </div>
      <Tree aria-label={CATALOGUE.name} tree={tree}>
        <TreeRows>
          {tree.getItems().map((item) => (
            <TreeRow key={item.getId()} item={item}>
              <CategoryRow row={item} />
            </TreeRow>
          ))}
        </TreeRows>
      </Tree>
      <LiveRegion message={notice} />
    </div>
  );
}
