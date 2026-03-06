// Adapted from prompt-kit (MIT, Copyright (c) 2025 Julien Thibeaut).
'use client';

import { createContext, useContext, useId, useState } from 'react';

import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Markdown } from '@/registry/ndeko/ui/chat-markdown';
import { Fold } from '@/registry/ndeko/ui/chat-motion';

type ReasoningContextValue = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  contentId: string;
};

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

function useReasoningContext() {
  const context = useContext(ReasoningContext);
  if (!context) {
    throw new Error('useReasoningContext must be used within a Reasoning');
  }
  return context;
}

type ReasoningProps = {
  children: React.ReactNode;
  className?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Opens the reasoning while it streams and folds it once the answer starts. Only when uncontrolled. */
  isStreaming?: boolean;
};

function Reasoning({
  children,
  className,
  open,
  defaultOpen = false,
  onOpenChange,
  isStreaming = false,
}: ReasoningProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen || isStreaming);
  const [wasStreaming, setWasStreaming] = useState(isStreaming);
  const contentId = useId();
  const isControlled = open !== undefined;
  const isOpen = open ?? internalOpen;

  if (wasStreaming !== isStreaming) {
    setWasStreaming(isStreaming);
    if (!isControlled) {
      setInternalOpen(isStreaming);
    }
  }

  function changeOpen(nextOpen: boolean) {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  }

  const context: ReasoningContextValue = {
    isOpen,
    onOpenChange: changeOpen,
    contentId,
  };

  return (
    <ReasoningContext.Provider value={context}>
      <div data-slot='reasoning' className={className}>
        {children}
      </div>
    </ReasoningContext.Provider>
  );
}

function chevronTurnOf(isOpen: boolean) {
  if (isOpen) {
    return 'rotate-180';
  }
  return 'rotate-0';
}

type ReasoningTriggerProps = Omit<
  React.ComponentProps<'button'>,
  'onClick' | 'type'
>;

function ReasoningTrigger({
  children,
  className,
  ...props
}: ReasoningTriggerProps) {
  const { isOpen, onOpenChange, contentId } = useReasoningContext();

  function toggle() {
    onOpenChange(!isOpen);
  }

  return (
    <button
      type='button'
      data-slot='reasoning-trigger'
      aria-expanded={isOpen}
      aria-controls={contentId}
      onClick={toggle}
      className={cn(
        'text-muted-foreground hover:text-foreground focus-visible:ring-ring/25 inline-flex cursor-pointer items-center gap-1 rounded-md text-[13px] transition-colors outline-none focus-visible:ring-[3px]',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon
        className={cn(
          'size-3.5 transition-transform duration-200 ease-(--ease-out-strong)',
          chevronTurnOf(isOpen)
        )}
      />
    </button>
  );
}

type ReasoningContentProps = {
  children: React.ReactNode;
  /** Applies to string children only. */
  markdown?: boolean;
  className?: string;
  contentClassName?: string;
};

function isMarkdownText(
  children: React.ReactNode,
  markdown: boolean
): children is string {
  const isText = typeof children === 'string';
  return markdown && isText;
}

function ReasoningBody({
  children,
  markdown,
}: Pick<ReasoningContentProps, 'children' | 'markdown'>) {
  const shouldRenderMarkdown = isMarkdownText(children, Boolean(markdown));
  if (shouldRenderMarkdown) {
    return (
      <Markdown className='text-muted-foreground text-[13px]'>
        {children}
      </Markdown>
    );
  }
  return children;
}

function ReasoningContent({
  children,
  markdown = false,
  className,
  contentClassName,
}: ReasoningContentProps) {
  const { isOpen, contentId } = useReasoningContext();

  return (
    <Fold open={isOpen} id={contentId} className={className}>
      <div
        data-slot='reasoning-content'
        className={cn(
          'border-foreground/10 text-muted-foreground mt-2 border-s-2 ps-3 text-[13px] leading-relaxed',
          contentClassName
        )}
      >
        <ReasoningBody markdown={markdown}>{children}</ReasoningBody>
      </div>
    </Fold>
  );
}

export {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
  useReasoningContext,
  type ReasoningProps,
};
