import { cn } from '@/registry/ndeko/lib/utils';

export function RowmillMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 24'
      aria-hidden='true'
      className={cn('size-6 shrink-0', className)}
    >
      <rect width='24' height='24' rx='7' className='fill-primary' />
      <rect
        x='5.5'
        y='6'
        width='13'
        height='2.6'
        rx='1.3'
        className='fill-primary-foreground'
      />
      <rect
        x='5.5'
        y='10.7'
        width='13'
        height='2.6'
        rx='1.3'
        className='fill-primary-foreground/80'
      />
      <rect
        x='5.5'
        y='15.4'
        width='8'
        height='2.6'
        rx='1.3'
        className='fill-primary-foreground/60'
      />
    </svg>
  );
}
