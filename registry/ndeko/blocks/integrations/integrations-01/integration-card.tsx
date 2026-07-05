'use client';

import {
  AnimatePresence,
  motion,
  type MotionProps,
  type Transition,
  type Variants,
} from 'motion/react';
import { useId } from 'react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { BrandLogo } from '@/registry/ndeko/lib/brand-logos';
import {
  CheckIcon,
  LoaderCircleIcon,
  RefreshCwIcon,
} from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Button } from '@/registry/ndeko/ui/button';

import { APPROVER, CATEGORIES, nameOf, type Integration } from './data';

export type ConnectState = 'idle' | 'connecting' | 'connected' | 'failed';

const EASE_OUT_STRONG: [number, number, number, number] = [0.23, 1, 0.32, 1];

const SWAP_TRANSITION: Transition = { duration: 0.15, ease: [0.2, 0, 0, 1] };

const ENTER: Transition = { duration: 0.2, ease: EASE_OUT_STRONG };

const EXIT: Transition = { duration: 0.14, ease: EASE_OUT_STRONG };

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

type PresenceProps = Pick<
  MotionProps,
  'initial' | 'animate' | 'exit' | 'transition'
>;

const HEIGHT_PRESENCE: PresenceProps = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0, transition: EXIT },
  transition: ENTER,
};

const FADE_PRESENCE: PresenceProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: EXIT },
  transition: ENTER,
};

const CONNECTED_LOOK =
  'bg-success/10 text-success-foreground ring-success/25 shadow-none dark:bg-success/15 data-disabled:opacity-100 disabled:opacity-100';

const BUSY_LOOK = 'data-disabled:opacity-100 disabled:opacity-100';

export const CARD_SURFACE =
  'bg-card hairline-ring ring-border rounded-xl shadow-[0_1px_2px_rgb(0_0_0/0.04)] dark:bg-foreground/[0.03]';

function swapVariantsOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_VARIANTS;
  }
  return SWAP_VARIANTS;
}

function heightPresenceOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_PRESENCE;
  }
  return HEIGHT_PRESENCE;
}

function labelOf(state: ConnectState) {
  if (state === 'connecting') {
    return 'Connecting';
  }
  if (state === 'connected') {
    return 'Connected';
  }
  if (state === 'failed') {
    return 'Try again';
  }
  return 'Connect';
}

function glyphOf(state: ConnectState) {
  if (state === 'connecting') {
    return {
      key: 'connecting',
      icon: <LoaderCircleIcon className='animate-spin' />,
    };
  }
  if (state === 'connected') {
    return { key: 'connected', icon: <CheckIcon /> };
  }
  if (state === 'failed') {
    return { key: 'failed', icon: <RefreshCwIcon /> };
  }
  return null;
}

function lookOf(state: ConnectState) {
  if (state === 'connected') {
    return CONNECTED_LOOK;
  }
  if (state === 'connecting') {
    return BUSY_LOOK;
  }
  return undefined;
}

function describedByOf(isFailed: boolean, errorId: string) {
  if (isFailed) {
    return errorId;
  }
  return undefined;
}

type ConnectButtonProps = {
  name: string;
  state: ConnectState;
  errorId: string;
  onConnect: () => void;
};

/** One pill for every state: Connect becomes Connecting, then Connected or Try again, and resizes to its label. */
function ConnectButton({
  name,
  state,
  errorId,
  onConnect,
}: ConnectButtonProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const variants = swapVariantsOf(shouldReduceMotion);
  const label = labelOf(state);
  const glyph = glyphOf(state);
  const isConnecting = state === 'connecting';
  const isConnected = state === 'connected';
  const isLocked = isConnecting || isConnected;
  const isFailed = state === 'failed';

  return (
    <Button
      size='sm'
      disabled={isLocked}
      focusableWhenDisabled
      aria-label={`${label}: ${name}`}
      aria-describedby={describedByOf(isFailed, errorId)}
      onClick={onConnect}
      className={lookOf(state)}
    >
      <AnimatedSize
        as='span'
        axis='width'
        contentClassName='relative flex items-center gap-1.5'
      >
        <AnimatePresence mode='popLayout' initial={false}>
          {glyph && (
            <motion.span
              key={glyph.key}
              variants={variants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
              className='flex'
            >
              {glyph.icon}
            </motion.span>
          )}
        </AnimatePresence>
        <AnimatePresence mode='popLayout' initial={false}>
          <motion.span
            key={label}
            variants={variants}
            initial='enter'
            animate='visible'
            exit='exit'
            transition={SWAP_TRANSITION}
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </AnimatedSize>
    </Button>
  );
}

type IntegrationCardProps = {
  integration: Integration;
  state: ConnectState;
  onConnect: () => void;
  onDisconnect: () => void;
};

export function IntegrationCard({
  integration,
  state,
  onConnect,
  onDisconnect,
}: IntegrationCardProps) {
  const titleId = useId();
  const errorId = useId();
  const shouldReduceMotion = usePrefersReducedMotion();
  const swapVariants = swapVariantsOf(shouldReduceMotion);
  const heightPresence = heightPresenceOf(shouldReduceMotion);
  const category = CATEGORIES[integration.category];
  const name = nameOf(integration);
  const isConnected = state === 'connected';
  const isFailed = state === 'failed';

  return (
    <article
      aria-labelledby={titleId}
      className={cn(CARD_SURFACE, 'flex h-full flex-col p-4')}
    >
      <div className='flex items-center gap-3'>
        <span className='keycap-3d flex size-9 shrink-0 items-center justify-center rounded-lg'>
          <BrandLogo brand={integration.brand} className='size-4.5' />
        </span>
        <div className='min-w-0 flex-1'>
          <h3 id={titleId} className='truncate text-sm font-medium'>
            {name}
          </h3>
          <p className='text-muted-foreground text-xs'>{category.label}</p>
        </div>
      </div>
      <p className='text-muted-foreground mt-3 text-[13px] leading-relaxed text-pretty'>
        {integration.description}
      </p>
      <AnimatePresence initial={false}>
        {isFailed && (
          <motion.p
            key='approval'
            id={errorId}
            {...heightPresence}
            className='text-destructive-ink overflow-hidden text-xs leading-relaxed'
          >
            <span className='block pt-2'>
              {name} needs a workspace owner to approve it. A request went to{' '}
              {APPROVER}. Try again once they approve.
            </span>
          </motion.p>
        )}
      </AnimatePresence>
      <div className='mt-auto flex items-center gap-1.5 pt-4'>
        <ConnectButton
          name={name}
          state={state}
          errorId={errorId}
          onConnect={onConnect}
        />
        <AnimatePresence initial={false}>
          {isConnected && (
            <motion.span
              key='disconnect'
              variants={swapVariants}
              initial='enter'
              animate='visible'
              exit='exit'
              transition={SWAP_TRANSITION}
              className='flex'
            >
              <Button
                variant='ghost'
                size='sm'
                aria-label={`Disconnect ${name}`}
                onClick={onDisconnect}
              >
                Disconnect
              </Button>
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </article>
  );
}
