'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useEffect, useState } from 'react';

import { CheckIcon, CopyIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

const INSTALL_COMMAND = 'pnpm add @fernwick/sdk';
const COPY_LABEL = `Copy ${INSTALL_COMMAND}`;
const COPIED_RESET_MS = 1600;

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const ICON_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const FADE_VARIANTS: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

function iconVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return ICON_VARIANTS;
}

function copyGlyphOf(isCopied: boolean) {
  if (isCopied) {
    return {
      key: 'copied',
      icon: <CheckIcon className='text-success-foreground' />,
    };
  }
  return { key: 'copy', icon: <CopyIcon className='text-muted-foreground' /> };
}

export default function Button63() {
  const [isCopied, setIsCopied] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const iconVariants = iconVariantsOf(shouldReduceMotion);
  const glyph = copyGlyphOf(isCopied);

  useEffect(() => {
    if (!isCopied) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setIsCopied(false);
    }, COPIED_RESET_MS);
    return () => window.clearTimeout(timeout);
  }, [isCopied]);

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(INSTALL_COMMAND);
      setIsCopied(true);
    } catch {
      setIsCopied(false);
    }
  }

  return (
    <>
      <Button
        variant='outline'
        className='gap-3 pe-3 font-mono text-xs'
        aria-label={COPY_LABEL}
        onClick={copyCommand}
      >
        {INSTALL_COMMAND}
        <span className='relative flex'>
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.span
              key={glyph.key}
              className='flex'
              variants={iconVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
            >
              {glyph.icon}
            </motion.span>
          </AnimatePresence>
        </span>
      </Button>
      <span className='sr-only' role='status'>
        {isCopied && 'Install command copied'}
      </span>
    </>
  );
}
