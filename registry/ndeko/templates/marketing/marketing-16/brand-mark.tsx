import { cn } from '@/registry/ndeko/lib/utils';

export function QuillfieldMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 24'
      aria-hidden='true'
      className={cn('size-6 shrink-0', className)}
    >
      <rect width='24' height='24' rx='6' className='fill-foreground' />
      <path
        d='M7 17c0-5.5 3.2-9.5 9.5-10-1 5.2-4 8.6-8.2 9.4'
        fill='none'
        strokeWidth='1.7'
        strokeLinecap='round'
        strokeLinejoin='round'
        className='stroke-background'
      />
      <path
        d='M6.5 17.5 11 13'
        fill='none'
        strokeWidth='1.7'
        strokeLinecap='round'
        className='stroke-background'
      />
    </svg>
  );
}
