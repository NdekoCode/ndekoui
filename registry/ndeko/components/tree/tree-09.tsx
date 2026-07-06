'use client';

import {
  hotkeysCoreFeature,
  selectionFeature,
  syncDataLoaderFeature,
  type FeatureImplementation,
  type ItemInstance,
  type TreeInstance,
} from '@headless-tree/core';

import { WordRoll } from '@/components/core/word-roll';
import { FolderIcon } from '@/registry/ndeko/lib/icons';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Tree, TreeItemLabel, useTree } from '@/registry/ndeko/ui/tree';

import {
  branchLoaderOf,
  hasChildren,
  indexBranches,
  nameOf,
  parentIdsOf,
  type Branch,
} from './_parts/tree-data';
import { FolderGlyph } from './_parts/tree-glyphs';
import { TreeRow, TreeRows } from './_parts/tree-rows';

const WORKSPACE: Branch = {
  id: 'workspace',
  name: 'Wrenfield workspace',
  children: [
    {
      id: 'projects',
      name: 'Projects',
      children: [
        {
          id: 'storefront',
          name: 'Storefront',
          children: [
            { id: 'storefront-source', name: 'Source' },
            { id: 'storefront-tests', name: 'Tests' },
            { id: 'storefront-docs', name: 'Docs' },
          ],
        },
        {
          id: 'billing-service',
          name: 'Billing service',
          children: [
            { id: 'billing-source', name: 'Source' },
            { id: 'billing-migrations', name: 'Migrations' },
          ],
        },
        { id: 'mobile-app', name: 'Mobile app' },
      ],
    },
    {
      id: 'shared',
      name: 'Shared',
      children: [
        { id: 'brand', name: 'Brand' },
        { id: 'legal', name: 'Legal' },
      ],
    },
    { id: 'archive', name: 'Archive' },
  ],
};

const FOLDERS = indexBranches(WORKSPACE);

const FOLDER_LOADER = branchLoaderOf(FOLDERS);

const PARENT_IDS = parentIdsOf(FOLDERS);

const OPEN_AT_START = ['projects', 'storefront'];

const SELECTED_AT_START = ['storefront-tests'];

function toggleFolder(row: ItemInstance<Branch>) {
  if (!row.isFolder()) {
    return;
  }
  if (row.isExpanded()) {
    row.collapse();
    return;
  }
  row.expand();
}

function applyClickToSelection(
  tree: TreeInstance<Branch>,
  row: ItemInstance<Branch>,
  event: React.MouseEvent
) {
  const keepsOthers = event.ctrlKey || event.metaKey;
  if (event.shiftKey) {
    row.selectUpTo(keepsOthers);
    return;
  }
  if (keepsOthers) {
    row.toggleSelect();
    return;
  }
  tree.setSelectedItems([row.getId()]);
}

function openFocusedFolder(_event: KeyboardEvent, tree: TreeInstance<Branch>) {
  const focusedRow = tree.getFocusedItem();
  toggleFolder(focusedRow);
}

/* A click only selects here, as in a file manager: opening a folder takes a double click, Enter or the arrow keys. */
const openOnDoubleClick: FeatureImplementation<Branch> = {
  itemInstance: {
    getProps: ({ tree, item, prev }) => {
      function selectRow(event: React.MouseEvent) {
        applyClickToSelection(tree, item, event);
        item.setFocused();
      }

      function openRow() {
        item.primaryAction();
        toggleFolder(item);
      }

      return { ...prev?.(), onClick: selectRow, onDoubleClick: openRow };
    },
  },
};

function pathNamesOf(folderId: string): string[] {
  if (folderId === WORKSPACE.id) {
    return [];
  }
  const parentId = PARENT_IDS[folderId];
  const parentPath = pathNamesOf(parentId);
  const folder = FOLDERS[folderId];
  return [...parentPath, folder.name];
}

function selectionLabelOf(selectedIds: string[]) {
  if (selectedIds.length === 0) {
    return 'No folder selected';
  }
  if (selectedIds.length > 1) {
    return `${selectedIds.length} folders selected`;
  }
  const [onlyId] = selectedIds;
  const names = pathNamesOf(onlyId);
  return names.join(' / ');
}

type FolderMarkProps = {
  canOpen: boolean;
};

function FolderMark({ canOpen }: FolderMarkProps) {
  if (canOpen) {
    return <FolderGlyph />;
  }
  return <FolderIcon className='text-muted-foreground size-4' />;
}

export default function Tree09() {
  const tree = useTree<Branch>({
    initialState: {
      expandedItems: OPEN_AT_START,
      selectedItems: SELECTED_AT_START,
    },
    rootItemId: WORKSPACE.id,
    getItemName: nameOf,
    isItemFolder: hasChildren,
    dataLoader: FOLDER_LOADER,
    hotkeys: {
      customOpenFolder: { hotkey: 'Enter', handler: openFocusedFolder },
    },
    features: [
      syncDataLoaderFeature,
      hotkeysCoreFeature,
      selectionFeature,
      openOnDoubleClick,
    ],
  });
  const { selectedItems } = tree.getState();
  const selectionLabel = selectionLabelOf(selectedItems);

  return (
    <div className='relative flex w-full flex-col gap-2'>
      <Tree aria-label={WORKSPACE.name} tree={tree}>
        <TreeRows>
          {tree.getItems().map((item) => (
            <TreeRow key={item.getId()} item={item}>
              <TreeItemLabel>
                <FolderMark canOpen={item.isFolder()} />
                <span className='truncate'>{item.getItemName()}</span>
              </TreeItemLabel>
            </TreeRow>
          ))}
        </TreeRows>
      </Tree>
      <p className='text-muted-foreground flex flex-wrap items-baseline gap-x-1.5 text-xs'>
        Working folder
        <WordRoll
          text={selectionLabel}
          className='text-foreground font-medium'
        />
      </p>
      <LiveRegion message={`Working folder: ${selectionLabel}`} />
    </div>
  );
}
