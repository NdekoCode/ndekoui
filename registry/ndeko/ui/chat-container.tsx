// Adapted from prompt-kit (MIT, Copyright (c) 2025 Julien Thibeaut).
'use client';

import { useReducedMotion } from 'motion/react';
import {
  StickToBottom,
  useStickToBottomContext,
  type StickToBottomContext,
} from 'use-stick-to-bottom';

import { cn } from '@/registry/ndeko/lib/utils';

type ScrollBehaviour = 'smooth' | 'instant';

function scrollBehaviourOf(
  shouldReduceMotion: boolean | null
): ScrollBehaviour {
  if (shouldReduceMotion) {
    return 'instant';
  }
  return 'smooth';
}

type ChatContainerRootProps = React.ComponentProps<'div'> & {
  /** Receives `scrollToBottom`, `isAtBottom` and the rest, for a composer that sits outside the list. */
  contextRef?: React.Ref<StickToBottomContext>;
};

function ChatContainerRoot({
  className,
  children,
  contextRef,
  ...props
}: ChatContainerRootProps) {
  const shouldReduceMotion = useReducedMotion();
  const resize = scrollBehaviourOf(shouldReduceMotion);

  return (
    <StickToBottom
      data-slot='chat-container'
      role='log'
      resize={resize}
      initial='instant'
      contextRef={contextRef}
      className={cn('relative flex min-h-0 flex-col', className)}
      {...props}
    >
      {children}
    </StickToBottom>
  );
}

type ChatContainerContentProps = Omit<
  React.ComponentProps<'div'>,
  'children'
> & {
  children: React.ReactNode;
  /** Classes of the element that scrolls. */
  scrollClassName?: string;
};

function ChatContainerContent({
  className,
  scrollClassName,
  children,
  ...props
}: ChatContainerContentProps) {
  return (
    <StickToBottom.Content
      data-slot='chat-container-content'
      scrollClassName={cn(
        'overscroll-contain [scrollbar-color:color-mix(in_oklab,var(--foreground)_20%,transparent)_transparent] [scrollbar-width:thin]',
        scrollClassName
      )}
      className={cn('flex w-full flex-col', className)}
      {...props}
    >
      {children}
    </StickToBottom.Content>
  );
}

type ChatContainerScrollAnchorProps = React.ComponentProps<'div'>;

function ChatContainerScrollAnchor({
  className,
  ...props
}: ChatContainerScrollAnchorProps) {
  return (
    <div
      data-slot='chat-container-scroll-anchor'
      aria-hidden='true'
      className={cn('h-px w-full shrink-0 scroll-mt-4', className)}
      {...props}
    />
  );
}

const useChatContainer = useStickToBottomContext;

export {
  ChatContainerContent,
  ChatContainerRoot,
  ChatContainerScrollAnchor,
  useChatContainer,
  type StickToBottomContext as ChatContainerContext,
};
