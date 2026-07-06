'use client';

import { pressedQuietOf } from '@/registry/ndeko/lib/demonstration';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

type SettledLineProps = {
  icon: React.ReactNode;
  actionLabel: string;
  actionIcon?: React.ReactNode;
  onAction: () => void;
  /** Shows the action held down, for a demonstration that presses it. */
  isActionPressed?: boolean;
  children: React.ReactNode;
  className?: string;
};

/** What a card becomes once it is settled: one line that says what happened, and the way back. */
export function SettledLine({
  icon,
  actionLabel,
  actionIcon,
  onAction,
  isActionPressed = false,
  children,
  className,
}: SettledLineProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 py-2.5 ps-3.5 pe-2.5 text-[13px]',
        className
      )}
    >
      <span className='mt-1 flex shrink-0 items-center'>{icon}</span>
      <p className='min-w-0 flex-1 py-1 leading-5'>{children}</p>
      <Button
        type='button'
        variant='ghost'
        size='sm'
        data-hand-off=''
        onClick={onAction}
        className={cn(
          'text-muted-foreground shrink-0',
          pressedQuietOf(isActionPressed)
        )}
      >
        {actionIcon}
        {actionLabel}
      </Button>
    </div>
  );
}
