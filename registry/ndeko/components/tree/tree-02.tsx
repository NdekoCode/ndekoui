'use client';

import {
  hotkeysCoreFeature,
  syncDataLoaderFeature,
  type ItemInstance,
} from '@headless-tree/core';

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

const INDENT_GUIDES = [
  'relative before:pointer-events-none before:absolute before:inset-y-0 before:-start-1 before:w-(--tree-padding)',
  'before:bg-[repeating-linear-gradient(to_right,transparent_0,transparent_calc(var(--tree-indent)-var(--hairline)),var(--border)_calc(var(--tree-indent)-var(--hairline)),var(--border)_var(--tree-indent))]',
].join(' ');

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

export default function Tree02() {
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
        <Tree aria-label='Project files' indent={INDENT} tree={tree}>
          {tree.getItems().map((item) => (
            <TreeItem key={item.getId()} item={item} className={INDENT_GUIDES}>
              <TreeItemLabel />
            </TreeItem>
          ))}
        </Tree>
      </AnimatedSize>
    </div>
  );
}
