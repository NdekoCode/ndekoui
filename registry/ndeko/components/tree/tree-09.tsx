'use client';

import {
  hotkeysCoreFeature,
  selectionFeature,
  syncDataLoaderFeature,
  type FeatureImplementation,
  type ItemInstance,
} from '@headless-tree/core';

import { FolderIcon, FolderOpenIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import {
  Tree,
  TreeItem,
  TreeItemLabel,
  useTree,
} from '@/registry/ndeko/ui/tree';

type Item = {
  name: string;
  children?: string[];
};

const ITEMS: Record<string, Item> = {
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

function itemOf(itemId: string) {
  return ITEMS[itemId];
}

function childrenOf(itemId: string) {
  return ITEMS[itemId].children ?? [];
}

function toggleExpanded(item: ItemInstance<Item>) {
  if (item.isExpanded()) {
    item.collapse();
    return;
  }
  item.expand();
}

const doubleClickExpandFeature: FeatureImplementation<Item> = {
  itemInstance: {
    getProps: ({ tree, item, prev }) => ({
      ...prev?.(),
      onDoubleClick: () => {
        item.primaryAction();
        if (!item.isFolder()) {
          return;
        }
        toggleExpanded(item);
      },
      onClick: (event: React.MouseEvent) => {
        const isToggleKey = event.ctrlKey || event.metaKey;
        if (event.shiftKey) {
          item.selectUpTo(isToggleKey);
        } else if (isToggleKey) {
          item.toggleSelect();
        } else {
          tree.setSelectedItems([item.getItemMeta().itemId]);
        }
        item.setFocused();
      },
    }),
  },
};

export default function Tree09() {
  const tree = useTree<Item>({
    initialState: {
      expandedItems: EXPANDED_ITEMS,
      selectedItems: ['components'],
    },
    indent: INDENT,
    rootItemId: ROOT_ID,
    getItemName: nameOf,
    isItemFolder: hasChildren,
    dataLoader: { getItem: itemOf, getChildren: childrenOf },
    features: [
      syncDataLoaderFeature,
      selectionFeature,
      hotkeysCoreFeature,
      doubleClickExpandFeature,
    ],
  });

  return (
    <div className='w-full'>
      <AnimatedSize>
        <Tree aria-label='Project files' indent={INDENT} tree={tree}>
          {tree.getItems().map((item) => (
            <TreeItem key={item.getId()} item={item}>
              <TreeItemLabel>
                <span className='flex items-center gap-2'>
                  {item.isFolder() && <FolderGlyph />}
                  {item.getItemName()}
                </span>
              </TreeItemLabel>
            </TreeItem>
          ))}
        </Tree>
      </AnimatedSize>
    </div>
  );
}
