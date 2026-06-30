'use client';

import {
  expandAllFeature,
  hotkeysCoreFeature,
  selectionFeature,
  syncDataLoaderFeature,
  type ItemInstance,
} from '@headless-tree/core';

import {
  FolderIcon,
  FolderOpenIcon,
  ListCollapseIcon,
  ListTreeIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
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

const COUNT =
  'keycap-3d text-muted-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] px-1 text-[11px] font-medium tabular-nums';

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

export default function Tree10() {
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
      expandAllFeature,
    ],
  });

  function expandAll() {
    void tree.expandAll();
  }

  function collapseAll() {
    tree.collapseAll();
  }

  return (
    <div className='flex w-full flex-col gap-2'>
      <div className='flex items-center gap-2'>
        <Button size='sm' variant='outline' onClick={expandAll}>
          <ListTreeIcon className='-ms-1 opacity-60' />
          Expand all
        </Button>
        <Button size='sm' variant='outline' onClick={collapseAll}>
          <ListCollapseIcon className='-ms-1 opacity-60' />
          Collapse all
        </Button>
      </div>
      <AnimatedSize>
        <Tree aria-label='Project files' indent={INDENT} tree={tree}>
          {tree.getItems().map((item) => (
            <TreeItem key={item.getId()} item={item}>
              <TreeItemLabel>
                <span className='flex items-center gap-2'>
                  {item.isFolder() && <FolderGlyph />}
                  {item.getItemName()}
                  {item.isFolder() && (
                    <span className={COUNT}>{item.getChildren().length}</span>
                  )}
                </span>
              </TreeItemLabel>
            </TreeItem>
          ))}
        </Tree>
      </AnimatedSize>
    </div>
  );
}
