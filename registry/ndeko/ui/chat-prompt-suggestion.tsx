// Adapted from prompt-kit (MIT, Copyright (c) 2025 Julien Thibeaut).
'use client';

import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

type PromptSuggestionProps = React.ComponentProps<typeof Button> & {
  /** Turns the pill into a list row that marks where the typed text matches. */
  highlight?: string;
};

type HighlightParts = {
  before: string;
  match: string;
  after: string;
};

function highlightPartsOf(content: string, highlight: string) {
  const lowerContent = content.toLowerCase();
  const lowerHighlight = highlight.toLowerCase();
  const start = lowerContent.indexOf(lowerHighlight);
  if (start === -1) {
    return null;
  }
  const end = start + highlight.length;
  const parts: HighlightParts = {
    before: content.slice(0, start),
    match: content.slice(start, end),
    after: content.slice(end),
  };
  return parts;
}

function trimmedHighlightOf(highlight: string | undefined) {
  if (!highlight) {
    return '';
  }
  return highlight.trim();
}

function HighlightedText({
  content,
  highlight,
}: {
  content: string;
  highlight: string;
}) {
  const parts = highlightPartsOf(content, highlight);

  if (!parts) {
    return (
      <span className='text-muted-foreground whitespace-pre-wrap'>
        {content}
      </span>
    );
  }

  return (
    <span className='whitespace-pre-wrap'>
      <span className='text-muted-foreground'>{parts.before}</span>
      <span className='text-primary-ink font-medium'>{parts.match}</span>
      <span className='text-muted-foreground'>{parts.after}</span>
    </span>
  );
}

const ROW = 'h-auto w-full justify-start py-2 text-start font-normal';

function PromptSuggestion({
  children,
  variant,
  size,
  className,
  highlight,
  ...props
}: PromptSuggestionProps) {
  const trimmedHighlight = trimmedHighlightOf(highlight);
  const isHighlightMode = trimmedHighlight.length > 0;
  const isTextContent = typeof children === 'string';

  if (!isHighlightMode) {
    return (
      <Button
        type='button'
        variant={variant ?? 'outline'}
        size={size ?? 'default'}
        className={cn('font-normal', className)}
        {...props}
      >
        {children}
      </Button>
    );
  }

  if (!isTextContent) {
    return (
      <Button
        type='button'
        variant={variant ?? 'ghost'}
        size={size ?? 'sm'}
        className={cn(ROW, className)}
        {...props}
      >
        {children}
      </Button>
    );
  }

  return (
    <Button
      type='button'
      variant={variant ?? 'ghost'}
      size={size ?? 'sm'}
      className={cn(ROW, 'gap-0', className)}
      {...props}
    >
      <HighlightedText content={children} highlight={trimmedHighlight} />
    </Button>
  );
}

export { PromptSuggestion, type PromptSuggestionProps };
