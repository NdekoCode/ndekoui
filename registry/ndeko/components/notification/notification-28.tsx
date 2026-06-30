'use client';

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from 'motion/react';
import { useState } from 'react';

import {
  ChevronsUpDownIcon,
  PlusIcon,
  XIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { StatusOrb, type StatusOrbTone } from '@/registry/ndeko/ui/status-orb';

type StackToast = {
  id: number;
  tone: StatusOrbTone;
  title: string;
  description: string;
};

type ToastMessage = Omit<StackToast, 'id'>;

const MESSAGES: ToastMessage[] = [
  {
    tone: 'success',
    title: 'Invite sent to priya@example.com',
    description: 'She joins Atlas Redesign as a member',
  },
  {
    tone: 'info',
    title: 'Weekly digest is ready',
    description: '12 tasks closed across 3 teams',
  },
  {
    tone: 'warning',
    title: 'Last week is still open',
    description: 'Submit the timesheet before Friday',
  },
  {
    tone: 'error',
    title: 'The export did not finish',
    description: 'The file went past the 50 MB limit',
  },
];

const INITIAL_TOASTS: StackToast[] = [
  { id: 3, ...MESSAGES[2] },
  { id: 2, ...MESSAGES[1] },
  { id: 1, ...MESSAGES[0] },
];

const TOAST_HEIGHT = 64;
const TOAST_GAP = 8;
const PEEK = 10;
const STACKED_LAYERS = 3;
const MAX_TOASTS = 4;
const LAYER_SCALE_STEP = 0.05;

const SPRING: Transition = { type: 'spring', bounce: 0, duration: 0.35 };
const INSTANT: Transition = { duration: 0 };
const LEAVE: Transition = { duration: 0.12, ease: [0.23, 1, 0.32, 1] };

type Placement = { y: number; scale: number; opacity: number };

function placementOf(index: number, isExpanded: boolean): Placement {
  if (isExpanded) {
    const step = TOAST_HEIGHT + TOAST_GAP;
    const y = index * step;
    return { y, scale: 1, opacity: 1 };
  }
  const deepestLayer = STACKED_LAYERS - 1;
  const layer = Math.min(index, deepestLayer);
  const y = layer * PEEK;
  const shrink = layer * LAYER_SCALE_STEP;
  const scale = 1 - shrink;
  const isBuried = index >= STACKED_LAYERS;
  if (isBuried) {
    return { y, scale, opacity: 0 };
  }
  return { y, scale, opacity: 1 };
}

function stackHeightOf(count: number, isExpanded: boolean) {
  if (count === 0) {
    return TOAST_HEIGHT;
  }
  if (isExpanded) {
    const gapCount = count - 1;
    const gaps = gapCount * TOAST_GAP;
    const toastsHeight = count * TOAST_HEIGHT;
    return toastsHeight + gaps;
  }
  const layers = Math.min(count, STACKED_LAYERS);
  const peekCount = layers - 1;
  const peeks = peekCount * PEEK;
  return TOAST_HEIGHT + peeks;
}

function motionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return INSTANT;
  }
  return SPRING;
}

function arrivalOffsetOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return 0;
  }
  return -16;
}

function focusStaysInside(event: React.FocusEvent<HTMLElement>) {
  const nextTarget = event.relatedTarget;
  if (!(nextTarget instanceof Node)) {
    return false;
  }
  return event.currentTarget.contains(nextTarget);
}

function withNewest(toasts: StackToast[], toast: StackToast) {
  const next = [toast, ...toasts];
  return next.slice(0, MAX_TOASTS);
}

export default function Notification28() {
  const shouldReduceMotion = useReducedMotion();
  const [toasts, setToasts] = useState(INITIAL_TOASTS);
  const [nextId, setNextId] = useState(4);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [isPinnedOpen, setIsPinnedOpen] = useState(false);
  const isExpanded = isHovered || isFocusWithin || isPinnedOpen;
  const hasToasts = toasts.length > 0;
  const stackHeight = stackHeightOf(toasts.length, isExpanded);
  const transition = motionOf(shouldReduceMotion);
  const arrivalOffset = arrivalOffsetOf(shouldReduceMotion);

  function sendToast() {
    const position = nextId - 1;
    const messageIndex = position % MESSAGES.length;
    const toast = { id: nextId, ...MESSAGES[messageIndex] };
    setToasts((current) => withNewest(current, toast));
    setNextId((current) => current + 1);
  }

  function dismiss(toastId: number) {
    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  }

  function togglePinned() {
    setIsPinnedOpen((current) => !current);
  }

  function hoverStarts(event: React.PointerEvent<HTMLElement>) {
    if (event.pointerType === 'mouse') {
      setIsHovered(true);
    }
  }

  function hoverEnds() {
    setIsHovered(false);
  }

  function focusEnters() {
    setIsFocusWithin(true);
  }

  function focusLeaves(event: React.FocusEvent<HTMLElement>) {
    if (focusStaysInside(event)) {
      return;
    }
    setIsFocusWithin(false);
  }

  return (
    <div className='flex w-full max-w-[22rem] flex-col gap-4'>
      <motion.ol
        aria-label='Notifications'
        aria-live='polite'
        initial={false}
        animate={{ height: stackHeight }}
        transition={transition}
        onPointerEnter={hoverStarts}
        onPointerLeave={hoverEnds}
        onFocus={focusEnters}
        onBlur={focusLeaves}
        className='relative'
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast, index) => {
            const placement = placementOf(index, isExpanded);
            const layerStyle = { zIndex: toasts.length - index };
            return (
              <motion.li
                key={toast.id}
                initial={{ y: arrivalOffset, scale: 1, opacity: 0 }}
                animate={placement}
                exit={{ opacity: 0, transition: LEAVE }}
                transition={transition}
                style={layerStyle}
                className='surface-raised absolute inset-x-0 top-0 flex h-16 origin-bottom items-center gap-3 rounded-xl ps-3.5 pe-2'
              >
                <StatusOrb tone={toast.tone} size='sm' />
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-[13px] leading-5 font-medium'>
                    {toast.title}
                  </p>
                  <p className='text-muted-foreground truncate text-xs'>
                    {toast.description}
                  </p>
                </div>
                <Button
                  variant='ghost'
                  size='icon-sm'
                  aria-label={`Dismiss ${toast.title}`}
                  onClick={() => dismiss(toast.id)}
                  className='text-muted-foreground'
                >
                  <XIcon />
                </Button>
              </motion.li>
            );
          })}
        </AnimatePresence>
        <AnimatePresence initial={false}>
          {!hasToasts && (
            <motion.li
              key='empty'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: LEAVE }}
              className='hairline-border border-border text-muted-foreground absolute inset-0 flex items-center justify-center rounded-xl border-dashed text-[13px]'
            >
              No notifications, send one to fill the stack
            </motion.li>
          )}
        </AnimatePresence>
      </motion.ol>
      <div className='flex items-center gap-2'>
        <Button size='sm' variant='outline' onClick={sendToast}>
          <PlusIcon />
          Send a notification
        </Button>
        <Button
          size='sm'
          variant='ghost'
          aria-pressed={isPinnedOpen}
          disabled={!hasToasts}
          onClick={togglePinned}
          className='text-muted-foreground'
        >
          <ChevronsUpDownIcon />
          Keep expanded
        </Button>
      </div>
    </div>
  );
}
