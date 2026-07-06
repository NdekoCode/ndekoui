import { cn } from '@/registry/ndeko/lib/utils';

export function MurmuraMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 24'
      aria-hidden='true'
      className={cn('size-6 shrink-0', className)}
    >
      <rect width='24' height='24' rx='12' className='fill-primary' />
      <circle cx='12' cy='12' r='2.6' className='fill-white' />
      <circle cx='18.4' cy='12' r='1.3' className='fill-white/80' />
      <circle cx='16.5' cy='16.5' r='1.3' className='fill-white/60' />
      <circle cx='12' cy='18.4' r='1.3' className='fill-white/80' />
      <circle cx='7.5' cy='16.5' r='1.3' className='fill-white/60' />
      <circle cx='5.6' cy='12' r='1.3' className='fill-white/80' />
      <circle cx='7.5' cy='7.5' r='1.3' className='fill-white/60' />
      <circle cx='12' cy='5.6' r='1.3' className='fill-white/80' />
      <circle cx='16.5' cy='7.5' r='1.3' className='fill-white/60' />
    </svg>
  );
}
