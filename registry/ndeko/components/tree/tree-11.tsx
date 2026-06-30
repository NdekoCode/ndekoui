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

import {
  CodeIcon,
  FileIcon,
  FileTextIcon,
  ImageIcon,
  ReactBrandIcon,
  SourceCodeIcon,
} from '@/registry/ndeko/lib/icons';
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
  fileExtension?: string;
};

const INITIAL_ITEMS: Record<string, Item> = {
  app: {
    name: 'app',
    children: ['app/layout.tsx', 'app/page.tsx', 'app/(dashboard)', 'app/api'],
  },
  'app/layout.tsx': { name: 'layout.tsx', fileExtension: 'tsx' },
  'app/page.tsx': { name: 'page.tsx', fileExtension: 'tsx' },
  'app/(dashboard)': {
    name: '(dashboard)',
    children: ['app/(dashboard)/dashboard'],
  },
  'app/(dashboard)/dashboard': {
    name: 'dashboard',
    children: ['app/(dashboard)/dashboard/page.tsx'],
  },
  'app/(dashboard)/dashboard/page.tsx': {
    name: 'page.tsx',
    fileExtension: 'tsx',
  },
  'app/api': { name: 'api', children: ['app/api/hello'] },
  'app/api/hello': { name: 'hello', children: ['app/api/hello/route.ts'] },
  'app/api/hello/route.ts': { name: 'route.ts', fileExtension: 'ts' },
  components: {
    name: 'components',
    children: ['components/button.tsx', 'components/card.tsx'],
  },
  'components/button.tsx': { name: 'button.tsx', fileExtension: 'tsx' },
  'components/card.tsx': { name: 'card.tsx', fileExtension: 'tsx' },
  lib: { name: 'lib', children: ['lib/utils.ts'] },
  'lib/utils.ts': { name: 'utils.ts', fileExtension: 'ts' },
  public: {
    name: 'public',
    children: ['public/favicon.ico', 'public/logo.svg'],
  },
  'public/favicon.ico': { name: 'favicon.ico', fileExtension: 'ico' },
  'public/logo.svg': { name: 'logo.svg', fileExtension: 'svg' },
  'package.json': { name: 'package.json', fileExtension: 'json' },
  'tailwind.config.ts': { name: 'tailwind.config.ts', fileExtension: 'ts' },
  'tsconfig.json': { name: 'tsconfig.json', fileExtension: 'json' },
  'next.config.mjs': { name: 'next.config.mjs', fileExtension: 'mjs' },
  'README.md': { name: 'README.md', fileExtension: 'md' },
  root: {
    name: 'Project root',
    children: [
      'app',
      'components',
      'lib',
      'public',
      'package.json',
      'tailwind.config.ts',
      'tsconfig.json',
      'next.config.mjs',
      'README.md',
    ],
  },
};

const INDENT = 20;
const ROOT_ID = 'root';
const EXPANDED_ITEMS = ['app', 'app/(dashboard)', 'app/(dashboard)/dashboard'];

const TREE_INDENT_STYLE = {
  '--tree-indent': `${INDENT}px`,
} as React.CSSProperties;

const FILE_GLYPH = 'text-muted-foreground size-4';

const FILE_GLYPHS: Record<string, React.ReactNode> = {
  tsx: <ReactBrandIcon className={FILE_GLYPH} />,
  jsx: <ReactBrandIcon className={FILE_GLYPH} />,
  ts: <SourceCodeIcon className={FILE_GLYPH} />,
  js: <SourceCodeIcon className={FILE_GLYPH} />,
  mjs: <SourceCodeIcon className={FILE_GLYPH} />,
  json: <CodeIcon className={FILE_GLYPH} />,
  svg: <ImageIcon className={FILE_GLYPH} />,
  ico: <ImageIcon className={FILE_GLYPH} />,
  png: <ImageIcon className={FILE_GLYPH} />,
  jpg: <ImageIcon className={FILE_GLYPH} />,
  md: <FileTextIcon className={FILE_GLYPH} />,
};

const DEFAULT_FILE_GLYPH = <FileIcon className={FILE_GLYPH} />;

const INDENT_GUIDES = [
  'relative before:pointer-events-none before:absolute before:inset-y-0 before:-start-1 before:w-(--tree-padding)',
  'before:bg-[repeating-linear-gradient(to_right,transparent_0,transparent_calc(var(--tree-indent)-var(--hairline)),var(--border)_calc(var(--tree-indent)-var(--hairline)),var(--border)_var(--tree-indent))]',
].join(' ');

const TRAVEL: Transition = { duration: 0.25, ease: [0.77, 0, 0.175, 1] };

const INSTANT: Transition = { duration: 0 };

function travelOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return TRAVEL;
}

function nameOf(item: ItemInstance<Item>) {
  return item.getItemData().name;
}

function isFolderEntry(entry: Item) {
  const children = entry.children ?? [];
  return children.length > 0;
}

function hasChildren(item: ItemInstance<Item>) {
  return isFolderEntry(item.getItemData());
}

function folderFirstOrder(items: Record<string, Item>) {
  return function compare(firstId: string, secondId: string) {
    const first = items[firstId];
    const second = items[secondId];
    const isFirstFolder = isFolderEntry(first);
    const isSecondFolder = isFolderEntry(second);
    if (isFirstFolder && !isSecondFolder) {
      return -1;
    }
    if (!isFirstFolder && isSecondFolder) {
      return 1;
    }
    return first.name.localeCompare(second.name);
  };
}

function fileGlyphOf(extension: string | undefined) {
  if (!extension) {
    return DEFAULT_FILE_GLYPH;
  }
  return FILE_GLYPHS[extension] ?? DEFAULT_FILE_GLYPH;
}

export default function Tree11() {
  const [items, setItems] = useState(INITIAL_ITEMS);
  const shouldReduceMotion = useReducedMotion();
  const travel = travelOf(shouldReduceMotion);

  function replaceChildren(parent: ItemInstance<Item>, childIds: string[]) {
    const parentId = parent.getId();
    setItems((current) => {
      const sortedChildIds = [...childIds];
      sortedChildIds.sort(folderFirstOrder(current));
      const updatedParent = { ...current[parentId], children: sortedChildIds };
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
    canReorder: false,
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
    <div className='w-full' style={TREE_INDENT_STYLE}>
      <AnimatedSize>
        <Tree aria-label='Project files' indent={INDENT} tree={tree}>
          <AssistiveTreeDescription tree={tree} />
          {tree.getItems().map((item) => (
            <TreeItem
              key={item.getId()}
              item={item}
              className={cn(INDENT_GUIDES, 'pb-0!')}
              render={<motion.button layout='position' transition={travel} />}
            >
              <TreeItemLabel className='rounded-none py-1 leading-5'>
                <span className='flex items-center gap-2'>
                  {!item.isFolder() &&
                    fileGlyphOf(item.getItemData().fileExtension)}
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
