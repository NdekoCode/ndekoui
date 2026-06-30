import { cn } from '@/registry/ndeko/lib/utils';

export function FernwickMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 24'
      aria-hidden='true'
      className={cn('size-6 shrink-0', className)}
    >
      <rect width='24' height='24' rx='7' className='fill-primary' />
      <path
        d='M8.5 6h7A2.5 2.5 0 0 1 18 8.5v5a2.5 2.5 0 0 1-2.5 2.5H11l-3 2.5V16a2 2 0 0 1-2-2V8.5A2.5 2.5 0 0 1 8.5 6Z'
        className='fill-white'
      />
      <path
        d='M9.5 10h5M9.5 12.5h3'
        fill='none'
        strokeWidth='1.5'
        strokeLinecap='round'
        className='stroke-primary'
      />
    </svg>
  );
}
