import { cn } from '@/registry/ndeko/lib/utils';

export function HearthworkMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 24'
      aria-hidden='true'
      className={cn('size-6 shrink-0', className)}
    >
      <rect width='24' height='24' rx='7' className='fill-primary' />
      <path
        d='M6 17.5V11l6-4.5 6 4.5v6.5'
        fill='none'
        strokeWidth='1.8'
        strokeLinecap='round'
        strokeLinejoin='round'
        className='stroke-primary-foreground'
      />
      <rect
        x='10'
        y='12.5'
        width='4'
        height='5'
        rx='1.2'
        className='fill-primary-foreground/80'
      />
    </svg>
  );
}
