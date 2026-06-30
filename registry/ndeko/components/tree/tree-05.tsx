'use client';

import {
  createOnDropHandler,
  dragAndDropFeature,
  hotkeysCoreFeature,
  keyboardDragAndDropFeature,
  selectionFeature,
  syncDataLoaderFeature,
  type ItemInstance,
} from '@headless-tree/core';
import { AssistiveTreeDescription } from '@headless-tree/react';
import { motion, type Transition, useReducedMotion } from 'motion/react';
import { useState } from 'react';

import { FolderIcon, FolderOpenIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import {
  Tree,
  TreeDragLine,
  TreeItem,
  TreeItemLabel,
  useTree,
} from '@/registry/ndeko/ui/tree';

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

function nameOf(item: ItemInstance<Item>) {
  return item.getItemData().name;
}

function hasChildren(item: ItemInstance<Item>) {
  const children = item.getItemData().children ?? [];
  return children.length > 0;
}

export default function Tree05() {
  const [items, setItems] = useState(INITIAL_ITEMS);
  const shouldReduceMotion = useReducedMotion();
  const travel = travelOf(shouldReduceMotion);

  function replaceChildren(parent: ItemInstance<Item>, childIds: string[]) {
    const parentId = parent.getId();
    setItems((current) => {
      const updatedParent = { ...current[parentId], children: childIds };
      return { ...current, [parentId]: updatedParent };
    });
  }

  function itemOf(itemId: string) {
    return items[itemId];
  }

  function childrenOf(itemId: string) {
    return items[itemId].children ?? [];
  }

  const tree = useTree<Item>({
    initialState: {
      expandedItems: EXPANDED_ITEMS,
      selectedItems: ['components'],
    },
    indent: INDENT,
    rootItemId: ROOT_ID,
    getItemName: nameOf,
    isItemFolder: hasChildren,
    canReorder: true,
    onDrop: createOnDropHandler(replaceChildren),
    dataLoader: { getItem: itemOf, getChildren: childrenOf },
    features: [
      syncDataLoaderFeature,
      selectionFeature,
      hotkeysCoreFeature,
      dragAndDropFeature,
      keyboardDragAndDropFeature,
    ],
  });

  return (
    <div className='w-full'>
      <AnimatedSize className='-ms-3' contentClassName='ps-3'>
        <Tree aria-label='Project files' indent={INDENT} tree={tree}>
          <AssistiveTreeDescription tree={tree} />
          {tree.getItems().map((item) => (
            <TreeItem
              key={item.getId()}
              item={item}
              render={<motion.button layout='position' transition={travel} />}
            >
              <TreeItemLabel>
                <span className='flex items-center gap-2'>
                  {item.isFolder() && <FolderGlyph />}
                  {item.getItemName()}
                </span>
              </TreeItemLabel>
            </TreeItem>
          ))}
          <TreeDragLine />
        </Tree>
      </AnimatedSize>
    </div>
  );
}
