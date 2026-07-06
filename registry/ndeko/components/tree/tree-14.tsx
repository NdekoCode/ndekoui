'use client';

import {
  checkboxesFeature,
  hotkeysCoreFeature,
  selectionFeature,
  syncDataLoaderFeature,
} from '@headless-tree/core';

import { WordRoll } from '@/components/core/word-roll';
import { Button } from '@/registry/ndeko/ui/button';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Tree, TreeItemLabel, useTree } from '@/registry/ndeko/ui/tree';

import { ItemCheckbox } from './_parts/item-checkbox';
import {
  branchLoaderOf,
  countIn,
  hasChildren,
  indexBranches,
  leafIdsOf,
  nameOf,
  type Branch,
} from './_parts/tree-data';
import { TreeRow, TreeRows } from './_parts/tree-rows';

const NETWORK: Branch = {
  id: 'network',
  name: 'Calder Freight depots',
  children: [
    {
      id: 'north',
      name: 'North',
      children: [
        { id: 'leeds', name: 'Leeds' },
        { id: 'newcastle', name: 'Newcastle' },
        { id: 'carlisle', name: 'Carlisle' },
      ],
    },
    {
      id: 'midlands',
      name: 'Midlands',
      children: [
        { id: 'derby', name: 'Derby' },
        { id: 'coventry', name: 'Coventry' },
      ],
    },
    {
      id: 'south',
      name: 'South',
      children: [
        { id: 'reading', name: 'Reading' },
        {
          id: 'south-coast',
          name: 'South coast',
          children: [
            { id: 'southampton', name: 'Southampton' },
            { id: 'exeter', name: 'Exeter' },
          ],
        },
      ],
    },
  ],
};

const REGIONS = indexBranches(NETWORK);

const REGION_LOADER = branchLoaderOf(REGIONS);

const DEPOT_IDS = leafIdsOf(REGIONS);

const OPEN_AT_START = ['north', 'south'];

const PICKED_AT_START = ['leeds', 'newcastle', 'reading'];

function reportLabelOf(depotCount: number) {
  if (depotCount === 0) {
    return 'No depot in the report';
  }
  if (depotCount === 1) {
    return '1 depot in the report';
  }
  return `${depotCount} depots in the report`;
}

export default function Tree14() {
  const tree = useTree<Branch>({
    initialState: {
      expandedItems: OPEN_AT_START,
      checkedItems: PICKED_AT_START,
    },
    rootItemId: NETWORK.id,
    getItemName: nameOf,
    isItemFolder: hasChildren,
    dataLoader: REGION_LOADER,
    features: [
      syncDataLoaderFeature,
      hotkeysCoreFeature,
      selectionFeature,
      checkboxesFeature,
    ],
  });
  const { checkedItems } = tree.getState();
  const depotCount = countIn(DEPOT_IDS, checkedItems);
  const reportLabel = reportLabelOf(depotCount);

  function pickEveryDepot() {
    tree.setCheckedItems(DEPOT_IDS);
  }

  function clearDepots() {
    tree.setCheckedItems([]);
  }

  return (
    <div className='relative flex w-full flex-col gap-2'>
      <Tree aria-label={NETWORK.name} tree={tree}>
        <TreeRows>
          {tree.getItems().map((item) => (
            <TreeRow
              key={item.getId()}
              item={item}
              leading={<ItemCheckbox item={item} />}
            >
              <TreeItemLabel />
            </TreeRow>
          ))}
        </TreeRows>
      </Tree>
      <div className='flex flex-wrap items-center justify-between gap-x-3 gap-y-1'>
        <WordRoll
          text={reportLabel}
          value={depotCount}
          className='text-muted-foreground text-xs tabular-nums'
        />
        <div className='flex items-center'>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={pickEveryDepot}
          >
            Select all
          </Button>
          <Button type='button' variant='ghost' size='sm' onClick={clearDepots}>
            Clear
          </Button>
        </div>
      </div>
      <LiveRegion message={reportLabel} />
    </div>
  );
}
