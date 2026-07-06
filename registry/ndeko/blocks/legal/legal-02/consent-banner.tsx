'use client';

import { AnimatePresence, motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { CookieIcon } from '@/registry/ndeko/lib/icons';
import {
  EASE_OUT_STRONG,
  fadePresence,
} from '@/registry/ndeko/lib/motion-presets';
import { Button } from '@/registry/ndeko/ui/button';

import { SITE_NAME } from './data';

const BANNER_PRESENCE = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: {
    opacity: 0,
    y: 8,
    transition: { duration: 0.2, ease: EASE_OUT_STRONG },
  },
  transition: { duration: 0.25, ease: EASE_OUT_STRONG },
};

function bannerPresenceOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return fadePresence();
  }
  return BANNER_PRESENCE;
}

type ConsentBannerProps = {
  isShown: boolean;
  pressed: string | null;
  onRejectAll: () => void;
  onAcceptAll: () => void;
  onCustomize: () => void;
};

/** It never covers the page: no backdrop, the article under it still scrolls and reads. */
export function ConsentBanner({
  isShown,
  pressed,
  onRejectAll,
  onAcceptAll,
  onCustomize,
}: ConsentBannerProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const presence = bannerPresenceOf(shouldReduceMotion);

  return (
    <AnimatePresence initial={false}>
      {isShown && (
        <motion.div
          key='banner'
          role='region'
          aria-label='Cookie choices'
          className='surface-raised pointer-events-auto flex w-full max-w-2xl flex-col gap-3 rounded-xl p-4 @2xl:flex-row @2xl:items-center @2xl:gap-6'
          {...presence}
        >
          <p className='min-w-0 flex-1 text-[13px] text-pretty'>
            <span className='font-medium'>{`Cookies on ${SITE_NAME}.`}</span> We
            use the ones the site needs to work. With your yes, we also count
            visits and remember your reading preferences.
          </p>
          <div className='flex flex-wrap items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              data-reject-all
              onClick={onRejectAll}
              className={pressedQuietOf(pressed === 'reject')}
            >
              Reject all
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={onAcceptAll}
              className={pressedQuietOf(pressed === 'accept')}
            >
              Accept all
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              data-customize
              onClick={onCustomize}
              className={pressedQuietOf(pressed === 'customize')}
            >
              Customize
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

type SettingsLinkProps = {
  isShown: boolean;
  isPressed: boolean;
  onOpen: () => void;
};

/** What the banner leaves behind once a choice is saved: the way back to it. */
export function SettingsLink({
  isShown,
  isPressed,
  onOpen,
}: SettingsLinkProps) {
  const fade = fadePresence();

  return (
    <AnimatePresence initial={false}>
      {isShown && (
        <motion.div key='settings' className='pointer-events-auto' {...fade}>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            data-cookie-settings
            onClick={onOpen}
            className={pressedQuietOf(isPressed)}
          >
            <CookieIcon />
            Cookie settings
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
