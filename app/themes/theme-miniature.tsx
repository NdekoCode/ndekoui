import { cn } from '@/registry/ndeko/lib/utils';

type ThemeMiniatureProps = {
  /** The `data-theme` scope whose colours it wears. */
  scope: string;
  className?: string;
};

/** The page, a card and the colours a theme is judged by: the fill with its text, and brand text. */
export function ThemeMiniature({ scope, className }: ThemeMiniatureProps) {
  return (
    <span
      aria-hidden='true'
      data-theme={scope}
      className={cn(
        'bg-background flex h-14 items-end rounded-lg p-1.5',
        className
      )}
    >
      <span className='bg-card flex w-full items-center gap-2 rounded-md px-2 py-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.06)]'>
        <span className='bg-primary text-primary-foreground rounded-full px-2 text-[11px] leading-4 font-semibold'>
          Aa
        </span>
        <span className='text-primary-ink text-xs font-medium'>Link</span>
      </span>
    </span>
  );
}
