'use client';

import {
  CheckedState,
  checkboxesFeature,
  hotkeysCoreFeature,
  selectionFeature,
  syncDataLoaderFeature,
  type ItemInstance,
} from '@headless-tree/core';

import {
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
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

const INDENT_GUIDES = [
  'relative before:pointer-events-none before:absolute before:inset-y-0 before:-start-1 before:w-(--tree-padding)',
  'before:bg-[repeating-linear-gradient(to_right,transparent_0,transparent_calc(var(--tree-indent)-var(--hairline)),var(--border)_calc(var(--tree-indent)-var(--hairline)),var(--border)_var(--tree-indent))]',
].join(' ');

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

export default function Tree15() {
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
    canCheckFolders: true,
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
              <TreeItem
                item={item}
                className={cn(INDENT_GUIDES, 'flex-1 not-last:pb-0')}
              >
                <TreeItemLabel>
                  <span className='flex items-center gap-2'>
                    <ItemGlyph isFolder={item.isFolder()} />
                    {item.getItemName()}
                  </span>
                </TreeItemLabel>
              </TreeItem>
            </div>
          ))}
        </Tree>
      </AnimatedSize>
    </div>
  );
}
