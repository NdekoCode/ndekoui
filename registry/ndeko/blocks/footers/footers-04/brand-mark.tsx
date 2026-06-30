import { cn } from '@/registry/ndeko/lib/utils';

export function QuillmintMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 24'
      aria-hidden='true'
      className={cn('size-6 shrink-0', className)}
    >
      <rect width='24' height='24' rx='7' className='fill-primary' />
      <path
        d='M17.5 5.5c-6 .5-9.5 4.5-10 11l2-1.5c3-.5 6.5-3.5 8-9.5Z'
        className='fill-white'
      />
      <path
        d='M6.5 18.5h11'
        fill='none'
        strokeWidth='1.5'
        strokeLinecap='round'
        className='stroke-white/60'
      />
    </svg>
  );
}
