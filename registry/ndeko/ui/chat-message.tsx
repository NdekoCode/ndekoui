// Adapted from prompt-kit (MIT, Copyright (c) 2025 Julien Thibeaut).
'use client';

import { cn } from '@/registry/ndeko/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import { Markdown } from '@/registry/ndeko/ui/chat-markdown';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/registry/ndeko/ui/tooltip';

type MessageProps = React.ComponentProps<'div'>;

function Message({ className, ...props }: MessageProps) {
  return (
    <div
      data-slot='message'
      className={cn('flex gap-3', className)}
      {...props}
    />
  );
}

type MessageAvatarProps = {
  alt: string;
  fallback: string;
  src?: string;
  className?: string;
};

function MessageAvatar({ src, alt, fallback, className }: MessageAvatarProps) {
  return (
    <Avatar className={cn('size-8 shrink-0', className)}>
      {src && <AvatarImage src={src} alt={alt} />}
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
}

type MessageGlyphProps = React.ComponentProps<'span'> & {
  /** The hue of the plate; any CSS colour or token. */
  color?: string;
};

const DEFAULT_GLYPH_COLOR = 'var(--primary)';

function MessageGlyph({
  color = DEFAULT_GLYPH_COLOR,
  className,
  style,
  ...props
}: MessageGlyphProps) {
  const plateStyle = { '--gem': color, ...style } as React.CSSProperties;

  return (
    <span
      data-slot='message-glyph'
      aria-hidden='true'
      style={plateStyle}
      className={cn(
        'gem-plate inline-flex size-8 shrink-0 items-center justify-center rounded-full [&_svg]:size-4',
        className
      )}
      {...props}
    />
  );
}

type MessageVariant = 'bubble' | 'plain';

const CONTENT_VARIANT: Record<MessageVariant, string> = {
  bubble:
    'rounded-xl bg-foreground/[0.05] px-3.5 py-2 dark:bg-foreground/[0.07]',
  plain: '',
};

type MessageContentProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  children: React.ReactNode;
  /** Applies to string children only. */
  markdown?: boolean;
  variant?: MessageVariant;
};

function isMarkdownText(
  children: React.ReactNode,
  markdown: boolean
): children is string {
  const isText = typeof children === 'string';
  return markdown && isText;
}

function MessageContent({
  children,
  markdown = false,
  variant = 'bubble',
  className,
  ...props
}: MessageContentProps) {
  const classNames = cn(
    'text-foreground min-w-0 text-sm leading-relaxed break-words',
    CONTENT_VARIANT[variant],
    className
  );

  if (isMarkdownText(children, markdown)) {
    return (
      <div data-slot='message-content' className={classNames} {...props}>
        <Markdown>{children}</Markdown>
      </div>
    );
  }

  return (
    <div
      data-slot='message-content'
      className={cn('whitespace-pre-wrap', classNames)}
      {...props}
    >
      {children}
    </div>
  );
}

type MessageActionsProps = React.ComponentProps<'div'>;

function MessageActions({ className, ...props }: MessageActionsProps) {
  return (
    <TooltipProvider>
      <div
        data-slot='message-actions'
        className={cn(
          'text-muted-foreground flex items-center gap-0.5',
          className
        )}
        {...props}
      />
    </TooltipProvider>
  );
}

type MessageActionProps = {
  tooltip: React.ReactNode;
  /** The control the tooltip explains, usually an icon `Button` with an `aria-label`. */
  children: React.ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
};

function MessageAction({
  tooltip,
  children,
  side = 'top',
  className,
}: MessageActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side={side} className={className}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

export {
  Message,
  MessageAction,
  MessageActions,
  MessageAvatar,
  MessageContent,
  MessageGlyph,
  type MessageVariant,
};
