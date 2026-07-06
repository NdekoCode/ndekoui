'use client';

import {
  expandAllFeature,
  hotkeysCoreFeature,
  searchFeature,
  selectionFeature,
  syncDataLoaderFeature,
  type ItemInstance,
} from '@headless-tree/core';
import { useState } from 'react';

import { SearchIcon } from '@/registry/ndeko/lib/icons';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { Input } from '@/registry/ndeko/ui/input';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Tree, TreeItemLabel, useTree } from '@/registry/ndeko/ui/tree';

import {
  branchLoaderOf,
  folderIdsOf,
  hasChildren,
  indexBranches,
  nameOf,
  type Branch,
} from './_parts/tree-data';
import { FolderGlyph } from './_parts/tree-glyphs';
import { TreeRow, TreeRows } from './_parts/tree-rows';

const SAVED_REPLIES: Branch = {
  id: 'saved-replies',
  name: 'Oatfield saved replies',
  children: [
    {
      id: 'orders',
      name: 'Orders',
      children: [
        { id: 'order-status', name: 'Where is my order' },
        { id: 'delivery-day', name: 'Change the delivery day' },
        { id: 'late-order', name: 'Late order apology' },
      ],
    },
    {
      id: 'refunds',
      name: 'Refunds',
      children: [
        { id: 'damaged-bag', name: 'Damaged bag' },
        { id: 'refund-timing', name: 'Refund timing' },
        { id: 'refund-to-gift-card', name: 'Refund to a gift card' },
      ],
    },
    {
      id: 'subscriptions',
      name: 'Subscriptions',
      children: [
        { id: 'skip-a-week', name: 'Skip a week' },
        { id: 'pause-or-cancel', name: 'Pause or cancel' },
        { id: 'box-size', name: 'Change the box size' },
      ],
    },
    { id: 'allergens', name: 'Allergens' },
  ],
};

const REPLIES = indexBranches(SAVED_REPLIES);

const REPLY_LOADER = branchLoaderOf(REPLIES);

const FOLDER_IDS = folderIdsOf(REPLIES);

const OPEN_AT_START = ['orders'];

/* The arrow keys walk the matches while the caret stays in the field: the match they are on is the stronger one. */
const CURRENT_MATCH =
  '[[data-search-match=true][data-focus=true]_&]:bg-warning/30';

function ancestorIdsOf(row: ItemInstance<Branch>) {
  const ancestorIds: string[] = [];
  let parent = row.getParent();
  while (parent) {
    ancestorIds.push(parent.getId());
    parent = parent.getParent();
  }
  return ancestorIds;
}

function matchLabelOf(query: string, matchCount: number) {
  if (query === '') {
    return '';
  }
  if (matchCount === 0) {
    return 'No match';
  }
  if (matchCount === 1) {
    return '1 match';
  }
  return `${matchCount} matches`;
}

function spokenMatchesOf(query: string, matchCount: number) {
  if (query === '') {
    return '';
  }
  if (matchCount === 0) {
    return `No reply matches ${query}`;
  }
  if (matchCount === 1) {
    return `1 reply matches ${query}`;
  }
  return `${matchCount} replies match ${query}`;
}

export default function Tree07() {
  const [openIds, setOpenIds] = useState(OPEN_AT_START);
  const [openBeforeSearch, setOpenBeforeSearch] = useState<string[] | null>(
    null
  );

  function openEveryFolder() {
    if (!openBeforeSearch) {
      setOpenBeforeSearch(openIds);
    }
    setOpenIds(FOLDER_IDS);
  }

  const tree = useTree<Branch>({
    state: { expandedItems: openIds },
    setExpandedItems: setOpenIds,
    rootItemId: SAVED_REPLIES.id,
    getItemName: nameOf,
    isItemFolder: hasChildren,
    onOpenSearch: openEveryFolder,
    dataLoader: REPLY_LOADER,
    features: [
      syncDataLoaderFeature,
      hotkeysCoreFeature,
      selectionFeature,
      expandAllFeature,
      searchFeature,
    ],
  });
  const searchField = tree.getSearchInputElementProps();
  const query = tree.getSearchValue();
  const matchCount = tree.getSearchMatchingItems().length;
  const matchLabel = matchLabelOf(query, matchCount);
  const spokenMatches = spokenMatchesOf(query, matchCount);

  function restoreFolders() {
    if (!openBeforeSearch) {
      return;
    }
    const focusedRow = tree.getFocusedItem();
    const pathToFocusedRow = ancestorIdsOf(focusedRow);
    const restored = new Set([...openBeforeSearch, ...pathToFocusedRow]);
    setOpenIds([...restored]);
    setOpenBeforeSearch(null);
  }

  function typeQuery(event: React.ChangeEvent<HTMLInputElement>) {
    searchField.onChange(event);
    const isCleared = event.target.value === '';
    if (isCleared) {
      restoreFolders();
      return;
    }
    openEveryFolder();
  }

  /* Leaving the field keeps every folder open: a click on a match must find its row where it was. */
  function leaveSearch() {
    searchField.onBlur();
    setOpenBeforeSearch(null);
  }

  return (
    <div className='relative flex w-full flex-col gap-2'>
      <div className='relative'>
        <Input
          {...searchField}
          onChange={typeQuery}
          onBlur={leaveSearch}
          type='search'
          placeholder='Search replies'
          aria-label='Search replies'
          className='ps-8 pe-20'
        />
        <SearchIcon className='text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2' />
        <span
          aria-hidden='true'
          className='text-muted-foreground pointer-events-none absolute inset-y-0 end-2.5 flex items-center text-xs tabular-nums'
        >
          <Swap swapKey={matchLabel}>{matchLabel}</Swap>
        </span>
      </div>
      <Tree aria-label={SAVED_REPLIES.name} tree={tree}>
        <TreeRows>
          {tree.getItems().map((item) => (
            <TreeRow key={item.getId()} item={item}>
              <TreeItemLabel className={CURRENT_MATCH}>
                {item.isFolder() && <FolderGlyph />}
                <span className='truncate'>{item.getItemName()}</span>
              </TreeItemLabel>
            </TreeRow>
          ))}
        </TreeRows>
      </Tree>
      <LiveRegion message={spokenMatches} />
    </div>
  );
}
