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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

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
  return { key: 'copy', icon: <CopyIcon /> };
}

function tooltipLabelOf(isCopied: boolean) {
  if (isCopied) {
    return 'Copied';
  }
  return 'Copy address';
}

export function CopyEmail({ email }: { email: string }) {
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

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setIsCopied(true);
    } catch {
      setIsCopied(false);
    }
  }

  return (
    <div className='flex items-center gap-1'>
      <a
        href={`mailto:${email}`}
        className='text-primary-ink focus-visible:ring-ring/25 rounded-sm text-[13px] font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px]'
      >
        {email}
      </a>
      <Tooltip>
        <TooltipTrigger
          delay={0}
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              className='text-muted-foreground'
              aria-label={`Copy ${email}`}
              onClick={copyEmail}
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
        <TooltipContent>{tooltipLabelOf(isCopied)}</TooltipContent>
      </Tooltip>
      <span className='sr-only' role='status'>
        {isCopied && 'Email address copied'}
      </span>
    </div>
  );
}
