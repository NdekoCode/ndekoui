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
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

const INVITE_LINK = 'https://acme.app/join/7f3k2m';
const COPIED_DURATION_MS = 1500;

const FIELD_BUTTON =
  'text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-ring/25 absolute inset-y-0 end-1 my-auto flex size-6 items-center justify-center rounded-md outline-none transition-[color,background-color,box-shadow] focus-visible:ring-[3px]';

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

function copyGlyphOf(isCopied: boolean) {
  if (isCopied) {
    return {
      key: 'copied',
      icon: <CheckIcon className='text-success-foreground size-4' />,
    };
  }
  return { key: 'copy', icon: <CopyIcon className='size-4' /> };
}

function copyLabelOf(isCopied: boolean) {
  if (isCopied) {
    return 'Copied';
  }
  return 'Copy invite link';
}

export default function Input54() {
  const [isCopied, setIsCopied] = useState(false);
  const shouldReduceMotion = usePrefersReducedMotion();
  const swapVariants = swapVariantsOf(shouldReduceMotion);
  const glyph = copyGlyphOf(isCopied);
  const copyLabel = copyLabelOf(isCopied);

  useEffect(() => {
    if (!isCopied) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setIsCopied(false);
    }, COPIED_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [isCopied]);

  async function copyInviteLink() {
    await navigator.clipboard.writeText(INVITE_LINK);
    setIsCopied(true);
  }

  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Invite link</FieldLabel>
      <div className='relative'>
        <Input className='pe-8' defaultValue={INVITE_LINK} readOnly />
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type='button'
                className={FIELD_BUTTON}
                onClick={copyInviteLink}
                aria-label={copyLabel}
              />
            }
          >
            <AnimatePresence mode='popLayout' initial={false}>
              <motion.span
                key={glyph.key}
                className='flex'
                variants={swapVariants}
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
        <span className='sr-only' role='status'>
          {isCopied && 'Invite link copied'}
        </span>
      </div>
    </Field>
  );
}
