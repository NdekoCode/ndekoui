'use client';

import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { CompanyMark } from '@/registry/ndeko/ui/company-mark';

import {
  accountOf,
  contactOf,
  spokenNodeOf,
  type GraphNode,
  type NodeKind,
} from './data';

/** The engine reveals a node once it knows where the node stands, so none is ever seen at the corner. */
const HIDDEN: React.CSSProperties = { visibility: 'hidden' };

const NODE =
  'absolute top-0 left-0 grid cursor-pointer place-items-center outline-none transition-[opacity,box-shadow,scale,background-color] duration-150 ease-(--ease-out-strong) hover:bg-foreground/[0.05] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card active:scale-[0.94]';

const SHAPE: Record<NodeKind, string> = {
  account: 'size-9 rounded-lg',
  contact: 'size-8 rounded-full',
};

const SELECTED_RING = 'ring-2 ring-primary ring-offset-2 ring-offset-card';

function selectedClassOf(isSelected: boolean) {
  if (isSelected) {
    return SELECTED_RING;
  }
  return undefined;
}

function dimmedClassOf(isDimmed: boolean) {
  if (isDimmed) {
    return 'opacity-40';
  }
  return undefined;
}

function Face({ node }: { node: GraphNode }) {
  if (node.kind === 'account') {
    const account = accountOf(node.id);
    return <CompanyMark seed={account.name} size='lg' />;
  }
  const contact = contactOf(node.id);
  const name = contact?.name ?? node.id;
  return <Avatar className='size-6' seed={name} />;
}

type GraphNodeButtonProps = {
  node: GraphNode;
  isSelected: boolean;
  isDimmed: boolean;
  isPressed: boolean;
  tabIndex: 0 | -1;
  onSelect: (id: string) => void;
  onPreview: (id: string | null) => void;
  onFocusNode: (id: string) => void;
};

export function GraphNodeButton({
  node,
  isSelected,
  isDimmed,
  isPressed,
  tabIndex,
  onSelect,
  onPreview,
  onFocusNode,
}: GraphNodeButtonProps) {
  const { id } = node;

  function select() {
    onSelect(id);
  }

  function preview() {
    onPreview(id);
  }

  function endPreview() {
    onPreview(null);
  }

  function focusNode() {
    onFocusNode(id);
    onPreview(id);
  }

  return (
    <button
      type='button'
      data-node={id}
      aria-label={spokenNodeOf(id)}
      aria-pressed={isSelected}
      tabIndex={tabIndex}
      style={HIDDEN}
      onClick={select}
      onPointerEnter={preview}
      onPointerLeave={endPreview}
      onFocus={focusNode}
      onBlur={endPreview}
      className={cn(
        NODE,
        SHAPE[node.kind],
        selectedClassOf(isSelected),
        dimmedClassOf(isDimmed),
        pressedQuietOf(isPressed)
      )}
    >
      <Face node={node} />
    </button>
  );
}
