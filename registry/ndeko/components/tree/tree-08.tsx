'use client';

import {
  expandAllFeature,
  hotkeysCoreFeature,
  searchFeature,
  selectionFeature,
  syncDataLoaderFeature,
  type ItemInstance,
  type TreeState,
} from '@headless-tree/core';
import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useRef, useState, type ChangeEvent } from 'react';

import {
  CircleXIcon,
  FilterIcon,
  FolderIcon,
  FolderOpenIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Input } from '@/registry/ndeko/ui/input';
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

const CLEAR_BUTTON =
  'text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-ring/25 absolute inset-y-0 end-1 my-auto flex size-6 items-center justify-center rounded-md outline-none transition-[color,background-color,box-shadow] focus-visible:ring-[3px]';

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const SWAP_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

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

function swapVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

function parentsOf(items: Record<string, Item>) {
  const parents: Record<string, string> = {};
  for (const [itemId, item] of Object.entries(items)) {
    for (const childId of item.children ?? []) {
      parents[childId] = itemId;
    }
  }
  return parents;
}

const PARENTS = parentsOf(ITEMS);

function ancestorsOf(itemId: string) {
  const ancestors: string[] = [];
  let parentId = PARENTS[itemId];
  while (parentId) {
    ancestors.push(parentId);
    parentId = PARENTS[parentId];
  }
  return ancestors;
}

function descendantsOf(itemId: string) {
  const descendants: string[] = [];
  for (const childId of childrenOf(itemId)) {
    descendants.push(childId);
    descendants.push(...descendantsOf(childId));
  }
  return descendants;
}

function matches(itemId: string, normalizedQuery: string) {
  const name = ITEMS[itemId].name.toLowerCase();
  return name.includes(normalizedQuery);
}

function visibleIdsFor(query: string) {
  const normalizedQuery = query.toLowerCase();
  const visibleIds = new Set<string>();
  for (const itemId of descendantsOf(ROOT_ID)) {
    if (!matches(itemId, normalizedQuery)) {
      continue;
    }
    const related = [itemId, ...ancestorsOf(itemId), ...descendantsOf(itemId)];
    related.forEach((relatedId) => visibleIds.add(relatedId));
  }
  return visibleIds;
}

export default function Tree08() {
  const [state, setState] = useState<Partial<TreeState<Item>>>({});
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const swapVariants = swapVariantsOf(shouldReduceMotion);
  const hasQuery = query.length > 0;
  const visibleIds = visibleIdsFor(query);
  const hasNoMatch = hasQuery && visibleIds.size === 0;

  const tree = useTree<Item>({
    state,
    setState,
    initialState: { expandedItems: EXPANDED_ITEMS },
    indent: INDENT,
    rootItemId: ROOT_ID,
    getItemName: nameOf,
    isItemFolder: hasChildren,
    dataLoader: { getItem: itemOf, getChildren: childrenOf },
    features: [
      syncDataLoaderFeature,
      hotkeysCoreFeature,
      selectionFeature,
      searchFeature,
      expandAllFeature,
    ],
  });

  function isShown(itemId: string) {
    if (!hasQuery) {
      return true;
    }
    return visibleIds.has(itemId);
  }

  function applyQuery(value: string) {
    setQuery(value);
    tree.setSearch(value);
    if (value.length > 0) {
      void tree.expandAll();
      return;
    }
    setState((current) => ({ ...current, expandedItems: EXPANDED_ITEMS }));
  }

  function changeQuery(event: ChangeEvent<HTMLInputElement>) {
    applyQuery(event.target.value);
  }

  function clearQuery() {
    applyQuery('');
    inputRef.current?.focus();
  }

  return (
    <div className='flex w-full flex-col gap-2'>
      <div className='relative'>
        <Input
          ref={inputRef}
          value={query}
          onChange={changeQuery}
          type='search'
          placeholder='Filter teams'
          aria-label='Filter teams'
          className='peer ps-8 pe-8'
        />
        <span className='text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex w-8 items-center justify-center peer-disabled:opacity-50'>
          <FilterIcon className='size-4' />
        </span>
        <AnimatePresence initial={false}>
          {hasQuery && (
            <motion.button
              key='clear'
              type='button'
              className={CLEAR_BUTTON}
              onClick={clearQuery}
              aria-label='Clear filter'
              variants={swapVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
            >
              <CircleXIcon className='size-4' />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <AnimatedSize>
        <Tree aria-label='Project files' indent={INDENT} tree={tree}>
          {tree.getItems().map((item) => (
            <TreeItem
              key={item.getId()}
              item={item}
              data-visible={isShown(item.getId())}
              className='data-[visible=false]:hidden'
            >
              <TreeItemLabel>
                <span className='flex items-center gap-2'>
                  {item.isFolder() && <FolderGlyph />}
                  {item.getItemName()}
                </span>
              </TreeItemLabel>
            </TreeItem>
          ))}
        </Tree>
        {hasNoMatch && (
          <p className='text-muted-foreground px-3 py-4 text-center text-[13px]'>
            No teams match &ldquo;{query}&rdquo;.
          </p>
        )}
      </AnimatedSize>
    </div>
  );
}
