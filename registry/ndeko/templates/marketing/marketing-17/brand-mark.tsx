import { cn } from '@/registry/ndeko/lib/utils';

export function PinemarshMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 24'
      aria-hidden='true'
      className={cn('size-6 shrink-0', className)}
    >
      <rect width='24' height='24' rx='6' className='fill-foreground' />
      <path
        d='M12 5 17 8.5v7L12 19l-5-3.5v-7Z'
        fill='none'
        strokeWidth='1.7'
        strokeLinejoin='round'
        className='stroke-background'
      />
      <path
        d='M12 5v14'
        fill='none'
        strokeWidth='1.4'
        className='stroke-background/60'
      />
    </svg>
  );
}
