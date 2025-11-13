import { cn } from '@/registry/ndeko/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='skeleton'
      aria-hidden='true'
      className={cn('bg-foreground/[0.06] animate-pulse rounded-md', className)}
      {...props}
    />
  );
}

export { Skeleton };
