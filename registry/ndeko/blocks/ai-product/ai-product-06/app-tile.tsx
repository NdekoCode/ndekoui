'use client';

import { AnimatePresence, motion, type Transition } from 'motion/react';
import { useId } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { pressedSolidOf } from '@/registry/ndeko/lib/demonstration';
import { EASE_OUT_STRONG } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { BrandTile } from '@/registry/ndeko/ui/brand-tile';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';
import { DrawnCheck } from '@/registry/ndeko/ui/drawn-check';

import type { App } from './data';

export type Anchor = 'start' | 'center' | 'end';

/** The cards of the outer tiles hang from the edge of the row, so none leaves the block. */
const ANCHOR_CLASS: Record<Anchor, string> = {
  start: 'start-0 origin-top-left',
  center: 'left-1/2 -translate-x-1/2 origin-top',
  end: 'end-0 origin-top-right',
};

const LIFT: Transition = { duration: 0.22, ease: EASE_OUT_STRONG };

const LEAVE: Transition = { duration: 0.1, ease: EASE_OUT_STRONG };

function liftOf(shouldReduceMotion: boolean) {
  if (shouldReduceMotion) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: LIFT },
      exit: { opacity: 0, transition: LEAVE },
    };
  }
  return {
    initial: { opacity: 0, scale: 0.94, y: -12 },
    animate: { opacity: 1, scale: 1, y: 0, transition: LIFT },
    exit: { opacity: 0, scale: 0.96, y: -6, transition: LEAVE },
  };
}

function toneOf(isActive: boolean, isDimmed: boolean) {
  if (isActive) {
    return 'bg-foreground/[0.09] -translate-y-0.5';
  }
  if (isDimmed) {
    return 'bg-foreground/[0.04] opacity-40';
  }
  return 'bg-foreground/[0.04]';
}

function stateWordOf(isConnected: boolean) {
  if (isConnected) {
    return 'connected';
  }
  return 'not connected';
}

type AppTileProps = {
  app: App;
  anchor: Anchor;
  isActive: boolean;
  isDimmed: boolean;
  isConnected: boolean;
  isTabStop: boolean;
  pressed: string | null;
  onActivate: (id: App['id']) => void;
  onConnect: (id: App['id']) => void;
};

export function AppTile({
  app,
  anchor,
  isActive,
  isDimmed,
  isConnected,
  isTabStop,
  pressed,
  onActivate,
  onConnect,
}: AppTileProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const cardId = useId();
  const lift = liftOf(shouldReduceMotion);
  const label = `${app.name}, ${stateWordOf(isConnected)}`;
  let tabIndex = -1;
  if (isTabStop) {
    tabIndex = 0;
  }
  let describedBy: string | undefined;
  if (isActive) {
    describedBy = cardId;
  }

  function connectFromKeyboard(event: React.KeyboardEvent<HTMLButtonElement>) {
    const isEnter = event.key === 'Enter';
    const isSpace = event.key === ' ';
    if (isEnter || isSpace) {
      event.preventDefault();
      onConnect(app.id);
    }
  }

  return (
    <li
      data-app-item={app.id}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') {
          onActivate(app.id);
        }
      }}
      className='relative'
    >
      <button
        type='button'
        data-app-tile={app.id}
        aria-label={label}
        aria-describedby={describedBy}
        tabIndex={tabIndex}
        onFocus={() => onActivate(app.id)}
        onClick={() => onActivate(app.id)}
        onKeyDown={connectFromKeyboard}
        className={cn(
          'focus-visible:ring-ring focus-visible:ring-offset-background relative flex size-12 cursor-pointer items-center justify-center rounded-2xl transition-[background-color,opacity,translate] duration-150 ease-(--ease-out-strong) outline-none focus-visible:ring-2 focus-visible:ring-offset-2 @xs:size-14 @md:size-20',
          toneOf(isActive, isDimmed)
        )}
      >
        <BrandTile brand={app.brand} size='2xl' />
        <AnimatePresence>
          {isConnected && (
            <span className='absolute -end-1 -top-1'>
              <DrawnCheck tone='success' />
            </span>
          )}
        </AnimatePresence>
      </button>
      <AnimatePresence>
        {isActive && (
          <motion.div
            key='card'
            id={cardId}
            initial={lift.initial}
            animate={lift.animate}
            exit={lift.exit}
            className={cn(
              'surface-raised absolute top-full z-10 mt-2 flex w-60 flex-col gap-3 rounded-xl p-3 @md:w-64',
              ANCHOR_CLASS[anchor]
            )}
          >
            <div className='flex items-center gap-2'>
              <BrandTile brand={app.brand} size='md' />
              <p className='text-[13px] font-medium'>{app.name}</p>
            </div>
            <p className='text-muted-foreground text-xs text-pretty'>
              {app.line}
            </p>
            <Swap swapKey={stateWordOf(isConnected)} className='self-start'>
              {!isConnected && (
                <Button
                  type='button'
                  size='sm'
                  onClick={() => onConnect(app.id)}
                  className={pressedSolidOf(pressed === `connect-${app.id}`)}
                >
                  Connect {app.name}
                </Button>
              )}
              {isConnected && (
                <span className='text-success-foreground flex h-7 items-center gap-1.5 text-xs font-medium'>
                  <DrawnCheck tone='success' entrance='draw' />
                  Connected
                </span>
              )}
            </Swap>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
