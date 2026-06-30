'use client';

import {
  hotkeysCoreFeature,
  syncDataLoaderFeature,
  type ItemInstance,
} from '@headless-tree/core';
import { useState } from 'react';

import { SelectedMark } from '@/registry/ndeko/ui/selected-mark';
import {
  Tree,
  TreeItem,
  TreeItemLabel,
  useTree,
} from '@/registry/ndeko/ui/tree';

type FileNode = {
  name: string;
  children?: string[];
};

type Appearance = 'light' | 'dark' | 'system';

const FILES: Record<string, FileNode> = {
  website: { name: 'website', children: ['app', 'components', 'public'] },
  app: { name: 'app', children: ['pricing', 'layout', 'page'] },
  pricing: { name: 'pricing', children: ['pricing-page'] },
  'pricing-page': { name: 'page.tsx' },
  layout: { name: 'layout.tsx' },
  page: { name: 'page.tsx' },
  components: { name: 'components', children: ['hero', 'footer'] },
  hero: { name: 'hero.tsx' },
  footer: { name: 'footer.tsx' },
  public: { name: 'public', children: ['logo'] },
  logo: { name: 'logo.svg' },
};

const TREE_INDENT = 20;
const TREE_ROOT = 'website';
const EXPANDED_FOLDERS = ['app', 'pricing'];

const APPEARANCES: { value: Appearance; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'Match the system' },
];

const APPEARANCE_ROW =
  'flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-md px-2 text-start text-[13px] outline-none transition-colors hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/25';

function nameOf(item: ItemInstance<FileNode>) {
  return item.getItemData().name;
}

function isFolder(item: ItemInstance<FileNode>) {
  const children = item.getItemData().children ?? [];
  return children.length > 0;
}

function fileOf(itemId: string) {
  return FILES[itemId];
}

function childrenOf(itemId: string) {
  return FILES[itemId].children ?? [];
}

export function TreeDemo() {
  const tree = useTree<FileNode>({
    initialState: { expandedItems: EXPANDED_FOLDERS },
    indent: TREE_INDENT,
    rootItemId: TREE_ROOT,
    getItemName: nameOf,
    isItemFolder: isFolder,
    dataLoader: { getItem: fileOf, getChildren: childrenOf },
    features: [syncDataLoaderFeature, hotkeysCoreFeature],
  });

  return (
    <div className='w-full max-w-xs'>
      <Tree aria-label='Files' indent={TREE_INDENT} tree={tree}>
        {tree.getItems().map((item) => (
          <TreeItem key={item.getId()} item={item}>
            <TreeItemLabel />
          </TreeItem>
        ))}
      </Tree>
    </div>
  );
}

export function SelectedMarkDemo() {
  const [appearance, setAppearance] = useState<Appearance>('system');

  return (
    <div
      role='group'
      aria-label='Appearance'
      className='surface-raised flex w-56 flex-col rounded-xl p-1'
    >
      {APPEARANCES.map((option) => {
        const isSelected = option.value === appearance;
        return (
          <button
            key={option.value}
            type='button'
            aria-pressed={isSelected}
            onClick={() => setAppearance(option.value)}
            className={APPEARANCE_ROW}
          >
            {option.label}
            {isSelected && <SelectedMark className='ms-auto' />}
          </button>
        );
      })}
    </div>
  );
}
