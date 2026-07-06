'use client';

import {
  dragAndDropFeature,
  hotkeysCoreFeature,
  keyboardDragAndDropFeature,
  selectionFeature,
  syncDataLoaderFeature,
  type DragTarget,
  type ItemInstance,
} from '@headless-tree/core';
import { useEffect, useId, useState } from 'react';

import { Kbd, KbdGroup } from '@/registry/ndeko/ui/kbd';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import {
  Tree,
  TreeDragLine,
  TreeItemLabel,
  useTree,
} from '@/registry/ndeko/ui/tree';

import {
  dragStatusOf,
  moveNoticeOf,
  spokenStatusOf,
} from './_parts/drag-status';
import {
  flattenBranches,
  isFlatFolder,
  moveNodes,
  nameOf,
  type Branch,
  type FlatNode,
} from './_parts/tree-data';
import { FolderGlyph } from './_parts/tree-glyphs';
import { TreeRow, TreeRows } from './_parts/tree-rows';

const SITE_MENU: Branch = {
  id: 'site-menu',
  name: 'Mossline site menu',
  children: [
    {
      id: 'product',
      name: 'Product',
      children: [
        { id: 'planner', name: 'Planner' },
        { id: 'timesheets', name: 'Timesheets' },
        { id: 'invoicing', name: 'Invoicing' },
      ],
    },
    {
      id: 'solutions',
      name: 'Solutions',
      children: [
        { id: 'for-agencies', name: 'For agencies' },
        { id: 'for-freelancers', name: 'For freelancers' },
      ],
    },
    {
      id: 'resources',
      name: 'Resources',
      children: [
        { id: 'guides', name: 'Guides' },
        { id: 'changelog', name: 'Changelog' },
      ],
    },
    { id: 'pricing', name: 'Pricing' },
    { id: 'contact', name: 'Contact' },
  ],
};

const MENU_AT_START = flattenBranches(SITE_MENU);

const OPEN_AT_START = ['product', 'resources'];

const SELECTED_AT_START = ['timesheets'];

const INDENT = 20;

function idOf(row: ItemInstance<FlatNode>) {
  return row.getId();
}

export default function Tree05() {
  const [nodes, setNodes] = useState(MENU_AT_START);
  const [moveNotice, setMoveNotice] = useState('');
  const hintId = useId();

  function nodeOf(nodeId: string) {
    return nodes[nodeId];
  }

  function childIdsOf(nodeId: string) {
    return nodes[nodeId].childIds;
  }

  function dropRows(
    rows: ItemInstance<FlatNode>[],
    target: DragTarget<FlatNode>
  ) {
    const movedIds = rows.map(idOf);
    const notice = moveNoticeOf(rows, target);
    setNodes((current) => moveNodes(current, movedIds, target));
    setMoveNotice(notice);
  }

  function forgetLastMove() {
    setMoveNotice('');
  }

  const tree = useTree<FlatNode>({
    initialState: {
      expandedItems: OPEN_AT_START,
      selectedItems: SELECTED_AT_START,
    },
    indent: INDENT,
    rootItemId: SITE_MENU.id,
    getItemName: nameOf,
    isItemFolder: isFlatFolder,
    canReorder: true,
    onDrop: dropRows,
    onStartKeyboardDrag: forgetLastMove,
    dataLoader: { getItem: nodeOf, getChildren: childIdsOf },
    features: [
      syncDataLoaderFeature,
      hotkeysCoreFeature,
      selectionFeature,
      dragAndDropFeature,
      keyboardDragAndDropFeature,
    ],
  });
  const dragStatus = dragStatusOf(tree);
  const status = spokenStatusOf(dragStatus, moveNotice);

  /* The tree lists its rows once and keeps the list: it reads the menu again after every move. */
  useEffect(() => {
    tree.rebuildTree();
  }, [nodes, tree]);

  return (
    <div className='relative flex w-full flex-col gap-2'>
      <Tree
        aria-label={SITE_MENU.name}
        aria-describedby={hintId}
        indent={INDENT}
        tree={tree}
      >
        <TreeRows>
          {tree.getItems().map((item) => (
            <TreeRow key={item.getId()} item={item} travels>
              <TreeItemLabel>
                {item.isFolder() && <FolderGlyph />}
                <span className='truncate'>{item.getItemName()}</span>
              </TreeItemLabel>
            </TreeRow>
          ))}
        </TreeRows>
        <TreeDragLine />
      </Tree>
      <p
        id={hintId}
        className='text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs'
      >
        Drag rows to reorder them, or press
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <Kbd>Shift</Kbd>
          <Kbd>D</Kbd>
        </KbdGroup>
      </p>
      <LiveRegion message={status} />
    </div>
  );
}
