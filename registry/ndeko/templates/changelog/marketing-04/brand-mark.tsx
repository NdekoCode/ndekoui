import { cn } from '@/registry/ndeko/lib/utils';

export function LoomboardMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 24'
      aria-hidden='true'
      className={cn('size-6 shrink-0', className)}
    >
      <rect width='24' height='24' rx='7' className='fill-primary' />
      <rect x='6' y='6' width='3' height='12' rx='1.5' className='fill-white' />
      <rect
        x='10.5'
        y='6'
        width='3'
        height='8'
        rx='1.5'
        className='fill-white/80'
      />
      <rect
        x='15'
        y='6'
        width='3'
        height='10'
        rx='1.5'
        className='fill-white/60'
      />
    </svg>
  );
}
