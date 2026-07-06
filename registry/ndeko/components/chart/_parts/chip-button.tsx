'use client';

import { cn } from '@/registry/ndeko/lib/utils';

type ChipButtonProps = {
  onClick: () => void;
  /** Only for a chip that can be the current one, such as a question of the history. */
  isCurrent?: boolean;
  children: React.ReactNode;
};

function currentOf(isCurrent: boolean | undefined) {
  if (isCurrent) {
    return 'bg-foreground/[0.08] text-foreground';
  }
  return 'text-muted-foreground';
}

/** A suggestion or a past entry as a pill: one press puts it to work. */
export function ChipButton({ onClick, isCurrent, children }: ChipButtonProps) {
  return (
    <button
      type='button'
      aria-pressed={isCurrent}
      onClick={onClick}
      className={cn(
        'hairline-ring ring-foreground/12 hover:bg-foreground/5 hover:text-foreground focus-visible:ring-ring/25 max-w-full cursor-pointer truncate rounded-full px-2.5 py-1 text-start text-xs outline-none',
        'transition-[color,background-color,scale] duration-150 ease-(--ease-out-strong) focus-visible:ring-[3px] active:scale-[0.97]',
        currentOf(isCurrent)
      )}
    >
      {children}
    </button>
  );
}
