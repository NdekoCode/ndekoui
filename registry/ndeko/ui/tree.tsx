'use client';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import type { ItemInstance, TreeInstance } from '@headless-tree/core';
import { createContext, useContext } from 'react';

import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

type TreeContextValue = {
  indent: number;
  currentItem?: ItemInstance<unknown>;
  tree?: TreeInstance<unknown>;
};

const TreeContext = createContext<TreeContextValue>({ indent: 20 });

function useTreeContext() {
  return useContext(TreeContext);
}

type TreeProps<T> = React.ComponentProps<'div'> & {
  indent?: number;
  tree?: TreeInstance<T>;
};

function containerPropsOf<T>(
  tree: TreeInstance<T> | undefined,
  label: string | undefined
) {
  const hasContainerProps = typeof tree?.getContainerProps === 'function';
  if (!tree || !hasContainerProps) {
    return {};
  }
  return tree.getContainerProps(label);
}

function Tree<T>({
  indent = 20,
  tree,
  className,
  style,
  'aria-label': label,
  ...props
}: TreeProps<T>) {
  const containerProps = containerPropsOf(tree, label);
  const treeStyle = {
    ...style,
    '--tree-indent': `${indent}px`,
  } as React.CSSProperties;
  const ownProps = {
    'data-slot': 'tree',
    'aria-label': label,
    style: treeStyle,
    className: cn('flex flex-col', className),
  };
  const contextTree = tree as TreeInstance<unknown> | undefined;

  return (
    <TreeContext.Provider value={{ indent, tree: contextTree }}>
      <div {...mergeProps<'div'>(ownProps, props, containerProps)} />
    </TreeContext.Provider>
  );
}

function stateOf(check: (() => boolean) | undefined) {
  if (typeof check !== 'function') {
    return undefined;
  }
  return check() || false;
}

type TreeItemProps<T> = useRender.ComponentProps<'button'> & {
  item: ItemInstance<T>;
};

function TreeItem<T>({
  item,
  className,
  render,
  style,
  children,
  ...props
}: TreeItemProps<T>) {
  const { indent } = useTreeContext();
  const itemProps = item.getProps();
  const level = item.getItemMeta().level;
  const itemStyle = {
    ...style,
    '--tree-padding': `${level * indent}px`,
  } as React.CSSProperties;
  const contextItem = item as ItemInstance<unknown>;

  const defaultProps = {
    'data-slot': 'tree-item',
    style: itemStyle,
    'data-focus': stateOf(item.isFocused),
    'data-folder': stateOf(item.isFolder),
    'data-selected': stateOf(item.isSelected),
    'data-drag-target': stateOf(item.isDragTarget),
    'data-search-match': stateOf(item.isMatchingSearch),
    'aria-expanded': item.isExpanded(),
    className: cn(
      'z-10 ps-(--tree-padding) outline-none select-none not-last:pb-0.5 focus:z-20 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    ),
    children,
  };

  const element = useRender({
    defaultTagName: 'button',
    render,
    props: mergeProps<'button'>(defaultProps, props, itemProps),
  });

  return (
    <TreeContext.Provider value={{ indent, currentItem: contextItem }}>
      {element}
    </TreeContext.Provider>
  );
}

type TreeItemLabelProps<T> = React.ComponentProps<'span'> & {
  item?: ItemInstance<T>;
};

const LABEL = [
  'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] transition-colors not-in-data-[folder=true]:ps-7.5',
  'hover:bg-foreground/5 in-data-[selected=true]:bg-primary/[0.08] in-data-[selected=true]:text-foreground',
  'in-data-[drag-target=true]:bg-primary/10 in-data-[search-match=true]:bg-warning/15',
  'in-focus-visible:ring-[3px] in-focus-visible:ring-ring/25',
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
].join(' ');

function TreeItemLabel<T>({
  item: itemProp,
  children,
  className,
  ...props
}: TreeItemLabelProps<T>) {
  const { currentItem } = useTreeContext();
  const item = itemProp ?? currentItem;
  if (!item) {
    return null;
  }
  const isFolder = item.isFolder();
  const label = children ?? item.getItemName();

  return (
    <span
      data-slot='tree-item-label'
      className={cn(LABEL, className)}
      {...props}
    >
      {isFolder && (
        <ChevronDownIcon className='text-muted-foreground size-4 transition-transform duration-200 ease-(--ease-out-strong) in-aria-[expanded=false]:-rotate-90' />
      )}
      {label}
    </span>
  );
}

function TreeDragLine({ className, ...props }: React.ComponentProps<'div'>) {
  const { tree } = useTreeContext();
  const hasDragLine = typeof tree?.getDragLineStyle === 'function';
  if (!tree || !hasDragLine) {
    return null;
  }

  return (
    <div
      style={tree.getDragLineStyle()}
      className={cn(
        'bg-primary before:border-primary before:bg-background absolute z-30 -mt-px h-0.5 w-[unset] before:absolute before:-top-[3px] before:left-0 before:size-2 before:rounded-full before:border-2',
        className
      )}
      {...props}
    />
  );
}

export { Tree, TreeDragLine, TreeItem, TreeItemLabel };
