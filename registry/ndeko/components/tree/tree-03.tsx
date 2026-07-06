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
import { EntryGlyph } from './_parts/tree-glyphs';
import { TreeRow, TreeRows } from './_parts/tree-rows';

const SHARED_DRIVE: Branch = {
  id: 'shared-drive',
  name: 'Tidewell Studio shared drive',
  children: [
    {
      id: 'clients',
      name: 'Clients',
      children: [
        {
          id: 'oatfield',
          name: 'Oatfield',
          children: [
            { id: 'packaging-brief', name: 'Packaging brief.pdf' },
            { id: 'label-artwork', name: 'Label artwork.zip' },
            { id: 'shoot-selects', name: 'Shoot selects.zip' },
          ],
        },
        {
          id: 'pinecrest',
          name: 'Pinecrest',
          children: [{ id: 'spring-lookbook', name: 'Spring lookbook.pdf' }],
        },
      ],
    },
    {
      id: 'studio',
      name: 'Studio',
      children: [
        { id: 'rate-card', name: 'Rate card.pdf' },
        { id: 'holiday-rota', name: 'Holiday rota.xlsx' },
      ],
    },
    {
      id: 'templates',
      name: 'Templates',
      children: [
        { id: 'proposal', name: 'Proposal.docx' },
        { id: 'estimate', name: 'Estimate.xlsx' },
      ],
    },
  ],
};

const ENTRIES = indexBranches(SHARED_DRIVE);

const ENTRY_LOADER = branchLoaderOf(ENTRIES);

const OPEN_AT_START = ['clients', 'oatfield'];

export default function Tree03() {
  const tree = useTree<Branch>({
    initialState: { expandedItems: OPEN_AT_START },
    rootItemId: SHARED_DRIVE.id,
    getItemName: nameOf,
    isItemFolder: hasChildren,
    dataLoader: ENTRY_LOADER,
    features: [syncDataLoaderFeature, hotkeysCoreFeature],
  });

  return (
    <Tree aria-label={SHARED_DRIVE.name} tree={tree} className='w-full'>
      <TreeRows>
        {tree.getItems().map((item) => (
          <TreeRow key={item.getId()} item={item} hasGuides>
            <TreeItemLabel>
              <EntryGlyph isFolder={item.isFolder()} />
              <span className='truncate'>{item.getItemName()}</span>
            </TreeItemLabel>
          </TreeRow>
        ))}
      </TreeRows>
    </Tree>
  );
}
