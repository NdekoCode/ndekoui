import { cn } from '@/registry/ndeko/lib/utils';

export function DriftdeskMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 24'
      aria-hidden='true'
      className={cn('size-6 shrink-0', className)}
    >
      <rect width='24' height='24' rx='7' className='fill-primary' />
      <path
        d='M8 6.5h8A1.5 1.5 0 0 1 17.5 8v8a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 16V8A1.5 1.5 0 0 1 8 6.5Z'
        className='fill-white/25'
      />
      <path
        d='M6.5 13h3.25l.9 1.5h2.7l.9-1.5h3.25v3a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 16Z'
        className='fill-white'
      />
      <path
        d='M9.5 9.5h5'
        fill='none'
        strokeWidth='1.5'
        strokeLinecap='round'
        className='stroke-white'
      />
    </svg>
  );
}
