'use client';

import { AnimatePresence, motion, type Transition } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { BlocksIcon, SearchIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';
import { Tabs, TabsList, TabsTab } from '@/registry/ndeko/ui/tabs';

import {
  CATEGORIES,
  INITIALLY_CONNECTED,
  INTEGRATIONS,
  PAGE,
  VIEWS,
  nameOf,
  type Integration,
  type ViewId,
} from './data';
import { IntegrationCard, type ConnectState } from './integration-card';

const CONNECTING_MS = 900;

const EASE_OUT_STRONG: [number, number, number, number] = [0.23, 1, 0.32, 1];

const CARD_TRANSITION: Transition = { duration: 0.2, ease: EASE_OUT_STRONG };

const CARD_EXIT: Transition = { duration: 0.12, ease: EASE_OUT_STRONG };

const CARD_LAYOUT: Transition = { type: 'spring', bounce: 0, duration: 0.3 };

type ConnectStates = Record<string, ConnectState>;

function initialStatesOf(): ConnectStates {
  const states: ConnectStates = {};
  for (const integration of INTEGRATIONS) {
    const isConnected = INITIALLY_CONNECTED.includes(integration.id);
    if (isConnected) {
      states[integration.id] = 'connected';
    } else {
      states[integration.id] = 'idle';
    }
  }
  return states;
}

function isViewId(value: unknown): value is ViewId {
  return VIEWS.some((view) => view.id === value);
}

function matchesQuery(integration: Integration, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  const category = CATEGORIES[integration.category].label;
  const name = nameOf(integration);
  const haystack = `${name} ${integration.description} ${category}`;
  const lowered = haystack.toLowerCase();
  return lowered.includes(needle);
}

function matchesView(
  integration: Integration,
  view: ViewId,
  states: ConnectStates
) {
  if (view === 'all') {
    return true;
  }
  if (view === 'connected') {
    return states[integration.id] === 'connected';
  }
  return integration.category === view;
}

function connectedCountOf(states: ConnectStates) {
  const values = Object.values(states);
  const connected = values.filter((state) => state === 'connected');
  return connected.length;
}

function connectedNounOf(count: number) {
  if (count === 1) {
    return 'tool connected';
  }
  return 'tools connected';
}

function outcomeOf(integration: Integration, attempts: number): ConnectState {
  const isFirstAttempt = attempts === 0;
  const needsApproval = Boolean(integration.needsApproval);
  const isBlocked = needsApproval && isFirstAttempt;
  if (isBlocked) {
    return 'failed';
  }
  return 'connected';
}

function searchHintOf(view: ViewId) {
  if (view === 'all') {
    return 'Try the name of a tool or a word from what it does';
  }
  if (view === 'connected') {
    return 'Only connected tools are searched here, clear the search or open All';
  }
  const label = CATEGORIES[view].label;
  return `Only ${label} tools are searched here, clear the search or open All`;
}

type EmptyViewProps = {
  view: ViewId;
  query: string;
  onClearSearch: () => void;
  onBrowseAll: () => void;
};

function EmptyView({
  view,
  query,
  onClearSearch,
  onBrowseAll,
}: EmptyViewProps) {
  const trimmed = query.trim();
  const hasQuery = trimmed.length > 0;
  const isConnectedView = view === 'connected';

  if (!hasQuery && isConnectedView) {
    return (
      <div className='flex flex-col items-center px-6 py-12 text-center'>
        <span className='keycap-3d text-muted-foreground flex size-9 items-center justify-center rounded-lg'>
          <BlocksIcon />
        </span>
        <p className='mt-4 text-sm font-medium'>Nothing connected yet</p>
        <p className='text-muted-foreground mt-1 max-w-sm text-[13px] text-balance'>
          Connect a tool from the full list and it shows up here
        </p>
        <Button variant='outline' onClick={onBrowseAll} className='mt-4'>
          Browse all
        </Button>
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center px-6 py-12 text-center'>
      <span className='keycap-3d text-muted-foreground flex size-9 items-center justify-center rounded-lg'>
        <SearchIcon />
      </span>
      <p className='mt-4 text-sm font-medium'>
        No integration matches “{trimmed}”
      </p>
      <p className='text-muted-foreground mt-1 max-w-sm text-[13px] text-balance'>
        {searchHintOf(view)}
      </p>
      <Button variant='outline' onClick={onClearSearch} className='mt-4'>
        <XIcon />
        Clear search
      </Button>
    </div>
  );
}

export default function Integrations01() {
  const [states, setStates] = useState<ConnectStates>(initialStatesOf);
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [view, setView] = useState<ViewId>('all');
  const [query, setQuery] = useState('');
  const timersRef = useRef(new Map<string, number>());
  const shouldReduceMotion = usePrefersReducedMotion();
  const allowsLayout = !shouldReduceMotion;
  const connectedCount = connectedCountOf(states);
  const visible = INTEGRATIONS.filter(
    (integration) =>
      matchesView(integration, view, states) && matchesQuery(integration, query)
  );
  const isEmpty = visible.length === 0;
  const hasQuery = query.length > 0;

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  function setStateOf(id: string, state: ConnectState) {
    setStates((current) => ({ ...current, [id]: state }));
  }

  function finishConnecting(integration: Integration) {
    const attemptCount = attempts[integration.id] ?? 0;
    const outcome = outcomeOf(integration, attemptCount);
    setStateOf(integration.id, outcome);
    setAttempts((current) => ({
      ...current,
      [integration.id]: attemptCount + 1,
    }));
    timersRef.current.delete(integration.id);
  }

  function connect(integration: Integration) {
    setStateOf(integration.id, 'connecting');
    const timer = window.setTimeout(
      () => finishConnecting(integration),
      CONNECTING_MS
    );
    timersRef.current.set(integration.id, timer);
  }

  function disconnect(integration: Integration) {
    setStateOf(integration.id, 'idle');
  }

  function pickView(value: unknown) {
    if (isViewId(value)) {
      setView(value);
    }
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      setQuery('');
    }
  }

  return (
    <div className='bg-background text-foreground min-h-dvh w-full'>
      <div className='mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6 md:px-6 md:py-10'>
        <header className='flex flex-wrap items-end justify-between gap-x-6 gap-y-2'>
          <div className='flex max-w-xl flex-col gap-1'>
            <h1 className='text-lg font-semibold text-balance'>{PAGE.title}</h1>
            <p className='text-muted-foreground text-[13px] text-pretty'>
              {PAGE.description}
            </p>
          </div>
          <p className='text-muted-foreground text-[13px]'>
            <MotionNumber
              value={connectedCount}
              className='text-foreground font-medium'
            />{' '}
            {connectedNounOf(connectedCount)}
          </p>
        </header>
        <div className='flex flex-col gap-3 lg:flex-row lg:items-center'>
          <div className='-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0'>
            <Tabs value={view} onValueChange={pickView}>
              <TabsList variant='segmented' aria-label='Show integrations'>
                {VIEWS.map((option) => (
                  <TabsTab key={option.id} value={option.id}>
                    {option.label}
                    {option.id === 'connected' && (
                      <span className='bg-foreground/[0.06] text-muted-foreground inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[11px]'>
                        <MotionNumber value={connectedCount} />
                      </span>
                    )}
                  </TabsTab>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <div className='relative min-w-0 lg:ms-auto lg:w-64'>
            <SearchIcon className='text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2' />
            <Input
              type='search'
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder='Search integrations'
              aria-label='Search integrations'
              className='ps-8 pe-9'
            />
            {hasQuery && (
              <button
                type='button'
                onClick={() => setQuery('')}
                aria-label='Clear search'
                className='text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-ring/25 absolute end-1.5 top-1/2 inline-flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-[3px]'
              >
                <XIcon className='size-3.5' />
              </button>
            )}
          </div>
        </div>
        <AnimatedSize>
          <ul className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            <AnimatePresence mode='popLayout' initial={false}>
              {visible.map((integration) => (
                <motion.li
                  key={integration.id}
                  layout={allowsLayout && 'position'}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    transition: CARD_TRANSITION,
                  }}
                  exit={{ opacity: 0, scale: 0.98, transition: CARD_EXIT }}
                  transition={{ layout: CARD_LAYOUT }}
                >
                  <IntegrationCard
                    integration={integration}
                    state={states[integration.id]}
                    onConnect={() => connect(integration)}
                    onDisconnect={() => disconnect(integration)}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <AnimatePresence initial={false}>
            {isEmpty && (
              <motion.div
                key='empty'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: CARD_TRANSITION }}
                exit={{ opacity: 0, transition: CARD_EXIT }}
              >
                <EmptyView
                  view={view}
                  query={query}
                  onClearSearch={() => setQuery('')}
                  onBrowseAll={() => setView('all')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </AnimatedSize>
      </div>
    </div>
  );
}
