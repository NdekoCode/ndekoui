'use client';

import { AnimatePresence, motion, useInView } from 'motion/react';
import { useId, useRef, useState } from 'react';

import {
  useRunScript,
  type RunScriptStep,
} from '@/registry/ndeko/hooks/use-agent-run';
import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  emptyRun,
  pendingApprovalsOf,
  seriesColorOf,
  type RunEvent,
  type RunSnapshot,
  type ToolCall,
} from '@/registry/ndeko/lib/agent-run';
import {
  CircleCheckIcon,
  GlobeIcon,
  HandIcon,
  LockIcon,
  MousePointerClickIcon,
  MousePointerIcon,
  PauseIcon,
  PlayIcon,
  TriangleAlertIcon,
  TypeIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { formatClock, spokenClockOf } from '@/registry/ndeko/lib/media-clock';
import {
  EASE_OUT_STRONG,
  risePresenceOf,
} from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { CallStatusMark } from '@/registry/ndeko/ui/call-status';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { Chip } from '@/registry/ndeko/ui/chip';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { LetterTile } from '@/registry/ndeko/ui/letter-tile';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { Slider } from '@/registry/ndeko/ui/slider';

export type Screen =
  'search' | 'results' | 'details' | 'checkout' | 'confirmed';

export type Page = {
  screen: Screen;
  destination: string;
  dates: string;
};

export type ActionKind = 'navigate' | 'click' | 'type';

export type BrowserAction = {
  id: string;
  kind: ActionKind;
  label: string;
  /** The element the pointer goes to; the address bar when it only loads a page. */
  target: string;
  pageAfter: Page;
  isRisky?: boolean;
};

const AGENT_NAME = 'Researcher';

const AGENT_SERIES = 2;

const KIND_ICON: Record<ActionKind, Icon> = {
  navigate: GlobeIcon,
  click: MousePointerClickIcon,
  type: TypeIcon,
};

const ADDRESS: Record<Screen, string> = {
  search: 'lakeline-stays.example/search',
  results: 'lakeline-stays.example/lisbon',
  details: 'lakeline-stays.example/stay/casa-alfama',
  checkout: 'lakeline-stays.example/checkout',
  confirmed: 'lakeline-stays.example/booked',
};

const BLANK_PAGE: Page = { screen: 'search', destination: '', dates: '' };

const SCREEN_TARGETS: Record<Screen, string[]> = {
  search: ['search-title', 'destination', 'dates', 'search'],
  results: ['results-title', 'alfama', 'tejo', 'miradouro'],
  details: ['details-title', 'book'],
  checkout: ['checkout-title', 'pay'],
  confirmed: ['confirmed-title', 'reference'],
};

/** Once a click has opened the next page, its element is gone: the pointer rests on the new page's title. */
function pointerTargetOf(action: BrowserAction | undefined, page: Page) {
  const targets = SCREEN_TARGETS[page.screen];
  const target = action?.target ?? 'address';
  const isAddress = target === 'address';
  const isOnPage = targets.includes(target);
  const isPresent = isAddress || isOnPage;
  if (isPresent) {
    return target;
  }
  return targets[0];
}

type FrameContextValue = {
  pointerTarget: string | null;
  pointerId: string;
  rippleTarget: string | null;
  rippleKey: string;
  isPointerShown: boolean;
  riskyTarget: string | null;
};

function NamedPointer({
  pointerId,
  isShown,
}: {
  pointerId: string;
  isShown: boolean;
}) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const color = seriesColorOf(AGENT_SERIES);
  const pointerStyle = { color } as React.CSSProperties;

  return (
    <motion.span
      layoutId={pointerId}
      aria-hidden='true'
      className='pointer-events-none absolute top-1/2 left-1/2 z-20 flex items-start gap-0.5'
      initial={false}
      animate={{ opacity: pointerOpacityOf(isShown) }}
      transition={pointerTransitionOf(shouldReduceMotion)}
    >
      <MousePointerIcon
        className='size-4 drop-shadow-[0_1px_1px_rgb(0_0_0/0.25)]'
        strokeWidth={2.25}
        style={pointerStyle}
      />
      <Chip color={color} className='mt-3 h-4 px-1 text-[10px]'>
        {AGENT_NAME}
      </Chip>
    </motion.span>
  );
}

function pointerOpacityOf(isShown: boolean) {
  if (isShown) {
    return 1;
  }
  return 0;
}

function pointerTransitionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return { duration: 0 };
  }
  return {
    layout: { type: 'spring' as const, bounce: 0.15, duration: 0.6 },
    opacity: { duration: 0.2 },
  };
}

function Ripple({ rippleKey }: { rippleKey: string }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const ripple = rippleMotionOf(shouldReduceMotion);

  return (
    <motion.span
      key={rippleKey}
      aria-hidden='true'
      className='bg-primary/35 pointer-events-none absolute top-1/2 left-1/2 z-10 -ms-3 -mt-3 size-6 rounded-full'
      {...ripple}
    />
  );
}

const RIPPLE = {
  initial: { scale: 0.4, opacity: 0.6 },
  animate: { scale: 2.6, opacity: 0 },
  transition: { duration: 0.6, ease: EASE_OUT_STRONG },
} as const;

const RIPPLE_FADE = {
  initial: { opacity: 0.5 },
  animate: { opacity: 0 },
  transition: { duration: 0.5 },
} as const;

function rippleMotionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return RIPPLE_FADE;
  }
  return RIPPLE;
}

type TargetProps = {
  id: string;
  frame: FrameContextValue;
  className?: string;
  children: React.ReactNode;
};

/** An element the agent can point at: the pointer lives inside its current target and glides to the next. */
function Target({ id, frame, className, children }: TargetProps) {
  const isPointed = frame.pointerTarget === id;
  const isRippling = frame.rippleTarget === id;
  const isRisky = frame.riskyTarget === id;

  return (
    <span
      className={cn(
        'relative inline-flex rounded-md transition-shadow duration-200',
        isRisky && 'ring-warning/60 ring-offset-card ring-2 ring-offset-2',
        className
      )}
    >
      {children}
      {isRippling && <Ripple rippleKey={frame.rippleKey} />}
      {isPointed && (
        <NamedPointer
          pointerId={frame.pointerId}
          isShown={frame.isPointerShown}
        />
      )}
    </span>
  );
}

const SITE_FIELD =
  'bg-card hairline-ring ring-foreground/12 flex h-7 w-full items-center rounded-md px-2 text-[11px]';

const SITE_BUTTON =
  'bg-primary text-primary-foreground flex h-7 items-center justify-center rounded-full px-3 text-[11px] font-medium';

function FieldValue({
  value,
  placeholder,
}: {
  value: string;
  placeholder: string;
}) {
  if (value === '') {
    return <span className='text-muted-foreground'>{placeholder}</span>;
  }
  return (
    <span className='transition-opacity duration-300 starting:opacity-0'>
      {value}
    </span>
  );
}

function SearchScreen({
  page,
  frame,
}: {
  page: Page;
  frame: FrameContextValue;
}) {
  return (
    <div className='flex flex-col gap-2.5'>
      <Target id='search-title' frame={frame} className='self-start'>
        <p className='text-[13px] font-semibold'>Find a stay</p>
      </Target>
      <Target id='destination' frame={frame} className='w-full'>
        <span className={SITE_FIELD}>
          <FieldValue value={page.destination} placeholder='Where to?' />
        </span>
      </Target>
      <div className='grid grid-cols-2 gap-2'>
        <Target id='dates' frame={frame} className='w-full'>
          <span className={SITE_FIELD}>
            <FieldValue value={page.dates} placeholder='Dates' />
          </span>
        </Target>
        <span className={SITE_FIELD}>2 guests</span>
      </div>
      <Target id='search' frame={frame} className='self-start'>
        <span className={SITE_BUTTON}>Search</span>
      </Target>
    </div>
  );
}

const STAYS = [
  { id: 'alfama', name: 'Casa Alfama', note: 'Old town, 4.8', price: '156' },
  { id: 'tejo', name: 'Rio Tejo Rooms', note: 'Riverside, 4.5', price: '132' },
  {
    id: 'miradouro',
    name: 'Miradouro House',
    note: 'Viewpoint, 4.7',
    price: '171',
  },
];

function ResultsScreen({ frame }: { frame: FrameContextValue }) {
  return (
    <div className='flex flex-col gap-2'>
      <Target id='results-title' frame={frame} className='self-start'>
        <p className='text-[13px] font-semibold'>3 stays in Lisbon</p>
      </Target>
      <ul className='flex flex-col gap-1.5'>
        {STAYS.map((stay) => (
          <li
            key={stay.id}
            className='bg-foreground/[0.03] dark:bg-foreground/[0.05] flex items-center gap-2 rounded-md p-2 text-[11px]'
          >
            <span className='bg-foreground/10 size-8 shrink-0 rounded-[5px]' />
            <span className='flex min-w-0 flex-1 flex-col'>
              <span className='truncate font-medium'>{stay.name}</span>
              <span className='text-muted-foreground truncate'>
                {stay.note}
              </span>
            </span>
            <span className='shrink-0 tabular-nums'>{stay.price} EUR</span>
            <Target id={stay.id} frame={frame}>
              <span className='hairline-ring ring-foreground/15 bg-card flex h-6 items-center rounded-full px-2 text-[11px]'>
                View
              </span>
            </Target>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DetailsScreen({ frame }: { frame: FrameContextValue }) {
  return (
    <div className='flex flex-col gap-2.5'>
      <span className='bg-foreground/10 h-16 w-full rounded-md' />
      <div className='flex items-baseline justify-between gap-2'>
        <Target id='details-title' frame={frame}>
          <p className='text-[13px] font-semibold'>Casa Alfama</p>
        </Target>
        <span className='text-muted-foreground text-[11px]'>Old town, 4.8</span>
      </div>
      <dl className='grid grid-cols-[1fr_auto] gap-y-1 text-[11px] tabular-nums'>
        <dt className='text-muted-foreground'>12 to 14 Dec, 2 nights</dt>
        <dd>2 × 156.00 EUR</dd>
        <dt className='font-medium'>Total</dt>
        <dd className='font-medium'>312.00 EUR</dd>
      </dl>
      <Target id='book' frame={frame} className='self-start'>
        <span className={SITE_BUTTON}>Book 2 nights</span>
      </Target>
    </div>
  );
}

function CheckoutScreen({ frame }: { frame: FrameContextValue }) {
  return (
    <div className='flex flex-col gap-2.5'>
      <Target id='checkout-title' frame={frame} className='self-start'>
        <p className='text-[13px] font-semibold'>Confirm and pay</p>
      </Target>
      <dl className='grid grid-cols-[1fr_auto] gap-y-1 text-[11px] tabular-nums'>
        <dt className='text-muted-foreground'>Guest</dt>
        <dd>Dana Reyes</dd>
        <dt className='text-muted-foreground'>Card</dt>
        <dd>ending 4417</dd>
        <dt className='font-medium'>Total</dt>
        <dd className='font-medium'>312.00 EUR</dd>
      </dl>
      <Target id='pay' frame={frame} className='self-start'>
        <span className={SITE_BUTTON}>Pay 312.00 EUR</span>
      </Target>
    </div>
  );
}

function ConfirmedScreen({ frame }: { frame: FrameContextValue }) {
  return (
    <div className='flex flex-col items-center gap-2 py-3 text-center'>
      <CircleCheckIcon className='text-success-foreground size-6' />
      <Target id='confirmed-title' frame={frame}>
        <p className='text-[13px] font-semibold'>Booked</p>
      </Target>
      <p className='text-muted-foreground text-[11px]'>
        Casa Alfama, 12 to 14 Dec, 312.00 EUR
      </p>
      <Target id='reference' frame={frame}>
        <span className='bg-foreground/[0.05] rounded-md px-2 py-1 font-mono text-[11px]'>
          LKL-48213
        </span>
      </Target>
    </div>
  );
}

function PageView({ page, frame }: { page: Page; frame: FrameContextValue }) {
  if (page.screen === 'results') {
    return <ResultsScreen frame={frame} />;
  }
  if (page.screen === 'details') {
    return <DetailsScreen frame={frame} />;
  }
  if (page.screen === 'checkout') {
    return <CheckoutScreen frame={frame} />;
  }
  if (page.screen === 'confirmed') {
    return <ConfirmedScreen frame={frame} />;
  }
  return <SearchScreen page={page} frame={frame} />;
}

const SCREEN_SWAP = {
  initial: { opacity: 0, filter: 'blur(2px)' },
  animate: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(2px)' },
  transition: { duration: 0.2, ease: EASE_OUT_STRONG },
} as const;

const SCREEN_FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
} as const;

function screenMotionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return SCREEN_FADE;
  }
  return SCREEN_SWAP;
}

type BrowserFrameProps = {
  page: Page;
  frame: FrameContextValue;
  isPaused: boolean;
  banner: React.ReactNode;
  overlay: React.ReactNode;
};

function BrowserFrame({
  page,
  frame,
  isPaused,
  banner,
  overlay,
}: BrowserFrameProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const screenMotion = screenMotionOf(shouldReduceMotion);

  return (
    <div className='bg-foreground/[0.03] dark:bg-foreground/[0.05] relative flex flex-col overflow-hidden rounded-lg'>
      <div className='flex h-9 items-center gap-2 px-2.5'>
        <Target id='address' frame={frame} className='min-w-0 flex-1'>
          <span className='bg-card hairline-ring ring-foreground/10 flex h-6 w-full min-w-0 items-center gap-1.5 rounded-full px-2 text-[11px]'>
            <LockIcon className='text-muted-foreground size-3 shrink-0' />
            <LetterTile initial='L' size='sm' className='rounded-full' />
            <span className='text-muted-foreground min-w-0 truncate'>
              {ADDRESS[page.screen]}
            </span>
          </span>
        </Target>
        <AnimatePresence initial={false}>
          {isPaused && (
            <motion.span
              key='paused'
              className='flex shrink-0'
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <Chip color='var(--muted-foreground)'>
                <PauseIcon />
                Paused
              </Chip>
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      {banner}
      <div className='bg-card relative m-1.5 mt-0 min-h-56 rounded-md p-3'>
        <AnimatePresence initial={false} mode='popLayout'>
          <motion.div key={page.screen} {...screenMotion}>
            <PageView page={page} frame={frame} />
          </motion.div>
        </AnimatePresence>
        {overlay}
      </div>
    </div>
  );
}

type ApprovalCardProps = {
  onAllow: () => void;
  onDeny: () => void;
};

function ApprovalCard({ onAllow, onDeny }: ApprovalCardProps) {
  return (
    <div
      role='alertdialog'
      aria-label='Approve the payment'
      className='surface-raised absolute inset-x-2 bottom-2 z-30 flex flex-col gap-2.5 rounded-xl p-3'
    >
      <p className='flex items-start gap-2 text-xs leading-5'>
        <TriangleAlertIcon className='text-warning-foreground mt-0.5 size-3.5 shrink-0' />
        <span>
          <span className='font-medium'>{AGENT_NAME}</span> wants to pay 312.00
          EUR to Lakeline Stays with the card ending 4417.
        </span>
      </p>
      <span className='flex items-center gap-2'>
        <Button type='button' size='sm' onClick={onAllow}>
          Allow payment
        </Button>
        <Button type='button' size='sm' variant='outline' onClick={onDeny}>
          Deny
        </Button>
      </span>
    </div>
  );
}

const ACTIONS: BrowserAction[] = [
  {
    id: 'open',
    kind: 'navigate',
    label: 'Open lakeline-stays.example',
    target: 'address',
    pageAfter: BLANK_PAGE,
  },
  {
    id: 'destination',
    kind: 'type',
    label: 'Type “Lisbon” as the destination',
    target: 'destination',
    pageAfter: { screen: 'search', destination: 'Lisbon', dates: '' },
  },
  {
    id: 'dates',
    kind: 'click',
    label: 'Pick 12 to 14 December',
    target: 'dates',
    pageAfter: {
      screen: 'search',
      destination: 'Lisbon',
      dates: '12 to 14 Dec',
    },
  },
  {
    id: 'search',
    kind: 'click',
    label: 'Click Search',
    target: 'search',
    pageAfter: {
      screen: 'results',
      destination: 'Lisbon',
      dates: '12 to 14 Dec',
    },
  },
  {
    id: 'alfama',
    kind: 'click',
    label: 'Open Casa Alfama',
    target: 'alfama',
    pageAfter: {
      screen: 'details',
      destination: 'Lisbon',
      dates: '12 to 14 Dec',
    },
  },
  {
    id: 'book',
    kind: 'click',
    label: 'Click Book 2 nights',
    target: 'book',
    pageAfter: {
      screen: 'checkout',
      destination: 'Lisbon',
      dates: '12 to 14 Dec',
    },
  },
  {
    id: 'pay',
    kind: 'click',
    label: 'Pay 312.00 EUR',
    target: 'pay',
    pageAfter: {
      screen: 'confirmed',
      destination: 'Lisbon',
      dates: '12 to 14 Dec',
    },
    isRisky: true,
  },
  {
    id: 'reference',
    kind: 'navigate',
    label: 'Read the booking reference',
    target: 'reference',
    pageAfter: {
      screen: 'confirmed',
      destination: 'Lisbon',
      dates: '12 to 14 Dec',
    },
  },
];

const APPROVAL_ID = 'pay-approval';

const MOVE_MS = 650;

const SETTLE_MS = 550;

/** A click lands first; the page it opens follows, so the ripple shows on the page where it happened. */
const LOAD_MS = 380;

type ActionOutput = { isLoaded: boolean };

function actionOf(id: string) {
  return ACTIONS.find((action) => action.id === id);
}

function startEvent(action: BrowserAction, status: 'running' | 'waiting') {
  const event: RunEvent = {
    type: 'call.started',
    call: {
      id: action.id,
      tool: action.kind,
      label: action.label,
      status,
      input: { target: action.target },
      output: { isLoaded: false },
    },
  };
  return event;
}

function doneEvent(action: BrowserAction): RunEvent {
  return { type: 'call.updated', id: action.id, patch: { status: 'done' } };
}

function loadedEvent(action: BrowserAction): RunEvent {
  return {
    type: 'call.updated',
    id: action.id,
    patch: { output: { isLoaded: true } },
  };
}

function approvalEvent(): RunEvent {
  return {
    type: 'approval.requested',
    approval: {
      id: APPROVAL_ID,
      title: 'Pay 312.00 EUR to Lakeline Stays',
      risk: 'high',
      status: 'pending',
    },
  };
}

/** The risky step waits: the script holds on the pending approval until a person answers it. */
function scriptOf(actions: BrowserAction[]): RunScriptStep[] {
  const steps: RunScriptStep[] = [
    { after: 500, event: { type: 'run.started' } },
  ];
  for (const action of actions) {
    if (action.isRisky) {
      steps.push({ after: SETTLE_MS, event: startEvent(action, 'waiting') });
      steps.push({ after: MOVE_MS, event: approvalEvent() });
      steps.push({
        after: 200,
        event: {
          type: 'call.updated',
          id: action.id,
          patch: { status: 'running' },
        },
      });
    }
    if (!action.isRisky) {
      steps.push({ after: SETTLE_MS, event: startEvent(action, 'running') });
    }
    steps.push({ after: MOVE_MS, event: doneEvent(action) });
    steps.push({ after: LOAD_MS, event: loadedEvent(action) });
  }
  steps.push({ after: 0, event: { type: 'run.finished', status: 'done' } });
  return steps;
}

const SCRIPT = scriptOf(ACTIONS);

const INITIAL_RUN = emptyRun({ id: 'browser', title: 'Book a stay in Lisbon' });

function isActionOutput(value: unknown): value is ActionOutput {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return typeof (value as ActionOutput).isLoaded === 'boolean';
}

function isLoaded(call: ToolCall) {
  if (!isActionOutput(call.output)) {
    return false;
  }
  return call.output.isLoaded;
}

function pageBefore(index: number) {
  const previous = ACTIONS[index - 1];
  return previous?.pageAfter ?? BLANK_PAGE;
}

function livePageOf(calls: ToolCall[]) {
  const loaded = calls.filter(isLoaded);
  const last = loaded.at(-1);
  if (!last) {
    return BLANK_PAGE;
  }
  const action = actionOf(last.id);
  return action?.pageAfter ?? BLANK_PAGE;
}

function lastClickOf(calls: ToolCall[]) {
  const clicks = calls.filter((call) => {
    const isDone = call.status === 'done';
    const isClick = call.tool === 'click';
    return isDone && isClick;
  });
  return clicks.at(-1);
}

function offsetOf(run: RunSnapshot, call: ToolCall) {
  const runStart = run.startedAt ?? 0;
  const callStart = call.startedAt ?? runStart;
  return callStart - runStart;
}

function rowToneOf(isViewed: boolean) {
  if (isViewed) {
    return 'bg-primary/[0.07]';
  }
  return 'hover:bg-foreground/[0.03]';
}

type ActionLogProps = {
  run: RunSnapshot;
  viewedIndex: number;
  onView: (index: number) => void;
};

function ActionLog({ run, viewedIndex, onView }: ActionLogProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = risePresenceOf(shouldReduceMotion);

  return (
    <ol aria-label='Actions' className='flex flex-col'>
      <AnimatePresence initial={false}>
        {run.calls.map((call, index) => {
          const action = actionOf(call.id);
          const KindIcon = KIND_ICON[action?.kind ?? 'click'];
          const offset = offsetOf(run, call);
          const isViewed = index === viewedIndex;
          return (
            <motion.li key={call.id} {...rowPresence}>
              <button
                type='button'
                aria-current={currentOf(isViewed)}
                onClick={() => onView(index)}
                className={cn(
                  'focus-visible:ring-ring/25 flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-start text-xs transition-colors duration-150 outline-none focus-visible:ring-[3px]',
                  rowToneOf(isViewed)
                )}
              >
                <span className='text-muted-foreground w-8 shrink-0 tabular-nums'>
                  <span aria-hidden='true'>{formatClock(offset)}</span>
                  <span className='sr-only'>{spokenClockOf(offset)}</span>
                </span>
                <KindIcon className='text-muted-foreground size-3.5 shrink-0' />
                <span className='min-w-0 flex-1 truncate'>{call.label}</span>
                <CallStatusMark status={call.status} />
              </button>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ol>
  );
}

function currentOf(isViewed: boolean) {
  if (isViewed) {
    return 'step' as const;
  }
  return undefined;
}

type Control = 'agent' | 'paused' | 'you';

function bannerOf(control: Control, isDenied: boolean, onHandBack: () => void) {
  if (isDenied) {
    return (
      <p className='bg-destructive/10 text-destructive-ink mx-1.5 mb-1.5 rounded-md px-2.5 py-1.5 text-xs'>
        Payment denied. {AGENT_NAME} stopped before paying.
      </p>
    );
  }
  if (control !== 'you') {
    return null;
  }
  return (
    <div className='bg-primary/10 text-primary-ink mx-1.5 mb-1.5 flex items-center gap-2 rounded-md py-1 ps-2.5 pe-1 text-xs'>
      <HandIcon className='size-3.5 shrink-0' />
      <span className='min-w-0 flex-1'>
        You have control. {AGENT_NAME} waits until you hand back.
      </span>
      <Button
        type='button'
        size='sm'
        variant='ghost'
        onClick={onHandBack}
        className='h-6 px-2'
      >
        Hand back
      </Button>
    </div>
  );
}

function stepTextOf(index: number, total: number) {
  const position = index + 1;
  return `Step ${position} of ${total}`;
}

function announcementOf(run: RunSnapshot, control: Control, isDenied: boolean) {
  if (isDenied) {
    return 'Payment denied. The agent stopped';
  }
  if (control === 'you') {
    return 'You have control of the browser';
  }
  if (control === 'paused') {
    return 'The agent is paused';
  }
  const pending = pendingApprovalsOf(run);
  if (pending.length > 0) {
    return 'The agent waits for your approval to pay 312.00 EUR';
  }
  const last = run.calls.at(-1);
  if (!last) {
    return '';
  }
  if (run.status === 'done') {
    return 'Booking done';
  }
  return `${AGENT_NAME}: ${last.label}`;
}

export default function Review10() {
  const [control, setControl] = useState<Control>('agent');
  const [isDenied, setIsDenied] = useState(false);
  const [isHeld, setIsHeld] = useState(false);
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const pointerId = useId();
  const isInView = useInView(rootRef, { amount: 0.3 });
  const isAgentInControl = control === 'agent';
  const isFree = !isHeld && !isDenied;
  const isActive = isInView && isAgentInControl && isFree;
  const { snapshot, store, restart } = useRunScript(SCRIPT, {
    initial: INITIAL_RUN,
    isActive,
  });
  const pending = pendingApprovalsOf(snapshot);
  const shouldHold = pending.length > 0;
  if (shouldHold !== isHeld) {
    setIsHeld(shouldHold);
  }
  const calls = snapshot.calls;
  const liveIndex = calls.length - 1;
  const isViewingPast = viewIndex !== null;
  const shownIndex = viewIndex ?? liveIndex;
  const shownCall = calls[shownIndex];
  const shownAction = actionOf(shownCall?.id ?? '');
  const page = shownPageOf(isViewingPast, shownIndex, calls);
  const lastClick = lastClickOf(calls);
  const isWaiting = shouldHold && !isViewingPast;
  const isYours = control === 'you';
  const isPaused = control === 'paused';
  const frame: FrameContextValue = {
    pointerTarget: pointerTargetOf(shownAction, page),
    pointerId,
    rippleTarget: rippleTargetOf(isViewingPast, lastClick),
    rippleKey: lastClick?.id ?? '',
    isPointerShown: !isYours,
    riskyTarget: riskyTargetOf(isWaiting),
  };
  const isFinished = snapshot.status === 'done';
  const hasActions = calls.length > 0;
  const announcement = announcementOf(snapshot, control, isDenied);
  const stepText = stepTextOf(shownIndex, ACTIONS.length);
  const canControl = !isFinished && !isDenied;

  function allow() {
    store.dispatch({
      type: 'approval.resolved',
      id: APPROVAL_ID,
      decision: 'approved',
    });
  }

  function deny() {
    store.dispatch({
      type: 'approval.resolved',
      id: APPROVAL_ID,
      decision: 'denied',
    });
    store.dispatch({
      type: 'call.updated',
      id: 'pay',
      patch: { status: 'failed', error: 'Denied by you' },
    });
    store.dispatch({ type: 'run.finished', status: 'cancelled' });
    setIsDenied(true);
  }

  function togglePause() {
    if (control === 'paused') {
      setControl('agent');
      return;
    }
    setControl('paused');
  }

  function toggleTakeOver() {
    if (control === 'you') {
      setControl('agent');
      return;
    }
    setControl('you');
  }

  function view(index: number) {
    if (index === liveIndex) {
      setViewIndex(null);
      return;
    }
    setViewIndex(index);
  }

  function scrub(value: number | readonly number[]) {
    const next = sliderValueOf(value);
    view(next);
  }

  function replay() {
    setControl('agent');
    setIsDenied(false);
    setViewIndex(null);
    restart();
  }

  const banner = bannerOf(control, isDenied, toggleTakeOver);
  const showsApproval = isWaiting && !isYours;

  useKeptHeight(rootRef);

  return (
    <div
      ref={rootRef}
      className='bg-card hairline-ring ring-border @container w-full max-w-[56rem] rounded-xl p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <div className='grid grid-cols-1 gap-3 @2xl:grid-cols-[minmax(0,1fr)_17rem]'>
        <div className='flex min-w-0 flex-col gap-2.5'>
          <BrowserFrame
            page={page}
            frame={frame}
            isPaused={isPaused}
            banner={banner}
            overlay={
              <AnimatePresence initial={false}>
                {showsApproval && (
                  <motion.div
                    key='approval'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <ApprovalCard onAllow={allow} onDeny={deny} />
                  </motion.div>
                )}
              </AnimatePresence>
            }
          />
          <div className='flex items-center gap-3 px-1'>
            <Slider
              value={Math.max(0, shownIndex)}
              min={0}
              max={Math.max(1, liveIndex)}
              step={1}
              disabled={!hasActions}
              onValueChange={scrub}
              thumbLabels={['Frame']}
              getAriaValueText={(_formatted, value) =>
                stepTextOf(value, ACTIONS.length)
              }
              className='min-w-0 flex-1'
            />
            <span className='text-muted-foreground w-24 shrink-0 text-end text-xs tabular-nums'>
              {stepText}
            </span>
          </div>
          <div className='flex flex-wrap items-center gap-2 px-1'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={!canControl}
              onClick={togglePause}
            >
              <Swap swapKey={pauseLabelOf(control)}>
                {isPaused && <PlayIcon />}
                {!isPaused && <PauseIcon />}
              </Swap>
              {pauseLabelOf(control)}
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={!canControl}
              onClick={toggleTakeOver}
            >
              <HandIcon />
              {takeOverLabelOf(control)}
            </Button>
            <AnimatePresence initial={false}>
              {isViewingPast && (
                <motion.span
                  key='live'
                  className='flex'
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => setViewIndex(null)}
                  >
                    Back to live
                  </Button>
                </motion.span>
              )}
            </AnimatePresence>
            {isFinished && (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={replay}
                className='ms-auto'
              >
                Watch again
              </Button>
            )}
            {isDenied && (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={replay}
                className='ms-auto'
              >
                Start over
              </Button>
            )}
          </div>
        </div>
        <section
          aria-label='Action log'
          className='bg-foreground/[0.02] dark:bg-foreground/[0.035] flex min-w-0 flex-col gap-1 rounded-lg p-1.5'
        >
          <header className='flex items-center gap-2 px-2 pt-1 pb-1.5'>
            <LetterTile initial='R' series={AGENT_SERIES} />
            <span className='min-w-0 flex-1 truncate text-[13px] font-medium'>
              {AGENT_NAME}
            </span>
            <BrandTile brand='claude' size='sm' />
            <span className='text-muted-foreground text-xs'>Claude Sonnet</span>
          </header>
          <ActionLog run={snapshot} viewedIndex={shownIndex} onView={view} />
          {!hasActions && (
            <p className='text-muted-foreground px-2 py-3 text-xs'>
              Actions show here as the agent works
            </p>
          )}
        </section>
      </div>
      <LiveRegion message={announcement} />
    </div>
  );
}

function shownPageOf(
  isViewingPast: boolean,
  shownIndex: number,
  calls: ToolCall[]
) {
  if (isViewingPast) {
    return pageBefore(shownIndex);
  }
  return livePageOf(calls);
}

function rippleTargetOf(
  isViewingPast: boolean,
  lastClick: ToolCall | undefined
) {
  if (isViewingPast) {
    return null;
  }
  if (!lastClick) {
    return null;
  }
  const action = actionOf(lastClick.id);
  return action?.target ?? null;
}

function riskyTargetOf(isWaiting: boolean) {
  if (isWaiting) {
    return 'pay';
  }
  return null;
}

function sliderValueOf(value: number | readonly number[]) {
  if (typeof value === 'number') {
    return value;
  }
  return value[0] ?? 0;
}

function pauseLabelOf(control: Control) {
  if (control === 'paused') {
    return 'Resume';
  }
  return 'Pause';
}

function takeOverLabelOf(control: Control) {
  if (control === 'you') {
    return 'Hand back';
  }
  return 'Take over';
}
