import { ArrowRightIcon, EclipseIcon } from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

export default function Banner04() {
  return (
    <div className='bg-primary/[0.06] hairline-ring ring-primary/15 dark:bg-primary/10 @container w-full rounded-xl px-4 py-3'>
      <div className='flex gap-3'>
        <StatusOrb
          tone='brand'
          size='sm'
          glyph={<EclipseIcon strokeWidth={2.25} />}
        />
        <div className='flex grow flex-col justify-between gap-2 py-0.5 @xl:flex-row @xl:items-center'>
          <p className='text-[13px] leading-5'>
            Saved views are here: keep your filters and reopen them in one
            click.
          </p>
          <a
            href='#'
            className={cn(
              'group text-primary-ink inline-flex w-fit items-center gap-1 rounded-sm text-[13px] leading-5 font-medium whitespace-nowrap',
              FOCUS_RING
            )}
          >
            Learn more
            <ArrowRightIcon className='size-4 opacity-60 transition-transform group-hover:translate-x-0.5' />
          </a>
        </div>
      </div>
    </div>
  );
}
