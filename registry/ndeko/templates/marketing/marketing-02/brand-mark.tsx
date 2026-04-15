import { cn } from '@/registry/ndeko/lib/utils';

export function FernpostMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 24'
      aria-hidden='true'
      className={cn('size-6 shrink-0', className)}
    >
      <rect width='24' height='24' rx='12' className='fill-primary' />
      <path
        d='M7 8.5h10a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1Z'
        className='fill-white/25'
      />
      <path
        d='m6.5 9 5.5 3.75L17.5 9'
        fill='none'
        strokeWidth='1.6'
        strokeLinecap='round'
        strokeLinejoin='round'
        className='stroke-white'
      />
    </svg>
  );
}
