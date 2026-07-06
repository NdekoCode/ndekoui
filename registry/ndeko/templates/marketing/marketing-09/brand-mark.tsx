import { cn } from '@/registry/ndeko/lib/utils';

export function TidewellMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 24'
      aria-hidden='true'
      className={cn('size-6 shrink-0', className)}
    >
      <rect width='24' height='24' rx='7' className='fill-primary' />
      <path
        d='M5 10.5c2-2.2 4-2.2 6 0s4 2.2 6 0c.8-.9 1.4-1.2 2-1.3'
        fill='none'
        strokeWidth='1.7'
        strokeLinecap='round'
        className='stroke-white'
      />
      <path
        d='M5 15.5c2-2.2 4-2.2 6 0s4 2.2 6 0c.8-.9 1.4-1.2 2-1.3'
        fill='none'
        strokeWidth='1.7'
        strokeLinecap='round'
        className='stroke-white/60'
      />
    </svg>
  );
}
