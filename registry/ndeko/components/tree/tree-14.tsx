'use client';

import {
  CheckedState,
  checkboxesFeature,
  hotkeysCoreFeature,
  selectionFeature,
  syncDataLoaderFeature,
  type ItemInstance,
} from '@headless-tree/core';

import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Checkbox } from '@/registry/ndeko/ui/checkbox';
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

function ItemCheckbox({
  name,
  checkedState,
  onToggle,
}: {
  name: string;
  checkedState: CheckedState;
  onToggle: () => void;
}) {
  const isChecked = checkedState === CheckedState.Checked;
  const isIndeterminate = checkedState === CheckedState.Indeterminate;

  return (
    <Checkbox
      checked={isChecked}
      indeterminate={isIndeterminate}
      onCheckedChange={onToggle}
      aria-label={name}
    />
  );
}

export default function Tree14() {
  const tree = useTree<Item>({
    initialState: {
      expandedItems: EXPANDED_ITEMS,
      checkedItems: ['components', 'tokens'],
    },
    indent: INDENT,
    rootItemId: ROOT_ID,
    getItemName: nameOf,
    isItemFolder: hasChildren,
    dataLoader: { getItem: itemOf, getChildren: childrenOf },
    features: [
      syncDataLoaderFeature,
      selectionFeature,
      checkboxesFeature,
      hotkeysCoreFeature,
    ],
  });

  return (
    <div className='w-full'>
      <AnimatedSize>
        <Tree aria-label='Project files' indent={INDENT} tree={tree}>
          {tree.getItems().map((item) => (
            <div
              key={item.getId()}
              className='flex items-center gap-1.5 not-last:pb-0.5'
            >
              <ItemCheckbox
                name={item.getItemName()}
                checkedState={item.getCheckedState()}
                onToggle={() => void item.toggleCheckedState()}
              />
              <TreeItem item={item} className='flex-1 not-last:pb-0'>
                <TreeItemLabel />
              </TreeItem>
            </div>
          ))}
        </Tree>
      </AnimatedSize>
    </div>
  );
}
