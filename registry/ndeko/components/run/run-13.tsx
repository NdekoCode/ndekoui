'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId } from 'react';

import { useKeptHeight } from '@/registry/ndeko/hooks/use-kept-height';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import {
  useSession,
  type SessionStep,
} from '@/registry/ndeko/hooks/use-session';
import { useTimeouts } from '@/registry/ndeko/hooks/use-timeouts';
import {
  pressedQuietOf,
  spokenUnless,
} from '@/registry/ndeko/lib/demonstration';
import {
  ChevronDownIcon,
  RefreshCwIcon,
  TerminalIcon,
} from '@/registry/ndeko/lib/icons';
import { rowPresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { restingOf } from '@/registry/ndeko/lib/run-session';
import { cn } from '@/registry/ndeko/lib/utils';
import { Badge } from '@/registry/ndeko/ui/badge';
import { Button } from '@/registry/ndeko/ui/button';
import { Fold } from '@/registry/ndeko/ui/chat-motion';
import { ClockGate } from '@/registry/ndeko/ui/live-duration';
import { LiveRegion } from '@/registry/ndeko/ui/live-region';
import { ReplayButton } from '@/registry/ndeko/ui/replay-button';
import { Segments, type Segment } from '@/registry/ndeko/ui/segments';

import { PricingPage } from './_parts/pricing-page';

export type PreviewView = 'desktop' | 'mobile';

export type ConsoleTone = 'info' | 'hot';

export type ConsoleLine = {
  id: number;
  tone: ConsoleTone;
  text: string;
};

const VIEWS: Segment<PreviewView>[] = [
  { value: 'desktop', label: 'Desktop' },
  { value: 'mobile', label: 'Mobile' },
];

const FRAME_SIZE: Record<PreviewView, string> = {
  desktop: 'w-full rounded-lg',
  mobile: 'w-[17.5rem] rounded-[1.25rem]',
};

const LINE_TONE: Record<ConsoleTone, string> = {
  info: 'text-muted-foreground',
  hot: 'text-primary-ink',
};

const PROGRESS_START = { scaleX: 0.04, opacity: 1 };

const PROGRESS_RUNNING = { scaleX: 0.88, opacity: 1 };

const PROGRESS_DONE = { scaleX: 1, opacity: 0 };

function chevronTurnOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-180';
  }
  return 'rotate-0';
}

function spinOf(isReloading: boolean) {
  if (isReloading) {
    return 'animate-spin';
  }
  return undefined;
}

function frameLabelOf(view: PreviewView) {
  if (view === 'mobile') {
    return 'Preview of the page at phone width';
  }
  return 'Preview of the page at desktop width';
}

function ReloadLine({ isReloading }: { isReloading: boolean }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const duration = reloadDurationOf(shouldReduceMotion);

  return (
    <AnimatePresence initial={false}>
      {isReloading && (
        <motion.span
          key='reload'
          aria-hidden='true'
          initial={PROGRESS_START}
          animate={PROGRESS_RUNNING}
          exit={{ ...PROGRESS_DONE, transition: { duration: 0.25 } }}
          transition={{ duration, ease: [0.23, 1, 0.32, 1] }}
          className='bg-primary absolute inset-x-0 top-0 z-10 h-0.5 origin-left'
        />
      )}
    </AnimatePresence>
  );
}

function reloadDurationOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return 0;
  }
  return 0.9;
}

function ConsoleLines({ lines }: { lines: ConsoleLine[] }) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const rowPresence = rowPresenceOf(shouldReduceMotion);

  return (
    <ul
      aria-label='Preview console'
      className='bg-foreground/[0.04] dark:bg-foreground/[0.06] flex flex-col rounded-lg px-3 py-1.5 font-mono text-xs leading-5'
    >
      <AnimatePresence initial={false}>
        {lines.map((line) => (
          <motion.li key={line.id} className='overflow-hidden' {...rowPresence}>
            <span className={cn('block truncate', LINE_TONE[line.tone])}>
              [dev] {line.text}
            </span>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

export type SandboxPreviewProps = {
  /** The address the page runs at: "localhost:3000/pricing". */
  address: string;
  view: PreviewView;
  onViewChange: (view: PreviewView) => void;
  isReloading: boolean;
  onReload: () => void;
  isConsoleOpen: boolean;
  onConsoleOpenChange: (isOpen: boolean) => void;
  lines: ConsoleLine[];
  /** The running page: an iframe, or anything drawn in the frame. */
  children: React.ReactNode;
  /** Shows Reload held down, for a demonstration that presses it. */
  isReloadPressed?: boolean;
  /** Shows the console toggle held down, for a demonstration that presses it. */
  isConsolePressed?: boolean;
  className?: string;
};

export function SandboxPreview({
  address,
  view,
  onViewChange,
  isReloading,
  onReload,
  isConsoleOpen,
  onConsoleOpenChange,
  lines,
  children,
  isReloadPressed = false,
  isConsolePressed = false,
  className,
}: SandboxPreviewProps) {
  const consoleId = useId();
  const lineCount = lines.length;

  function toggleConsole() {
    onConsoleOpenChange(!isConsoleOpen);
  }

  return (
    <section
      aria-label='Sandbox preview'
      className={cn(
        'bg-card hairline-ring ring-border @container flex flex-col gap-3 rounded-xl p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]',
        className
      )}
    >
      <div className='flex flex-wrap items-center gap-2'>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          aria-label='Reload the preview'
          onClick={onReload}
          className={cn(
            'text-muted-foreground',
            pressedQuietOf(isReloadPressed)
          )}
        >
          <RefreshCwIcon className={spinOf(isReloading)} />
        </Button>
        <div className='bg-foreground/[0.05] dark:bg-foreground/[0.07] flex h-7 min-w-0 flex-1 basis-40 items-center gap-2 rounded-md px-2.5'>
          <span
            aria-hidden='true'
            className='bg-success size-1.5 shrink-0 rounded-full'
          />
          <span className='min-w-0 truncate font-mono text-xs'>{address}</span>
        </div>
        <Segments
          value={view}
          segments={VIEWS}
          onValueChange={onViewChange}
          label='Preview width'
        />
      </div>
      <div className='bg-foreground/[0.04] dark:bg-foreground/[0.06] relative flex h-[19rem] justify-center overflow-hidden rounded-lg p-3'>
        <ReloadLine isReloading={isReloading} />
        <div
          role='img'
          aria-label={frameLabelOf(view)}
          className={cn(
            'hairline-ring ring-border bg-background @container h-full max-w-full overflow-hidden shadow-[0_1px_2px_rgb(0_0_0/0.06)] transition-[width,border-radius] duration-300 ease-(--ease-out-strong) motion-reduce:transition-none',
            FRAME_SIZE[view]
          )}
        >
          {children}
        </div>
      </div>
      <div className='flex flex-col'>
        <button
          type='button'
          aria-expanded={isConsoleOpen}
          aria-controls={consoleId}
          onClick={toggleConsole}
          className={cn(
            'text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-1 text-xs transition-[color,scale] outline-none focus-visible:ring-[3px]',
            pressedQuietOf(isConsolePressed)
          )}
        >
          <TerminalIcon className='size-3.5' />
          Console
          <Badge variant='secondary' className='tabular-nums'>
            {lineCount}
          </Badge>
          <ChevronDownIcon
            className={cn(
              'ms-auto size-3.5 transition-transform duration-200 ease-(--ease-out-strong)',
              chevronTurnOf(isConsoleOpen)
            )}
          />
        </button>
        <Fold open={isConsoleOpen} id={consoleId}>
          <ConsoleLines lines={lines} />
        </Fold>
      </div>
    </section>
  );
}

const ADDRESS = 'localhost:3000/pricing';

const RELOAD_MS = 900;

const MAX_LINES = 4;

const EDIT_FILES = ['src/pricing/plan-card.tsx', 'src/pricing/cta.tsx'];

type SandboxState = {
  view: PreviewView;
  isConsoleOpen: boolean;
  isReloading: boolean;
  editCount: number;
  lines: ConsoleLine[];
  nextLineId: number;
};

type SandboxAction =
  | { type: 'edit' }
  | { type: 'reload' }
  | { type: 'reloaded' }
  | { type: 'view'; view: PreviewView }
  | { type: 'console'; isOpen: boolean }
  | { type: 'hold' };

type SandboxStep = SessionStep<SandboxState, SandboxAction>;

const INITIAL: SandboxState = {
  view: 'desktop',
  isConsoleOpen: false,
  isReloading: false,
  editCount: 0,
  lines: [
    { id: 1, tone: 'info', text: 'ready on http://localhost:3000' },
    { id: 2, tone: 'info', text: 'compiled /pricing in 412 ms' },
  ],
  nextLineId: 3,
};

function withLine(
  state: SandboxState,
  tone: ConsoleTone,
  text: string
): SandboxState {
  const line: ConsoleLine = { id: state.nextLineId, tone, text };
  const lines = [...state.lines, line].slice(-MAX_LINES);
  return { ...state, lines, nextLineId: state.nextLineId + 1 };
}

function edited(state: SandboxState): SandboxState {
  const file = EDIT_FILES[state.editCount];
  if (!file) {
    return state;
  }
  const next = withLine(state, 'hot', `hot update: ${file}`);
  return { ...next, editCount: state.editCount + 1 };
}

function reloaded(state: SandboxState): SandboxState {
  if (!state.isReloading) {
    return state;
  }
  const next = withLine(state, 'info', 'page reloaded in 380 ms');
  return { ...next, isReloading: false };
}

function reducer(state: SandboxState, action: SandboxAction): SandboxState {
  switch (action.type) {
    case 'edit':
      return edited(state);
    case 'reload':
      return { ...state, isReloading: true };
    case 'reloaded':
      return reloaded(state);
    case 'view':
      return { ...state, view: action.view };
    case 'console':
      return { ...state, isConsoleOpen: action.isOpen };
    case 'hold':
      return state;
  }
}

const SCRIPT: SandboxStep[] = [
  { after: 1800, action: { type: 'edit' } },
  {
    after: 1700,
    by: 'demo',
    press: 'reload',
    action: { type: 'reload' },
  },
  { after: RELOAD_MS, action: { type: 'reloaded' } },
  {
    after: 1400,
    by: 'demo',
    action: { type: 'view', view: 'mobile' },
  },
  {
    after: 1500,
    by: 'demo',
    press: 'console',
    action: { type: 'console', isOpen: true },
  },
  { after: 1500, action: { type: 'edit' } },
  { after: 4500, action: { type: 'hold' } },
];

const SESSION = {
  reducer,
  initial: INITIAL,
  resting: restingOf(INITIAL, SCRIPT, reducer),
  script: SCRIPT,
  loopAfter: 3000,
};

function announcementOf(state: SandboxState) {
  const last = state.lines[state.lines.length - 1];
  if (!last) {
    return '';
  }
  return last.text;
}

export default function Run13() {
  const { schedule, clearAll } = useTimeouts();
  const {
    ref,
    isInView,
    isAutoplaying,
    state,
    act,
    pressed,
    isFinished,
    restart,
  } = useSession(SESSION);
  const canReplay = isFinished && !isAutoplaying;
  const announcement = announcementOf(state);

  function reload() {
    act({ type: 'reload' });
    schedule(() => act({ type: 'reloaded' }), RELOAD_MS);
  }

  function changeView(view: PreviewView) {
    act({ type: 'view', view });
  }

  function changeConsole(isOpen: boolean) {
    act({ type: 'console', isOpen });
  }

  function replay() {
    clearAll();
    restart();
  }

  useKeptHeight(ref);

  return (
    <div
      ref={ref}
      className='flex min-h-[30rem] w-full max-w-[40rem] flex-col gap-2'
    >
      <ClockGate isActive={isInView}>
        <SandboxPreview
          address={ADDRESS}
          view={state.view}
          onViewChange={changeView}
          isReloading={state.isReloading}
          onReload={reload}
          isConsoleOpen={state.isConsoleOpen}
          onConsoleOpenChange={changeConsole}
          lines={state.lines}
          isReloadPressed={pressed === 'reload'}
          isConsolePressed={pressed === 'console'}
        >
          <div inert className='h-full'>
            <PricingPage editCount={state.editCount} />
          </div>
        </SandboxPreview>
      </ClockGate>
      <div className='flex h-7 items-center justify-end'>
        <ReplayButton isShown={canReplay} onReplay={replay} />
      </div>
      <LiveRegion message={spokenUnless(isAutoplaying, announcement)} />
    </div>
  );
}
