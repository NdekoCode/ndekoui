'use client';

import { AnimatePresence, motion } from 'motion/react';

import { MotionNumber } from '@/components/core/motion-number';
import { usePrefersReducedMotion } from '@/registry/ndeko/hooks/use-prefers-reduced-motion';
import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { XIcon } from '@/registry/ndeko/lib/icons';
import { risePresenceOf } from '@/registry/ndeko/lib/motion-presets';
import { cn } from '@/registry/ndeko/lib/utils';
import { AnimatedSize } from '@/registry/ndeko/ui/animated-size';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';
import { Swap } from '@/registry/ndeko/ui/chat-motion';

import { OWNERS, type OwnerId } from './data';
import type { BulkMode } from './session';

/** What the bar offers arrives with a fade, since the bar changes width around it. */
const CHOICES =
  'flex items-center gap-1 transition-opacity duration-200 starting:opacity-0';

function exportWordOf(isExported: boolean) {
  if (isExported) {
    return 'Exported';
  }
  return 'Export';
}

/** On a narrow bar the names of the owners need the room the count takes while one is picked. */
function countVisibilityOf(isPickingOwner: boolean) {
  if (isPickingOwner) {
    return 'hidden @lg:flex';
  }
  return 'flex';
}

type BulkBarProps = {
  count: number;
  mode: BulkMode;
  isExported: boolean;
  pressed: string | null;
  onShowOwners: () => void;
  onHideOwners: () => void;
  onAssign: (owner: OwnerId) => void;
  onExport: () => void;
  onClear: () => void;
};

/**
 * The bar keeps its place at the foot of the block whether it shows or not, so selecting a row
 * moves nothing. The owners are picked in the bar itself: no layer opens over the table.
 */
export function BulkBar({
  count,
  mode,
  isExported,
  pressed,
  onShowOwners,
  onHideOwners,
  onAssign,
  onExport,
  onClear,
}: BulkBarProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const presence = risePresenceOf(shouldReduceMotion);
  const hasSelection = count > 0;
  const isPickingOwner = mode === 'owners';
  const exportWord = exportWordOf(isExported);

  function leaveOwnersOnEscape(event: React.KeyboardEvent<HTMLElement>) {
    const isEscape = event.key === 'Escape';
    if (isEscape && isPickingOwner) {
      onHideOwners();
    }
  }

  return (
    <div className='pointer-events-none sticky bottom-4 z-10 flex h-11 justify-center'>
      <AnimatePresence initial={false}>
        {hasSelection && (
          <motion.section
            key='bulk'
            aria-label='Selected accounts'
            onKeyDown={leaveOwnersOnEscape}
            className='surface-raised pointer-events-auto flex h-11 max-w-full items-center gap-2 rounded-full ps-4 pe-1.5'
            {...presence}
          >
            <p
              className={cn(
                'shrink-0 items-baseline gap-1 text-[13px] font-medium',
                countVisibilityOf(isPickingOwner)
              )}
            >
              <MotionNumber value={count} />
              selected
            </p>
            <AnimatedSize axis='width'>
              {isPickingOwner && (
                <div role='group' aria-label='Assign to' className={CHOICES}>
                  <span className='text-muted-foreground hidden pe-1 text-xs @lg:inline'>
                    Assign to
                  </span>
                  {OWNERS.map((owner) => (
                    <Button
                      key={owner.id}
                      type='button'
                      variant='ghost'
                      size='sm'
                      data-bulk-owner={owner.id}
                      aria-label={`Assign to ${owner.name}`}
                      onClick={() => onAssign(owner.id)}
                      className={cn(
                        'gap-1 px-1.5 @lg:gap-1.5',
                        pressedQuietOf(pressed === `owner-${owner.id}`)
                      )}
                    >
                      <Avatar seed={owner.name} className='size-4 @lg:size-5' />
                      {owner.firstName}
                    </Button>
                  ))}
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon-sm'
                    aria-label='Back to the actions'
                    onClick={onHideOwners}
                    className='text-muted-foreground'
                  >
                    <XIcon />
                  </Button>
                </div>
              )}
              {!isPickingOwner && (
                <div className={CHOICES}>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    data-bulk-assign
                    onClick={onShowOwners}
                    className={pressedQuietOf(pressed === 'assign')}
                  >
                    Assign owner
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={onExport}
                  >
                    <Swap swapKey={exportWord}>{exportWord}</Swap>
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon-sm'
                    aria-label='Clear the selection'
                    onClick={onClear}
                    className='text-muted-foreground'
                  >
                    <XIcon />
                  </Button>
                </div>
              )}
            </AnimatedSize>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
