'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useEffect, useState } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { CheckIcon, CopyIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

type CopyState = 'idle' | 'copied' | 'failed';

const COPIED_RESET_MS = 1500;

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const ICON_VARIANTS: Variants = {
  enter: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.6, filter: 'blur(2px)' },
};

const TEXT_VARIANTS: Variants = {
  enter: { opacity: 0, filter: 'blur(2px)' },
  visible: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(2px)' },
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

function textVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return TEXT_VARIANTS;
}

function copyGlyphOf(isCopied: boolean) {
  if (isCopied) {
    return {
      key: 'copied',
      icon: <CheckIcon className='text-success-foreground' />,
    };
  }
  return { key: 'copy', icon: <CopyIcon /> };
}

function copyLabelOf(isCopied: boolean) {
  if (isCopied) {
    return 'Copied';
  }
  return 'Copy the command';
}

export function CommandRow({ command }: { command: string }) {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const shouldReduceMotion = usePrefersReducedMotion();
  const iconVariants = iconVariantsOf(shouldReduceMotion);
  const textVariants = textVariantsOf(shouldReduceMotion);
  const isCopied = copyState === 'copied';
  const hasFailed = copyState === 'failed';
  const glyph = copyGlyphOf(isCopied);
  const copyLabel = copyLabelOf(isCopied);

  useEffect(() => {
    if (!isCopied) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setCopyState('idle');
    }, COPIED_RESET_MS);
    return () => window.clearTimeout(timeout);
  }, [isCopied]);

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(command);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  }

  return (
    <div className='flex flex-col gap-2'>
      <div className='bg-foreground/[0.04] hairline-ring ring-border flex h-11 items-center gap-2 rounded-lg ps-3.5 pe-1.5'>
        <code className='relative flex min-w-0 flex-1 overflow-hidden font-mono text-[13px]'>
          <AnimatePresence mode='popLayout' initial={false}>
            <motion.span
              key={command}
              className='truncate'
              variants={textVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
            >
              {command}
            </motion.span>
          </AnimatePresence>
        </code>
        <Tooltip>
          <TooltipTrigger
            delay={0}
            render={
              <Button
                variant='ghost'
                size='icon'
                onClick={copyCommand}
                aria-label={copyLabel}
              />
            }
          >
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
          </TooltipTrigger>
          <TooltipContent>{copyLabel}</TooltipContent>
        </Tooltip>
      </div>
      <p aria-live='polite' className='text-destructive-ink min-h-4 text-xs'>
        {hasFailed &&
          'Copying is blocked in this window, select the command and copy it by hand'}
      </p>
    </div>
  );
}
