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

const TEXT_TO_COPY = 'https://example.com/invite/k7p2m9';
const COPIED_RESET_MS = 1500;

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
  return { key: 'copy', icon: <CopyIcon /> };
}

function copyLabelOf(isCopied: boolean) {
  if (isCopied) {
    return 'Copied';
  }
  return 'Copy to clipboard';
}

export default function Button30() {
  const [isCopied, setIsCopied] = useState(false);
  const shouldReduceMotion = usePrefersReducedMotion();
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

  async function copyText() {
    try {
      await navigator.clipboard.writeText(TEXT_TO_COPY);
      setIsCopied(true);
    } catch {
      setIsCopied(false);
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger
        delay={0}
        render={
          <Button
            variant='outline'
            size='icon'
            onClick={copyText}
            disabled={isCopied}
            focusableWhenDisabled
            aria-label={copyLabelOf(isCopied)}
            className='data-disabled:opacity-100'
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
      <TooltipContent>Copy to clipboard</TooltipContent>
    </Tooltip>
  );
}
