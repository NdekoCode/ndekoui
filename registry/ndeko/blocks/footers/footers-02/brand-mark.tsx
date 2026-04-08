import { cn } from '@/registry/ndeko/lib/utils';

export function TallyfoldMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 24'
      aria-hidden='true'
      className={cn('size-6 shrink-0', className)}
    >
      <rect width='24' height='24' rx='7' className='fill-primary' />
      <path
        d='M7.5 5.5h6l3 3v9a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Z'
        className='fill-white'
      />
      <path d='M13.5 5.5v3h3Z' className='fill-white/60' />
      <path
        d='M9 12h6M9 15h4'
        fill='none'
        strokeWidth='1.5'
        strokeLinecap='round'
        className='stroke-primary'
      />
    </svg>
  );
}
