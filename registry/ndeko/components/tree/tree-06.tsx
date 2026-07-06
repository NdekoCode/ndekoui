'use client';

import {
  hotkeysCoreFeature,
  renamingFeature,
  selectionFeature,
  syncDataLoaderFeature,
  type ItemInstance,
} from '@headless-tree/core';
import { useEffect, useState } from 'react';

import { PencilIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';
import { Kbd } from '@/registry/ndeko/ui/kbd';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Tree, TreeItemLabel, useTree } from '@/registry/ndeko/ui/tree';

import {
  flattenBranches,
  isFlatFolder,
  nameOf,
  type Branch,
  type FlatNode,
  type FlatNodes,
} from './_parts/tree-data';
import { EntryGlyph } from './_parts/tree-glyphs';
import { TreeRow, TreeRows } from './_parts/tree-rows';

const LIBRARY: Branch = {
  id: 'library',
  name: 'Corvale research library',
  children: [
    {
      id: 'competitors',
      name: 'Competitors',
      children: [
        { id: 'pricing-pages', name: 'Pricing pages' },
        { id: 'teardown-notes', name: 'Teardown notes' },
        { id: 'win-and-loss-calls', name: 'Win and loss calls' },
      ],
    },
    {
      id: 'interviews',
      name: 'Interviews',
      children: [
        { id: 'churn-round', name: 'Churn round' },
        { id: 'onboarding-round', name: 'Onboarding round' },
        { id: 'pilot-debriefs', name: 'Pilot debriefs' },
      ],
    },
    { id: 'market-sizing', name: 'Market sizing' },
    { id: 'reading-list', name: 'Reading list' },
  ],
};

const LIBRARY_AT_START = flattenBranches(LIBRARY);

const OPEN_AT_START = ['interviews'];

const FOCUSED_AT_START = 'churn-round';

/* A field inside a button loses its spaces and its clicks in some browsers, so the row being renamed is a plain element. */
const ROW_BEING_RENAMED = <div />;

/* A line of 20px is what the rename field takes once its margins are counted, so a row keeps its height when it opens. */
const LABEL_AS_TALL_AS_THE_FIELD = 'leading-5';

function byNameIn(nodes: FlatNodes) {
  return function compareNames(firstId: string, secondId: string) {
    const firstName = nodes[firstId].name;
    const secondName = nodes[secondId].name;
    return firstName.localeCompare(secondName);
  };
}

function elementOf(row: ItemInstance<FlatNode>) {
  if (row.isRenaming()) {
    return ROW_BEING_RENAMED;
  }
  return undefined;
}

function keepClickInField(event: React.MouseEvent) {
  event.stopPropagation();
}

function selectWholeName(event: React.FocusEvent<HTMLInputElement>) {
  event.target.select();
}

type RowNameProps = {
  row: ItemInstance<FlatNode>;
};

function RowName({ row }: RowNameProps) {
  const name = row.getItemName();

  if (!row.isRenaming()) {
    return <span className='truncate'>{name}</span>;
  }
  return (
    <Input
      {...row.getRenameInputProps()}
      aria-label={`New name for ${name}`}
      onClick={keepClickInField}
      onFocus={selectWholeName}
      className='-my-1 h-7 flex-1 px-1.5'
    />
  );
}

export default function Tree06() {
  const [nodes, setNodes] = useState(LIBRARY_AT_START);
  const [notice, setNotice] = useState('');

  function nodeOf(nodeId: string) {
    return nodes[nodeId];
  }

  function sortedChildIdsOf(nodeId: string) {
    const node = nodes[nodeId];
    const childIds = [...node.childIds];
    const order = byNameIn(nodes);
    return childIds.sort(order);
  }

  function renameRow(row: ItemInstance<FlatNode>, typedName: string) {
    const newName = typedName.trim();
    const oldName = row.getItemName();
    const isBlank = newName === '';
    const isUnchanged = newName === oldName;
    if (isBlank || isUnchanged) {
      return;
    }
    const rowId = row.getId();
    setNodes((current) => {
      const renamed = { ...current[rowId], name: newName };
      return { ...current, [rowId]: renamed };
    });
    setNotice(`Renamed ${oldName} to ${newName}`);
  }

  const tree = useTree<FlatNode>({
    initialState: {
      expandedItems: OPEN_AT_START,
      selectedItems: [FOCUSED_AT_START],
      focusedItem: FOCUSED_AT_START,
    },
    rootItemId: LIBRARY.id,
    getItemName: nameOf,
    isItemFolder: isFlatFolder,
    onRename: renameRow,
    dataLoader: { getItem: nodeOf, getChildren: sortedChildIdsOf },
    features: [
      syncDataLoaderFeature,
      hotkeysCoreFeature,
      selectionFeature,
      renamingFeature,
    ],
  });

  /* The tree lists its rows once and keeps the list: it reads the names again after every change, to sort them. */
  useEffect(() => {
    tree.rebuildTree();
  }, [nodes, tree]);

  function renameFocusedRow() {
    tree.getFocusedItem().startRenaming();
  }

  return (
    <div className='relative flex w-full flex-col gap-2'>
      <div className='flex items-center justify-between gap-2'>
        <h3 className='text-muted-foreground truncate text-xs font-medium'>
          Research library
        </h3>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          aria-keyshortcuts='F2'
          onClick={renameFocusedRow}
        >
          <PencilIcon />
          Rename
          <Kbd>F2</Kbd>
        </Button>
      </div>
      <Tree aria-label={LIBRARY.name} tree={tree}>
        <TreeRows>
          {tree.getItems().map((item) => (
            <TreeRow
              key={item.getId()}
              item={item}
              render={elementOf(item)}
              travels
            >
              <TreeItemLabel className={LABEL_AS_TALL_AS_THE_FIELD}>
                <EntryGlyph isFolder={item.isFolder()} />
                <RowName row={item} />
              </TreeItemLabel>
            </TreeRow>
          ))}
        </TreeRows>
      </Tree>
      <LiveRegion message={notice} />
    </div>
  );
}
