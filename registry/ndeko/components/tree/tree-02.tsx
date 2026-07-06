'use client';

import { hotkeysCoreFeature, syncDataLoaderFeature } from '@headless-tree/core';

import { Tree, TreeItemLabel, useTree } from '@/registry/ndeko/ui/tree';

import {
  branchLoaderOf,
  hasChildren,
  indexBranches,
  nameOf,
  type Branch,
} from './_parts/tree-data';
import { TreeRow, TreeRows } from './_parts/tree-rows';

const WAREHOUSE: Branch = {
  id: 'warehouse',
  name: 'Brightmoor Supply warehouse',
  children: [
    {
      id: 'ambient-hall',
      name: 'Ambient hall',
      children: [
        {
          id: 'aisle-01',
          name: 'Aisle 01',
          children: [
            { id: 'rack-01-a', name: 'Rack 01-A' },
            { id: 'rack-01-b', name: 'Rack 01-B' },
            { id: 'rack-01-c', name: 'Rack 01-C' },
          ],
        },
        {
          id: 'aisle-02',
          name: 'Aisle 02',
          children: [
            { id: 'rack-02-a', name: 'Rack 02-A' },
            { id: 'rack-02-b', name: 'Rack 02-B' },
          ],
        },
        { id: 'mezzanine', name: 'Mezzanine' },
      ],
    },
    {
      id: 'cold-room',
      name: 'Cold room',
      children: [
        { id: 'chiller-1', name: 'Chiller 1' },
        { id: 'chiller-2', name: 'Chiller 2' },
      ],
    },
    {
      id: 'dispatch',
      name: 'Dispatch',
      children: [
        { id: 'dock-1', name: 'Dock 1' },
        { id: 'dock-2', name: 'Dock 2' },
        { id: 'returns-cage', name: 'Returns cage' },
      ],
    },
  ],
};

const LOCATIONS = indexBranches(WAREHOUSE);

const LOCATION_LOADER = branchLoaderOf(LOCATIONS);

const OPEN_AT_START = ['ambient-hall', 'aisle-01'];

export default function Tree02() {
  const tree = useTree<Branch>({
    initialState: { expandedItems: OPEN_AT_START },
    rootItemId: WAREHOUSE.id,
    getItemName: nameOf,
    isItemFolder: hasChildren,
    dataLoader: LOCATION_LOADER,
    features: [syncDataLoaderFeature, hotkeysCoreFeature],
  });

  return (
    <Tree aria-label={WAREHOUSE.name} tree={tree} className='w-full'>
      <TreeRows>
        {tree.getItems().map((item) => (
          <TreeRow key={item.getId()} item={item} hasGuides>
            <TreeItemLabel />
          </TreeRow>
        ))}
      </TreeRows>
    </Tree>
  );
}
