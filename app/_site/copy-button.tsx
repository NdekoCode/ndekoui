'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { CheckIcon, CopyIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const COPIED_DURATION_MS = 1600;

const SWAP_TRANSITION = { duration: 0.15, ease: [0.2, 0, 0, 1] } as const;

type CopyButtonProps = {
  value: string;
  label: string;
};

function swapMotion(reduceMotion: boolean | null) {
  if (reduceMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };
  }
  return {
    initial: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  };
}

function iconKeyOf(hasCopied: boolean) {
  if (hasCopied) {
    return 'copied';
  }
  return 'copy';
}

function announcementOf(hasCopied: boolean) {
  if (hasCopied) {
    return 'Copied';
  }
  return '';
}

export function CopyButton({ value, label }: CopyButtonProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotion();
  const swap = swapMotion(reduceMotion);

  useEffect(() => {
    return () => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
      }
    };
  }, []);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setHasCopied(true);
    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
    }
    resetTimer.current = setTimeout(() => {
      setHasCopied(false);
    }, COPIED_DURATION_MS);
  }

  const iconKey = iconKeyOf(hasCopied);
  const announcement = announcementOf(hasCopied);

  return (
    <Button variant='ghost' size='icon-sm' aria-label={label} onClick={copy}>
      <AnimatePresence mode='popLayout' initial={false}>
        <motion.span
          key={iconKey}
          className='flex'
          initial={swap.initial}
          animate={swap.animate}
          exit={swap.exit}
          transition={SWAP_TRANSITION}
        >
          {hasCopied && <CheckIcon />}
          {!hasCopied && <CopyIcon />}
        </motion.span>
      </AnimatePresence>
      <span className='sr-only' aria-live='polite'>
        {announcement}
      </span>
    </Button>
  );
}
