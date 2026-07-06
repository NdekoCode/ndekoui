import { cn } from '@/registry/ndeko/lib/utils';

export function LisangaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 24'
      aria-hidden='true'
      className={cn('size-6 shrink-0', className)}
    >
      <rect width='24' height='24' rx='7' className='fill-primary' />
      <circle cx='12' cy='12' r='2.6' className='fill-white' />
      <circle cx='12' cy='5.8' r='1.4' className='fill-white/80' />
      <circle cx='18.2' cy='12' r='1.4' className='fill-white/80' />
      <circle cx='12' cy='18.2' r='1.4' className='fill-white/80' />
      <circle cx='5.8' cy='12' r='1.4' className='fill-white/80' />
      <circle cx='7.6' cy='7.6' r='0.9' className='fill-white/55' />
      <circle cx='16.4' cy='7.6' r='0.9' className='fill-white/55' />
      <circle cx='16.4' cy='16.4' r='0.9' className='fill-white/55' />
      <circle cx='7.6' cy='16.4' r='0.9' className='fill-white/55' />
    </svg>
  );
}
