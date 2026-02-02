import { cn } from '@/registry/ndeko/lib/utils';

function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 32 32'
      fill='none'
      aria-hidden='true'
      className={cn('size-8', className)}
    >
      <rect width='32' height='32' rx='9' fill='currentColor' />
      <circle
        cx='16'
        cy='16'
        r='6.25'
        strokeWidth='2.5'
        className='stroke-background'
      />
      <circle cx='16' cy='16' r='1.75' className='fill-background' />
    </svg>
  );
}

function LogoLink({ className }: { className?: string }) {
  return (
    <a
      href='#'
      aria-label='Home'
      className={cn(
        'text-foreground focus-visible:ring-ring/25 flex shrink-0 rounded-[9px] outline-none focus-visible:ring-[3px]',
        className
      )}
    >
      <Logo />
    </a>
  );
}

export { Logo, LogoLink };
