'use client';

import { AnimatePresence, motion } from 'motion/react';

import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { FileTextIcon, ImageIcon, XIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

import type { Attachment, AttachmentKind } from './data';
import { layoutTransitionOf, settlePresenceOf } from './presence';

const KILOBYTE = 1024;

const MEGABYTE = KILOBYTE * 1024;

const KIND_LOOK: Record<
  AttachmentKind,
  { icon: React.ReactNode; gem: string }
> = {
  document: { icon: <FileTextIcon />, gem: 'var(--primary)' },
  image: { icon: <ImageIcon />, gem: 'var(--info)' },
};

export function formatBytes(size: number) {
  if (size < KILOBYTE) {
    return `${size} B`;
  }
  if (size < MEGABYTE) {
    const kilobytes = Math.round(size / KILOBYTE);
    return `${kilobytes} KB`;
  }
  const tenths = Math.round((size / MEGABYTE) * 10);
  const megabytes = tenths / 10;
  return `${megabytes} MB`;
}

type AttachmentListProps = {
  attachments: Attachment[];
  onRemove: (id: string) => void;
  disabled?: boolean;
};

export function AttachmentList({
  attachments,
  onRemove,
  disabled = false,
}: AttachmentListProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const presence = settlePresenceOf(shouldReduceMotion);
  const layoutTransition = layoutTransitionOf(shouldReduceMotion);
  const transition = { ...presence.transition, layout: layoutTransition };
  const hasAttachments = attachments.length > 0;

  return (
    <ul
      aria-label='Attachments'
      className={cn(
        'flex flex-wrap gap-1.5',
        hasAttachments && 'px-1 pt-1 pb-2'
      )}
    >
      <AnimatePresence mode='popLayout' initial={false}>
        {attachments.map((attachment) => {
          const look = KIND_LOOK[attachment.kind];
          const plateStyle = { '--gem': look.gem } as React.CSSProperties;
          const size = formatBytes(attachment.size);

          return (
            <motion.li
              key={attachment.id}
              layout
              initial={presence.initial}
              animate={presence.animate}
              exit={presence.exit}
              transition={transition}
              className='bg-card hairline-ring ring-border flex h-11 max-w-60 items-center gap-2 rounded-lg ps-1.5 pe-1 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
            >
              <span
                aria-hidden='true'
                style={plateStyle}
                className='gem-plate inline-flex size-7 shrink-0 items-center justify-center rounded-md [&_svg]:size-3.5'
              >
                {look.icon}
              </span>
              <span className='min-w-0 flex-1'>
                <span className='block truncate text-xs font-medium'>
                  {attachment.name}
                </span>
                <span className='text-muted-foreground block text-xs tabular-nums'>
                  {size}
                </span>
              </span>
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                aria-label={`Remove ${attachment.name}`}
                disabled={disabled}
                onClick={() => onRemove(attachment.id)}
                className='text-muted-foreground'
              >
                <XIcon className='size-3.5' />
              </Button>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
