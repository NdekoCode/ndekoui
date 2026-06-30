import { cn } from '@/registry/ndeko/lib/utils';

export function TidepostMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 24'
      aria-hidden='true'
      className={cn('size-6 shrink-0', className)}
    >
      <rect width='24' height='24' rx='7' className='fill-primary' />
      <path
        d='M5.5 10.5c2.2-1.8 4.3-1.8 6.5 0s4.3 1.8 6.5 0'
        fill='none'
        strokeWidth='2'
        strokeLinecap='round'
        className='stroke-white'
      />
      <path
        d='M5.5 14.5c2.2-1.8 4.3-1.8 6.5 0s4.3 1.8 6.5 0'
        fill='none'
        strokeWidth='2'
        strokeLinecap='round'
        className='stroke-white/60'
      />
    </svg>
  );
}
