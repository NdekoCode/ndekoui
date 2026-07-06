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

import {
  CodeIcon,
  FileIcon,
  FileTextIcon,
  ImageIcon,
  ReactBrandIcon,
  SourceCodeIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { Kbd, KbdGroup } from '@/registry/ndeko/ui/kbd';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Tree, TreeItemLabel, useTree } from '@/registry/ndeko/ui/tree';

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
  type FlatNodes,
} from './_parts/tree-data';
import { TreeRow, TreeRows } from './_parts/tree-rows';

type FileKind = 'component' | 'script' | 'data' | 'image' | 'text' | 'other';

const REPOSITORY: Branch = {
  id: 'repository',
  name: 'Kettlebrook storefront',
  children: [
    {
      id: 'src',
      name: 'src',
      children: [
        {
          id: 'src/checkout',
          name: 'checkout',
          children: [
            { id: 'src/checkout/checkout-form.tsx', name: 'checkout-form.tsx' },
            { id: 'src/checkout/use-cart.ts', name: 'use-cart.ts' },
          ],
        },
        { id: 'src/storefront.tsx', name: 'storefront.tsx' },
      ],
    },
    {
      id: 'emails',
      name: 'emails',
      children: [
        { id: 'emails/receipt.tsx', name: 'receipt.tsx' },
        { id: 'emails/shipping-notice.tsx', name: 'shipping-notice.tsx' },
      ],
    },
    {
      id: 'assets',
      name: 'assets',
      children: [{ id: 'assets/wordmark.svg', name: 'wordmark.svg' }],
    },
    { id: 'prices.json', name: 'prices.json' },
    { id: 'CHANGELOG.md', name: 'CHANGELOG.md' },
  ],
};

const FILES_AT_START = flattenBranches(REPOSITORY);

const OPEN_AT_START = ['src', 'src/checkout'];

const SELECTED_AT_START = ['emails'];

const INDENT = 20;

const KIND_OF_EXTENSION: Partial<Record<string, FileKind>> = {
  tsx: 'component',
  jsx: 'component',
  ts: 'script',
  js: 'script',
  mjs: 'script',
  json: 'data',
  svg: 'image',
  png: 'image',
  webp: 'image',
  md: 'text',
};

const KIND_ICON: Record<FileKind, Icon> = {
  component: ReactBrandIcon,
  script: SourceCodeIcon,
  data: CodeIcon,
  image: ImageIcon,
  text: FileTextIcon,
  other: FileIcon,
};

/* A file takes the column of the chevron, so file names and folder names start on one line. */
const COMPACT_LABEL = 'py-1 leading-5 not-in-data-[folder=true]:ps-2';

function kindOf(fileName: string): FileKind {
  const parts = fileName.split('.');
  const extension = parts.at(-1) ?? '';
  return KIND_OF_EXTENSION[extension] ?? 'other';
}

function idOf(row: ItemInstance<FlatNode>) {
  return row.getId();
}

function sortKeyOf(node: FlatNode) {
  if (node.isFolder) {
    return `0 ${node.name}`;
  }
  return `1 ${node.name}`;
}

function foldersFirstIn(nodes: FlatNodes) {
  return function compareEntries(firstId: string, secondId: string) {
    const first = nodes[firstId];
    const second = nodes[secondId];
    const firstKey = sortKeyOf(first);
    const secondKey = sortKeyOf(second);
    return firstKey.localeCompare(secondKey);
  };
}

type FileGlyphProps = {
  name: string;
};

function FileGlyph({ name }: FileGlyphProps) {
  const kind = kindOf(name);
  const Glyph = KIND_ICON[kind];

  return <Glyph className='text-muted-foreground size-4' />;
}

export default function Tree11() {
  const [nodes, setNodes] = useState(FILES_AT_START);
  const [moveNotice, setMoveNotice] = useState('');
  const hintId = useId();

  function nodeOf(nodeId: string) {
    return nodes[nodeId];
  }

  function sortedChildIdsOf(nodeId: string) {
    const node = nodes[nodeId];
    const childIds = [...node.childIds];
    const order = foldersFirstIn(nodes);
    return childIds.sort(order);
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
    rootItemId: REPOSITORY.id,
    getItemName: nameOf,
    isItemFolder: isFlatFolder,
    canReorder: false,
    onDrop: dropRows,
    onStartKeyboardDrag: forgetLastMove,
    dataLoader: { getItem: nodeOf, getChildren: sortedChildIdsOf },
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

  /* The tree lists its rows once and keeps the list: it reads the files again after every move, to sort them. */
  useEffect(() => {
    tree.rebuildTree();
  }, [nodes, tree]);

  return (
    <div className='relative flex w-full flex-col gap-2'>
      <Tree
        aria-label={REPOSITORY.name}
        aria-describedby={hintId}
        indent={INDENT}
        tree={tree}
      >
        <TreeRows>
          {tree.getItems().map((item) => (
            <TreeRow key={item.getId()} item={item} hasGuides travels>
              <TreeItemLabel className={COMPACT_LABEL}>
                {!item.isFolder() && <FileGlyph name={item.getItemName()} />}
                <span className='truncate'>{item.getItemName()}</span>
              </TreeItemLabel>
            </TreeRow>
          ))}
        </TreeRows>
      </Tree>
      <p
        id={hintId}
        className='text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs'
      >
        Drop a file on a folder to move it, or press
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
