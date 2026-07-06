'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { countOf } from '@/registry/ndeko/lib/words';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { Segments } from '@/registry/ndeko/ui/segments';

import {
  ACCOUNTS,
  CONTACTS,
  contactOf,
  contactsOf,
  detailsOf,
  GRAPH_NODES,
} from './data';
import { createGraphEngine, type GraphEngine } from './graph-engine';
import { LAYOUT_OPTIONS, type LayoutId } from './graph-layouts';
import { GraphNodeButton } from './graph-node';
import { rovingTargetOf } from './roving';

function groupOf(id: string | null) {
  if (id === null) {
    return null;
  }
  const contact = contactOf(id);
  if (contact) {
    return new Set([contact.id, contact.accountId]);
  }
  const members = contactsOf(id).map((member) => member.id);
  return new Set([id, ...members]);
}

function isDimmedIn(group: Set<string> | null, id: string) {
  if (group === null) {
    return false;
  }
  return !group.has(id);
}

function tabIndexOf(id: string, owner: string): 0 | -1 {
  if (id === owner) {
    return 0;
  }
  return -1;
}

function detailsOfShown(id: string | null) {
  if (id === null) {
    return null;
  }
  return detailsOf(id);
}

type CaptionProps = {
  shownId: string | null;
};

function Caption({ shownId }: CaptionProps) {
  const details = detailsOfShown(shownId);

  return (
    <div className='flex min-h-11 items-center px-1'>
      {details && (
        <Swap swapKey={details.id} className='min-w-0'>
          <span className='flex min-w-0 flex-col leading-tight'>
            <span className='truncate text-[13px] font-medium'>
              {details.title}
            </span>
            <span className='text-muted-foreground truncate text-xs'>
              {details.meta}
            </span>
          </span>
        </Swap>
      )}
      {!details && (
        <p className='text-muted-foreground text-xs'>
          Select an account or a person to see who they work with
        </p>
      )}
    </div>
  );
}

type AccountGraphProps = {
  layout: LayoutId;
  selectedId: string | null;
  pressed: string | null;
  isActive: boolean;
  onLayoutChange: (layout: LayoutId) => void;
  onSelect: (id: string) => void;
  onClear: () => void;
};

export function AccountGraph({
  layout,
  selectedId,
  pressed,
  isActive,
  onLayoutChange,
  onSelect,
  onClear,
}: AccountGraphProps) {
  const titleId = useId();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GraphEngine | null>(null);
  const layoutRef = useRef(layout);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const isLive = isActive && !shouldReduceMotion;
  const group = groupOf(selectedId);
  const owner = focusId ?? selectedId ?? GRAPH_NODES[0].id;
  const shownId = previewId ?? selectedId;

  useEffect(() => {
    layoutRef.current = layout;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const plane = planeRef.current;
    if (!canvas || !plane) {
      return;
    }
    const engine = createGraphEngine(canvas, plane, layoutRef.current);
    engineRef.current = engine;
    return () => {
      engine?.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setLive(isLive);
  }, [isLive]);

  useEffect(() => {
    engineRef.current?.setLayout(layout, true);
  }, [layout]);

  useEffect(() => {
    engineRef.current?.setHighlight(selectedId, previewId);
  }, [selectedId, previewId]);

  function focusNode(id: string) {
    const selector = `[data-node="${id}"]`;
    const element = planeRef.current?.querySelector<HTMLElement>(selector);
    element?.focus();
  }

  function walk(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && selectedId !== null) {
      onClear();
      return;
    }
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const currentId = target.dataset.node;
    if (currentId === undefined) {
      return;
    }
    const current = GRAPH_NODES.findIndex((node) => node.id === currentId);
    const next = rovingTargetOf(event.key, current, GRAPH_NODES.length);
    if (next === null || next === current) {
      return;
    }
    event.preventDefault();
    focusNode(GRAPH_NODES[next].id);
  }

  return (
    <section
      data-section='accounts'
      aria-labelledby={titleId}
      className='bg-card hairline-ring ring-border dark:bg-foreground/[0.03] flex scroll-mt-4 flex-col gap-3 rounded-xl p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <header className='flex flex-wrap items-center gap-x-3 gap-y-2'>
        <div className='flex min-w-40 flex-1 flex-col leading-tight'>
          <h2 id={titleId} className='text-sm font-medium'>
            Accounts and contacts
          </h2>
          <p className='text-muted-foreground text-xs'>
            {countOf(ACCOUNTS.length, 'account')} and{' '}
            {countOf(CONTACTS.length, 'contact')}
          </p>
        </div>
        <Segments
          value={layout}
          segments={LAYOUT_OPTIONS}
          onValueChange={onLayoutChange}
          label='Layout of the map'
          className='w-full @lg/page:w-auto'
          itemClassName='px-2'
        />
      </header>
      <div className='bg-foreground/[0.03] relative h-72 overflow-hidden rounded-lg @lg/page:h-80'>
        <canvas
          ref={canvasRef}
          aria-hidden='true'
          className='text-foreground pointer-events-none absolute inset-0 size-full'
        />
        <div
          ref={planeRef}
          role='group'
          aria-label='Accounts and contacts. The arrow keys move between them'
          onKeyDown={walk}
          className='absolute inset-0'
        >
          {GRAPH_NODES.map((node) => (
            <GraphNodeButton
              key={node.id}
              node={node}
              isSelected={node.id === selectedId}
              isDimmed={isDimmedIn(group, node.id)}
              isPressed={pressed === `node-${node.id}`}
              tabIndex={tabIndexOf(node.id, owner)}
              onSelect={onSelect}
              onPreview={setPreviewId}
              onFocusNode={setFocusId}
            />
          ))}
        </div>
      </div>
      <Caption shownId={shownId} />
    </section>
  );
}
