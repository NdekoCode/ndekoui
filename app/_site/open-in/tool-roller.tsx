'use client';

import { AnimatePresence, motion, useInView } from 'motion/react';
import { useRef, useSyncExternalStore, type ComponentType } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';

import {
  ChatGptMark,
  ClaudeMark,
  CursorMark,
  LovableMark,
  V0Mark,
} from './tool-marks';

type Tool = {
  id: string;
  /** Left out when the mark already spells the name, as v0's does. */
  name?: string;
  Mark: ComponentType<{ className?: string }>;
};

const TOOLS: Tool[] = [
  { id: 'v0', Mark: V0Mark },
  { id: 'lovable', name: 'Lovable', Mark: LovableMark },
  { id: 'cursor', name: 'Cursor', Mark: CursorMark },
  { id: 'claude', name: 'Claude', Mark: ClaudeMark },
  { id: 'chatgpt', name: 'ChatGPT', Mark: ChatGptMark },
];

const CYCLE_MS = 2600;

const ENTER = { y: '110%', opacity: 0, filter: 'blur(4px)' };
const SHOWN = { y: '0%', opacity: 1, filter: 'blur(0px)' };
const LEAVE = { y: '-110%', opacity: 0, filter: 'blur(4px)' };
const ENTER_TIMING = { duration: 0.28, ease: [0.22, 1, 0.36, 1] } as const;
const LEAVE_TIMING = { duration: 0.2, ease: [0.4, 0, 1, 1] } as const;

/*
 * One clock for every roller on the page, so the buttons turn together instead of each at its own
 * moment. It skips its turns while the tab is hidden, and a roller off screen does not listen to it.
 */
let currentIndex = 0;
let timer: number | undefined;
const listeners = new Set<() => void>();

function advance() {
  if (document.hidden) {
    return;
  }
  currentIndex = (currentIndex + 1) % TOOLS.length;
  listeners.forEach((listener) => listener());
}

function subscribeToClock(listener: () => void) {
  listeners.add(listener);
  const isFirst = listeners.size === 1;
  if (isFirst) {
    timer = window.setInterval(advance, CYCLE_MS);
  }
  return () => {
    listeners.delete(listener);
    const isLast = listeners.size === 0;
    if (isLast) {
      window.clearInterval(timer);
    }
  };
}

function subscribeToNothing() {
  return () => {};
}

function currentIndexOf() {
  return currentIndex;
}

function firstIndexOf() {
  return 0;
}

function subscriptionOf(isRolling: boolean) {
  if (isRolling) {
    return subscribeToClock;
  }
  return subscribeToNothing;
}

const NAME_CLASS = 'hidden @sm/tile-header:inline';

function ToolLabel({ tool }: { tool: Tool }) {
  const { Mark, name } = tool;
  return (
    <>
      <Mark className='size-4' />
      {name && <span className={NAME_CLASS}>{name}</span>}
    </>
  );
}

/**
 * The builders the Open in menu reaches, one at a time: each leaves upwards with a blur while the
 * next rises in, and the button eases to the new width. The name shows when the header has room; a
 * narrow tile keeps the mark alone.
 */
export function ToolRoller() {
  const rollerRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(rollerRef);
  const prefersReducedMotion = usePrefersReducedMotion();
  const isRolling = isInView && !prefersReducedMotion;
  const index = useSyncExternalStore(
    subscriptionOf(isRolling),
    currentIndexOf,
    firstIndexOf
  );
  const tool = TOOLS[index];

  return (
    <span ref={rollerRef} className='inline-flex'>
      <AnimatedSize axis='width' as='span' aria-hidden='true'>
        <span className='inline-grid overflow-hidden'>
          <AnimatePresence initial={false}>
            <motion.span
              key={tool.id}
              className='col-start-1 row-start-1 flex items-center gap-1.5'
              initial={ENTER}
              animate={{ ...SHOWN, transition: ENTER_TIMING }}
              exit={{ ...LEAVE, transition: LEAVE_TIMING }}
            >
              <ToolLabel tool={tool} />
            </motion.span>
          </AnimatePresence>
        </span>
      </AnimatedSize>
    </span>
  );
}
