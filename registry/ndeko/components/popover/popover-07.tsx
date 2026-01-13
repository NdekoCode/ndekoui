'use client';

import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'motion/react';
import { useEffect, useState } from 'react';

import {
  CheckIcon,
  CodeIcon,
  CopyIcon,
  FacebookBrandIcon,
  MailIcon,
  TwitterXIcon,
} from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';
import { Input } from '@/registry/ndeko/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@/registry/ndeko/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

const SHARE_LINK = 'https://example.com/s/Avx8HD';
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
  return 'Copy link';
}

export default function Popover07() {
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

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(SHARE_LINK);
      setIsCopied(true);
    } catch {
      setIsCopied(false);
    }
  }

  return (
    <Popover>
      <PopoverTrigger render={<Button variant='outline' />}>
        Share
      </PopoverTrigger>
      <PopoverContent className='flex flex-col gap-3 text-center'>
        <PopoverTitle>Share code</PopoverTitle>
        <div className='flex flex-wrap justify-center gap-2'>
          <Button variant='outline' size='icon' aria-label='Copy embed code'>
            <CodeIcon />
          </Button>
          <Button variant='outline' size='icon' aria-label='Share on X'>
            <TwitterXIcon />
          </Button>
          <Button variant='outline' size='icon' aria-label='Share on Facebook'>
            <FacebookBrandIcon />
          </Button>
          <Button variant='outline' size='icon' aria-label='Share by email'>
            <MailIcon />
          </Button>
        </div>
        <div className='relative'>
          <Input
            readOnly
            defaultValue={SHARE_LINK}
            aria-label='Share link'
            className='pe-9'
          />
          <Tooltip>
            <TooltipTrigger
              delay={0}
              render={
                <Button
                  variant='ghost'
                  size='icon-sm'
                  onClick={copyLink}
                  disabled={isCopied}
                  focusableWhenDisabled
                  aria-label={copyLabelOf(isCopied)}
                  className='absolute end-0.5 top-0.5 data-disabled:opacity-100'
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
            <TooltipContent>Copy link</TooltipContent>
          </Tooltip>
        </div>
      </PopoverContent>
    </Popover>
  );
}
