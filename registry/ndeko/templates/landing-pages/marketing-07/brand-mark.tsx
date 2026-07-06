import { cn } from '@/registry/ndeko/lib/utils';

export function TallypotMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 24'
      aria-hidden='true'
      className={cn('size-6 shrink-0', className)}
    >
      <rect width='24' height='24' rx='12' className='fill-primary' />
      <rect
        x='5'
        y='7.5'
        width='14'
        height='9'
        rx='2.2'
        fill='none'
        strokeWidth='1.6'
        className='stroke-primary-foreground'
      />
      <rect
        x='5'
        y='10.5'
        width='14'
        height='2'
        className='fill-primary-foreground/70'
      />
      <circle cx='9' cy='14.6' r='0.9' className='fill-primary-foreground' />
    </svg>
  );
}
