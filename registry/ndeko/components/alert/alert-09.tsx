import { ArrowRightIcon } from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

export default function Alert09() {
  return (
    <div
      role='alert'
      className='bg-card hairline-ring ring-border flex items-start gap-3 rounded-xl px-4 py-2.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'
    >
      <StatusOrb tone='warning' size='sm' />
      <div className='flex grow justify-between gap-3 py-0.5'>
        <p className='text-[13px] leading-5'>
          Some details are missing from your profile.
        </p>
        <a
          href='#'
          className={cn(
            'group text-primary-ink inline-flex items-center gap-1 rounded-sm text-[13px] leading-5 font-medium whitespace-nowrap',
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
