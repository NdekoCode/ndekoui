'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useEffect, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { CheckIcon, TrashIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

type HoldStatus = 'idle' | 'holding' | 'deleted';

const HOLD_DURATION_MS = 2000;
const DELETED_RESET_MS = 1800;
const HOLD_KEYS = new Set([' ', 'Enter']);

const FILL_LAYER =
  'bg-destructive pointer-events-none absolute inset-0 flex items-center justify-center rounded-[inherit] px-3.5 text-white';

const FILL_BY_CLIP = [
  '[clip-path:inset(0_100%_0_0)] transition-[clip-path] duration-200 ease-(--ease-out-strong)',
  'group-data-filled/button:[clip-path:inset(0)] group-data-filled/button:duration-2000 group-data-filled/button:ease-linear',
].join(' ');

const FILL_BY_FADE = [
  'opacity-0 transition-opacity duration-200 ease-(--ease-out-strong)',
  'group-data-filled/button:opacity-100 group-data-filled/button:duration-2000 group-data-filled/button:ease-linear',
].join(' ');

const CONTENT =
  'col-start-1 row-start-1 flex items-center justify-center gap-2';

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const SWAP_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function swapVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

function fillMotionOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FILL_BY_FADE;
  }
  return FILL_BY_CLIP;
}

function contentOf(isDeleted: boolean) {
  if (isDeleted) {
    return { key: 'deleted', icon: <CheckIcon />, label: 'Deleted' };
  }
  return { key: 'hold', icon: <TrashIcon />, label: 'Hold to delete' };
}

function HoldContent({
  isDeleted,
  variants,
}: {
  isDeleted: boolean;
  variants: Variants;
}) {
  const content = contentOf(isDeleted);

  return (
    <span className='grid'>
      <span aria-hidden='true' className={cn(CONTENT, 'invisible')}>
        <TrashIcon />
        Hold to delete
      </span>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={content.key}
          className={CONTENT}
          variants={variants}
          initial='enter'
          animate='visible'
          exit='exit'
          transition={SWAP_TRANSITION}
        >
          {content.icon}
          {content.label}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function preventContextMenu(event: React.MouseEvent) {
  event.preventDefault();
}

export default function Button58() {
  const [status, setStatus] = useState<HoldStatus>('idle');
  const shouldReduceMotion = usePrefersReducedMotion();
  const swapVariants = swapVariantsOf(shouldReduceMotion);
  const isHolding = status === 'holding';
  const isDeleted = status === 'deleted';
  const isFilled = status !== 'idle';

  useEffect(() => {
    if (!isHolding) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setStatus('deleted');
    }, HOLD_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [isHolding]);

  useEffect(() => {
    if (!isDeleted) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setStatus('idle');
    }, DELETED_RESET_MS);
    return () => window.clearTimeout(timeout);
  }, [isDeleted]);

  function startHold() {
    if (status !== 'idle') {
      return;
    }
    setStatus('holding');
  }

  function cancelHold() {
    if (!isHolding) {
      return;
    }
    setStatus('idle');
  }

  function pressPointer(event: React.PointerEvent<HTMLButtonElement>) {
    const isPrimaryButton = event.button === 0;
    if (!isPrimaryButton) {
      return;
    }
    startHold();
  }

  function pressKey(event: React.KeyboardEvent<HTMLButtonElement>) {
    const isHoldKey = HOLD_KEYS.has(event.key);
    if (!isHoldKey) {
      return;
    }
    event.preventDefault();
    if (event.repeat) {
      return;
    }
    startHold();
  }

  function releaseKey(event: React.KeyboardEvent<HTMLButtonElement>) {
    const isHoldKey = HOLD_KEYS.has(event.key);
    if (!isHoldKey) {
      return;
    }
    cancelHold();
  }

  return (
    <>
      <Button
        variant='outline'
        data-filled={isFilled || undefined}
        className='touch-manipulation [-webkit-touch-callout:none]'
        onPointerDown={pressPointer}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        onKeyDown={pressKey}
        onKeyUp={releaseKey}
        onBlur={cancelHold}
        onContextMenu={preventContextMenu}
      >
        <HoldContent isDeleted={isDeleted} variants={swapVariants} />
        <span
          aria-hidden='true'
          className={cn(FILL_LAYER, fillMotionOf(shouldReduceMotion))}
        >
          <HoldContent isDeleted={isDeleted} variants={swapVariants} />
        </span>
      </Button>
      <span className='sr-only' role='status'>
        {isDeleted && 'Project deleted'}
      </span>
    </>
  );
}
