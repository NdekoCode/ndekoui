'use client';

import {
  hotkeysCoreFeature,
  renamingFeature,
  selectionFeature,
  syncDataLoaderFeature,
  type ItemInstance,
} from '@headless-tree/core';
import { useTree } from '@headless-tree/react';
import { motion, type Transition, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';

import {
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Input } from '@/registry/ndeko/ui/input';
import { Tree, TreeItem, TreeItemLabel } from '@/registry/ndeko/ui/tree';

type Item = {
  name: string;
  children?: string[];
};

const INITIAL_ITEMS: Record<string, Item> = {
  company: {
    name: 'Company',
    children: ['engineering', 'marketing', 'operations'],
  },
  engineering: {
    name: 'Engineering',
    children: ['frontend', 'backend', 'platform-team'],
  },
  frontend: { name: 'Frontend', children: ['design-system', 'web-platform'] },
  'design-system': {
    name: 'Design System',
    children: ['components', 'tokens', 'guidelines'],
  },
  components: { name: 'Components' },
  tokens: { name: 'Tokens' },
  guidelines: { name: 'Guidelines' },
  'web-platform': { name: 'Web Platform' },
  backend: { name: 'Backend', children: ['apis', 'infrastructure'] },
  apis: { name: 'APIs' },
  infrastructure: { name: 'Infrastructure' },
  'platform-team': { name: 'Platform Team' },
  marketing: { name: 'Marketing', children: ['content', 'seo'] },
  content: { name: 'Content' },
  seo: { name: 'SEO' },
  operations: { name: 'Operations', children: ['hr', 'finance'] },
  hr: { name: 'HR' },
  finance: { name: 'Finance' },
};

const INDENT = 20;
const ROOT_ID = 'company';
const EXPANDED_ITEMS = ['engineering', 'frontend', 'design-system'];

const TRAVEL: Transition = { duration: 0.25, ease: [0.77, 0, 0.175, 1] };

const INSTANT: Transition = { duration: 0 };

function travelOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return TRAVEL;
}

const GLYPH =
  'text-muted-foreground col-start-1 row-start-1 size-4 transition-[opacity,scale,filter] duration-150 ease-out-strong';

const SHOWN_WHEN_CLOSED =
  'in-aria-expanded:scale-60 in-aria-expanded:opacity-0 in-aria-expanded:blur-[2px]';

const SHOWN_WHEN_OPEN =
  'scale-60 opacity-0 blur-[2px] in-aria-expanded:scale-100 in-aria-expanded:opacity-100 in-aria-expanded:blur-none';

function FolderGlyph() {
  return (
    <span className='grid'>
      <FolderIcon className={cn(GLYPH, SHOWN_WHEN_CLOSED)} />
      <FolderOpenIcon className={cn(GLYPH, SHOWN_WHEN_OPEN)} />
    </span>
  );
}

function ItemGlyph({ isFolder }: { isFolder: boolean }) {
  if (isFolder) {
    return <FolderGlyph />;
  }
  return <FileIcon className='text-muted-foreground size-4' />;
}

function nameOf(item: ItemInstance<Item>) {
  return item.getItemData().name;
}

function hasChildren(item: ItemInstance<Item>) {
  const children = item.getItemData().children ?? [];
  return children.length > 0;
}

function sortedChildrenOf(items: Record<string, Item>, itemId: string) {
  const children = items[itemId].children ?? [];
  const sorted = [...children];
  sorted.sort((firstId, secondId) => {
    const firstName = items[firstId].name;
    return firstName.localeCompare(items[secondId].name);
  });
  return sorted;
}

export default function Tree06() {
  const [items, setItems] = useState(INITIAL_ITEMS);
  const shouldReduceMotion = useReducedMotion();
  const travel = travelOf(shouldReduceMotion);

  function renameItem(item: ItemInstance<Item>, name: string) {
    const itemId = item.getId();
    setItems((current) => {
      const renamed = { ...current[itemId], name };
      return { ...current, [itemId]: renamed };
    });
  }

  function itemOf(itemId: string) {
    return items[itemId];
  }

  function childrenOf(itemId: string) {
    return sortedChildrenOf(items, itemId);
  }

  const tree = useTree<Item>({
    initialState: { expandedItems: EXPANDED_ITEMS },
    indent: INDENT,
    rootItemId: ROOT_ID,
    getItemName: nameOf,
    isItemFolder: hasChildren,
    dataLoader: { getItem: itemOf, getChildren: childrenOf },
    onRename: renameItem,
    features: [
      syncDataLoaderFeature,
      hotkeysCoreFeature,
      renamingFeature,
      selectionFeature,
    ],
  });

  useEffect(() => {
    tree.rebuildTree();
  }, [items, tree]);

  return (
    <div className='w-full'>
      <AnimatedSize>
        <Tree aria-label='Project files' indent={INDENT} tree={tree}>
          {tree.getItems().map((item) => (
            <TreeItem
              key={item.getId()}
              item={item}
              render={<motion.button layout='position' transition={travel} />}
            >
              <TreeItemLabel>
                <span className='flex items-center gap-2'>
                  <ItemGlyph isFolder={item.isFolder()} />
                  {item.isRenaming() && (
                    <Input
                      {...item.getRenameInputProps()}
                      aria-label={`Rename ${item.getItemName()}`}
                      className='-my-0.5 h-6 px-1.5'
                    />
                  )}
                  {!item.isRenaming() && item.getItemName()}
                </span>
              </TreeItemLabel>
            </TreeItem>
          ))}
        </Tree>
      </AnimatedSize>
    </div>
  );
}
