'use client';

import {
  hotkeysCoreFeature,
  syncDataLoaderFeature,
  type ItemInstance,
} from '@headless-tree/core';
import { useTree } from '@headless-tree/react';

import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Tree, TreeItem, TreeItemLabel } from '@/registry/ndeko/ui/tree';

type Item = {
  name: string;
  href?: string;
  children?: string[];
  current?: boolean;
};

const ITEMS: Record<string, Item> = {
  main: { name: 'Documentation', children: ['guides', 'api', 'resources'] },
  guides: { name: 'User guides', children: ['getting-started', 'advanced'] },
  'getting-started': {
    name: 'Getting started',
    children: ['installation', 'setup'],
  },
  installation: { name: 'Installation', href: '#', current: true },
  setup: { name: 'Configuration', href: '#' },
  advanced: { name: 'Advanced usage', href: '#' },
  api: { name: 'API reference', children: ['endpoints', 'models'] },
  endpoints: { name: 'Endpoints', href: '#' },
  models: { name: 'Data models', href: '#' },
  resources: { name: 'Resources', children: ['examples', 'faq'] },
  examples: { name: 'Code examples', href: '#' },
  faq: { name: 'FAQ', href: '#' },
};

const INDENT = 20;
const ROOT_ID = 'main';

const CURRENT_PAGE =
  'in-data-[current=true]:bg-primary/[0.08] in-data-[current=true]:font-medium';

function nameOf(item: ItemInstance<Item>) {
  return item.getItemData().name;
}

function hasChildren(item: ItemInstance<Item>) {
  const children = item.getItemData().children ?? [];
  return children.length > 0;
}

function itemOf(itemId: string) {
  return ITEMS[itemId];
}

function childrenOf(itemId: string) {
  return ITEMS[itemId].children ?? [];
}

function pathToCurrent(itemId: string): string[] {
  const item = ITEMS[itemId];
  if (item.current) {
    return [itemId];
  }
  for (const childId of childrenOf(itemId)) {
    const path = pathToCurrent(childId);
    if (path.length > 0) {
      return [itemId, ...path];
    }
  }
  return [];
}

function isFolderId(itemId: string) {
  const children = childrenOf(itemId);
  return children.length > 0;
}

const EXPANDED_ITEMS = pathToCurrent(ROOT_ID).filter(isFolderId);

function currentStateOf(item: Item) {
  if (item.current) {
    return 'page' as const;
  }
  return undefined;
}

function linkOf(item: Item) {
  if (!item.href) {
    return undefined;
  }
  return (
    <a
      href={item.href}
      data-current={item.current}
      aria-current={currentStateOf(item)}
    />
  );
}

export default function Tree12() {
  const tree = useTree<Item>({
    initialState: { expandedItems: EXPANDED_ITEMS },
    indent: INDENT,
    rootItemId: ROOT_ID,
    getItemName: nameOf,
    isItemFolder: hasChildren,
    dataLoader: { getItem: itemOf, getChildren: childrenOf },
    features: [syncDataLoaderFeature, hotkeysCoreFeature],
  });

  return (
    <div className='w-full'>
      <AnimatedSize>
        <Tree aria-label='Documentation' indent={INDENT} tree={tree}>
          {tree.getItems().map((item) => (
            <TreeItem
              key={item.getId()}
              item={item}
              render={linkOf(item.getItemData())}
            >
              <TreeItemLabel className={CURRENT_PAGE} />
            </TreeItem>
          ))}
        </Tree>
      </AnimatedSize>
    </div>
  );
}
