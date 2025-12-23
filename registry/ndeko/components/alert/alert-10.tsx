import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

export default function Alert10() {
  return (
    <div
      role='alert'
      className='bg-warning/10 text-warning-foreground hairline-ring ring-warning/25 flex items-start gap-3 rounded-xl px-4 py-2.5'
    >
      <StatusOrb tone='warning' size='sm' />
      <div className='flex grow justify-between gap-3 py-0.5'>
        <p className='text-[13px] leading-5'>
          Some details are missing from your profile.
        </p>
        <a
          href='#'
          className={cn(
            'group inline-flex items-center gap-1 rounded-sm text-[13px] leading-5 font-medium whitespace-nowrap',
            FOCUS_RING
          )}
        >
          Complete profile
          <ArrowRightIcon className='size-4 opacity-60 transition-transform group-hover:translate-x-0.5' />
        </a>
      </div>
    </div>
  );
}
