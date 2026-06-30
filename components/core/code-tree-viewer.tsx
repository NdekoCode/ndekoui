'use client';

import {
  hotkeysCoreFeature,
  selectionFeature,
  syncDataLoaderFeature,
  type FeatureImplementation,
  type ItemInstance,
} from '@headless-tree/core';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { bundledLanguages, codeToHtml, type BundledTheme } from 'shiki';

import { cn } from '@/lib/utils';
import {
  FileIcon,
  FileTextIcon,
  FolderIcon,
  FolderOpenIcon,
} from '@/registry/ndeko/lib/icons';
import { CodeBlockCopyButton } from '@/registry/ndeko/ui/chat-code-block';
import {
  Tree,
  TreeItem,
  TreeItemLabel,
  useTree,
} from '@/registry/ndeko/ui/tree';

export type CodeTreeFile = {
  path: string;
  code: string;
  language?: string;
};

type TreeNode = {
  name: string;
  children?: string[];
};

const ROOT_ID = '__root__';

const INDENT = 16;

const PLAIN_LANGUAGE = 'text';

const THEMES = {
  light: 'github-light',
  dark: 'github-dark',
} satisfies Record<string, BundledTheme>;

const EXTENSION_LANGUAGES: Record<string, string> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'jsx',
  mjs: 'javascript',
  json: 'json',
  css: 'css',
  md: 'markdown',
  mdx: 'mdx',
  html: 'html',
  yml: 'yaml',
  yaml: 'yaml',
  sh: 'bash',
};

const PROSE_EXTENSIONS = new Set(['md', 'mdx', 'txt']);

const highlighted = new Map<string, Promise<string>>();

function extensionOf(path: string) {
  const segments = path.split('/');
  const name = segments.pop() ?? '';
  const dot = name.lastIndexOf('.');
  if (dot < 0) {
    return '';
  }
  const extension = name.slice(dot + 1);
  return extension.toLowerCase();
}

function languageOf(file: CodeTreeFile) {
  if (file.language) {
    return file.language;
  }
  const extension = extensionOf(file.path);
  return EXTENSION_LANGUAGES[extension] ?? extension;
}

function highlightableLanguageOf(language: string) {
  if (language in bundledLanguages) {
    return language;
  }
  return PLAIN_LANGUAGE;
}

function shikiLanguageOf(file: CodeTreeFile) {
  const language = languageOf(file);
  return highlightableLanguageOf(language);
}

function highlightKeyOf(file: CodeTreeFile) {
  const language = shikiLanguageOf(file);
  return `${language}\n${file.code}`;
}

function highlight(file: CodeTreeFile) {
  const key = highlightKeyOf(file);
  const cached = highlighted.get(key);
  if (cached) {
    return cached;
  }
  const lang = shikiLanguageOf(file);
  const pending = codeToHtml(file.code, {
    lang,
    themes: THEMES,
    defaultColor: false,
  });
  pending.catch(() => highlighted.delete(key));
  highlighted.set(key, pending);
  return pending;
}

function useHighlightedFiles(files: CodeTreeFile[]) {
  const [htmlByKey, setHtmlByKey] = useState<Record<string, string>>({});

  useEffect(() => {
    let isCurrent = true;

    function keep(key: string, html: string) {
      if (!isCurrent) {
        return;
      }
      setHtmlByKey((current) => ({ ...current, [key]: html }));
    }

    function keepPlainCode() {
      return null;
    }

    for (const file of files) {
      const key = highlightKeyOf(file);
      highlight(file)
        .then((html) => keep(key, html))
        .catch(keepPlainCode);
    }

    return () => {
      isCurrent = false;
    };
  }, [files]);

  return htmlByKey;
}

function folderChildren(nodes: Map<string, TreeNode>, id: string) {
  const node = nodes.get(id);
  if (!node?.children) {
    return null;
  }
  return node.children;
}

function addPath(nodes: Map<string, TreeNode>, path: string) {
  const segments = path.split('/');
  let parentId = ROOT_ID;
  const lastIndex = segments.length - 1;
  segments.forEach((segment, index) => {
    const idSegments = segments.slice(0, index + 1);
    const id = idSegments.join('/');
    const isFile = index === lastIndex;
    if (!nodes.has(id)) {
      const node: TreeNode = { name: segment };
      if (!isFile) {
        node.children = [];
      }
      nodes.set(id, node);
      const siblings = folderChildren(nodes, parentId);
      siblings?.push(id);
    }
    parentId = id;
  });
}

function isFolderNode(node: TreeNode | undefined) {
  return node?.children !== undefined;
}

function sortChildren(nodes: Map<string, TreeNode>) {
  function compare(first: string, second: string) {
    const firstNode = nodes.get(first);
    const secondNode = nodes.get(second);
    const firstIsFolder = isFolderNode(firstNode);
    const secondIsFolder = isFolderNode(secondNode);
    if (firstIsFolder === secondIsFolder) {
      return first.localeCompare(second);
    }
    if (firstIsFolder) {
      return -1;
    }
    return 1;
  }
  for (const node of nodes.values()) {
    node.children?.sort(compare);
  }
}

function buildNodes(files: CodeTreeFile[]) {
  const nodes = new Map<string, TreeNode>();
  nodes.set(ROOT_ID, { name: '', children: [] });
  for (const file of files) {
    addPath(nodes, file.path);
  }
  sortChildren(nodes);
  return nodes;
}

function folderIdsOf(nodes: Map<string, TreeNode>) {
  const ids: string[] = [];
  for (const [id, node] of nodes) {
    const isRealFolder = id !== ROOT_ID && isFolderNode(node);
    if (isRealFolder) {
      ids.push(id);
    }
  }
  return ids;
}

function toggleExpanded(item: ItemInstance<TreeNode>) {
  if (item.isExpanded()) {
    item.collapse();
    return;
  }
  item.expand();
}

const fileSelectionFeature: FeatureImplementation<TreeNode> = {
  itemInstance: {
    getProps: ({ tree, item, prev }) => ({
      ...prev?.(),
      onClick: () => {
        item.setFocused();
        if (item.isFolder()) {
          toggleExpanded(item);
          return;
        }
        tree.setSelectedItems([item.getId()]);
        item.primaryAction();
      },
    }),
  },
};

const GLYPH =
  'text-muted-foreground col-start-1 row-start-1 size-4 transition-[opacity,scale,filter] duration-150 ease-(--ease-out-strong)';

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

function FileGlyph({ path, className }: { path: string; className?: string }) {
  const isProse = PROSE_EXTENSIONS.has(extensionOf(path));
  if (isProse) {
    return (
      <FileTextIcon className={cn('text-muted-foreground size-4', className)} />
    );
  }
  return <FileIcon className={cn('text-muted-foreground size-4', className)} />;
}

function NodeGlyph({ item }: { item: ItemInstance<TreeNode> }) {
  if (item.isFolder()) {
    return <FolderGlyph />;
  }
  return <FileGlyph path={item.getId()} />;
}

const CODE_AREA = [
  'min-h-0 flex-1 overflow-auto font-mono text-[13px] leading-relaxed',
  '[&_pre]:min-w-max [&_pre]:bg-transparent [&_pre]:px-4 [&_pre]:py-3 [&_pre]:outline-none',
  '[&_.shiki]:text-(--shiki-light) [&_.shiki_span]:text-(--shiki-light)',
  'dark:[&_.shiki]:text-(--shiki-dark) dark:[&_.shiki_span]:text-(--shiki-dark)',
].join(' ');

const LINE_NUMBERS = [
  '[&_code]:[counter-reset:line]',
  '[&_.line]:before:inline-block [&_.line]:before:w-6 [&_.line]:before:me-4 [&_.line]:before:text-end',
  '[&_.line]:before:text-muted-foreground/60 [&_.line]:before:[counter-increment:line] [&_.line]:before:content-[counter(line)]',
].join(' ');

function PlainCode({ code }: { code: string }) {
  const lines = code.split('\n');
  return (
    <pre>
      <code>
        {lines.map((line, index) => (
          <Fragment key={index}>
            <span className='line'>{line}</span>
            {'\n'}
          </Fragment>
        ))}
      </code>
    </pre>
  );
}

function CodePanel({
  file,
  html,
  showLineNumbers,
}: {
  file: CodeTreeFile;
  html: string | undefined;
  showLineNumbers: boolean;
}) {
  const segments = file.path.split('/');
  const name = segments.pop() ?? file.path;
  const folder = segments.join('/');
  const areaClassName = cn(CODE_AREA, showLineNumbers && LINE_NUMBERS);

  return (
    <section
      aria-label={`Code of ${file.path}`}
      className='flex min-h-0 min-w-0 flex-1 flex-col'
    >
      <header className='flex items-center gap-2 py-1.5 ps-4 pe-1.5'>
        <FileGlyph path={file.path} className='size-3.5' />
        <span className='text-foreground truncate font-mono text-xs'>
          {name}
        </span>
        {folder && (
          <span className='text-muted-foreground hidden truncate font-mono text-xs sm:inline'>
            {folder}
          </span>
        )}
        <CodeBlockCopyButton code={file.code} className='ms-auto' />
      </header>
      {html && (
        <div
          className={areaClassName}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
      {!html && (
        <div className={areaClassName}>
          <PlainCode code={file.code} />
        </div>
      )}
    </section>
  );
}

function selectedFileOf(files: CodeTreeFile[], path: string | undefined) {
  const match = files.find((file) => file.path === path);
  return match ?? files[0];
}

function nameOf(item: ItemInstance<TreeNode>) {
  return item.getItemData().name;
}

function isFolderItem(item: ItemInstance<TreeNode>) {
  return isFolderNode(item.getItemData());
}

export type CodeTreeViewerProps = {
  files: CodeTreeFile[];
  defaultPath?: string;
  showLineNumbers?: boolean;
  className?: string;
  'aria-label'?: string;
};

export function CodeTreeViewer({
  files,
  defaultPath,
  showLineNumbers = true,
  className,
  'aria-label': ariaLabel = 'Files',
}: CodeTreeViewerProps) {
  const nodes = useMemo(() => buildNodes(files), [files]);
  const initialFile = selectedFileOf(files, defaultPath);
  const [selectedPath, setSelectedPath] = useState(initialFile?.path);
  const htmlByKey = useHighlightedFiles(files);
  const selectedFile = selectedFileOf(files, selectedPath);

  function showFile(item: ItemInstance<TreeNode>) {
    setSelectedPath(item.getId());
  }

  function nodeOf(id: string) {
    return nodes.get(id) ?? { name: id };
  }

  function childrenOf(id: string) {
    return nodes.get(id)?.children ?? [];
  }

  const tree = useTree<TreeNode>({
    rootItemId: ROOT_ID,
    initialState: {
      expandedItems: folderIdsOf(nodes),
      selectedItems: [initialFile?.path ?? ''],
      focusedItem: initialFile?.path ?? null,
    },
    indent: INDENT,
    getItemName: nameOf,
    isItemFolder: isFolderItem,
    onPrimaryAction: showFile,
    dataLoader: { getItem: nodeOf, getChildren: childrenOf },
    features: [
      syncDataLoaderFeature,
      selectionFeature,
      hotkeysCoreFeature,
      fileSelectionFeature,
    ],
  });

  if (!selectedFile) {
    return (
      <div
        className={cn(
          'bg-card text-muted-foreground hairline-ring ring-border grid h-40 place-items-center rounded-xl text-[13px]',
          className
        )}
      >
        No files to show
      </div>
    );
  }

  const selectedKey = highlightKeyOf(selectedFile);
  const html = htmlByKey[selectedKey];

  return (
    <div
      className={cn(
        'bg-card text-card-foreground hairline-ring ring-border flex h-[30rem] flex-col overflow-hidden rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)] md:h-96 md:flex-row',
        className
      )}
    >
      <div className='hairline-b border-border md:hairline-r max-h-40 shrink-0 overflow-auto p-1.5 md:max-h-none md:w-56 md:border-b-0'>
        <Tree aria-label={ariaLabel} indent={INDENT} tree={tree}>
          {tree.getItems().map((item) => (
            <TreeItem key={item.getId()} item={item}>
              <TreeItemLabel>
                <span className='flex min-w-0 items-center gap-2'>
                  <NodeGlyph item={item} />
                  <span className='truncate'>{item.getItemName()}</span>
                </span>
              </TreeItemLabel>
            </TreeItem>
          ))}
        </Tree>
      </div>
      <CodePanel
        file={selectedFile}
        html={html}
        showLineNumbers={showLineNumbers}
      />
    </div>
  );
}
