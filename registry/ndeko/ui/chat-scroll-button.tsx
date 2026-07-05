// Adapted from prompt-kit (MIT, Copyright (c) 2025 Julien Thibeaut).
'use client';

import {
  AnimatePresence,
  motion,
  type MotionProps,
  type Transition,
} from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';
import { useChatContainer } from '@/registry/ndeko/ui/chat-container';

type PresenceProps = Pick<
  MotionProps,
  'initial' | 'animate' | 'exit' | 'transition'
>;

const ENTER: Transition = { duration: 0.2, ease: [0.23, 1, 0.32, 1] };

const EXIT: Transition = { duration: 0.12, ease: [0.23, 1, 0.32, 1] };

const RISE_PRESENCE: PresenceProps = {
  initial: { opacity: 0, y: 8, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 8, scale: 0.95, transition: EXIT },
  transition: ENTER,
};

const FADE_PRESENCE: PresenceProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: EXIT },
  transition: ENTER,
};

function presenceOf(shouldReduceMotion: boolean | null) {
  if (shouldReduceMotion) {
    return FADE_PRESENCE;
  }
  return RISE_PRESENCE;
}

type ScrollButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  'children' | 'onClick'
> & {
  /** Classes of the element that appears and leaves, to place it over the list. */
  wrapperClassName?: string;
  label?: string;
};

function ScrollButton({
  variant = 'outline',
  size = 'icon',
  label = 'Scroll to the latest message',
  wrapperClassName,
  className,
  ...props
}: ScrollButtonProps) {
  const { isAtBottom, scrollToBottom } = useChatContainer();
  const shouldReduceMotion = usePrefersReducedMotion();
  const presence = presenceOf(shouldReduceMotion);
  const isVisible = !isAtBottom;

  function scrollDown() {
    scrollToBottom();
  }

  return (
    <AnimatePresence initial={false}>
      {isVisible && (
        <motion.div
          key='scroll-button'
          data-slot='scroll-button'
          className={cn('z-10 inline-flex', wrapperClassName)}
          {...presence}
        >
          <Button
            type='button'
            variant={variant}
            size={size}
            aria-label={label}
            onClick={scrollDown}
            className={cn('shadow-md shadow-black/6', className)}
            {...props}
          >
            <ChevronDownIcon />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { ScrollButton, type ScrollButtonProps };
