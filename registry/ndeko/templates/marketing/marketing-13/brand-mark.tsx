import { cn } from '@/registry/ndeko/lib/utils';

export function AperlineMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 24'
      aria-hidden='true'
      className={cn('size-6 shrink-0', className)}
    >
      <rect width='24' height='24' rx='7' className='fill-primary' />
      <circle
        cx='12'
        cy='12'
        r='5.5'
        fill='none'
        strokeWidth='1.8'
        className='stroke-primary-foreground'
      />
      <path
        d='M12 6.5 15.5 12.8M17 14.5l-5.2 0M8.5 12.8 12 6.5'
        fill='none'
        strokeWidth='1.4'
        strokeLinecap='round'
        strokeLinejoin='round'
        className='stroke-primary-foreground/70'
      />
    </svg>
  );
}
