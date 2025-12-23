import { EclipseIcon } from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { StatusOrb } from '@/registry/ndeko/ui/status-orb';

export default function Banner03() {
  return (
    <div className='bg-primary/[0.06] hairline-ring ring-primary/15 dark:bg-primary/10 w-full rounded-xl px-4 py-2.5'>
      <div className='flex items-center justify-center gap-3'>
        <StatusOrb
          tone='brand'
          size='sm'
          glyph={<EclipseIcon strokeWidth={2.25} />}
        />
        <p className='text-[13px]'>
          Get real-time updates and analytics on the Team plan{' '}
          <span className='text-muted-foreground' aria-hidden='true'>
            ·
          </span>{' '}
          <a
            href='#'
            className={cn(
              'text-primary-ink rounded-sm font-medium underline underline-offset-4 hover:no-underline',
              FOCUS_RING
            )}
          >
            Upgrade
          </a>
        </p>
      </div>
    </div>
  );
}
